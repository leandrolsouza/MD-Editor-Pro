const { ipcRenderer } = require('electron')

/**
 * Preload script that exposes API to renderer process
 * When contextIsolation is disabled, we expose directly to window
 */

const electronAPI = {
    // File operations - using invoke for async request-response
    openFile: () => ipcRenderer.invoke('file:open'),
    saveFile: (filePath, content) => ipcRenderer.invoke('file:save', filePath, content),
    saveFileAs: (content) => ipcRenderer.invoke('file:save-as', content),

    // Export operations
    exportHTML: (content) => ipcRenderer.invoke('export:html', content),
    exportPDF: (content) => ipcRenderer.invoke('export:pdf', content),

    // Config operations
    getConfig: (key) => ipcRenderer.invoke('config:get', key),
    setConfig: (key, value) => ipcRenderer.invoke('config:set', key, value),

    // Event listeners - wrapped to prevent direct ipcRenderer exposure
    // Returns cleanup function for proper memory management
    onFileDropped: (callback) => {
        const subscription = (event, filePath) => callback(filePath)
        ipcRenderer.on('file:dropped', subscription)
        // Return cleanup function
        return () => ipcRenderer.removeListener('file:dropped', subscription)
    },

    onMenuAction: (callback) => {
        const subscription = (event, action) => callback(action)
        ipcRenderer.on('menu:action', subscription)
        // Return cleanup function
        return () => ipcRenderer.removeListener('menu:action', subscription)
    },

    // Tab operations
    createTab: (filePath, content) => ipcRenderer.invoke('tab:create', filePath, content),
    closeTab: (tabId) => ipcRenderer.invoke('tab:close', tabId),
    switchTab: (tabId) => ipcRenderer.invoke('tab:switch', tabId),
    getTab: (tabId) => ipcRenderer.invoke('tab:get', tabId),
    getAllTabs: () => ipcRenderer.invoke('tab:get-all'),
    getActiveTab: () => ipcRenderer.invoke('tab:get-active'),
    markTabModified: (tabId, isModified) => ipcRenderer.invoke('tab:mark-modified', tabId, isModified),
    updateTabContent: (tabId, content) => ipcRenderer.invoke('tab:update-content', tabId, content),
    updateTabScroll: (tabId, position) => ipcRenderer.invoke('tab:update-scroll', tabId, position),
    updateTabCursor: (tabId, position) => ipcRenderer.invoke('tab:update-cursor', tabId, position),
    updateTabFilePath: (tabId, filePath) => ipcRenderer.invoke('tab:update-filepath', tabId, filePath),
    saveTabs: () => ipcRenderer.invoke('tab:save'),
    restoreTabs: () => ipcRenderer.invoke('tab:restore'),
    getNextTab: () => ipcRenderer.invoke('tab:get-next'),
    getPreviousTab: () => ipcRenderer.invoke('tab:get-previous'),

    // Keyboard shortcut operations
    getShortcut: (actionId) => ipcRenderer.invoke('shortcuts:get', actionId),
    setShortcut: (actionId, keyBinding) => ipcRenderer.invoke('shortcuts:set', actionId, keyBinding),
    resetShortcut: (actionId) => ipcRenderer.invoke('shortcuts:reset', actionId),
    resetAllShortcuts: () => ipcRenderer.invoke('shortcuts:reset-all'),
    getAllShortcuts: () => ipcRenderer.invoke('shortcuts:get-all'),
    getAvailableActions: () => ipcRenderer.invoke('shortcuts:get-available-actions'),
    checkShortcutConflict: (keyBinding, excludeActionId) => ipcRenderer.invoke('shortcuts:check-conflict', keyBinding, excludeActionId),
    getDefaultShortcut: (actionId) => ipcRenderer.invoke('shortcuts:get-default', actionId)
}

// Expose API directly to window when contextIsolation is disabled
window.electronAPI = electronAPI
