const { ipcRenderer } = require('electron');

/**
 * Preload script that exposes API to renderer process
 * When contextIsolation is disabled, we expose directly to window
 */

const electronAPI = {
    // File operations - using invoke for async request-response
    openFile: () => ipcRenderer.invoke('file:open'),
    openRecentFile: (filePath) => ipcRenderer.invoke('file:open-recent', filePath),
    readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
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
        const subscription = (event, filePath) => callback(filePath);

        ipcRenderer.on('file:dropped', subscription);
        // Return cleanup function
        return () => ipcRenderer.removeListener('file:dropped', subscription);
    },

    onMenuAction: (callback) => {
        const subscription = (event, action, data) => callback(action, data);

        ipcRenderer.on('menu:action', subscription);
        // Return cleanup function
        return () => ipcRenderer.removeListener('menu:action', subscription);
    },

    // Tab operations
    createTab: (filePath, content) => ipcRenderer.invoke('tab:create', filePath, content),
    closeTab: (tabId) => ipcRenderer.invoke('tab:close', tabId),
    switchTab: (tabId) => ipcRenderer.invoke('tab:switch', tabId),
    getTab: (tabId) => ipcRenderer.invoke('tab:get', tabId),
    getAllTabs: () => ipcRenderer.invoke('tab:get-all'),
    getModifiedTabs: () => ipcRenderer.invoke('tab:get-modified'),
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
    getDefaultShortcut: (actionId) => ipcRenderer.invoke('shortcuts:get-default', actionId),

    // Template operations
    getTemplate: (templateId) => ipcRenderer.invoke('template:get', templateId),
    getAllTemplates: () => ipcRenderer.invoke('template:get-all'),
    getBuiltInTemplates: () => ipcRenderer.invoke('template:get-builtin'),
    getCustomTemplates: () => ipcRenderer.invoke('template:get-custom'),
    saveCustomTemplate: (name, content, metadata) => ipcRenderer.invoke('template:save-custom', name, content, metadata),
    deleteCustomTemplate: (templateId) => ipcRenderer.invoke('template:delete-custom', templateId),
    updateCustomTemplate: (templateId, updates) => ipcRenderer.invoke('template:update-custom', templateId, updates),
    getTemplateCategories: () => ipcRenderer.invoke('template:get-categories'),
    getTemplatesByCategory: (category) => ipcRenderer.invoke('template:get-by-category', category),
    markTemplateUsed: (templateId) => ipcRenderer.invoke('template:mark-used', templateId),
    findPlaceholders: (content) => ipcRenderer.invoke('template:find-placeholders', content),
    getFirstPlaceholderPosition: (content) => ipcRenderer.invoke('template:get-first-placeholder-position', content),

    // Advanced Markdown operations
    getAdvancedMarkdownSettings: () => ipcRenderer.invoke('advanced-markdown:get-settings'),
    toggleAdvancedMarkdownFeature: (featureName, enabled) => ipcRenderer.invoke('advanced-markdown:toggle-feature', featureName, enabled),

    onAdvancedMarkdownSettingsChanged: (callback) => {
        const subscription = (event, featureName, enabled) => callback(featureName, enabled);

        ipcRenderer.on('advanced-markdown:settings-changed', subscription);
        // Return cleanup function
        return () => ipcRenderer.removeListener('advanced-markdown:settings-changed', subscription);
    },

    // Shell operations
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),

    // Workspace operations
    openWorkspace: () => ipcRenderer.invoke('workspace:open'),
    closeWorkspace: () => ipcRenderer.invoke('workspace:close'),
    getWorkspacePath: () => ipcRenderer.invoke('workspace:get-path'),
    getWorkspaceTree: () => ipcRenderer.invoke('workspace:get-tree'),
    restoreWorkspace: () => ipcRenderer.invoke('workspace:restore'),
    toggleFolder: (folderPath, isExpanded) => ipcRenderer.invoke('workspace:toggle-folder', folderPath, isExpanded),

    // Line numbers operations
    getLineNumbers: () => ipcRenderer.invoke('config:get-line-numbers'),
    toggleLineNumbers: () => ipcRenderer.invoke('config:toggle-line-numbers'),

    // Global search operations
    globalSearch: (searchText, options) => ipcRenderer.invoke('global-search:search', searchText, options),

    // Image paste operations
    saveImageFromClipboard: (imageBuffer, currentFilePath) => ipcRenderer.invoke('image:save-from-clipboard', imageBuffer, currentFilePath),

    // System information
    getVersions: () => ({
        electron: process.versions.electron || 'N/A',
        chrome: process.versions.chrome || 'N/A',
        node: process.versions.node || 'N/A'
    })
};

// Expose API directly to window when contextIsolation is disabled
window.electronAPI = electronAPI;
