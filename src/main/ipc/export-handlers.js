/**
 * IPC Handlers — Export Operations
 * Handles: export:html, export:pdf
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de exportação
 * @param {Object} deps - Dependências
 * @param {import('../exporter')} deps.exporter - Instância do Exporter
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ exporter, ipcMain }) {
    ipcMain.handle('export:html', createIPCHandler(async (event, content, theme = 'light') => {
        const filePath = await exporter.exportToHTML(content, theme);

        if (filePath) {
            return { success: true, filePath };
        } else {
            // User cancelled the export
            return { success: false, cancelled: true };
        }
    }, 'exporting to HTML'));

    ipcMain.handle('export:pdf', createIPCHandler(async (event, content, theme = 'light') => {
        const filePath = await exporter.exportToPDF(content, theme);

        if (filePath) {
            return { success: true, filePath };
        } else {
            // User cancelled the export
            return { success: false, cancelled: true };
        }
    }, 'exporting to PDF'));
}

module.exports = { register };
