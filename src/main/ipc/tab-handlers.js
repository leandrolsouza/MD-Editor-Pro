/**
 * IPC Handlers — Tab Operations
 * Handles: tab:create, tab:close, tab:switch, tab:get, tab:get-all,
 *          tab:get-modified, tab:get-active, tab:mark-modified,
 *          tab:update-content, tab:update-scroll, tab:update-cursor,
 *          tab:update-filepath, tab:save, tab:restore, tab:get-next, tab:get-previous
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de tab
 * @param {Object} deps - Dependências
 * @param {import('../tab-manager')} deps.tabManager - Instância do TabManager
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ tabManager, ipcMain }) {
    ipcMain.handle('tab:create', createIPCHandler(async (event, filePath, content) => {
        const tab = tabManager.createTab(filePath, content);

        return { success: true, tab };
    }, 'creating tab'));

    ipcMain.handle('tab:close', createIPCHandler(async (event, tabId) => {
        const result = tabManager.closeTab(tabId);

        return { success: result };
    }, 'closing tab'));

    ipcMain.handle('tab:switch', createIPCHandler(async (event, tabId) => {
        const tab = tabManager.switchTab(tabId);

        return { success: !!tab, tab };
    }, 'switching tab'));

    ipcMain.handle('tab:get', createIPCHandler(async (event, tabId) => {
        const tab = tabManager.getTab(tabId);

        return { success: !!tab, tab };
    }, 'getting tab'));

    ipcMain.handle('tab:get-all', createIPCHandler(async () => {
        const tabs = tabManager.getAllTabs();

        return { success: true, tabs };
    }, 'getting all tabs'));

    ipcMain.handle('tab:get-modified', createIPCHandler(async () => {
        const tabs = tabManager.getModifiedTabs();

        return { success: true, tabs };
    }, 'getting modified tabs'));

    ipcMain.handle('tab:get-active', createIPCHandler(async () => {
        const tab = tabManager.getActiveTab();
        const tabId = tabManager.getActiveTabId();

        return { success: true, tab, tabId };
    }, 'getting active tab'));

    ipcMain.handle('tab:mark-modified', createIPCHandler(async (event, tabId, isModified) => {
        const result = tabManager.markTabModified(tabId, isModified);

        return { success: result };
    }, 'marking tab modified'));

    ipcMain.handle('tab:update-content', createIPCHandler(async (event, tabId, content) => {
        const result = tabManager.updateTabContent(tabId, content);

        return { success: result };
    }, 'updating tab content'));

    ipcMain.handle('tab:update-scroll', createIPCHandler(async (event, tabId, position) => {
        const result = tabManager.updateTabScrollPosition(tabId, position);

        return { success: result };
    }, 'updating tab scroll'));

    ipcMain.handle('tab:update-cursor', createIPCHandler(async (event, tabId, position) => {
        const result = tabManager.updateTabCursorPosition(tabId, position);

        return { success: result };
    }, 'updating tab cursor'));

    ipcMain.handle('tab:save', createIPCHandler(async () => {
        tabManager.saveTabs();
        return { success: true };
    }, 'saving tabs'));

    ipcMain.handle('tab:restore', createIPCHandler(async () => {
        const result = tabManager.restoreTabs();

        return { success: result };
    }, 'restoring tabs'));

    ipcMain.handle('tab:get-next', createIPCHandler(async () => {
        const tabId = tabManager.getNextTabId();

        return { success: true, tabId };
    }, 'getting next tab'));

    ipcMain.handle('tab:get-previous', createIPCHandler(async () => {
        const tabId = tabManager.getPreviousTabId();

        return { success: true, tabId };
    }, 'getting previous tab'));

    ipcMain.handle('tab:update-filepath', createIPCHandler(async (event, tabId, filePath) => {
        const result = tabManager.updateTabFilePath(tabId, filePath);
        return { success: result };
    }, 'updating tab filepath'));
}

module.exports = { register };
