/**
 * Renderer Process Entry Point
 * Initializes all components and sets up event listeners
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 3.4, 3.5, 7.1
 */

console.log('typeof require:', typeof require);
console.log('typeof window.require:', typeof window.require);
console.log('process:', typeof process !== 'undefined' ? process.versions : 'undefined');

const Editor = require('./editor.js');
const Preview = require('./preview.js');
const SearchManager = require('./search.js');
const ThemeManager = require('./theme.js');
const ViewModeManager = require('./view-mode.js');
const AutoSaveManager = require('./auto-save.js');
const StatisticsCalculator = require('./statistics.js');
const TabBar = require('./tab-bar.js');
const FocusMode = require('./focus-mode.js');
const TemplateUI = require('./template-ui.js');
const SnippetManager = require('./snippet-manager.js');
const FormattingToolbar = require('./formatting-toolbar.js');
const AdvancedMarkdownSettingsUI = require('./advanced-markdown-settings-ui.js');
const AdvancedMarkdownManagerClient = require('./advanced-markdown-manager-client.js');
const { MarkdownParser } = require('./markdown-parser.js');
const AdvancedMarkdownPostProcessor = require('./advanced-markdown/post-processor.js');

// Application state
let editor = null;
let preview = null;
let searchManager = null;
let themeManager = null;
let viewModeManager = null;
let autoSaveManager = null;
let statisticsCalculator = null;
let tabBar = null;
let focusMode = null;
let templateUI = null;
let snippetManager = null;
let formattingToolbar = null;
let advancedMarkdownSettingsUI = null;
let advancedMarkdownManager = null;
let advancedMarkdownPostProcessor = null;
let markdownParser = null;

// Document state
let currentFilePath = null;
let isDirty = false;
let lastSavedContent = '';
let currentTabId = null;

// Event listener cleanup functions
let removeFileDroppedListener = null;
let removeMenuActionListener = null;

/**
 * Initialize the application
 */
