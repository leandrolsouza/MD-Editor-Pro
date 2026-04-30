/**
 * IPC Handlers — What's New Operations
 * Handles: whats-new:get-changelog, whats-new:mark-seen
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações do What's New
 * @param {Object} deps - Dependências
 * @param {import('../whats-new-manager')} deps.whatsNewManager - Instância do WhatsNewManager
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ whatsNewManager, ipcMain }) {
    ipcMain.handle('whats-new:get-changelog', createIPCHandler(async () => {
        return await whatsNewManager.getChangelogData();
    }, 'getting changelog data'));

    ipcMain.handle('whats-new:mark-seen', createIPCHandler(async (event, version) => {
        whatsNewManager.markVersionSeen(version);
        return { success: true };
    }, 'marking version as seen'));
}

module.exports = { register };
