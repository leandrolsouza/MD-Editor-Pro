/**
 * IPC Handlers — Global Search Operations
 * Handles: global-search:search
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de busca global
 * @param {Object} deps - Dependências
 * @param {import('../global-search-manager')} deps.globalSearchManager - Instância do GlobalSearchManager
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ globalSearchManager, ipcMain }) {
    ipcMain.handle('global-search:search', createIPCHandler(async (event, searchText, options) => {
        const result = await globalSearchManager.searchInWorkspace(searchText, options);
        return result;
    }, 'performing global search'));
}

module.exports = { register };
