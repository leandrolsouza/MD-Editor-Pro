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

        // Initialize Editor
        const editorContainer = document.getElementById('editor-container');
        if (!editorContainer) {
            throw new Error('Editor container not found');
        }
        editor = new Editor();
        editor.initialize(editorContainer);
        console.log('Editor initialized');

        // Initialize Preview
        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer) {
            throw new Error('Preview container not found');
        }
        preview = new Preview();
        preview.initialize(previewContainer);
        console.log('Preview initialized');

        // Initialize SearchManager
        searchManager = new SearchManager(editor);
        searchManager.initialize();
        console.log('SearchManager initialized');

        // Initialize ThemeManager
        themeManager = new ThemeManager();
        await themeManager.initialize();
        console.log('ThemeManager initialized');

        // Initialize ViewModeManager
        viewModeManager = new ViewModeManager();
        await viewModeManager.initialize();
        console.log('ViewModeManager initialized');

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

        // Ctrl/Cmd + B: Bold
        if (modifier && e.key === 'b' && !e.shiftKey) {
            e.preventDefault();
            editor.applyFormatting('bold');
        }

        // Ctrl/Cmd + I: Italic
        if (modifier && e.key === 'i') {
            e.preventDefault();
            editor.applyFormatting('italic');
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
