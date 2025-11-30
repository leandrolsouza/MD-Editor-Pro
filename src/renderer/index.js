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

// Application state
let editor = null;
let preview = null;
let searchManager = null;
let themeManager = null;
let viewModeManager = null;
let autoSaveManager = null;

// Document state
let currentFilePath = null;
let isDirty = false;
let lastSavedContent = '';

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

        // Connect editor changes to preview updates
        editor.onContentChange((content) => {
            preview.render(content);
            updateDirtyState(content);
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
    // Check for unsaved changes
    if (isDirty) {
        const shouldSave = confirm('You have unsaved changes. Do you want to save them?');
        if (shouldSave) {
            await handleSaveFile();
        }
    }

    // Clear editor and reset state
    editor.setValue('');
    currentFilePath = null;
    isDirty = false;
    lastSavedContent = '';

    // Update auto-save manager
    if (autoSaveManager) {
        autoSaveManager.setCurrentFilePath(null);
        autoSaveManager.setLastSavedContent('');
    }

    preview.render('');
}

/**
 * Handle open file action
 */
async function handleOpenFile() {
    try {
        console.log('handleOpenFile called');

        // Check for unsaved changes
        if (isDirty) {
            const shouldSave = confirm('You have unsaved changes. Do you want to save them?');
            if (shouldSave) {
                await handleSaveFile();
            }
        }

        console.log('Calling window.electronAPI.openFile()...');
        const result = await window.electronAPI.openFile();
        console.log('openFile result:', result);

        if (result && result.filePath && result.content !== undefined) {
            await loadFile(result.filePath, result.content);
        }
    } catch (error) {
        console.error('Error opening file:', error);
        alert('Failed to open file: ' + error.message);
    }
}

/**
 * Load a file into the editor
 * @param {string} filePath - Path to the file
 * @param {string} content - File content (optional, will be loaded if not provided)
 */
async function loadFile(filePath, content = null) {
    try {
        // If content not provided, load it
        if (content === null) {
            const result = await window.electronAPI.openFile();
            if (!result || !result.content) {
                return;
            }
            content = result.content;
            filePath = result.filePath;
        }

        // Set editor content
        editor.setValue(content);
        currentFilePath = filePath;
        isDirty = false;
        lastSavedContent = content;

        // Update auto-save manager
        if (autoSaveManager) {
            autoSaveManager.setCurrentFilePath(filePath);
            autoSaveManager.setLastSavedContent(content);
        }

        // Update preview
        preview.render(content);

        console.log('File loaded:', filePath);
    } catch (error) {
        console.error('Error loading file:', error);
        alert('Failed to load file: ' + error.message);
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
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', async (e) => {
        // Detect platform (Ctrl on Windows/Linux, Cmd on macOS)
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;

        // Ctrl/Cmd + B: Bold
        if (modifier && e.key === 'b') {
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

        // Escape: Close search if open
        if (e.key === 'Escape' && searchManager.isVisible()) {
            e.preventDefault();
            searchManager.hide();
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
                // Check for unsaved changes
                if (isDirty) {
                    const shouldSave = confirm('You have unsaved changes. Do you want to save them?');
                    if (shouldSave) {
                        await handleSaveFile();
                    }
                }

                // Read file content
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const content = event.target.result;
                    editor.setValue(content);
                    currentFilePath = file.path;
                    isDirty = false;
                    lastSavedContent = content;
                    preview.render(content);
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
 * Cleanup function for when the window is closed
 */
function cleanup() {
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
