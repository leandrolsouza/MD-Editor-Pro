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
    }
}

// Expose API directly to window when contextIsolation is disabled
window.electronAPI = electronAPI
