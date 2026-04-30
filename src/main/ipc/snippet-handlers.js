/**
 * IPC Handlers — Snippet Operations
 * Handles: snippet:get-all, snippet:get-builtin, snippet:get-custom,
 *          snippet:save-custom, snippet:delete-custom, snippet:update-custom
 * Requirements: 7.2, 7.3
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de snippets
 * @param {Object} deps - Dependências
 * @param {import('../snippet-manager')} deps.snippetManager - Instância do SnippetManager
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ snippetManager, ipcMain }) {
    ipcMain.handle('snippet:get-all', createIPCHandler(async () => {
        const builtIn = snippetManager.getBuiltInSnippets();
        const custom = snippetManager.getCustomSnippets();
        return { success: true, snippets: [...builtIn, ...custom] };
    }, 'getting all snippets'));

    ipcMain.handle('snippet:get-builtin', createIPCHandler(async () => {
        const snippets = snippetManager.getBuiltInSnippets();
        return { success: true, snippets };
    }, 'getting built-in snippets'));

    ipcMain.handle('snippet:get-custom', createIPCHandler(async () => {
        const snippets = snippetManager.getCustomSnippets();
        return { success: true, snippets };
    }, 'getting custom snippets'));

    ipcMain.handle('snippet:save-custom', createIPCHandler(async (event, trigger, content, description) => {
        const snippet = snippetManager.saveCustomSnippet({
            trigger,
            content,
            description
        });
        return { success: true, snippet };
    }, 'saving custom snippet'));

    ipcMain.handle('snippet:delete-custom', createIPCHandler(async (event, trigger) => {
        snippetManager.deleteCustomSnippet(trigger);
        return { success: true };
    }, 'deleting custom snippet'));

    ipcMain.handle('snippet:update-custom', createIPCHandler(async (event, trigger, updates) => {
        if (updates.content) {
            updates.placeholders = snippetManager.findPlaceholders(updates.content);
        }
        snippetManager.configStore.updateCustomSnippet(trigger, updates);
        return { success: true };
    }, 'updating custom snippet'));
}

module.exports = { register };
