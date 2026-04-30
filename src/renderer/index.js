/**
 * Renderer Process Entry Point
 * Orchestrates initialization via ComponentRegistry and init modules.
 * Delegates event wiring, IPC listeners, keyboard shortcuts, and handlers to modules.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 3.4, 3.5, 7.1
 */

console.log('typeof require:', typeof require);
console.log('typeof window.require:', typeof window.require);

const RendererErrorBoundary = require('./error-boundary.js');
const ComponentRegistry = require('./core/component-registry.js');
const eventBus = require('./core/event-bus.js');
const initCore = require('./core/init-core.js');
const initManagers = require('./init-managers.js');
const initPanels = require('./init-panels.js');
const initAI = require('./init-ai.js');
const initSettings = require('./init-settings.js');
const initFeatures = require('./init-features.js');
const initUI = require('./init-ui.js');
const { registerActivityBarViews, registerCommandPaletteCommands } = require('./init-activity-bar.js');
const handlers = require('./handlers.js');
const notificationManager = require('./ui/notification.js');
const i18n = require('./i18n/index.js');

/**
 * Forward an error-level message to the main process Logger via IPC.
 * Falls back to console.error if the IPC bridge is not available.
 * @param {string} message - Human-readable error description
 * @param {Error} [error] - Optional Error object for context
 */
function logErrorToMain(message, error) {
    if (window.electronAPI && typeof window.electronAPI.logError === 'function') {
        const context = {};
        if (error) {
            context.error = error.message || String(error);
            if (error.stack) context.stack = error.stack;
        }
        window.electronAPI.logError({ level: 'error', message, context });
    } else {
        // Fallback when IPC bridge is unavailable (e.g., during early startup)
        console.error(message, error);
    }
}

// The single registry instance for all components
const registry = new ComponentRegistry();

// Shared document state (passed to handlers module)
const state = {
    currentFilePath: null,
    isDirty: false,
    lastSavedContent: '',
    currentTabId: null
};

/**
 * Update static HTML elements with translations
 */
function updateStaticTranslations() {
    const elements = {
        'search-input': { placeholder: 'search.findPlaceholder', ariaLabel: 'search.find' },
        'replace-input': { placeholder: 'search.replacePlaceholder', ariaLabel: 'search.replace' },
        'search-panel': { ariaLabel: () => i18n.t('search.find') + ' & ' + i18n.t('search.replace') },
        'search-prev': { title: 'search.previous', ariaLabel: 'search.previous' },
        'search-next': { title: 'search.next', ariaLabel: 'search.next' },
        'search-close': { title: 'actions.close', ariaLabel: 'actions.close' },
        'replace-current': { textContent: 'search.replace', ariaLabel: 'search.replace' },
        'replace-all': { textContent: 'search.replaceAll', ariaLabel: 'search.replaceAll' }
    };

    for (const [id, attrs] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (attrs.placeholder) el.placeholder = i18n.t(attrs.placeholder);
        if (attrs.title) el.title = i18n.t(attrs.title) || el.title;
        if (attrs.textContent) el.textContent = i18n.t(attrs.textContent);
        if (attrs.ariaLabel) {
            const val = typeof attrs.ariaLabel === 'function' ? attrs.ariaLabel() : i18n.t(attrs.ariaLabel);
            el.setAttribute('aria-label', val || '');
        }
    }
}

/**
 * Initialize the application
 */
