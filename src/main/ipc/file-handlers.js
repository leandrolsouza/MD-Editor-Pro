/**
 * IPC Handlers — File Operations
 * Handles: file:open, file:open-recent, file:read, file:save, file:save-as, shell:open-external
 */

const { createIPCHandler } = require('../utils/ipc-utils');
const logger = require('../utils/logger');

const log = logger.child('FileHandlers');

/**
 * Allowed URL protocols for shell:open-external
 * Only http and https are permitted to prevent javascript:, file://, vbscript:, etc.
 */
const ALLOWED_EXTERNAL_PROTOCOLS = ['http:', 'https:'];

/**
 * Validates a URL for safe external opening
 * @param {string} url - The URL to validate
 * @returns {string} The validated URL
 * @throws {Error} If URL is invalid or uses a disallowed protocol
 */
function validateExternalUrl(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL: must be a non-empty string');
    }

    let parsed;

    try {
        parsed = new URL(url);
    } catch {
        throw new Error(`Invalid URL format: ${url}`);
    }

    if (!ALLOWED_EXTERNAL_PROTOCOLS.includes(parsed.protocol)) {
        throw new Error(`Blocked URL with disallowed protocol "${parsed.protocol}". Only HTTP and HTTPS are allowed.`);
    }

    return url;
}

/**
 * Registra IPC handlers para operações de arquivo
 * @param {Object} deps - Dependências
 * @param {import('../file-manager')} deps.fileManager - Instância do FileManager
 * @param {Function} deps.refreshMenu - Callback para atualizar o menu da aplicação
 * @param {Function} deps.openExternal - Função para abrir URLs externas
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ fileManager, refreshMenu, openExternal, ipcMain }) {
    ipcMain.handle('file:open', createIPCHandler(async () => {
        log.debug('IPC handler file:open called');
        const result = await fileManager.openFile();

        log.debug('fileManager.openFile result', { result });

        // Update menu to reflect new recent files
        if (result) {
            refreshMenu();
        }

        return result;
    }, 'opening file'));

    ipcMain.handle('file:open-recent', createIPCHandler(async (event, filePath) => {
        const result = await fileManager.openRecentFile(filePath);

        // Update menu to reflect updated recent files
        refreshMenu();

        return result;
    }, 'opening recent file'));

    ipcMain.handle('file:read', createIPCHandler(async (event, filePath) => {
        const result = await fileManager.readFile(filePath);

        return result;
    }, 'reading file'));

    ipcMain.handle('file:save', createIPCHandler(async (event, filePath, content) => {
        await fileManager.saveFile(filePath, content);
        return { success: true };
    }, 'saving file'));

    ipcMain.handle('file:save-as', createIPCHandler(async (event, content) => {
        const filePath = await fileManager.saveFileAs(content);

        return { success: true, filePath };
    }, 'saving file as'));

    ipcMain.handle('shell:open-external', createIPCHandler(async (event, url) => {
        const safeUrl = validateExternalUrl(url);

        await openExternal(safeUrl);
        return { success: true };
    }, 'opening external URL'));
}

module.exports = { register };
