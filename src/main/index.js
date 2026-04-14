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
const WorkspaceManager = require('./workspace-manager');
const GlobalSearchManager = require('./global-search-manager');
const LinkAnalyzerManager = require('./link-analyzer-manager');
const AutoUpdater = require('./auto-updater');
const AIChatManager = require('./ai-chat-manager');
const AIAutocompleteManager = require('./ai-autocomplete-manager');
const IssueReporterManager = require('./issue-reporter-manager');
const { createApplicationMenu, updateMenuItemChecked } = require('./menu');

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

// Create workspace manager instance
const workspaceManager = new WorkspaceManager(configStore);

// Create global search manager instance
const globalSearchManager = new GlobalSearchManager(workspaceManager);

// Create link analyzer manager instance
const linkAnalyzerManager = new LinkAnalyzerManager(workspaceManager);

// Create AI chat manager instance
const aiChatManager = new AIChatManager(configStore);

// Create AI autocomplete manager instance
const aiAutocompleteManager = new AIAutocompleteManager(configStore);

// Create issue reporter manager instance
const issueReporterManager = new IssueReporterManager(windowManager);

// Create auto-updater instance
let autoUpdater = null;

/**
 * Built-in snippets for common markdown elements
 */
const BUILT_IN_SNIPPETS = [
    {
        trigger: 'code',
        content: '```{{language}}\n{{code}}\n```',
        description: 'Code block with syntax highlighting',
        placeholders: ['{{language}}', '{{code}}'],
        isBuiltIn: true
    },
    {
        trigger: 'table',
        content: '| {{header1}} | {{header2}} | {{header3}} |\n|------------|------------|------------|\n| {{cell1}}   | {{cell2}}   | {{cell3}}   |',
        description: 'Markdown table structure',
        placeholders: ['{{header1}}', '{{header2}}', '{{header3}}', '{{cell1}}', '{{cell2}}', '{{cell3}}'],
        isBuiltIn: true
    },
    {
        trigger: 'link',
        content: '[{{text}}]({{url}})',
        description: 'Markdown link',
        placeholders: ['{{text}}', '{{url}}'],
        isBuiltIn: true
    },
    {
        trigger: 'img',
        content: '![{{alt}}]({{url}})',
        description: 'Markdown image',
        placeholders: ['{{alt}}', '{{url}}'],
        isBuiltIn: true
    },
    {
        trigger: 'task',
        content: '- [ ] {{task}}',
        description: 'Task list item',
        placeholders: ['{{task}}'],
        isBuiltIn: true
    },
    {
        trigger: 'quote',
        content: '> {{quote}}',
        description: 'Block quote',
        placeholders: ['{{quote}}'],
        isBuiltIn: true
    }
];

/**
 * Get all built-in snippets
 * @returns {Array} Array of built-in snippets
 */
function getBuiltInSnippets() {
    return [...BUILT_IN_SNIPPETS];
}

/**
 * Find placeholders in snippet content
 * @param {string} content - Snippet content
 * @returns {Array<string>} Array of placeholder strings
 */