async function initialize() {
    try {
        console.log('=== Initializing renderer process ===');
        console.log('window.electronAPI available:', !!window.electronAPI);

        // Initialize Advanced Markdown Manager (client-side)
        advancedMarkdownManager = new AdvancedMarkdownManagerClient();
        await advancedMarkdownManager.loadSettings();
        console.log('AdvancedMarkdownManager initialized');

        // Initialize Advanced Markdown Post-Processor
        advancedMarkdownPostProcessor = new AdvancedMarkdownPostProcessor();
        console.log('AdvancedMarkdownPostProcessor initialized');

        // Initialize Markdown Parser with advanced features
        markdownParser = new MarkdownParser(advancedMarkdownManager, advancedMarkdownPostProcessor);
        console.log('MarkdownParser initialized');

        // Initialize Editor
        const editorContainer = document.getElementById('editor-container');

        if (!editorContainer) {
            throw new Error('Editor container not found');
        }
        editor = new Editor();
        editor.initialize(editorContainer);
        console.log('Editor initialized');

        // Initialize Preview with post-processor and markdown parser
        const previewContainer = document.getElementById('preview-container');

        if (!previewContainer) {
            throw new Error('Preview container not found');
        }
        preview = new Preview(advancedMarkdownPostProcessor, markdownParser);
        preview.initialize(previewContainer);
        console.log('Preview initialized');

        // Initialize FormattingToolbar
        const formattingToolbarContainer = document.getElementById('formatting-toolbar');

        if (!formattingToolbarContainer) {
            throw new Error('Formatting toolbar container not found');
        }
        formattingToolbar = new FormattingToolbar(editor);
        formattingToolbar.initialize(formattingToolbarContainer);
        console.log('FormattingToolbar initialized');

        // Initialize SearchManager
        searchManager = new SearchManager(editor);
        searchManager.initialize();
        console.log('SearchManager initialized');

        // Initialize ThemeManager
        themeManager = new ThemeManager();
        await themeManager.initialize();

        // Connect theme manager to preview for advanced markdown theme updates
        themeManager.onThemeChange((theme) => {
            if (preview) {
                preview.updateTheme(theme);
            }
        });

        console.log('ThemeManager initialized');

        // Initialize ViewModeManager
        viewModeManager = new ViewModeManager();
        await viewModeManager.initialize();
        console.log('ViewModeManager initialized');

        // Connect FormattingToolbar to ViewModeManager for visibility control
        viewModeManager.onViewModeChange((mode) => {
            if (mode === 'preview') {
                formattingToolbar.hide();
            } else {
                formattingToolbar.show();
            }
        });
        // Set initial visibility based on current view mode
        const currentViewMode = viewModeManager.getCurrentViewMode();

        if (currentViewMode === 'preview') {
            formattingToolbar.hide();
        } else {
            formattingToolbar.show();
        }

        // Initialize AutoSaveManager
        autoSaveManager = new AutoSaveManager(editor);
        await autoSaveManager.initialize();
        console.log('AutoSaveManager initialized');

        // Initialize StatisticsCalculator
        statisticsCalculator = new StatisticsCalculator(editor);
        await statisticsCalculator.initialize();
        console.log('StatisticsCalculator initialized');

        // Initialize TabBar
        const tabBarContainer = document.getElementById('tab-bar');

        if (!tabBarContainer) {
            throw new Error('Tab bar container not found');
        }
        tabBar = new TabBar(tabBarContainer);
        tabBar.initialize();
        console.log('TabBar initialized');

        // Setup tab bar event handlers
        setupTabBarHandlers();

        // Initialize FocusMode
        focusMode = new FocusMode(editor);
        focusMode.initialize();
        console.log('FocusMode initialized');

        // Initialize TemplateUI
        templateUI = new TemplateUI();
        templateUI.onInsert(async (template, mode) => {
            await handleTemplateInsert(template, mode);
        });
        // Connect TemplateUI to FormattingToolbar
        formattingToolbar.connectTemplateUI(templateUI);
        console.log('TemplateUI initialized');

        // Initialize SnippetManager (Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6)
        snippetManager = new SnippetManager(editor, {
            getCustomSnippets: async () => {
                const result = await window.electronAPI.getConfig('customSnippets');

                return result || [];
            },
            addCustomSnippet: async (snippet) => {
                const snippets = await window.electronAPI.getConfig('customSnippets') || [];

                snippets.push(snippet);
                await window.electronAPI.setConfig('customSnippets', snippets);
            },
            deleteCustomSnippet: async (trigger) => {
                const snippets = await window.electronAPI.getConfig('customSnippets') || [];
                const filtered = snippets.filter(s => s.trigger !== trigger);

                await window.electronAPI.setConfig('customSnippets', filtered);
            },
            updateCustomSnippet: async (trigger, updates) => {
                const snippets = await window.electronAPI.getConfig('customSnippets') || [];
                const index = snippets.findIndex(s => s.trigger === trigger);

                if (index !== -1) {
                    snippets[index] = { ...snippets[index], ...updates };
                    await window.electronAPI.setConfig('customSnippets', snippets);
                }
            }
        });
        // Enable snippet extensions in the editor
        const snippetExtensions = snippetManager.createSnippetExtension();

        editor.enableSnippetExtensions(snippetExtensions);
        console.log('SnippetManager initialized');

        // Initialize Advanced Markdown Settings UI
        advancedMarkdownSettingsUI = new AdvancedMarkdownSettingsUI();
        advancedMarkdownSettingsUI.onChange(async (featureName, enabled) => {
            // Update local manager
            advancedMarkdownManager.updateFeature(featureName, enabled);

            // Reinitialize parser with new settings
            markdownParser.reinitialize();

            // Re-render preview immediately
            const content = editor.getValue();

            preview.render(content, true);

            console.log(`Advanced markdown feature '${featureName}' ${enabled ? 'enabled' : 'disabled'}, preview updated`);
        });
        console.log('AdvancedMarkdownSettingsUI initialized');

        // Listen for settings changes from main process
        window.electronAPI.onAdvancedMarkdownSettingsChanged((featureName, enabled) => {
            // Update local manager
            advancedMarkdownManager.updateFeature(featureName, enabled);

            // Reinitialize parser
            markdownParser.reinitialize();

            // Re-render preview
            const content = editor.getValue();

            preview.render(content, true);
        });

        // Try to restore tabs from previous session
        await restoreTabsFromSession();

        // Connect editor changes to preview updates
        editor.onContentChange((content) => {
            preview.render(content);
            updateDirtyState(content);

            // Update current tab content
            if (currentTabId) {
                window.electronAPI.updateTabContent(currentTabId, content);
            }
        });

        // Setup editor scroll synchronization with preview
        setupScrollSynchronization();

        // Setup IPC event listeners
        setupIPCListeners();

        // Setup keyboard shortcuts
        setupKeyboardShortcuts();

        // Setup file drag-and-drop
        setupDragAndDrop();

        // Render initial empty content
        preview.render('');

        console.log('Renderer process initialized successfully');
    } catch (error) {
        console.error('Failed to initialize renderer process:', error);
        alert('Failed to initialize application: ' + error.message);
    }
}

