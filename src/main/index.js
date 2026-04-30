/**
 * Main Process Entry Point
 * Implements security best practices and app lifecycle management
 */

const { app, ipcMain, shell } = require('electron');
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
const WhatsNewManager = require('./whats-new-manager');
const SnippetManager = require('./snippet-manager');
const path = require('path');
const { createApplicationMenu, updateMenuItemChecked } = require('./menu');

// Sandbox disabled to allow nodeIntegration in renderer
// Note: This is less secure and should be replaced with a bundler in production
// app.enableSandbox();

// Create manager instances
const windowManager = new WindowManager();
const configStore = new ConfigStore();
const fileManager = new FileManager(windowManager, configStore);
const advancedMarkdownManager = new AdvancedMarkdownManager(configStore);
const exporter = new Exporter(windowManager, advancedMarkdownManager);
const tabManager = new TabManager(configStore);
const keyboardShortcutManager = new KeyboardShortcutManager(configStore);
const templateManager = new TemplateManager(configStore);
const workspaceManager = new WorkspaceManager(configStore);
const globalSearchManager = new GlobalSearchManager(workspaceManager);
const linkAnalyzerManager = new LinkAnalyzerManager(workspaceManager);
const aiChatManager = new AIChatManager(configStore);
const aiAutocompleteManager = new AIAutocompleteManager(configStore);
const issueReporterManager = new IssueReporterManager(windowManager);
const whatsNewManager = new WhatsNewManager(configStore, app.getVersion(), path.join(app.getAppPath(), 'CHANGELOG.md'));
const snippetManager = new SnippetManager(configStore);
let autoUpdater = null;

/**
 * Helper to refresh the application menu
 */
function refreshMenu() {
    createApplicationMenu(windowManager, fileManager, exporter, configStore, autoUpdater, issueReporterManager);
}

/**
 * Register IPC handlers for all main process operations
 * Delegates to domain-specific IPC modules
 */
function registerIPCHandlers() {
    // Shared dependencies for IPC modules
    const deps = {
        ipcMain,
        fileManager,
        exporter,
        configStore,
        tabManager,
        templateManager,
        keyboardShortcutManager,
        workspaceManager,
        globalSearchManager,
        linkAnalyzerManager,
        advancedMarkdownManager,
        aiChatManager,
        aiAutocompleteManager,
        issueReporterManager,
        whatsNewManager,
        windowManager,
        autoUpdater,
        snippetManager,
        refreshMenu,
        updateMenuItemChecked,
        openExternal: shell.openExternal.bind(shell),
        getAppVersion: () => app.getVersion()
    };

    // Register domain-specific IPC handlers via modules
    require('./ipc/file-handlers').register(deps);
    require('./ipc/export-handlers').register(deps);
    require('./ipc/config-handlers').register(deps);
    require('./ipc/tab-handlers').register(deps);
    require('./ipc/template-handlers').register(deps);
    require('./ipc/shortcut-handlers').register(deps);
    require('./ipc/workspace-handlers').register(deps);
    require('./ipc/search-handlers').register(deps);
    require('./ipc/ai-handlers').register(deps);
    require('./ipc/advanced-markdown-handlers').register(deps);
    require('./ipc/updater-handlers').register(deps);
    require('./ipc/whats-new-handlers').register(deps);
    require('./ipc/link-analyzer-handlers').register(deps);
    require('./ipc/issue-reporter-handlers').register(deps);
    require('./ipc/image-handlers').register(deps);
    require('./ipc/snippet-handlers').register(deps);
}

/**
 * App ready handler
 * Creates the main window when Electron has finished initialization
 */
app.whenReady().then(() => {
    registerIPCHandlers();

    // Create application menu (autoUpdater passed as null initially, rebuilt after init)
    createApplicationMenu(windowManager, fileManager, exporter, configStore, null, issueReporterManager);

    windowManager.createMainWindow();

    // Initialize auto-updater after window is created
    autoUpdater = new AutoUpdater(windowManager);

    // Rebuild menu now that autoUpdater is available
    refreshMenu();

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
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
