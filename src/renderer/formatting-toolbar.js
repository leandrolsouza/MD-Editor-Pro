/**
 * FormattingToolbar - Provides visual formatting buttons for markdown editing
 * Requirements: 9.1, 9.2, 9.4, 4.5, 6.5
 */

class FormattingToolbar {
    constructor(editor) {
        if (!editor) {
            throw new Error('Editor instance is required');
        }

        this.editor = editor;
        this.container = null;
        this.buttons = new Map();
        this.initialized = false;
        this.updateDebounceTimer = null;
        this.editorUpdateListener = null;

        // Button configuration array with all formatting buttons
        this.buttonConfig = [
            { id: 'bold', icon: 'B', title: 'Bold (Ctrl+B)', action: 'bold', group: 'inline' },
            { id: 'italic', icon: 'I', title: 'Italic (Ctrl+I)', action: 'italic', group: 'inline' },
            { id: 'strikethrough', icon: 'S', title: 'Strikethrough', action: 'strikethrough', group: 'inline' },
            { id: 'separator-1', type: 'separator' },
            { id: 'heading1', icon: 'H1', title: 'Heading 1', action: 'heading', level: 1, group: 'heading' },
            { id: 'heading2', icon: 'H2', title: 'Heading 2', action: 'heading', level: 2, group: 'heading' },
            { id: 'heading3', icon: 'H3', title: 'Heading 3', action: 'heading', level: 3, group: 'heading' },
            { id: 'separator-2', type: 'separator' },
            { id: 'unordered-list', icon: '•', title: 'Bullet List', action: 'unordered-list', group: 'list' },
            { id: 'ordered-list', icon: '1.', title: 'Numbered List', action: 'ordered-list', group: 'list' },
            { id: 'blockquote', icon: '"', title: 'Blockquote', action: 'blockquote', group: 'block' },
            { id: 'separator-3', type: 'separator' },
            { id: 'code', icon: '</>', title: 'Inline Code (Ctrl+`)', action: 'code', group: 'code' },
            { id: 'code-block', icon: '{ }', title: 'Code Block', action: 'code-block', group: 'code' },
            { id: 'separator-4', type: 'separator' },
            { id: 'link', icon: '🔗', title: 'Insert Link', action: 'link', group: 'insert' },
            { id: 'image', icon: '🖼', title: 'Insert Image', action: 'image', group: 'insert' }
        ];
    }

    /**
     * Initialize the toolbar and create DOM structure
     * @param {HTMLElement} container - The container element for the toolbar
     */
    initialize(container) {
        if (!container) {
            throw new Error('Container element is required');
        }

        if (this.initialized) {
            console.warn('FormattingToolbar already initialized');
            return;
        }

        this.container = container;
        this.createToolbarDOM();
        this.setupEditorListeners();
        this.initialized = true;
    }

    /**
     * Create the toolbar DOM structure with all buttons
     * @private
     */
    createToolbarDOM() {
        // Clear any existing content
        this.container.innerHTML = '';

        // Create toolbar wrapper
        const toolbarWrapper = document.createElement('div');
        toolbarWrapper.className = 'formatting-toolbar-wrapper';

        // Create buttons from configuration
        this.buttonConfig.forEach(config => {
            if (config.type === 'separator') {
                // Create separator
                const separator = document.createElement('div');
                separator.className = 'toolbar-separator';
                toolbarWrapper.appendChild(separator);
            } else {
                // Create button
                const button = this.createButton(config);
                toolbarWrapper.appendChild(button);
                this.buttons.set(config.id, button);
            }
        });

        this.container.appendChild(toolbarWrapper);
    }