async function initialize() {
    try {
        console.log('=== Initializing renderer process ===');

        // Initialize i18n
        await i18n.initialize();
        console.log('i18n initialized with locale:', i18n.getLocale());
        updateStaticTranslations();

        // Listen for locale changes
        i18n.onLocaleChange(() => {
            updateStaticTranslations();
            const cg = registry.get('connectionGraphPanel');
            if (cg) cg.updateTranslations();
            const wn = registry.get('whatsNewModal');
            if (wn) wn.updateTranslations();
            const cp = registry.get('commandPalette');
            if (cp) { cp.updateTranslations(); registerCommandPaletteCommands(registry, handlers); }
            const te = registry.get('tableEditor');
            if (te) te.updateTranslations();
            const bp = registry.get('backlinksPanel');
            if (bp) bp.updateTranslations();
        });

        // Register renderer error boundary before any component initialization
        // Requirement 4.5: handlers must be active before components initialize
        const errorBoundary = new RendererErrorBoundary();
        errorBoundary.register();

        // === Phase 1: Initialize all components via init modules ===
        await initCore.initialize(registry, eventBus);
        await initManagers.initialize(registry, eventBus);
        await initPanels.initialize(registry, eventBus);
        await initFeatures.initialize(registry, eventBus);
        await initSettings.initialize(registry, eventBus);
        await initUI.initialize(registry, eventBus);
        await initAI.initialize(registry, eventBus);

        // Initialize handlers module with registry and shared state
        handlers.init(registry, state);

        // === Phase 2: Component-specific initialization & wiring ===
        const editor = registry.get('editor');
        const preview = registry.get('preview');
        const markdownParser = registry.get('markdownParser');
        const advancedMarkdownManager = registry.get('advancedMarkdownManager');
        const formattingToolbar = registry.get('formattingToolbar');
        const viewModeManager = registry.get('viewModeManager');
        const themeSelector = registry.get('themeSelector');
        const aiAutocomplete = registry.get('aiAutocomplete');
        const aiEditCommands = registry.get('aiEditCommands');

        // Initialize What's New Modal
        registry.get('whatsNewModal').initialize();

        // Initialize Editor
        const editorContainer = document.getElementById('editor-container');
        if (!editorContainer) throw new Error('Editor container not found');
        const lineNumbersEnabled = await window.electronAPI.getLineNumbers();
        editor.initialize(editorContainer, [], lineNumbersEnabled);

        // Initialize Context Menu
        registry.get('contextMenu').initialize(editorContainer);

        // Initialize Preview
        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer) throw new Error('Preview container not found');
        preview.initialize(previewContainer, {
            onLinkClick: async (href) => {
                try {
                    const path = require('path');
                    let resolvedPath = href;
                    if (state.currentFilePath && !path.isAbsolute(href)) {
                        resolvedPath = path.resolve(path.dirname(state.currentFilePath), href);
                    }
                    const result = await window.electronAPI.openRecentFile(resolvedPath);
                    if (result && result.filePath && result.content !== undefined) {
                        await handlers.createNewTab(result.filePath, result.content);
                    }
                } catch (error) {
                    logErrorToMain('Error opening linked file', error);
                    notificationManager.error(i18n.t('notifications.failedToOpenFile') + ': ' + error.message);
                }
            }
        });

        // Initialize FormattingToolbar
        const ftContainer = document.getElementById('formatting-toolbar');
        if (!ftContainer) throw new Error('Formatting toolbar container not found');
        formattingToolbar.initialize(ftContainer);
        formattingToolbar.onMenuAction = (action) => handlers.handleMenuAction(action);

        // Initialize SearchManager
        registry.get('searchManager').initialize();

        // ThemeSelector
        window.themeSelector = themeSelector;
        themeSelector.initialize();

        // Connect FormattingToolbar to ViewModeManager
        viewModeManager.onViewModeChange((mode) => {
            if (mode === 'preview') formattingToolbar.hide();
            else formattingToolbar.show();
        });
        if (viewModeManager.getCurrentViewMode() === 'preview') formattingToolbar.hide();

        // Initialize remaining components
        await registry.get('autoSaveManager').initialize();
        await registry.get('statisticsCalculator').initialize();
        registry.get('statusBarInfo').initialize();

        // Initialize TabBar
        const tabBarContainer = document.getElementById('tab-bar');
        if (!tabBarContainer) throw new Error('Tab bar container not found');
        const TabBar = require('./core/tab-bar.js');
        const tabBar = new TabBar(tabBarContainer);
        registry.register('tabBar', tabBar);
        tabBar.initialize();
        handlers.setupTabBarHandlers();

        // Initialize FocusMode
        registry.get('focusMode').initialize();

        // TemplateUI wiring
        const templateUI = registry.get('templateUI');
        templateUI.onInsert(async (template, mode) => {
            try { await handlers.handleTemplateInsert(template, mode); }
            catch (error) { logErrorToMain('Failed to insert template', error); }
        });
        formattingToolbar.connectTemplateUI(templateUI);

        // SnippetManager wiring
        const snippetManager = registry.get('snippetManager');
        editor.enableSnippetExtensions(snippetManager.createSnippetExtension());

        // Initialize ImagePaste
        await registry.get('imagePaste').initialize();

        // ImagePasteSettingsUI wiring
        registry.get('imagePasteSettingsUI').onChange(async (enabled, assetsFolder) => {
            const ip = registry.get('imagePaste');
            if (ip) await ip.setEnabled(enabled);
        });

        // AdvancedMarkdownSettingsUI wiring
        registry.get('advancedMarkdownSettingsUI').onChange(async (featureName, enabled) => {
            advancedMarkdownManager.updateFeature(featureName, enabled);
            markdownParser.reinitialize();
            preview.render(editor.getValue(), true);
        });

        // KeyboardShortcutsUI wiring
        registry.get('keyboardShortcutsUI').onChange((actionId, keyBinding) => {
            console.log(`Keyboard shortcut changed: ${actionId} -> ${keyBinding}`);
        });

        // AutoSaveSettingsUI wiring
        registry.get('autoSaveSettingsUI').onChange(async (enabled, delay) => {
            const asm = registry.get('autoSaveManager');
            if (asm) {
                if (enabled) { await asm.enable(); await asm.setDelay(delay); }
                else await asm.disable();
            }
        });

        // Initialize TooltipManager, FileTreeSidebar, OutlinePanel, TypewriterScrolling
        registry.get('tooltipManager').initialize();
        registry.get('fileTreeSidebar').initialize();
        handlers.setupSidebarIntegration();
        await handlers.restoreWorkspace();
        registry.get('outlinePanel').initialize(registry.get('outlinePanelContainer'));

        const typewriterScrolling = registry.get('typewriterScrolling');
        typewriterScrolling.initialize();
        const twResult = await window.electronAPI.getConfig('typewriter.enabled');
        if (twResult?.value) typewriterScrolling.enable();

        // Initialize GlobalSearchUI
        const globalSearchUI = registry.get('globalSearchUI');
        globalSearchUI.initialize();
        globalSearchUI.onFileClick(async (filePath, line) => {
            try {
                const allTabsResult = await window.electronAPI.getAllTabs();
                if (allTabsResult.success && allTabsResult.tabs) {
                    const existingTab = allTabsResult.tabs.find(tab => tab.filePath === filePath);
                    if (existingTab) await handlers.switchToTab(existingTab.id);
                    else {
                        const result = await window.electronAPI.readFile(filePath);
                        if (result && result.success) await handlers.createNewTab(filePath, result.content);
                    }
                }
                if (editor && line) setTimeout(() => editor.goToLine(line), 100);
            } catch (error) {
                logErrorToMain('Error opening file from global search', error);
                notificationManager.error('Failed to open file: ' + error.message);
            }
        });

        // Initialize ActivityBar and register views
        registry.get('activityBar').initialize();
        registerActivityBarViews(registry, handlers);

        // Initialize TableEditor, CommandPalette
        registry.get('tableEditor').initialize();
        registry.get('commandPalette').initialize();
        registerCommandPaletteCommands(registry, handlers);

        // AI Edit Commands & Autocomplete
        aiEditCommands.initialize();
        window.aiEditCommands = aiEditCommands;
        await aiAutocomplete.initialize();
        window.aiAutocomplete = aiAutocomplete;

        // Initialize PanelResizer
        registry.get('panelResizer').initialize();

        // Attach tooltips
        attachTooltips();

        // Listen for settings changes from main process
        window.electronAPI.onAdvancedMarkdownSettingsChanged((featureName, enabled) => {
            advancedMarkdownManager.updateFeature(featureName, enabled);
            markdownParser.reinitialize();
            preview.render(editor.getValue(), true);
        });

        // Restore tabs from previous session
        await handlers.restoreTabsFromSession();

        // Connect editor changes to preview updates
        editor.onContentChange((content) => {
            if (markdownParser && state.currentFilePath) markdownParser.setCurrentFilePath(state.currentFilePath);
            preview.render(content);
            handlers.updateDirtyState(content);
            if (state.currentTabId) window.electronAPI.updateTabContent(state.currentTabId, content);
            if (aiAutocomplete) aiAutocomplete.onContentChange(content, editor.getCursorPosition());
        });

        // Setup scroll sync, IPC listeners, keyboard shortcuts, drag-and-drop
        setupScrollSynchronization();
        handlers.setupIPCListeners();
        handlers.setupKeyboardShortcuts();
        handlers.setupDragAndDrop();

        // Render current editor content
        preview.render(editor.getValue(), true);
        console.log('Renderer process initialized successfully');
    } catch (error) {
        logErrorToMain('Failed to initialize renderer process', error);
        notificationManager.error(i18n.t('notifications.failedToInitialize') + ': ' + error.message);
    }
}

