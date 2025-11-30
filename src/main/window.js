const { BrowserWindow } = require('electron');
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
                contextIsolation: true,        // REQUIRED: Isolate preload context
                nodeIntegration: false,         // REQUIRED: Disable Node in renderer
                sandbox: true,                  // REQUIRED: Enable sandbox
                webSecurity: true,              // REQUIRED: Enable web security
                allowRunningInsecureContent: false,
                experimentalFeatures: false
            }
        });

        // Load the index.html of the app
        this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

        // Show window gracefully when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
        });

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
