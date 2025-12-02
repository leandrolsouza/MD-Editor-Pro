const { BrowserWindow, dialog } = require('electron');
const path = require('path');

/**
 * WindowManager - Manages the main application window
 * Implements secure BrowserWindow configuration following Electron best practices
 */
class WindowManager {
    constructor() {
        this.mainWindow = null;
    }

    /**
     * Handles window close event with unsaved changes check
     * @param {Event} e - Close event
     */
    async handleWindowClose(e) {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
            return;
        }

        try {
            const hasUnsaved = await this.mainWindow.webContents.executeJavaScript(
                'window.hasUnsavedChanges ? window.hasUnsavedChanges() : false'
            );

            if (!hasUnsaved) {
                return;
            }

            e.preventDefault();

            const choice = await dialog.showMessageBox(this.mainWindow, {
                type: 'question',
                buttons: ['Save', 'Don\'t Save', 'Cancel'],
                defaultId: 0,
                cancelId: 2,
                title: 'Unsaved Changes',
                message: 'Do you want to save the changes you made?',
                detail: 'Your changes will be lost if you don\'t save them.'
            });

            if (choice.response === 0) {
                await this.mainWindow.webContents.executeJavaScript(
                    'window.saveBeforeClose ? window.saveBeforeClose() : Promise.resolve()'
                );
                this.mainWindow.destroy();
            } else if (choice.response === 1) {
                this.mainWindow.destroy();
            }
        } catch (error) {
            console.error('Error checking unsaved changes:', error);
        }
    }

    /**
     * Creates the main application window with security best practices
     * @returns {BrowserWindow} The created window instance
     */
    createMainWindow() {
        // Create the browser window with secure configuration
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            show: false, // Use ready-to-show event for graceful display
            webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                contextIsolation: false,        // Disable to allow require in renderer
                nodeIntegration: true,          // Enable Node to use require with node_modules
                nodeIntegrationInWorker: false,
                sandbox: false,                 // Disable sandbox to allow nodeIntegration
                webSecurity: true,              // Enable web security
                allowRunningInsecureContent: false,
                experimentalFeatures: false
            }
        });

        // Load the index.html of the app
        this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

        // Show window gracefully when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.maximize();
            this.mainWindow.show();
        });

        // Handle window close event (before closing)
        this.mainWindow.on('close', (e) => this.handleWindowClose(e));

        // Handle window closed event
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        return this.mainWindow;
    }

    /**
     * Gets the main window instance
     * @returns {BrowserWindow | null} The main window or null if not created
     */
    getMainWindow() {
        return this.mainWindow;
    }

    /**
     * Closes the main window
     */
    closeWindow() {
        if (this.mainWindow) {
            this.mainWindow.close();
        }
    }
}

module.exports = WindowManager;
