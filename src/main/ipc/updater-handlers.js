/**
 * IPC Handlers — Auto-Updater & App Version Operations
 * Handles: updater:check-for-updates, updater:download-update, updater:quit-and-install,
 *          updater:get-current-version, app:get-version
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de auto-update e versão do app
 * @param {Object} deps - Dependências
 * @param {import('../auto-updater')|null} deps.autoUpdater - Instância do AutoUpdater (pode ser null)
 * @param {Function} deps.getAppVersion - Função que retorna a versão do app
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ autoUpdater, getAppVersion, ipcMain }) {
    ipcMain.handle('updater:check-for-updates', createIPCHandler(async () => {
        if (!autoUpdater) {
            return { success: false, error: 'Auto-updater not initialized' };
        }
        const result = await autoUpdater.checkForUpdates();
        return { success: true, updateInfo: result };
    }, 'checking for updates'));

    ipcMain.handle('updater:download-update', createIPCHandler(async () => {
        if (!autoUpdater) {
            return { success: false, error: 'Auto-updater not initialized' };
        }
        const result = await autoUpdater.downloadUpdate();
        return result;
    }, 'downloading update'));

    ipcMain.handle('updater:quit-and-install', createIPCHandler(async () => {
        if (!autoUpdater) {
            return { success: false, error: 'Auto-updater not initialized' };
        }
        autoUpdater.quitAndInstall();
        return { success: true };
    }, 'installing update'));

    ipcMain.handle('updater:get-current-version', createIPCHandler(async () => {
        if (!autoUpdater) {
            return { success: false, error: 'Auto-updater not initialized' };
        }
        const version = autoUpdater.getCurrentVersion();
        return { success: true, version };
    }, 'getting current version'));

    ipcMain.handle('app:get-version', createIPCHandler(async () => {
        return { success: true, version: getAppVersion() };
    }, 'getting app version'));
}

module.exports = { register };
