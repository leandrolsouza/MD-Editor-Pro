/**
 * Main Process Entry Point
 * Implements security best practices and app lifecycle management
 */

const { app, ipcMain } = require('electron');
const WindowManager = require('./window');
const FileManager = require('./file-manager');
const Exporter = require('./exporter');
const ConfigStore = require('./config-store');
const TabManager = require('./tab-manager');
const KeyboardShortcutManager = require('./keyboard-shortcut-manager');
const TemplateManager = require('./template-manager');
const AdvancedMarkdownManager = require('./advanced-markdown-manager');
const { createApplicationMenu } = require('./menu');

// Sandbox disabled to allow nodeIntegration in renderer
// Note: This is less secure and should be replaced with a bundler in production
// app.enableSandbox();

// Create window manager instance
const windowManager = new WindowManager();

// Create config store instance (moved up to be available for other managers)
const configStore = new ConfigStore();

// Create file manager instance
const fileManager = new FileManager(windowManager, configStore);

// Create advanced markdown manager instance (moved up to be available for exporter)
const advancedMarkdownManager = new AdvancedMarkdownManager(configStore);

// Create exporter instance
const exporter = new Exporter(windowManager, advancedMarkdownManager);

// Create tab manager instance
const tabManager = new TabManager(configStore);

// Create keyboard shortcut manager instance
const keyboardShortcutManager = new KeyboardShortcutManager(configStore);

// Create template manager instance
const templateManager = new TemplateManager(configStore);

/**
 * Register IPC handlers for all main process operations
 * Implements proper error handling for all handlers
 * Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 6.3, 8.4
 */
