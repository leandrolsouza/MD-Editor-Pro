/**
 * Main Process Entry Point
 * Implements security best practices and app lifecycle management
 */

const { app } = require('electron');
const WindowManager = require('./window');

// Enable sandbox for all renderers BEFORE app.whenReady()
// This is a critical security measure
app.enableSandbox();

// Create window manager instance
const windowManager = new WindowManager();

/**
 * App ready handler
 * Creates the main window when Electron has finished initialization
 */
app.whenReady().then(() => {
    windowManager.createMainWindow();

    // On macOS, re-create window when dock icon is clicked and no windows are open
    app.on('activate', () => {
        if (windowManager.getMainWindow() === null) {
            windowManager.createMainWindow();
        }
    });
});

/**
 * Window all closed handler
 * Quits the app when all windows are closed, except on macOS
 */
app.on('window-all-closed', () => {
    // On macOS, apps typically stay active until user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