function findSnippetPlaceholders(content) {
    if (!content || typeof content !== 'string') {
        return [];
    }
    const matches = content.match(/\{\{[^}]+\}\}/g);
    return matches || [];
}

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
                createApplicationMenu(windowManager, fileManager, exporter, configStore, autoUpdater, issueReporterManager);
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
            createApplicationMenu(windowManager, fileManager, exporter, configStore, autoUpdater, issueReporterManager);

            return result;
        } catch (error) {
            console.error('Error opening recent file:', error);
            throw error;
        }
    });

    ipcMain.handle('file:read', async (event, filePath) => {
        try {
            const result = await fileManager.readFile(filePath);

            return result;
        } catch (error) {
            console.error('Error reading file:', error);
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

            // Update menu checkboxes for specific keys
            if (key === 'workspace.sidebarVisible') {
                updateMenuItemChecked('View.Toggle Sidebar', value);
            } else if (key === 'outline.visible') {
                updateMenuItemChecked('View.Outline Panel', value);
            } else if (key === 'typewriter.enabled') {
                updateMenuItemChecked('View.Typewriter Scrolling', value);
            }

            return { success: true };
        } catch (error) {
            console.error('Error setting config:', error);
            throw error;
        }
    });

    ipcMain.handle('config:get-line-numbers', async () => {
        try {
            const enabled = configStore.get('lineNumbers');
            return enabled !== undefined ? enabled : true;
        } catch (error) {
            console.error('Error getting line numbers config:', error);
            throw error;
        }
    });

    ipcMain.handle('config:toggle-line-numbers', async () => {
        try {
            const currentValue = configStore.get('lineNumbers');
            const newValue = currentValue !== undefined ? !currentValue : false;
            configStore.set('lineNumbers', newValue);

            // Update menu to reflect new state
            createApplicationMenu(windowManager, fileManager, exporter, configStore, autoUpdater, issueReporterManager);

            return { success: true, enabled: newValue };
        } catch (error) {
            console.error('Error toggling line numbers:', error);
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

    // Snippet operations
    ipcMain.handle('snippet:get-all', async () => {
        try {
            const builtIn = getBuiltInSnippets();
            const custom = configStore.getCustomSnippets();
            return { success: true, snippets: [...builtIn, ...custom] };
        } catch (error) {
            console.error('Error getting all snippets:', error);
            throw error;
        }
    });

    ipcMain.handle('snippet:get-builtin', async () => {
        try {
            const snippets = getBuiltInSnippets();
            return { success: true, snippets };
        } catch (error) {
            console.error('Error getting built-in snippets:', error);
            throw error;
        }
    });

    ipcMain.handle('snippet:get-custom', async () => {
        try {
            const snippets = configStore.getCustomSnippets();
            return { success: true, snippets };
        } catch (error) {
            console.error('Error getting custom snippets:', error);
            throw error;
        }
    });

    ipcMain.handle('snippet:save-custom', async (event, trigger, content, description) => {
        try {
            const snippet = {
                trigger: trigger.trim(),
                content,
                description: description || '',
                placeholders: findSnippetPlaceholders(content),
                isBuiltIn: false,
                createdAt: Date.now()
            };
            configStore.addCustomSnippet(snippet);
            return { success: true, snippet };
        } catch (error) {
            console.error('Error saving custom snippet:', error);
            throw error;
        }
    });

    ipcMain.handle('snippet:delete-custom', async (event, trigger) => {
        try {
            configStore.deleteCustomSnippet(trigger);
            return { success: true };
        } catch (error) {
            console.error('Error deleting custom snippet:', error);
            throw error;
        }
    });

    ipcMain.handle('snippet:update-custom', async (event, trigger, updates) => {
        try {
            if (updates.content) {
                updates.placeholders = findSnippetPlaceholders(updates.content);
            }
            configStore.updateCustomSnippet(trigger, updates);
            return { success: true };
        } catch (error) {
            console.error('Error updating custom snippet:', error);
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

    // Workspace operations
    ipcMain.handle('workspace:open', async () => {
        try {
            const result = await workspaceManager.openWorkspace();

            return result;
        } catch (error) {
            console.error('Error opening workspace:', error);
            throw error;
        }
    });

    ipcMain.handle('workspace:close', async () => {
        try {
            const result = workspaceManager.closeWorkspace();

            return result;
        } catch (error) {
            console.error('Error closing workspace:', error);
            throw error;
        }
    });

    ipcMain.handle('workspace:get-path', async () => {
        try {
            const workspacePath = workspaceManager.getWorkspacePath();

            return { success: true, workspacePath };
        } catch (error) {
            console.error('Error getting workspace path:', error);
            throw error;
        }
    });

    ipcMain.handle('workspace:get-tree', async () => {
        try {
            const tree = await workspaceManager.getWorkspaceTree();

            return { success: true, tree };
        } catch (error) {
            console.error('Error getting workspace tree:', error);
            throw error;
        }
    });

    ipcMain.handle('workspace:restore', async () => {
        try {
            const result = await workspaceManager.restoreWorkspace();

            return result;
        } catch (error) {
            console.error('Error restoring workspace:', error);
            throw error;
        }
    });

    ipcMain.handle('workspace:toggle-folder', async (event, folderPath, isExpanded) => {
        try {
            const result = await workspaceManager.toggleFolder(folderPath, isExpanded);

            return result;
        } catch (error) {
            console.error('Error toggling folder:', error);
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

    // Global search operations
    ipcMain.handle('global-search:search', async (event, searchText, options) => {
        try {
            const result = await globalSearchManager.searchInWorkspace(searchText, options);

            return result;
        } catch (error) {
            console.error('Error performing global search:', error);
            throw error;
        }
    });

    // Graph operations
    ipcMain.handle('graph:get-data', async () => {
        try {
            return await linkAnalyzerManager.analyzeWorkspace();
        } catch (error) {
            console.error('Error getting graph data:', error);
            return { success: false, error: error.message };
        }
    });

    // Image paste operations
    ipcMain.handle('image:save-from-clipboard', async (event, imageBuffer, currentFilePath) => {
        try {
            const result = await fileManager.saveImageFromClipboard(imageBuffer, currentFilePath);

            return result;
        } catch (error) {
            console.error('Error saving image from clipboard:', error);
            throw error;
        }
    });

    // Auto-updater operations
    ipcMain.handle('updater:check-for-updates', async () => {
        try {
            if (!autoUpdater) {
                return { success: false, error: 'Auto-updater not initialized' };
            }
            const result = await autoUpdater.checkForUpdates();
            return { success: true, updateInfo: result };
        } catch (error) {
            console.error('Error checking for updates:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('updater:download-update', async () => {
        try {
            if (!autoUpdater) {
                return { success: false, error: 'Auto-updater not initialized' };
            }
            const result = await autoUpdater.downloadUpdate();
            return result;
        } catch (error) {
            console.error('Error downloading update:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('updater:quit-and-install', async () => {
        try {
            if (!autoUpdater) {
                return { success: false, error: 'Auto-updater not initialized' };
            }
            autoUpdater.quitAndInstall();
            return { success: true };
        } catch (error) {
            console.error('Error installing update:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('updater:get-current-version', async () => {
        try {
            if (!autoUpdater) {
                return { success: false, error: 'Auto-updater not initialized' };
            }
            const version = autoUpdater.getCurrentVersion();
            return { success: true, version };
        } catch (error) {
            console.error('Error getting current version:', error);
            return { success: false, error: error.message };
        }
    });

    // App version operations
    ipcMain.handle('app:get-version', async () => {
        try {
            return { success: true, version: app.getVersion() };
        } catch (error) {
            console.error('Error getting app version:', error);
            return { success: false, error: error.message };
        }
    });

    // AI Chat operations
    ipcMain.handle('ai:send-message', async (event, message, documentContent, selectedText) => {
        try {
            const result = await aiChatManager.sendMessage(message, documentContent, selectedText);
            return result;
        } catch (error) {
            console.error('Error sending AI message:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai:clear-history', async () => {
        try {
            aiChatManager.clearHistory();
            return { success: true };
        } catch (error) {
            console.error('Error clearing AI history:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai:get-api-key', async () => {
        try {
            const apiKey = aiChatManager.getApiKey();
            return apiKey || '';
        } catch (error) {
            console.error('Error getting API key:', error);
            return '';
        }
    });

    ipcMain.handle('ai:set-api-key', async (event, apiKey, provider) => {
        try {
            aiChatManager.setApiKey(apiKey, provider);
            return { success: true };
        } catch (error) {
            console.error('Error setting API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai:get-model', async (event, provider) => {
        try {
            return aiChatManager.getModel(provider);
        } catch (error) {
            console.error('Error getting AI model:', error);
            return 'gpt-4o-mini';
        }
    });

    ipcMain.handle('ai:set-model', async (event, model, provider) => {
        try {
            aiChatManager.setModel(model, provider);
            return { success: true };
        } catch (error) {
            console.error('Error setting AI model:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai:get-models', async () => {
        try {
            return aiChatManager.getAvailableModels();
        } catch (error) {
            console.error('Error getting AI models:', error);
            return [];
        }
    });

    ipcMain.handle('ai:get-provider', async () => {
        try {
            return aiChatManager.getProvider();
        } catch (error) {
            console.error('Error getting AI provider:', error);
            return 'openai';
        }
    });

    ipcMain.handle('ai:set-provider', async (event, provider) => {
        try {
            aiChatManager.setProvider(provider);
            return { success: true };
        } catch (error) {
            console.error('Error setting AI provider:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai:get-local-url', async () => {
        try {
            return aiChatManager.getLocalServerUrl();
        } catch (error) {
            console.error('Error getting local server URL:', error);
            return 'http://localhost:1234';
        }
    });

    ipcMain.handle('ai:set-local-url', async (event, url) => {
        try {
            aiChatManager.setLocalServerUrl(url);
            return { success: true };
        } catch (error) {
            console.error('Error setting local server URL:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai:get-local-api-key', async () => {
        try {
            return aiChatManager.getLocalApiKey() || '';
        } catch (error) {
            console.error('Error getting local API key:', error);
            return '';
        }
    });

    ipcMain.handle('ai:set-local-api-key', async (event, apiKey) => {
        try {
            aiChatManager.setLocalApiKey(apiKey);
            return { success: true };
        } catch (error) {
            console.error('Error setting local API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai:fetch-local-models', async () => {
        try {
            return await aiChatManager.fetchLocalModels();
        } catch (error) {
            console.error('Error fetching local models:', error);
            return [];
        }
    });

    ipcMain.handle('ai:test-local-connection', async () => {
        try {
            return await aiChatManager.testLocalConnection();
        } catch (error) {
            console.error('Error testing local connection:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai:test-api-key', async (event, apiKey, provider) => {
        try {
            return await aiChatManager.testApiKey(apiKey, provider);
        } catch (error) {
            console.error('Error testing API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai:get-settings', async () => {
        try {
            return aiChatManager.getSettings();
        } catch (error) {
            console.error('Error getting AI settings:', error);
            return null;
        }
    });

    ipcMain.handle('ai:transform-text', async (event, text, command, customPrompt, targetLanguage) => {
        try {
            return await aiChatManager.transformText(text, command, customPrompt, targetLanguage);
        } catch (error) {
            console.error('Error transforming text:', error);
            return { success: false, error: error.message };
        }
    });

    // AI Autocomplete operations
    ipcMain.handle('ai-autocomplete:get-suggestion', async (event, textBefore, textAfter) => {
        try {
            return await aiAutocompleteManager.getSuggestion(textBefore, textAfter);
        } catch (error) {
            console.error('Error getting autocomplete suggestion:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai-autocomplete:get-settings', async () => {
        try {
            return aiAutocompleteManager.getSettings();
        } catch (error) {
            console.error('Error getting autocomplete settings:', error);
            return null;
        }
    });

    ipcMain.handle('ai-autocomplete:set-enabled', async (event, enabled) => {
        try {
            aiAutocompleteManager.setEnabled(enabled);
            return { success: true };
        } catch (error) {
            console.error('Error setting autocomplete enabled:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai-autocomplete:set-debounce', async (event, ms) => {
        try {
            aiAutocompleteManager.setDebounceMs(ms);
            return { success: true };
        } catch (error) {
            console.error('Error setting autocomplete debounce:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai-autocomplete:set-min-chars', async (event, chars) => {
        try {
            aiAutocompleteManager.setMinCharsToTrigger(chars);
            return { success: true };
        } catch (error) {
            console.error('Error setting autocomplete min chars:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ai-autocomplete:set-max-tokens', async (event, tokens) => {
        try {
            aiAutocompleteManager.setMaxTokens(tokens);
            return { success: true };
        } catch (error) {
            console.error('Error setting autocomplete max tokens:', error);
            return { success: false, error: error.message };
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

    // Register issue reporter handlers
    issueReporterManager.registerHandlers();

    // Create application menu (autoUpdater passed as null initially, rebuilt after init)
    createApplicationMenu(windowManager, fileManager, exporter, configStore, null, issueReporterManager);

    windowManager.createMainWindow();

    // Initialize auto-updater after window is created
    autoUpdater = new AutoUpdater(windowManager);

    // Rebuild menu now that autoUpdater is available
    createApplicationMenu(windowManager, fileManager, exporter, configStore, autoUpdater, issueReporterManager);

    // Check for updates 3 seconds after app starts
    setTimeout(() => {
        if (autoUpdater) {
            autoUpdater.checkForUpdates();
        }
    }, 3000);

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
