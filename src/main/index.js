/**
 * Main Process Entry Point
 * Implements security best practices and app lifecycle management
 */

const { app, ipcMain } = require('electron');
const WindowManager = require('./window');
const FileManager = require('./file-manager');

// Enable sandbox for all renderers BEFORE app.whenReady()
// This is a critical security measure
app.enableSandbox();

// Create window manager instance
const windowManager = new WindowManager();

// Create file manager instance
const fileManager = new FileManager(windowManager);

/**
 * Register IPC handlers for file operations
 */
function registerIPCHandlers() {
    // File operations
    ipcMain.handle('file:open', async () => {
        try {
            return await fileManager.openFile();
        } catch (error) {
            console.error('Error opening file:', error);
            throw error;
        }
    });

    ipcMain.handle('file:save', async (event, filePath, content) => {
        try {
            await fileManager.saveFile(filePath, content);
            return { success: true };
        } catch (error) {
            console.error('Error saving file:', error);
            throw error;
        }
    });

    ipcMain.handle('file:save-as', async (event, content) => {
        try {
            const filePath = await fileManager.saveFileAs(content);
            return { success: true, filePath };
        } catch (error) {
            console.error('Error saving file as:', error);
            throw error;
        }
    });
}

/**
 * App ready handler
 * Creates the main window when Electron has finished initialization
 */
app.whenReady().then(() => {
    // Register IPC handlers
    registerIPCHandlers();

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