function registerIPCHandlers() {
    // File operations
    ipcMain.handle('file:open', async () => {
        try {
            console.log('IPC handler file:open called');
            const result = await fileManager.openFile();

            console.log('fileManager.openFile result:', result);

            // Update menu to reflect new recent files
            if (result) {
                createApplicationMenu(windowManager, fileManager, exporter, configStore);
            }

            return result;
        } catch (error) {
            console.error('Error opening file:', error);
            throw error;
        }
    });

    ipcMain.handle('file:open-recent', async (event, filePath) => {
        try {
            const result = await fileManager.openRecentFile(filePath);

            // Update menu to reflect updated recent files
            createApplicationMenu(windowManager, fileManager, exporter, configStore);

            return result;
        } catch (error) {
            console.error('Error opening recent file:', error);
            throw error;
        }
    });

    ipcMain.handle('file:save', async (event, filePath, content) => {
        try {
            await fileManager.saveFile(filePath, content);
            return { success: true };
        } catch (error) {
            console.error('Error saving file:', error);
            throw error;
        }
    });

    ipcMain.handle('file:save-as', async (event, content) => {
        try {
            const filePath = await fileManager.saveFileAs(content);

            return { success: true, filePath };
        } catch (error) {
            console.error('Error saving file as:', error);
            throw error;
        }
    });

    // Export operations
    ipcMain.handle('export:html', async (event, content, theme = 'light') => {
        try {
            const filePath = await exporter.exportToHTML(content, theme);

            if (filePath) {
                return { success: true, filePath };
            } else {
                // User cancelled the export
                return { success: false, cancelled: true };
            }
        } catch (error) {
            console.error('Error exporting to HTML:', error);
            throw error;
        }
    });

    ipcMain.handle('export:pdf', async (event, content, theme = 'light') => {
        try {
            const filePath = await exporter.exportToPDF(content, theme);

            if (filePath) {
                return { success: true, filePath };
            } else {
                // User cancelled the export
                return { success: false, cancelled: true };
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            throw error;
        }
    });

    // Config operations
    ipcMain.handle('config:get', async (event, key) => {
        try {
            const value = configStore.get(key);

            return { success: true, value };
        } catch (error) {
            console.error('Error getting config:', error);
            throw error;
        }
    });

    ipcMain.handle('config:set', async (event, key, value) => {
        try {
            configStore.set(key, value);
            return { success: true };
        } catch (error) {
            console.error('Error setting config:', error);
            throw error;
        }
    });

    // Tab operations
    ipcMain.handle('tab:create', async (event, filePath, content) => {
        try {
            const tab = tabManager.createTab(filePath, content);

            return { success: true, tab };
        } catch (error) {
            console.error('Error creating tab:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:close', async (event, tabId) => {
        try {
            const result = tabManager.closeTab(tabId);

            return { success: result };
        } catch (error) {
            console.error('Error closing tab:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:switch', async (event, tabId) => {
        try {
            const tab = tabManager.switchTab(tabId);

            return { success: !!tab, tab };
        } catch (error) {
            console.error('Error switching tab:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:get', async (event, tabId) => {
        try {
            const tab = tabManager.getTab(tabId);

            return { success: !!tab, tab };
        } catch (error) {
            console.error('Error getting tab:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:get-all', async () => {
        try {
            const tabs = tabManager.getAllTabs();

            return { success: true, tabs };
        } catch (error) {
            console.error('Error getting all tabs:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:get-modified', async () => {
        try {
            const tabs = tabManager.getModifiedTabs();

            return { success: true, tabs };
        } catch (error) {
            console.error('Error getting modified tabs:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:get-active', async () => {
        try {
            const tab = tabManager.getActiveTab();
            const tabId = tabManager.getActiveTabId();

            return { success: true, tab, tabId };
        } catch (error) {
            console.error('Error getting active tab:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:mark-modified', async (event, tabId, isModified) => {
        try {
            const result = tabManager.markTabModified(tabId, isModified);

            return { success: result };
        } catch (error) {
            console.error('Error marking tab modified:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:update-content', async (event, tabId, content) => {
        try {
            const result = tabManager.updateTabContent(tabId, content);

            return { success: result };
        } catch (error) {
            console.error('Error updating tab content:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:update-scroll', async (event, tabId, position) => {
        try {
            const result = tabManager.updateTabScrollPosition(tabId, position);

            return { success: result };
        } catch (error) {
            console.error('Error updating tab scroll:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:update-cursor', async (event, tabId, position) => {
        try {
            const result = tabManager.updateTabCursorPosition(tabId, position);

            return { success: result };
        } catch (error) {
            console.error('Error updating tab cursor:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:update-filepath', async (event, tabId, filePath) => {
        try {
            const result = tabManager.updateTabFilePath(tabId, filePath);

            return { success: result };
        } catch (error) {
            console.error('Error updating tab filepath:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:save', async () => {
        try {
            tabManager.saveTabs();
            return { success: true };
        } catch (error) {
            console.error('Error saving tabs:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:restore', async () => {
        try {
            const result = tabManager.restoreTabs();

            return { success: result };
        } catch (error) {
            console.error('Error restoring tabs:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:get-next', async () => {
        try {
            const tabId = tabManager.getNextTabId();

            return { success: true, tabId };
        } catch (error) {
            console.error('Error getting next tab:', error);
            throw error;
        }
    });

    ipcMain.handle('tab:get-previous', async () => {
        try {
            const tabId = tabManager.getPreviousTabId();

            return { success: true, tabId };
        } catch (error) {
            console.error('Error getting previous tab:', error);
            throw error;
        }
    });

    // Keyboard shortcut operations
    ipcMain.handle('shortcuts:get', async (event, actionId) => {
        try {
            const shortcut = keyboardShortcutManager.getShortcut(actionId);

            return { success: true, shortcut };
        } catch (error) {
            console.error('Error getting shortcut:', error);
            throw error;
        }
    });

    ipcMain.handle('shortcuts:set', async (event, actionId, keyBinding) => {
        try {
            keyboardShortcutManager.setShortcut(actionId, keyBinding);
            return { success: true };
        } catch (error) {
            console.error('Error setting shortcut:', error);
            throw error;
        }
    });

    ipcMain.handle('shortcuts:reset', async (event, actionId) => {
        try {
            keyboardShortcutManager.resetShortcut(actionId);
            return { success: true };
        } catch (error) {
            console.error('Error resetting shortcut:', error);
            throw error;
        }
    });

    ipcMain.handle('shortcuts:reset-all', async () => {
        try {
            keyboardShortcutManager.resetAllShortcuts();
            return { success: true };
        } catch (error) {
            console.error('Error resetting all shortcuts:', error);
            throw error;
        }
    });

    ipcMain.handle('shortcuts:get-all', async () => {
        try {
            const shortcuts = keyboardShortcutManager.getAllShortcuts();

            return { success: true, shortcuts };
        } catch (error) {
            console.error('Error getting all shortcuts:', error);
            throw error;
        }
    });

    ipcMain.handle('shortcuts:get-available-actions', async () => {
        try {
            const actions = keyboardShortcutManager.getAvailableActions();

            return { success: true, actions };
        } catch (error) {
            console.error('Error getting available actions:', error);
            throw error;
        }
    });

    ipcMain.handle('shortcuts:check-conflict', async (event, keyBinding, excludeActionId) => {
        try {
            const hasConflict = keyboardShortcutManager.hasConflict(keyBinding, excludeActionId);
            const conflictingAction = keyboardShortcutManager.getConflictingAction(keyBinding, excludeActionId);

            return { success: true, hasConflict, conflictingAction };
        } catch (error) {
            console.error('Error checking conflict:', error);
            throw error;
        }
    });

    ipcMain.handle('shortcuts:get-default', async (event, actionId) => {
        try {
            const shortcut = keyboardShortcutManager.getDefaultShortcut(actionId);

            return { success: true, shortcut };
        } catch (error) {
            console.error('Error getting default shortcut:', error);
            throw error;
        }
    });

    // Template operations
    ipcMain.handle('template:get', async (event, templateId) => {
        try {
            const template = templateManager.getTemplate(templateId);

            return { success: !!template, template };
        } catch (error) {
            console.error('Error getting template:', error);
            throw error;
        }
    });

    ipcMain.handle('template:get-all', async () => {
        try {
            const templates = templateManager.getAllTemplates();

            return { success: true, templates };
        } catch (error) {
            console.error('Error getting all templates:', error);
            throw error;
        }
    });

    ipcMain.handle('template:get-builtin', async () => {
        try {
            const templates = templateManager.getBuiltInTemplates();

            return { success: true, templates };
        } catch (error) {
            console.error('Error getting built-in templates:', error);
            throw error;
        }
    });

    ipcMain.handle('template:get-custom', async () => {
        try {
            const templates = templateManager.getCustomTemplates();

            return { success: true, templates };
        } catch (error) {
            console.error('Error getting custom templates:', error);
            throw error;
        }
    });

    ipcMain.handle('template:save-custom', async (event, name, content, metadata) => {
        try {
            const template = templateManager.saveCustomTemplate(name, content, metadata);

            return { success: true, template };
        } catch (error) {
            console.error('Error saving custom template:', error);
            throw error;
        }
    });

    ipcMain.handle('template:delete-custom', async (event, templateId) => {
        try {
            const result = templateManager.deleteCustomTemplate(templateId);

            return { success: result };
        } catch (error) {
            console.error('Error deleting custom template:', error);
            throw error;
        }
    });

    ipcMain.handle('template:update-custom', async (event, templateId, updates) => {
        try {
            const result = templateManager.updateCustomTemplate(templateId, updates);

            return { success: result };
        } catch (error) {
            console.error('Error updating custom template:', error);
            throw error;
        }
    });

    ipcMain.handle('template:get-categories', async () => {
        try {
            const categories = templateManager.getCategories();

            return { success: true, categories };
        } catch (error) {
            console.error('Error getting categories:', error);
            throw error;
        }
    });

    ipcMain.handle('template:get-by-category', async (event, category) => {
        try {
            const templates = templateManager.getTemplatesByCategory(category);

            return { success: true, templates };
        } catch (error) {
            console.error('Error getting templates by category:', error);
            throw error;
        }
    });

    ipcMain.handle('template:mark-used', async (event, templateId) => {
        try {
            templateManager.markTemplateUsed(templateId);
            return { success: true };
        } catch (error) {
            console.error('Error marking template used:', error);
            throw error;
        }
    });

    ipcMain.handle('template:find-placeholders', async (event, content) => {
        try {
            const placeholders = templateManager.findPlaceholders(content);

            return { success: true, placeholders };
        } catch (error) {
            console.error('Error finding placeholders:', error);
            throw error;
        }
    });

    ipcMain.handle('template:get-first-placeholder-position', async (event, content) => {
        try {
            const position = templateManager.getFirstPlaceholderPosition(content);

            return { success: true, position };
        } catch (error) {
            console.error('Error getting first placeholder position:', error);
            throw error;
        }
    });

    // Advanced Markdown operations
    // Requirement: 6.1 - Get current settings
    ipcMain.handle('advanced-markdown:get-settings', async () => {
        try {
            const features = advancedMarkdownManager.getAllFeatures();

            return { success: true, features };
        } catch (error) {
            console.error('Error getting advanced markdown settings:', error);
            throw error;
        }
    });

    // Requirements: 6.2, 6.3, 6.4 - Toggle feature and save to ConfigStore
    ipcMain.handle('advanced-markdown:toggle-feature', async (event, featureName, enabled) => {
        try {
            advancedMarkdownManager.toggleFeature(featureName, enabled);

            // Notify renderer of configuration changes
            const mainWindow = windowManager.getMainWindow();

            if (mainWindow) {
                mainWindow.webContents.send('advanced-markdown:settings-changed', featureName, enabled);
            }

            return { success: true };
        } catch (error) {
            console.error('Error toggling advanced markdown feature:', error);
            throw error;
        }
    });

    // Shell operations
    ipcMain.handle('shell:open-external', async (event, url) => {
        try {
            const { shell } = require('electron');

            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            console.error('Error opening external URL:', error);
            throw error;
        }
    });
}

/**
 * App ready handler
 * Creates the main window when Electron has finished initialization
 */
app.whenReady().then(() => {
    // Register IPC handlers
    registerIPCHandlers();

    // Create application menu
    createApplicationMenu(windowManager, fileManager, exporter, configStore);

    windowManager.createMainWindow();

    // On macOS, re-create window when dock icon is clicked and no windows are open
    app.on('activate', () => {
        if (windowManager.getMainWindow() === null) {
            windowManager.createMainWindow();
        }
    });
});

/**
 * Window all closed handler
 * Quits the app when all windows are closed, except on macOS
 */
app.on('window-all-closed', () => {
    // On macOS, apps typically stay active until user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