    /**
     * Create a single button element
     * @private
     * @param {Object} config - Button configuration
     * @returns {HTMLElement} Button element
     */
    createButton(config) {
        const button = document.createElement('button');
        button.className = 'toolbar-button';
        button.setAttribute('data-action', config.action);
        button.setAttribute('data-button-id', config.id);
        button.setAttribute('title', config.title);
        button.setAttribute('type', 'button');

        // Add group class for styling
        if (config.group) {
            button.classList.add(`toolbar-button-${config.group}`);
        }

        // Set button content (icon)
        button.textContent = config.icon;

        // Add click handler
        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleButtonClick(config);
        });

        return button;
    }

    /**
     * Handle button click events
     * @private
     * @param {Object} config - Button configuration
     */
    handleButtonClick(config) {
        if (!this.editor) {
            console.error('Editor not available');
            return;
        }

        try {
            switch (config.action) {
                case 'bold':
                    this.editor.applyBold();
                    break;
                case 'italic':
                    this.editor.applyItalic();
                    break;
                case 'strikethrough':
                    this.editor.applyStrikethrough();
                    break;
                case 'heading':
                    this.editor.applyHeading(config.level);
                    break;
                case 'unordered-list':
                    this.editor.applyUnorderedList();
                    break;
                case 'ordered-list':
                    this.editor.applyOrderedList();
                    break;
                case 'blockquote':
                    this.editor.applyBlockquote();
                    break;
                case 'code':
                    this.editor.applyInlineCode();
                    break;
                case 'code-block':
                    this.editor.applyCodeBlock();
                    break;
                case 'link':
                    this.editor.insertLink();
                    break;
                case 'image':
                    this.editor.insertImage();
                    break;
                default:
                    console.warn('Unknown action:', config.action);
            }
        } catch (error) {
            console.error('Error handling button click:', error);
        }
    }

    /**
     * Setup listeners for editor cursor and selection changes
     * Requirements: 10.1, 10.2
     * @private
     */
    setupEditorListeners() {
        if (!this.editor || !this.editor.view) {
            console.error('Editor view not available');
            return;
        }

        // Listen to editor updates (cursor movement, selection changes)
        const { EditorView } = require('@codemirror/view');

        this.editorUpdateListener = EditorView.updateListener.of((update) => {
            // Update button states when selection changes or document changes
            if (update.selectionSet || update.docChanged) {
                this.scheduleButtonStateUpdate();
            }
        });

        // Add the listener to the editor
        this.editor.view.dispatch({
            effects: require('@codemirror/state').StateEffect.appendConfig.of(this.editorUpdateListener)
        });

        // Initial button state update
        this.updateButtonStates();
    }

    /**
     * Schedule a debounced button state update
     * Requirements: 10.5
     * @private
     */
    scheduleButtonStateUpdate() {
        // Clear existing timer
        if (this.updateDebounceTimer) {
            clearTimeout(this.updateDebounceTimer);
        }

        // Schedule new update with 50ms debounce
        this.updateDebounceTimer = setTimeout(() => {
            this.updateButtonStates();
            this.updateDebounceTimer = null;
        }, 50);
    }

    /**
     * Update button active states based on current editor formatting
     * Requirements: 1.4, 2.4, 3.4, 4.4, 5.5, 7.4, 8.4, 10.1, 10.2, 10.3
     */
    updateButtonStates() {
        if (!this.editor || !this.initialized) {
            return;
        }

        try {
            // Query editor for active formats
            const isBold = this.editor.isBoldActive();
            const isItalic = this.editor.isItalicActive();
            const isStrikethrough = this.editor.isStrikethroughActive();
            const headingLevel = this.editor.getActiveHeadingLevel();
            const isUnorderedList = this.editor.isUnorderedListActive();
            const isOrderedList = this.editor.isOrderedListActive();
            const isBlockquote = this.editor.isBlockquoteActive();
            const isInlineCode = this.editor.isInlineCodeActive();

            // Update button states
            this.setButtonActive('bold', isBold);
            this.setButtonActive('italic', isItalic);
            this.setButtonActive('strikethrough', isStrikethrough);
            this.setButtonActive('code', isInlineCode);
            this.setButtonActive('blockquote', isBlockquote);
            this.setButtonActive('unordered-list', isUnorderedList);
            this.setButtonActive('ordered-list', isOrderedList);

            // Update heading buttons (only one can be active at a time)
            this.setButtonActive('heading1', headingLevel === 1);
            this.setButtonActive('heading2', headingLevel === 2);
            this.setButtonActive('heading3', headingLevel === 3);

        } catch (error) {
            console.error('Error updating button states:', error);
        }
    }

    /**
     * Set the active state of a button
     * Requirements: 10.5
     * @private
     * @param {string} buttonId - Button ID
     * @param {boolean} active - Whether the button should be active
     */
    setButtonActive(buttonId, active) {
        const button = this.buttons.get(buttonId);
        if (!button) {
            return;
        }

        if (active) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }

    /**
     * Show the toolbar
     * Requirements: 9.5
     */
    show() {
        if (this.container) {
            this.container.style.display = '';
        }
    }

    /**
     * Hide the toolbar
     * Requirements: 9.5
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Connect to ViewModeManager to listen for view mode changes
     * Requirements: 9.5
     * @param {ViewModeManager} viewModeManager - The view mode manager instance
     * @returns {Function} Function to remove the listener
     */
    connectToViewModeManager(viewModeManager) {
        if (!viewModeManager) {
            throw new Error('ViewModeManager instance is required');
        }

        // Listen for view mode changes
        const removeListener = viewModeManager.onViewModeChange((mode) => {
            // Show toolbar in editor-only and split-view modes
            // Hide toolbar in preview-only mode
            if (mode === 'preview') {
                this.hide();
            } else {
                this.show();
            }
        });

        // Set initial visibility based on current view mode
        const currentMode = viewModeManager.getCurrentViewMode();
        if (currentMode === 'preview') {
            this.hide();
        } else {
            this.show();
        }

        return removeListener;
    }

    /**
     * Destroy the toolbar and cleanup
     */
    destroy() {
        // Clear debounce timer
        if (this.updateDebounceTimer) {
            clearTimeout(this.updateDebounceTimer);
            this.updateDebounceTimer = null;
        }

        // Remove editor listener
        this.editorUpdateListener = null;

        // Remove all button references
        this.buttons.clear();

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }

        this.container = null;
        this.editor = null;
        this.initialized = false;
    }
}

module.exports = FormattingToolbar;
