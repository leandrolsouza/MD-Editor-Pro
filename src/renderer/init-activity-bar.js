/**
 * Activity Bar view registration and Command Palette command registration.
 *
 * @module init-activity-bar
 * Requirements: 3.3, 3.4
 */

const notificationManager = require('./ui/notification.js');
const i18n = require('./i18n/index.js');
const { getIcon } = require('./ui/icons.js');

/**
 * Register all views with the Activity Bar.
 * @param {ComponentRegistry} registry
 * @param {Object} handlers - Handler functions from handlers.js
 */
function registerActivityBarViews(registry, handlers) {
    const activityBar = registry.get('activityBar');
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    const fileTreeContainer = registry.get('fileTreeContainer');
    const globalSearchUI = registry.get('globalSearchUI');
    const outlinePanelContainer = registry.get('outlinePanelContainer');
    const templateUI = registry.get('templateUI');
    const snippetManager = registry.get('snippetManager');
    const snippetUI = registry.get('snippetUI');
    const settingsPanel = registry.get('settingsPanel');
    const aiChatPanel = registry.get('aiChatPanel');
    const editor = registry.get('editor');
    const connectionGraphPanel = registry.get('connectionGraphPanel');
    const backlinksPanel = registry.get('backlinksPanel');

    if (fileTreeSidebar) {
        activityBar.registerView('files', i18n.t('activityBar.explorer').toUpperCase(), fileTreeContainer, [
            {
                icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    <line x1="12" y1="11" x2="12" y2="17"/>
                    <line x1="9" y1="14" x2="15" y2="14"/>
                </svg>`,
                title: 'Abrir Pasta',
                onClick: () => handlers.handleOpenFolder()
            }
        ]);
    }

    if (globalSearchUI) {
        const searchPanel = globalSearchUI.container;
        if (searchPanel) {
            searchPanel.classList.remove('hidden');
            activityBar.registerView('search', i18n.t('activityBar.search').toUpperCase(), searchPanel);
        }
    }

    if (registry.get('outlinePanel')) {
        activityBar.registerView('outline', i18n.t('activityBar.outline').toUpperCase(), outlinePanelContainer);
    }

    if (templateUI) {
        activityBar.registerView('templates', i18n.t('activityBar.templates').toUpperCase(), () => templateUI.createSidebarPanel());
    }

    if (snippetManager && snippetUI) {
        snippetUI.onInsert((snippet) => {
            if (editor && editor.view) {
                snippetManager.insertSnippetContent(snippet);
                editor.view.focus();
            }
        });
        activityBar.registerView('snippets', i18n.t('activityBar.snippets').toUpperCase(), () => snippetUI.createSidebarPanel());
    }

    // Settings view
    const settingsContent = document.createElement('div');
    settingsContent.id = 'settings-container';
    settingsPanel.initialize(settingsContent);
    activityBar.registerView('settings', i18n.t('activityBar.settings').toUpperCase(), settingsContent);

    // AI Chat view
    const aiChatContainer = document.createElement('div');
    aiChatContainer.id = 'ai-chat-container';
    aiChatContainer.className = 'ai-chat-container';
    aiChatPanel.initialize(aiChatContainer);
    activityBar.registerView('ai-chat', i18n.t('activityBar.aiAssistant').toUpperCase(), aiChatContainer);

    // Connection Graph view
    const connectionGraphContainer = connectionGraphPanel.initialize();
    activityBar.registerView('connection-graph', i18n.t('activityBar.connectionGraph').toUpperCase(), connectionGraphContainer);
    connectionGraphPanel.onNodeClick(async (filePath) => {
        try {
            const allTabsResult = await window.electronAPI.getAllTabs();
            if (allTabsResult.success && allTabsResult.tabs) {
                const existingTab = allTabsResult.tabs.find(tab => tab.filePath === filePath);
                if (existingTab) { await handlers.switchToTab(existingTab.id); return; }
            }
            const result = await window.electronAPI.readFile(filePath);
            if (result && result.success) await handlers.createNewTab(filePath, result.content);
        } catch (error) {
            console.error('Error opening file from connection graph:', error);
            notificationManager.error(i18n.t('notifications.failedToOpenFile') + ': ' + error.message);
        }
    });

    // Backlinks Panel view
    const backlinksContainer = backlinksPanel.initialize();
    backlinksPanel.onFileClicked(async (filePath) => {
        try {
            const allTabsResult = await window.electronAPI.getAllTabs();
            if (allTabsResult.success && allTabsResult.tabs) {
                const existingTab = allTabsResult.tabs.find(tab => tab.filePath === filePath);
                if (existingTab) { await handlers.switchToTab(existingTab.id); return; }
            }
            const result = await window.electronAPI.readFile(filePath);
            if (result && result.success) await handlers.createNewTab(filePath, result.content);
        } catch (error) {
            console.error('Error opening file from backlinks:', error);
            notificationManager.error(i18n.t('notifications.failedToOpenFile') + ': ' + error.message);
        }
    });
    activityBar.registerView('backlinks', i18n.t('activityBar.backlinks').toUpperCase(), backlinksContainer, [
        {
            icon: getIcon('refresh'),
            title: i18n.t('backlinks.refresh'),
            onClick: () => { if (backlinksPanel) { backlinksPanel.invalidateCache(); backlinksPanel.refresh(); } }
        }
    ]);

    console.log('ActivityBar views registered');
}

/**
 * Register all commands for the Command Palette.
 * @param {ComponentRegistry} registry
 * @param {Object} handlers - Handler functions from handlers.js
 */
function registerCommandPaletteCommands(registry, handlers) {
    const commandPalette = registry.get('commandPalette');
    if (!commandPalette) return;

    const editor = registry.get('editor');
    const searchManager = registry.get('searchManager');
    const viewModeManager = registry.get('viewModeManager');
    const focusMode = registry.get('focusMode');
    const activityBar = registry.get('activityBar');
    const themeSelector = registry.get('themeSelector');
    const themeManager = registry.get('themeManager');
    const templateUI = registry.get('templateUI');
    const tableEditor = registry.get('tableEditor');
    const keyboardShortcutsUI = registry.get('keyboardShortcutsUI');
    const autoSaveSettingsUI = registry.get('autoSaveSettingsUI');
    const advancedMarkdownSettingsUI = registry.get('advancedMarkdownSettingsUI');
    const imagePasteSettingsUI = registry.get('imagePasteSettingsUI');
    const whatsNewModal = registry.get('whatsNewModal');

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? 'Cmd' : 'Ctrl';

    const commands = [
        { id: 'new-file', label: i18n.t('menu.newFile'), category: i18n.t('commandPalette.categoryFile'), shortcut: `${mod}+N`, icon: 'filePlus', execute: () => handlers.handleNewFile() },
        { id: 'open-file', label: i18n.t('menu.open'), category: i18n.t('commandPalette.categoryFile'), shortcut: `${mod}+O`, icon: 'file', execute: () => handlers.handleOpenFile() },
        { id: 'open-folder', label: i18n.t('menu.openFolder'), category: i18n.t('commandPalette.categoryFile'), icon: 'folder', execute: () => handlers.handleOpenFolder() },
        { id: 'save', label: i18n.t('menu.save'), category: i18n.t('commandPalette.categoryFile'), shortcut: `${mod}+S`, icon: 'save', execute: () => handlers.handleSaveFile() },
        { id: 'save-as', label: i18n.t('menu.saveAs'), category: i18n.t('commandPalette.categoryFile'), icon: 'save', execute: () => handlers.handleSaveFileAs() },
        { id: 'save-all', label: i18n.t('menu.saveAll'), category: i18n.t('commandPalette.categoryFile'), execute: () => handlers.handleSaveAll() },
        { id: 'export-html', label: i18n.t('menu.exportHTML'), category: i18n.t('commandPalette.categoryFile'), icon: 'export', execute: () => handlers.handleExportHTML() },
        { id: 'export-pdf', label: i18n.t('menu.exportPDF'), category: i18n.t('commandPalette.categoryFile'), icon: 'export', execute: () => handlers.handleExportPDF() },
        { id: 'close-folder', label: i18n.t('menu.closeFolder'), category: i18n.t('commandPalette.categoryFile'), execute: () => handlers.handleCloseFolder() },
        { id: 'undo', label: i18n.t('contextMenu.undo'), category: i18n.t('commandPalette.categoryEdit'), shortcut: `${mod}+Z`, icon: 'undo', execute: () => editor && editor.undo() },
        { id: 'redo', label: i18n.t('contextMenu.redo'), category: i18n.t('commandPalette.categoryEdit'), shortcut: `${mod}+Y`, icon: 'redo', execute: () => editor && editor.redo() },
        { id: 'find', label: i18n.t('search.find'), category: i18n.t('commandPalette.categoryEdit'), shortcut: `${mod}+F`, icon: 'search', execute: () => searchManager && searchManager.show() },
        { id: 'find-in-files', label: i18n.t('globalSearch.title'), category: i18n.t('commandPalette.categoryEdit'), shortcut: `${mod}+Shift+F`, icon: 'search', execute: () => activityBar && activityBar.toggleView('search') },
        { id: 'view-editor', label: i18n.t('quickActions.editorView'), category: i18n.t('commandPalette.categoryView'), icon: 'viewEditor', execute: () => viewModeManager && viewModeManager.setViewMode('editor') },
        { id: 'view-split', label: i18n.t('quickActions.splitView'), category: i18n.t('commandPalette.categoryView'), icon: 'viewSplit', execute: () => viewModeManager && viewModeManager.setViewMode('split') },
        { id: 'view-preview', label: i18n.t('quickActions.previewView'), category: i18n.t('commandPalette.categoryView'), icon: 'viewPreview', execute: () => viewModeManager && viewModeManager.setViewMode('preview') },
        { id: 'focus-mode', label: i18n.t('quickActions.focusMode'), category: i18n.t('commandPalette.categoryView'), shortcut: 'F11', icon: 'focusMode', execute: () => focusMode && focusMode.toggle() },
        { id: 'toggle-sidebar', label: i18n.t('activityBar.explorer'), category: i18n.t('commandPalette.categoryView'), shortcut: `${mod}+Shift+E`, icon: 'folder', execute: () => activityBar && activityBar.toggleView('files') },
        { id: 'toggle-outline', label: i18n.t('activityBar.outline'), category: i18n.t('commandPalette.categoryView'), shortcut: `${mod}+Shift+O`, icon: 'outline', execute: () => activityBar && activityBar.toggleView('outline') },
        { id: 'toggle-backlinks', label: i18n.t('activityBar.backlinks'), category: i18n.t('commandPalette.categoryView'), icon: 'backlinks', execute: () => activityBar && activityBar.toggleView('backlinks') },
        { id: 'toggle-connection-graph', label: i18n.t('activityBar.connectionGraph'), category: i18n.t('commandPalette.categoryView'), icon: 'graph', execute: () => activityBar && activityBar.toggleView('connection-graph') },
        { id: 'toggle-typewriter', label: i18n.t('typewriter.enabled'), category: i18n.t('commandPalette.categoryView'), shortcut: `${mod}+Shift+T`, execute: () => handlers.toggleTypewriterScrolling() },
        { id: 'select-theme', label: i18n.t('themeSelector.title'), category: i18n.t('commandPalette.categoryView'), shortcut: `${mod}+K ${mod}+T`, icon: 'theme', execute: () => themeSelector && themeSelector.open() },
        { id: 'toggle-theme', label: i18n.t('settings.theme'), category: i18n.t('commandPalette.categoryView'), shortcut: `${mod}+T`, icon: 'theme', execute: () => themeManager && themeManager.toggleTheme() },
        { id: 'insert-bold', label: i18n.t('formatting.bold'), category: i18n.t('commandPalette.categoryInsert'), shortcut: `${mod}+B`, icon: 'bold', execute: () => editor && editor.applyBold() },
        { id: 'insert-italic', label: i18n.t('formatting.italic'), category: i18n.t('commandPalette.categoryInsert'), shortcut: `${mod}+I`, icon: 'italic', execute: () => editor && editor.applyItalic() },
        { id: 'insert-strikethrough', label: i18n.t('formatting.strikethrough'), category: i18n.t('commandPalette.categoryInsert'), icon: 'strikethrough', execute: () => editor && editor.applyStrikethrough() },
        { id: 'insert-code', label: i18n.t('formatting.code'), category: i18n.t('commandPalette.categoryInsert'), shortcut: `${mod}+\``, icon: 'code', execute: () => editor && editor.applyInlineCode() },
        { id: 'insert-code-block', label: i18n.t('formatting.codeBlock'), category: i18n.t('commandPalette.categoryInsert'), icon: 'codeBlock', execute: () => editor && editor.applyCodeBlock() },
        { id: 'insert-link', label: i18n.t('formatting.link'), category: i18n.t('commandPalette.categoryInsert'), icon: 'link', execute: () => editor && editor.insertLink() },
        { id: 'insert-image', label: i18n.t('formatting.image'), category: i18n.t('commandPalette.categoryInsert'), icon: 'image', execute: () => editor && editor.insertImage() },
        { id: 'insert-table', label: i18n.t('formatting.table'), category: i18n.t('commandPalette.categoryInsert'), icon: 'table', execute: () => editor && editor.insertTable() },
        { id: 'insert-hr', label: i18n.t('formatting.horizontalRule'), category: i18n.t('commandPalette.categoryInsert'), icon: 'horizontalRule', execute: () => editor && editor.insertHorizontalRule() },
        { id: 'insert-h1', label: i18n.t('formatting.heading', { level: 1 }), category: i18n.t('commandPalette.categoryInsert'), icon: 'heading1', execute: () => editor && editor.applyHeading(1) },
        { id: 'insert-h2', label: i18n.t('formatting.heading', { level: 2 }), category: i18n.t('commandPalette.categoryInsert'), icon: 'heading2', execute: () => editor && editor.applyHeading(2) },
        { id: 'insert-h3', label: i18n.t('formatting.heading', { level: 3 }), category: i18n.t('commandPalette.categoryInsert'), icon: 'heading3', execute: () => editor && editor.applyHeading(3) },
        { id: 'insert-bullet-list', label: i18n.t('formatting.bulletList'), category: i18n.t('commandPalette.categoryInsert'), icon: 'listBullet', execute: () => editor && editor.applyUnorderedList() },
        { id: 'insert-numbered-list', label: i18n.t('formatting.numberedList'), category: i18n.t('commandPalette.categoryInsert'), icon: 'listOrdered', execute: () => editor && editor.applyOrderedList() },
        { id: 'insert-task-list', label: i18n.t('formatting.taskList'), category: i18n.t('commandPalette.categoryInsert'), icon: 'listTask', execute: () => editor && editor.applyTaskList() },
        { id: 'insert-blockquote', label: i18n.t('formatting.blockquote'), category: i18n.t('commandPalette.categoryInsert'), icon: 'quote', execute: () => editor && editor.applyBlockquote() },
        { id: 'insert-template', label: i18n.t('templates.insert'), category: i18n.t('commandPalette.categoryInsert'), icon: 'template', execute: () => templateUI && templateUI.showTemplateMenu() },
        { id: 'edit-table', label: i18n.t('tableEditor.editTable'), category: i18n.t('commandPalette.categoryTools'), icon: 'table', execute: () => { if (tableEditor && !tableEditor.openAtCursor()) notificationManager.info(i18n.t('tableEditor.noTableFound')); } },
        { id: 'keyboard-shortcuts', label: i18n.t('shortcuts.title'), category: i18n.t('commandPalette.categoryTools'), icon: 'keyboard', execute: () => keyboardShortcutsUI && keyboardShortcutsUI.show() },
        { id: 'auto-save-settings', label: i18n.t('autoSaveSettings.title'), category: i18n.t('commandPalette.categoryTools'), execute: () => autoSaveSettingsUI && autoSaveSettingsUI.show() },
        { id: 'advanced-markdown', label: i18n.t('advancedMarkdown.title'), category: i18n.t('commandPalette.categoryTools'), execute: () => advancedMarkdownSettingsUI && advancedMarkdownSettingsUI.show() },
        { id: 'image-paste-settings', label: i18n.t('imagePasteSettings.title'), category: i18n.t('commandPalette.categoryTools'), execute: () => imagePasteSettingsUI && imagePasteSettingsUI.show() },
        { id: 'settings', label: i18n.t('settings.title'), category: i18n.t('commandPalette.categoryTools'), icon: 'settings', execute: () => activityBar && activityBar.toggleView('settings') },
        { id: 'ai-chat', label: i18n.t('activityBar.aiAssistant'), category: i18n.t('commandPalette.categoryTools'), icon: 'ai', execute: () => activityBar && activityBar.toggleView('ai-chat') },
        { id: 'whats-new', label: i18n.t('whatsNew.menuLabel'), category: i18n.t('commandPalette.categoryHelp'), execute: () => whatsNewModal && whatsNewModal.show() },
        { id: 'about', label: i18n.t('about.title'), category: i18n.t('commandPalette.categoryHelp'), execute: () => handlers.showAboutDialog() },
    ];

    commandPalette.registerCommands(commands);
}

module.exports = { registerActivityBarViews, registerCommandPaletteCommands };
