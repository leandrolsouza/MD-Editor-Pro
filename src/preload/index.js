const { contextBridge, ipcRenderer } = require('electron')

/**
 * Secure preload script using contextBridge
 * Exposes a limited, safe API to the renderer process
 * Never exposes the full ipcRenderer module
 */

// Expose secure API via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
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
})