/**
 * Setup scroll synchronization between editor and preview
 */
function setupScrollSynchronization() {
    const editor = registry.get('editor');
    const preview = registry.get('preview');
    if (!editor || !preview) return;
    editor.view.scrollDOM.addEventListener('scroll', () => {
        const scrollPercent = editor.getScrollPosition();
        if (!isNaN(scrollPercent) && scrollPercent >= 0 && scrollPercent <= 1) {
            preview.syncScroll(scrollPercent);
        }
    });
}

/**
 * Attach tooltips to toolbar, search panel, and status indicators
 */
function attachTooltips() {
    const tooltipManager = registry.get('tooltipManager');
    if (!tooltipManager) return;

    // Formatting toolbar buttons
    document.querySelectorAll('.toolbar-button').forEach(button => {
        const title = button.getAttribute('title');
        if (title) { tooltipManager.attach(button, title); button.removeAttribute('title'); }
    });

    // Search panel buttons
    [
        { id: 'search-prev', text: 'Previous match' },
        { id: 'search-next', text: 'Next match' },
        { id: 'search-close', text: 'Close search panel' },
        { id: 'replace-current', text: 'Replace current match' },
        { id: 'replace-all', text: 'Replace all matches' },
        { id: 'toggle-replace', text: 'Toggle replace controls' }
    ].forEach(({ id, text }) => {
        const button = document.getElementById(id);
        if (button) tooltipManager.attach(button, text);
    });

    // Status indicator
    const statusIndicator = document.getElementById('auto-save-status');
    if (statusIndicator) {
        tooltipManager.attach(statusIndicator, () => {
            const text = statusIndicator.textContent;
            if (text.includes('Saving')) return 'Auto-save in progress...';
            if (text.includes('Saved')) return 'All changes saved';
            if (text.includes('Error')) return 'Error saving file';
            return 'Auto-save status';
        });
    }
}

