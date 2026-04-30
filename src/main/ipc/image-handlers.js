/**
 * IPC Handlers — Image Operations
 * Handles: image:save-from-clipboard
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de imagem
 * @param {Object} deps - Dependências
 * @param {import('../file-manager')} deps.fileManager - Instância do FileManager
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ fileManager, ipcMain }) {
    ipcMain.handle('image:save-from-clipboard', createIPCHandler(async (event, imageBuffer, currentFilePath) => {
        const result = await fileManager.saveImageFromClipboard(imageBuffer, currentFilePath);
        return result;
    }, 'saving image from clipboard'));
}

module.exports = { register };
