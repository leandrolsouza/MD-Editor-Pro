/**
 * Renderer Process Error Boundary
 *
 * Captures unhandled errors and promise rejections in the renderer process,
 * displays non-blocking notifications to the user, and forwards error details
 * to the main process via IPC for centralized logging and persistence.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

const notificationManager = require('./ui/notification.js');

class RendererErrorBoundary {
    constructor() {
        this._registered = false;
    }

    /**
     * Register window-level error handlers.
     * Should be called before component initialization in src/renderer/index.js.
     * Requirement 4.5: Register handlers before component initialization
     */
    register() {
        if (this._registered) {
            return;
        }

        // Requirement 4.1: Capture uncaught exceptions via window.onerror
        window.onerror = (message, source, lineno, colno, error) => {
            this._handleError(message, source, lineno, colno, error);
            // Return true to prevent the default browser error handling
            return true;
        };

        // Requirement 4.2: Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this._handleRejection(event);
        });

        this._registered = true;
    }

    /**
     * Handle uncaught exception from window.onerror.
     * @param {string} message - Error message
     * @param {string} source - Script URL where error occurred
     * @param {number} lineno - Line number
     * @param {number} colno - Column number
     * @param {Error} error - Error object (may be null in some browsers)
     */
    _handleError(message, source, lineno, colno, error) {
        const errorMessage = error ? error.message : String(message);
        const context = {
            source: source || 'unknown',
            lineno: lineno || 0,
            colno: colno || 0,
            stack: error ? error.stack : undefined
        };

        // Requirement 4.3: Display non-blocking notification
        this._notify(errorMessage);

        // Requirement 4.4: Forward to main process via IPC
        this._forwardToMain('error', `Uncaught exception: ${errorMessage}`, context);
    }

    /**
     * Handle unhandled promise rejection.
     * @param {PromiseRejectionEvent} event
     */
    _handleRejection(event) {
        const reason = event.reason;
        const errorMessage = reason instanceof Error
            ? reason.message
            : String(reason);
        const context = {
            stack: reason instanceof Error ? reason.stack : undefined
        };

        // Requirement 4.3: Display non-blocking notification
        this._notify(errorMessage);

        // Requirement 4.4: Forward to main process via IPC
        this._forwardToMain('error', `Unhandled promise rejection: ${errorMessage}`, context);
    }

    /**
     * Display a non-blocking error notification to the user.
     * Gracefully handles the case where notificationManager may not be fully
     * initialized (e.g., DOM not ready).
     * @param {string} message - Error message to display
     */
    _notify(message) {
        try {
            if (notificationManager && typeof notificationManager.error === 'function') {
                notificationManager.error(`An error occurred: ${message}`);
            }
        } catch (notifyError) {
            // notificationManager may not be ready (DOM not available yet)
            console.error('Error boundary: failed to show notification', notifyError);
        }
    }

    /**
     * Forward error details to the main process via IPC for centralized logging.
     * Gracefully handles the case where the IPC bridge is not available.
     * @param {string} level - Log level (e.g., 'error')
     * @param {string} message - Error message
     * @param {Object} context - Additional error context
     */
    _forwardToMain(level, message, context) {
        try {
            if (window.electronAPI && typeof window.electronAPI.logError === 'function') {
                window.electronAPI.logError({ level, message, context });
            }
        } catch (ipcError) {
            // IPC bridge may not be available; fall back to console
            console.error('Error boundary: failed to forward error to main process', ipcError);
        }
    }
}

module.exports = RendererErrorBoundary;