/**
 * Setup scroll synchronization between editor and preview
 */
function setupScrollSynchronization() {
    if (!editor || !preview) {
        return;
    }

    // Listen to editor scroll events
    const editorScrollDOM = editor.view.scrollDOM;

    editorScrollDOM.addEventListener('scroll', () => {
        const scrollPercent = editor.getScrollPosition();

        preview.syncScroll(scrollPercent);
    });
}

/**
 * Setup IPC event listeners for file operations and menu actions
 */
function setupIPCListeners() {
    console.log('Setting up IPC listeners...');
    console.log('window.electronAPI:', window.electronAPI);

    // Listen for file dropped events
    removeFileDroppedListener = window.electronAPI.onFileDropped(async (filePath) => {
        console.log('File dropped:', filePath);
        await loadFile(filePath);
    });

    // Listen for menu action events
    removeMenuActionListener = window.electronAPI.onMenuAction(async (action) => {
        console.log('Menu action received:', action);
        await handleMenuAction(action);
    });

    console.log('IPC listeners setup complete');
}

/**
 * Handle menu actions from the main process
 * @param {string} action - The menu action to handle
 */
async function handleMenuAction(action) {
    try {
        switch (action) {
            case 'new':
                await handleNewFile();
                break;
            case 'open':
                await handleOpenFile();
                break;
            case 'save':
                await handleSaveFile();
                break;
            case 'save-as':
                await handleSaveFileAs();
                break;
            case 'export-html':
                await handleExportHTML();
                break;
            case 'export-pdf':
                await handleExportPDF();
                break;
            case 'undo':
                editor.undo();
                break;
            case 'redo':
                editor.redo();
                break;
            case 'find':
                searchManager.show();
                break;
            case 'toggle-theme':
                await themeManager.toggleTheme();
                break;
            case 'view-mode-editor':
                await viewModeManager.setViewMode('editor');
                break;
            case 'view-mode-preview':
                await viewModeManager.setViewMode('preview');
                break;
            case 'view-mode-split':
                await viewModeManager.setViewMode('split');
                break;
            case 'focus-mode':
                if (focusMode) {
                    focusMode.toggle();
                }
                break;
            case 'insert-template':
                if (templateUI) {
                    templateUI.showTemplateMenu();
                }
                break;
            case 'toggle-statistics':
                if (statisticsCalculator) {
                    await statisticsCalculator.toggleVisibility();
                }
                break;
            case 'toggle-auto-save':
                if (autoSaveManager) {
                    if (autoSaveManager.isEnabled()) {
                        await autoSaveManager.disable();
                        console.log('Auto-save disabled');
                    } else {
                        await autoSaveManager.enable();
                        console.log('Auto-save enabled');
                    }
                }
                break;
            case 'auto-save-settings':
                // Show a simple prompt for auto-save delay
                if (autoSaveManager) {
                    const currentDelay = autoSaveManager.getDelay();
                    const newDelay = prompt(`Enter auto-save delay in seconds (1-60):`, currentDelay);

                    if (newDelay !== null) {
                        const delay = parseInt(newDelay, 10);

                        if (!isNaN(delay) && delay >= 1 && delay <= 60) {
                            await autoSaveManager.setDelay(delay);
                            alert(`Auto-save delay set to ${delay} seconds`);
                        } else {
                            alert('Invalid delay. Please enter a number between 1 and 60.');
                        }
                    }
                }
                break;
            case 'open-keyboard-shortcuts':
                // This would open a keyboard shortcuts settings dialog
                // For now, just log a message
                alert('Keyboard shortcuts settings dialog would open here.\nThis feature requires a dedicated UI component.');
                break;
            case 'advanced-markdown-settings':
                if (advancedMarkdownSettingsUI) {
                    await advancedMarkdownSettingsUI.show();
                }
                break;
            case 'about':
                showAboutDialog();
                break;
            default:
                console.warn('Unknown menu action:', action);
        }
    } catch (error) {
        console.error('Error handling menu action:', error);
        alert('Error: ' + error.message);
    }
}