/**
 * Cleanup function for when the window is closed
 */
function cleanup() {
    if (window.electronAPI && window.electronAPI.saveTabs) {
        window.electronAPI.saveTabs().catch(err => logErrorToMain('Error saving tabs on cleanup', err));
    }

    const refs = handlers.getCleanupRefs();
    if (refs.removeFileDroppedListener) refs.removeFileDroppedListener();
    if (refs.removeMenuActionListener) refs.removeMenuActionListener();

    // Destroy components that have destroy/cleanup methods
    const destroyable = ['editor', 'preview', 'formattingToolbar', 'autoSaveManager',
        'statisticsCalculator', 'statusBarInfo', 'tabBar', 'focusMode', 'fileTreeSidebar',
        'outlinePanel', 'imagePasteSettingsUI', 'aiEditCommands', 'contextMenu', 'connectionGraphPanel'];
    destroyable.forEach(name => {
        const c = registry.get(name);
        if (c && typeof c.destroy === 'function') c.destroy();
    });

    const tooltipManager = registry.get('tooltipManager');
    if (tooltipManager) tooltipManager.cleanup();
    const typewriterScrolling = registry.get('typewriterScrolling');
    if (typewriterScrolling) typewriterScrolling.disable();
    const imagePaste = registry.get('imagePaste');
    if (imagePaste) imagePaste.cleanup();

    registry.clear();
    eventBus.clear();
}

// Expose functions for main process
window.hasUnsavedChanges = async () => {
    if (state.isDirty) return true;
    try {
        const result = await window.electronAPI.getModifiedTabs();
        if (result.success && result.tabs && result.tabs.length > 0) return true;
    } catch (error) { logErrorToMain('Error checking modified tabs', error); }
    return false;
};

window.saveBeforeClose = async () => {
    try { await handlers.handleSaveAll(); return true; }
    catch (error) { logErrorToMain('Error saving before close', error); return false; }
};

window.addEventListener('unload', cleanup);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
