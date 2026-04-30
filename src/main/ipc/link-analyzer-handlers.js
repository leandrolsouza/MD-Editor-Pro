/**
 * IPC Handlers — Link Analyzer Operations
 * Handles: graph:get-data
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de análise de links
 * @param {Object} deps - Dependências
 * @param {import('../link-analyzer-manager')} deps.linkAnalyzerManager - Instância do LinkAnalyzerManager
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ linkAnalyzerManager, ipcMain }) {
    ipcMain.handle('graph:get-data', createIPCHandler(async () => {
        return await linkAnalyzerManager.analyzeWorkspace();
    }, 'getting graph data'));
}

module.exports = { register };