/**
 * Handle new file action
 */
async function handleNewFile() {
    // Create a new tab instead of clearing current one
    await createNewTab();
}

/**
 * Handle open file action
 */
async function handleOpenFile() {
    try {
        console.log('handleOpenFile called');

        console.log('Calling window.electronAPI.openFile()...');
        const result = await window.electronAPI.openFile();

        console.log('openFile result:', result);

        if (result && result.filePath && result.content !== undefined) {
            // Create a new tab for the opened file
            await createNewTab(result.filePath, result.content);
        }
    } catch (error) {
        console.error('Error opening file:', error);
        alert('Failed to open file: ' + error.message);
    }
}


/**
 * Handle save file action
 */
async function handleSaveFile() {
    try {
        const content = editor.getValue();

        if (currentFilePath) {
            // Save to existing file
            await window.electronAPI.saveFile(currentFilePath, content);
            lastSavedContent = content;
            isDirty = false;

            // Update tab state
            if (currentTabId) {
                await window.electronAPI.markTabModified(currentTabId, false);
                tabBar.markTabModified(currentTabId, false);
            }

            // Update auto-save manager
            if (autoSaveManager) {
                autoSaveManager.setLastSavedContent(content);
            }

            console.log('File saved:', currentFilePath);
        } else {
            // No file path, use save as
            await handleSaveFileAs();
        }
    } catch (error) {
        console.error('Error saving file:', error);
        alert('Failed to save file: ' + error.message);
    }
}

/**
 * Handle save file as action
 */
async function handleSaveFileAs() {
    try {
        const content = editor.getValue();
        const result = await window.electronAPI.saveFileAs(content);

        if (result && result.filePath) {
            currentFilePath = result.filePath;
            lastSavedContent = content;
            isDirty = false;

            // Update tab state
            if (currentTabId) {
                await window.electronAPI.updateTabFilePath(currentTabId, result.filePath);
                await window.electronAPI.markTabModified(currentTabId, false);

                // Update tab title
                const tabResult = await window.electronAPI.getTab(currentTabId);

                if (tabResult.success && tabResult.tab) {
                    tabBar.updateTabTitle(currentTabId, tabResult.tab.title);
                    tabBar.markTabModified(currentTabId, false);
                }
            }

            // Update auto-save manager
            if (autoSaveManager) {
                autoSaveManager.setCurrentFilePath(result.filePath);
                autoSaveManager.setLastSavedContent(content);
            }

            console.log('File saved as:', currentFilePath);
        }
    } catch (error) {
        console.error('Error saving file as:', error);
        alert('Failed to save file: ' + error.message);
    }
}

/**
 * Handle export to HTML action
 */
async function handleExportHTML() {
    try {
        const content = editor.getValue();
        const result = await window.electronAPI.exportHTML(content);

        if (result && result.success) {
            alert('Successfully exported to HTML: ' + result.filePath);
        }
    } catch (error) {
        console.error('Error exporting to HTML:', error);
        alert('Failed to export to HTML: ' + error.message);
    }
}

/**
 * Handle export to PDF action
 */
async function handleExportPDF() {
    try {
        const content = editor.getValue();
        const result = await window.electronAPI.exportPDF(content);

        if (result && result.success) {
            alert('Successfully exported to PDF: ' + result.filePath);
        }
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Failed to export to PDF: ' + error.message);
    }
}

/**
 * Update dirty state based on content changes
 * @param {string} content - Current editor content
 */
