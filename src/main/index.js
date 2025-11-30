/**
 * Main Process Entry Point
 * Implements security best practices and app lifecycle management
 */

const { app, ipcMain } = require('electron');
const WindowManager = require('./window');
const FileManager = require('./file-manager');
const Exporter = require('./exporter');
const ConfigStore = require('./config-store');
const { createApplicationMenu } = require('./menu');

// Enable sandbox for all renderers BEFORE app.whenReady()
// This is a critical security measure
app.enableSandbox();

// Create window manager instance
const windowManager = new WindowManager();

// Create file manager instance
const fileManager = new FileManager(windowManager);

// Create exporter instance
const exporter = new Exporter(windowManager);

// Create config store instance
const configStore = new ConfigStore();

/**
 * Register IPC handlers for all main process operations
 * Implements proper error handling for all handlers
 * Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 6.3, 8.4
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

    // Export operations
    ipcMain.handle('export:html', async (event, content, theme = 'light') => {
        try {
            const filePath = await exporter.exportToHTML(content, theme);
            if (filePath) {
                return { success: true, filePath };
            } else {
                // User cancelled the export
                return { success: false, cancelled: true };
            }
        } catch (error) {
            console.error('Error exporting to HTML:', error);
            throw error;
        }
    });

    ipcMain.handle('export:pdf', async (event, content, theme = 'light') => {
        try {
            const filePath = await exporter.exportToPDF(content, theme);
            if (filePath) {
                return { success: true, filePath };
            } else {
                // User cancelled the export
                return { success: false, cancelled: true };
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            throw error;
        }
    });

    // Config operations
    ipcMain.handle('config:get', async (event, key) => {
        try {
            const value = configStore.get(key);
            return { success: true, value };
        } catch (error) {
            console.error('Error getting config:', error);
            throw error;
        }
    });

    ipcMain.handle('config:set', async (event, key, value) => {
        try {
            configStore.set(key, value);
            return { success: true };
        } catch (error) {
            console.error('Error setting config:', error);
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

    // Create application menu
    createApplicationMenu(windowManager, fileManager, exporter);

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
