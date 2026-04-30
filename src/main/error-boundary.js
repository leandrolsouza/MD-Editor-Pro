/**
 * Main Process Error Boundary
 *
 * Registers global error handlers in the main process for uncaught exceptions,
 * unhandled promise rejections, and renderer process crashes. Ensures that
 * no error goes unlogged and that the user is informed of critical failures.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

const { dialog, BrowserWindow } = require('electron');

class MainErrorBoundary {
    /**
     * @param {import('./utils/logger')} logger - Logger instance (or child logger)
     * @param {import('./window')} windowManager - WindowManager instance
     */
    constructor(logger, windowManager) {
        this._logger = logger.child('ErrorBoundary');
        this._windowManager = windowManager;
        this._registered = false;
    }

    /**
     * Register process-level error handlers.
     * Should be called once during application startup.
     */
    register() {
        if (this._registered) {
            return;
        }

        process.on('uncaughtException', (error) => {
            this._handleUncaughtException(error);
        });

        process.on('unhandledRejection', (reason) => {
            this._handleUnhandledRejection(reason);
        });

        this._attachRendererCrashHandler();

        this._registered = true;
        this._logger.info('Error boundary registered');
    }

    /**
     * Handle uncaught exception — fatal, logs and exits.
     * Requirement 3.1: Log at fatal level with full stack trace
     * Requirement 3.3: Show native error dialog before exit
     * @param {Error} error
     */
    _handleUncaughtException(error) {
        this._logger.fatal('Uncaught exception', { error });

        try {
            dialog.showErrorBox(
                'Unexpected Error',
                `The application encountered an unexpected error and needs to close.\n\n${error.message || String(error)}`
            );
        } catch (dialogError) {
            // dialog may not be available if app is shutting down
        }

        process.exit(1);
    }

    /**
     * Handle unhandled promise rejection — non-fatal, logs and continues.
     * Requirement 3.2: Log at error level, do not exit
     * @param {*} reason
     */
    _handleUnhandledRejection(reason) {
        const context = reason instanceof Error
            ? { error: reason }
            : { reason: String(reason) };

        this._logger.error('Unhandled promise rejection', context);
    }

    /**
     * Attach render-process-gone listener on the main window's webContents.
     * Requirement 3.5: Log crash at fatal level, offer reload
     */
    _attachRendererCrashHandler() {
        const mainWindow = this._windowManager.getMainWindow();

        if (mainWindow && !mainWindow.isDestroyed()) {
            this._attachCrashListenerToWindow(mainWindow);
        }
    }

    /**
     * Attach the render-process-gone listener to a specific window.
     * @param {Electron.BrowserWindow} window
     */
    _attachCrashListenerToWindow(window) {
        window.webContents.on('render-process-gone', (event, details) => {
            this._handleRendererCrash(event, details, window);
        });
    }

    /**
     * Handle renderer process crash.
     * @param {Electron.Event} event
     * @param {Object} details - Crash details from Electron
     * @param {Electron.BrowserWindow} window
     */
    _handleRendererCrash(event, details, window) {
        this._logger.fatal('Renderer process crashed', {
            reason: details.reason,
            exitCode: details.exitCode
        });

        try {
            if (window.isDestroyed()) {
                return;
            }

            const response = dialog.showMessageBoxSync(window, {
                type: 'error',
                buttons: ['Reload', 'Close'],
                defaultId: 0,
                title: 'Renderer Process Crashed',
                message: 'The editor process has crashed.',
                detail: 'Would you like to reload the window?'
            });

            if (response === 0) {
                window.webContents.reload();
            } else {
                window.close();
            }
        } catch (dialogError) {
            // Window may have been destroyed between check and dialog
        }
    }
}

module.exports = MainErrorBoundary;