function updateDirtyState(content) {
    isDirty = content !== lastSavedContent;

    // Update tab modified indicator
    if (currentTabId) {
        window.electronAPI.markTabModified(currentTabId, isDirty).catch(err => {
            console.error('Error marking tab modified:', err);
        });
        tabBar.markTabModified(currentTabId, isDirty);
    }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', async (e) => {
        // Detect platform (Ctrl on Windows/Linux, Cmd on macOS)
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;

        // Ctrl/Cmd + Tab: Next tab (Requirements: 3.7)
        if (modifier && e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            const result = await window.electronAPI.getNextTab();

            if (result.success && result.tabId) {
                await switchToTab(result.tabId);
            }
        }

        // Ctrl/Cmd + Shift + Tab: Previous tab
        if (modifier && e.shiftKey && e.key === 'Tab') {
            e.preventDefault();
            const result = await window.electronAPI.getPreviousTab();

            if (result.success && result.tabId) {
                await switchToTab(result.tabId);
            }
        }

        // Ctrl/Cmd + W: Close tab (Requirements: 3.8)
        if (modifier && e.key === 'w') {
            e.preventDefault();
            if (currentTabId) {
                await closeTab(currentTabId);
            }
        }

        // Ctrl/Cmd + B: Bold (Requirements: 1.5)
        if (modifier && e.key === 'b' && !e.shiftKey) {
            e.preventDefault();
            editor.applyFormatting('bold');
        }

        // Ctrl/Cmd + I: Italic (Requirements: 2.5)
        if (modifier && e.key === 'i') {
            e.preventDefault();
            editor.applyFormatting('italic');
        }

        // Ctrl/Cmd + `: Inline code (Requirements: 7.5)
        if (modifier && e.key === '`') {
            e.preventDefault();
            editor.applyFormatting('code');
        }

        // Ctrl/Cmd + F: Find
        if (modifier && e.key === 'f') {
            e.preventDefault();
            searchManager.show();
        }

        // Ctrl/Cmd + Z: Undo
        if (modifier && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            editor.undo();
        }

        // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
        if ((modifier && e.key === 'y') || (modifier && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            editor.redo();
        }

        // Ctrl/Cmd + S: Save
        if (modifier && e.key === 's') {
            e.preventDefault();
            await handleSaveFile();
        }

        // Ctrl/Cmd + O: Open
        if (modifier && e.key === 'o') {
            e.preventDefault();
            await handleOpenFile();
        }

        // Ctrl/Cmd + N: New
        if (modifier && e.key === 'n') {
            e.preventDefault();
            await handleNewFile();
        }

        // Escape: Close search if open, or exit focus mode
        if (e.key === 'Escape') {
            if (searchManager.isVisible()) {
                e.preventDefault();
                searchManager.hide();
            }
            // Focus mode handles its own Escape key
        }

        // F11: Toggle focus mode
        if (e.key === 'F11') {
            e.preventDefault();
            if (focusMode) {
                focusMode.toggle();
            }
        }
    });
}

/**
 * Setup drag-and-drop file handling
 */
function setupDragAndDrop() {
    const appContainer = document.getElementById('app-container');

    if (!appContainer) {
        console.error('App container not found for drag-and-drop');
        return;
    }

    // Prevent default drag behaviors
    appContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        appContainer.classList.add('drag-over');
    });

    appContainer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        appContainer.classList.remove('drag-over');
    });

    appContainer.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        appContainer.classList.remove('drag-over');

        const files = e.dataTransfer.files;

        if (files.length > 0) {
            const file = files[0];

            // Check if it's a markdown file
            if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
                // Read file content
                const reader = new FileReader();

                reader.onload = async (event) => {
                    const content = event.target.result;

                    // Create a new tab for the dropped file
                    await createNewTab(file.path, content);
                    console.log('File loaded via drag-and-drop:', file.path);
                };
                reader.readAsText(file);
            } else {
                alert('Please drop a markdown file (.md or .markdown)');
            }
        }
    });
}

/**
 * Setup tab bar event handlers
 */
function setupTabBarHandlers() {
    // Handle tab clicks
    tabBar.onTabClick(async (tabId) => {
        await switchToTab(tabId);
    });

    // Handle tab close
    tabBar.onTabClose(async (tabId) => {
        await closeTab(tabId);
    });
}

/**
 * Restore tabs from previous session
 */
async function restoreTabsFromSession() {
    try {
        const result = await window.electronAPI.restoreTabs();

        if (result.success) {
            const tabsResult = await window.electronAPI.getAllTabs();

            if (tabsResult.success && tabsResult.tabs.length > 0) {
                // Add tabs to UI
                for (const tab of tabsResult.tabs) {
                    tabBar.addTab(tab.id, tab.title, false, tab.isModified);
                }

                // Switch to active tab
                const activeResult = await window.electronAPI.getActiveTab();

                if (activeResult.success && activeResult.tab) {
                    await switchToTab(activeResult.tab.id);
                }

                document.body.classList.add('has-tabs');
                return;
            }
        }

        // If no tabs restored, create a new empty tab
        await createNewTab();
    } catch (error) {
        console.error('Error restoring tabs:', error);
        // Create a new empty tab on error
        await createNewTab();
    }
}

