/**
 * IPC Handlers — Advanced Markdown Operations
 * Handles: advanced-markdown:get-settings, advanced-markdown:toggle-feature
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de advanced markdown
 * @param {Object} deps - Dependências
 * @param {import('../advanced-markdown-manager')} deps.advancedMarkdownManager - Instância do AdvancedMarkdownManager
 * @param {import('../window').WindowManager} deps.windowManager - Instância do WindowManager
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ advancedMarkdownManager, windowManager, ipcMain }) {
    ipcMain.handle('advanced-markdown:get-settings', createIPCHandler(async () => {
        const features = advancedMarkdownManager.getAllFeatures();

        return { success: true, features };
    }, 'getting advanced markdown settings'));

    ipcMain.handle('advanced-markdown:toggle-feature', createIPCHandler(async (event, featureName, enabled) => {
        advancedMarkdownManager.toggleFeature(featureName, enabled);

        // Notify renderer of configuration changes
        const mainWindow = windowManager.getMainWindow();

        if (mainWindow) {
            mainWindow.webContents.send('advanced-markdown:settings-changed', featureName, enabled);
        }

        return { success: true };
    }, 'toggling advanced markdown feature'));
}

module.exports = { register };
