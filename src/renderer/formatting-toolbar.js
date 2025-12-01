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
            { id: 'code', icon: '</>', title: 'Inline Code (Ctrl+`)', action: 'code', group: 'code' },
            { id: 'separator-1', type: 'separator' },
            { id: 'heading1', icon: 'H1', title: 'Heading 1', action: 'heading', level: 1, group: 'heading' },
            { id: 'heading2', icon: 'H2', title: 'Heading 2', action: 'heading', level: 2, group: 'heading' },
            { id: 'heading3', icon: 'H3', title: 'Heading 3', action: 'heading', level: 3, group: 'heading' },
            { id: 'heading4', icon: 'H4', title: 'Heading 4', action: 'heading', level: 4, group: 'heading' },
            { id: 'heading5', icon: 'H5', title: 'Heading 5', action: 'heading', level: 5, group: 'heading' },
            { id: 'heading6', icon: 'H6', title: 'Heading 6', action: 'heading', level: 6, group: 'heading' },
            { id: 'separator-2', type: 'separator' },
            { id: 'unordered-list', icon: '•', title: 'Bullet List', action: 'unordered-list', group: 'list' },
            { id: 'ordered-list', icon: '1.', title: 'Numbered List', action: 'ordered-list', group: 'list' },
            { id: 'task-list', icon: '☑', title: 'Task List', action: 'task-list', group: 'list' },
            { id: 'separator-3', type: 'separator' },
            { id: 'blockquote', icon: '"', title: 'Blockquote', action: 'blockquote', group: 'block' },
            { id: 'code-block', icon: '{ }', title: 'Code Block', action: 'code-block', group: 'code' },
            { id: 'table', icon: '⊞', title: 'Insert Table', action: 'table', group: 'insert' },
            { id: 'horizontal-rule', icon: '—', title: 'Horizontal Rule', action: 'horizontal-rule', group: 'insert' },
            { id: 'separator-4', type: 'separator' },
            { id: 'link', icon: '🔗', title: 'Insert Link', action: 'link', group: 'insert' },
            { id: 'image', icon: '🖼', title: 'Insert Image', action: 'image', group: 'insert' },
            { id: 'separator-5', type: 'separator' },
            { id: 'indent', icon: '→', title: 'Indent', action: 'indent', group: 'format' },
            { id: 'outdent', icon: '←', title: 'Outdent', action: 'outdent', group: 'format' },
            { id: 'clear-format', icon: '✕', title: 'Clear Formatting', action: 'clear-format', group: 'format' },
            { id: 'separator-6', type: 'separator' },
            { id: 'template', icon: '📄', title: 'Insert Template', action: 'template', group: 'insert' }
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

        // Add ARIA label for accessibility
        button.setAttribute('aria-label', config.title);

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
                case 'task-list':
                    this.editor.applyTaskList();
                    break;
                case 'blockquote':
                    this.editor.applyBlockquote();
                    break;
                case 'code':
                    this.editor.applyInlineCode();
                    break;
                case 'code-block':
                    this.handleCodeBlockClick();
                    break;
                case 'link':
                    this.editor.insertLink();
                    break;
                case 'image':
                    this.editor.insertImage();
                    break;
                case 'table':
                    this.editor.insertTable();
                    break;
                case 'horizontal-rule':
                    this.editor.insertHorizontalRule();
                    break;
                case 'indent':
                    this.editor.indentSelection();
                    break;
                case 'outdent':
                    this.editor.outdentSelection();
                    break;
                case 'clear-format':
                    this.editor.clearFormatting();
                    break;
                case 'template':
                    this.handleTemplateClick();
                    break;
                default:
                    console.warn('Unknown action:', config.action);
            }
        } catch (error) {
            console.error('Error handling button click:', error);
        }
    }

    /**
     * Handle template button click
     * @private
     */
    handleTemplateClick() {
        if (this.templateUI) {
            this.templateUI.showTemplateMenu();
        } else {
            console.warn('TemplateUI not connected to FormattingToolbar');
        }
    }

    /**
     * Connect TemplateUI instance to the toolbar
     * @param {TemplateUI} templateUI - The template UI instance
     */
    connectTemplateUI(templateUI) {
        if (!templateUI) {
            throw new Error('TemplateUI instance is required');
        }
        this.templateUI = templateUI;
    }

    /**
     * Handle code block button click with language selection
     * @private
     */
    handleCodeBlockClick() {
        // Create a custom language selection dialog
        this.showLanguageDialog((language) => {
            if (language !== null) {
                this.editor.applyCodeBlockWithLanguage(language);
            }
        });
    }

    /**
     * Show language selection dialog for code blocks
     * @private
     * @param {Function} callback - Callback with selected language
     */
    showLanguageDialog(callback) {
        // Create dialog overlay
        const overlay = document.createElement('div');

        overlay.className = 'language-dialog-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';

        // Create dialog
        const dialog = document.createElement('div');

        dialog.className = 'language-dialog';
        dialog.style.cssText = 'background: var(--bg-color, white); padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); min-width: 300px; max-width: 400px;';

        // Title
        const title = document.createElement('h3');

        title.textContent = 'Select Code Language';
        title.style.cssText = 'margin: 0 0 15px 0; font-size: 16px; color: var(--text-color, #333);';
        dialog.appendChild(title);

        // Input
        const input = document.createElement('input');

        input.type = 'text';
        input.placeholder = 'e.g., javascript, python, html...';
        input.style.cssText = 'width: 100%; padding: 8px; border: 1px solid var(--border-color, #ccc); border-radius: 4px; font-size: 14px; margin-bottom: 10px; box-sizing: border-box;';
        dialog.appendChild(input);

        // Common languages
        const commonLangs = ['javascript', 'python', 'java', 'html', 'css', 'typescript', 'bash', 'json', 'markdown', 'sql'];
        const langsContainer = document.createElement('div');

        langsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 15px;';

        commonLangs.forEach(lang => {
            const btn = document.createElement('button');

            btn.textContent = lang;
            btn.className = 'lang-quick-btn';
            btn.style.cssText = 'padding: 4px 8px; border: 1px solid var(--border-color, #ccc); border-radius: 4px; background: var(--bg-secondary, #f5f5f5); cursor: pointer; font-size: 12px;';
            btn.onclick = () => {
                input.value = lang;
            };
            langsContainer.appendChild(btn);
        });
        dialog.appendChild(langsContainer);

        // Buttons
        const buttonsDiv = document.createElement('div');

        buttonsDiv.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

        const cancelBtn = document.createElement('button');

        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'padding: 8px 16px; border: 1px solid var(--border-color, #ccc); border-radius: 4px; background: var(--bg-secondary, #f5f5f5); cursor: pointer;';
        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
            callback(null);
        };

        const okBtn = document.createElement('button');

        okBtn.textContent = 'Insert';
        okBtn.style.cssText = 'padding: 8px 16px; border: 1px solid #0969da; border-radius: 4px; background: #0969da; color: white; cursor: pointer;';
        okBtn.onclick = () => {
            const language = input.value.trim();

            document.body.removeChild(overlay);
            callback(language);
        };

        buttonsDiv.appendChild(cancelBtn);
        buttonsDiv.appendChild(okBtn);
        dialog.appendChild(buttonsDiv);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Focus input
        input.focus();

        // Handle Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                okBtn.click();
            } else if (e.key === 'Escape') {
                cancelBtn.click();
            }
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cancelBtn.click();
            }
        });
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
            const isTaskList = this.editor.isTaskListActive();
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
            this.setButtonActive('task-list', isTaskList);

            // Update heading buttons (only one can be active at a time)
            this.setButtonActive('heading1', headingLevel === 1);
            this.setButtonActive('heading2', headingLevel === 2);
            this.setButtonActive('heading3', headingLevel === 3);
            this.setButtonActive('heading4', headingLevel === 4);
            this.setButtonActive('heading5', headingLevel === 5);
            this.setButtonActive('heading6', headingLevel === 6);

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