/**
 * Create a new tab
 * @param {string|null} filePath - File path or null for new document
 * @param {string} content - Document content
 */
async function createNewTab(filePath = null, content = '') {
    try {
        const result = await window.electronAPI.createTab(filePath, content);

        if (result.success && result.tab) {
            const tab = result.tab;

            tabBar.addTab(tab.id, tab.title, true, tab.isModified);
            currentTabId = tab.id;

            // Load content into editor
            editor.setValue(content);
            currentFilePath = filePath;
            isDirty = false;
            lastSavedContent = content;

            if (autoSaveManager) {
                autoSaveManager.setCurrentFilePath(filePath);
                autoSaveManager.setLastSavedContent(content);
            }

            preview.render(content);
            document.body.classList.add('has-tabs');
        }
    } catch (error) {
        console.error('Error creating tab:', error);
        alert('Failed to create tab: ' + error.message);
    }
}

/**
 * Switch to a different tab
 * @param {string} tabId - Tab ID to switch to
 */
async function switchToTab(tabId) {
    try {
        // Save current tab state before switching
        if (currentTabId) {
            const scrollPos = editor.getScrollPosition();

            await window.electronAPI.updateTabScroll(currentTabId, scrollPos);
        }

        const result = await window.electronAPI.switchTab(tabId);

        if (result.success && result.tab) {
            const tab = result.tab;

            // Update UI
            tabBar.setActiveTab(tabId);
            currentTabId = tabId;

            // Load tab content
            editor.setValue(tab.content);
            currentFilePath = tab.filePath;
            isDirty = tab.isModified;
            lastSavedContent = tab.isModified ? '' : tab.content;

            if (autoSaveManager) {
                autoSaveManager.setCurrentFilePath(tab.filePath);
                autoSaveManager.setLastSavedContent(tab.isModified ? '' : tab.content);
            }

            // Restore scroll position
            if (tab.scrollPosition) {
                editor.setScrollPosition(tab.scrollPosition);
            }

            preview.render(tab.content);
        }
    } catch (error) {
        console.error('Error switching tab:', error);
        alert('Failed to switch tab: ' + error.message);
    }
}

/**
 * Close a tab
 * @param {string} tabId - Tab ID to close
 */
async function closeTab(tabId) {
    try {
        // Check if tab is modified
        const tabResult = await window.electronAPI.getTab(tabId);

        if (tabResult.success && tabResult.tab && tabResult.tab.isModified) {
            const confirmed = await tabBar.showCloseConfirmation(tabResult.tab.title);

            if (!confirmed) {
                return;
            }
        }

        // Close the tab
        const result = await window.electronAPI.closeTab(tabId);

        if (result.success) {
            tabBar.removeTab(tabId);

            // If this was the current tab, switch to another
            if (currentTabId === tabId) {
                const activeResult = await window.electronAPI.getActiveTab();

                if (activeResult.success && activeResult.tab) {
                    await switchToTab(activeResult.tab.id);
                } else {
                    // No tabs left, create a new one
                    await createNewTab();
                }
            }

            // Save tabs state
            await window.electronAPI.saveTabs();
        }
    } catch (error) {
        console.error('Error closing tab:', error);
        alert('Failed to close tab: ' + error.message);
    }
}

/**
 * Show About dialog
 */
function showAboutDialog() {
    // Create modal overlay
    const overlay = document.createElement('div');

    overlay.className = 'about-dialog-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    // Create dialog
    const dialog = document.createElement('div');

    dialog.className = 'about-dialog';
    dialog.style.cssText = `
        background: var(--bg-primary, #ffffff);
        color: var(--text-primary, #000000);
        border-radius: 8px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        text-align: center;
    `;

    dialog.innerHTML = `
        <h2 style="margin: 0 0 16px 0; font-size: 24px;">MD Editor Pro</h2>
        <p style="margin: 0 0 8px 0; font-size: 18px; color: var(--text-secondary, #666);">Version 1.0.0</p>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: var(--text-secondary, #666);">
            A cross-platform markdown editor built with Electron
        </p>
        <div style="margin: 24px 0; padding: 16px; background: var(--bg-secondary, #f5f5f5); border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: var(--text-secondary, #666);">
                <strong>Electron:</strong> ${process.versions.electron || 'N/A'}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: var(--text-secondary, #666);">
                <strong>Chrome:</strong> ${process.versions.chrome || 'N/A'}
            </p>
            <p style="margin: 0; font-size: 12px; color: var(--text-secondary, #666);">
                <strong>Node.js:</strong> ${process.versions.node || 'N/A'}
            </p>
        </div>
        <div style="margin: 0 0 24px 0;">
            <p style="margin: 0 0 12px 0; font-size: 12px; color: var(--text-secondary, #666);">
                © 2024 MD Editor Pro. All rights reserved.
            </p>
            <div style="display: flex; gap: 16px; justify-content: center; align-items: center;">
                <a id="github-link" href="#" style="
                    color: var(--accent-color, #007acc);
                    text-decoration: none;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                ">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    GitHub
                </a>
                <span style="color: var(--text-secondary, #666);">•</span>
                <a id="linkedin-link" href="#" style="
                    color: var(--accent-color, #007acc);
                    text-decoration: none;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                ">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                    </svg>
                    Author
                </a>
            </div>
        </div>
        <button id="about-close-btn" style="
            background: var(--accent-color, #007acc);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 24px;
            font-size: 14px;
            cursor: pointer;
            transition: opacity 0.2s;
        ">Close</button>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Close handlers
    const closeDialog = () => {
        document.body.removeChild(overlay);
    };

    document.getElementById('about-close-btn').addEventListener('click', closeDialog);

    // Open external links
    document.getElementById('github-link').addEventListener('click', async (e) => {
        e.preventDefault();
        await window.electronAPI.openExternal('https://github.com/leandrolsouza/MD-Editor-Pro');
    });

    document.getElementById('linkedin-link').addEventListener('click', async (e) => {
        e.preventDefault();
        await window.electronAPI.openExternal('https://www.linkedin.com/in/leandrolsouza/');
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDialog();
        }
    });

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeDialog();
            document.removeEventListener('keydown', handleEscape);
        }
    };

    document.addEventListener('keydown', handleEscape);
}

/**
 * Handle template insertion
 * Requirements: 6.1, 6.2, 6.3
 * @param {Object} template - Template object
 * @param {string} mode - 'insert' or 'replace'
 */
async function handleTemplateInsert(template, mode) {
    try {
        // Insert template into editor
        editor.insertTemplate(template.content, mode);

        // Mark template as used
        await window.electronAPI.markTemplateUsed(template.id);

        // Mark document as modified
        const content = editor.getValue();

        updateDirtyState(content);

        console.log('Template inserted:', template.name, 'mode:', mode);
    } catch (error) {
        console.error('Error inserting template:', error);
        alert('Failed to insert template: ' + error.message);
    }
}

/**
 * Cleanup function for when the window is closed
 */
function cleanup() {
    // Save tabs before closing
    if (window.electronAPI && window.electronAPI.saveTabs) {
        window.electronAPI.saveTabs().catch(err => {
            console.error('Error saving tabs on cleanup:', err);
        });
    }

    // Remove event listeners
    if (removeFileDroppedListener) {
        removeFileDroppedListener();
    }
    if (removeMenuActionListener) {
        removeMenuActionListener();
    }

    // Destroy components
    if (editor) {
        editor.destroy();
    }
    if (preview) {
        preview.destroy();
    }
    if (formattingToolbar) {
        formattingToolbar.destroy();
    }
    if (autoSaveManager) {
        autoSaveManager.destroy();
    }
    if (statisticsCalculator) {
        statisticsCalculator.destroy();
    }
    if (tabBar) {
        tabBar.destroy();
    }
    if (focusMode) {
        focusMode.destroy();
    }
    if (templateUI) {
        // TemplateUI doesn't have a destroy method, but we could add one if needed
    }
    if (snippetManager) {
        // SnippetManager doesn't need cleanup
    }
}

// Handle window beforeunload event to warn about unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // Some browsers require a return value
    }
});

// Cleanup on window unload
window.addEventListener('unload', cleanup);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
