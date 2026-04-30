/**
 * FormattingToolbar - Provides visual formatting buttons for markdown editing
 * Requirements: 9.1, 9.2, 9.4, 4.5, 6.5
 */

const i18n = require('../i18n/index.js');
const { getIcon } = require('./icons.js');

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
        this.removeLocaleListener = null;
        this.onMenuAction = null; // Callback for menu actions (set externally)

        // Button configuration array with all formatting buttons
        this.buttonConfig = [
            // Quick action buttons (file operations, view modes)
            { id: 'quick-new', icon: 'filePlus', titleKey: 'quickActions.newFile', shortcut: 'Ctrl+N', action: 'menu-action', menuAction: 'new', group: 'quick' },
            { id: 'quick-open', icon: 'folderOpen', titleKey: 'quickActions.openFile', shortcut: 'Ctrl+O', action: 'menu-action', menuAction: 'open', group: 'quick' },
            { id: 'quick-save', icon: 'save', titleKey: 'quickActions.save', shortcut: 'Ctrl+S', action: 'menu-action', menuAction: 'save', group: 'quick' },
            { id: 'separator-quick-1', type: 'separator' },
            { id: 'quick-export-html', icon: 'export', titleKey: 'quickActions.exportHTML', action: 'menu-action', menuAction: 'export-html', group: 'quick', label: 'HTML' },
            { id: 'quick-export-pdf', icon: 'download', titleKey: 'quickActions.exportPDF', action: 'menu-action', menuAction: 'export-pdf', group: 'quick', label: 'PDF' },
            { id: 'separator-quick-2', type: 'separator' },
            { id: 'quick-view-editor', icon: 'viewEditor', titleKey: 'quickActions.editorView', action: 'menu-action', menuAction: 'view-mode-editor', group: 'quick' },
            { id: 'quick-view-split', icon: 'viewSplit', titleKey: 'quickActions.splitView', action: 'menu-action', menuAction: 'view-mode-split', group: 'quick' },
            { id: 'quick-view-preview', icon: 'viewPreview', titleKey: 'quickActions.previewView', action: 'menu-action', menuAction: 'view-mode-preview', group: 'quick' },
            { id: 'separator-quick-3', type: 'separator' },
            { id: 'quick-focus-mode', icon: 'focusMode', titleKey: 'quickActions.focusMode', shortcut: 'F11', action: 'menu-action', menuAction: 'focus-mode', group: 'quick' },
            { id: 'separator-quick-4', type: 'separator' },
            // Formatting buttons
            { id: 'bold', icon: 'bold', titleKey: 'formatting.bold', shortcut: 'Ctrl+B', action: 'bold', group: 'inline' },
            { id: 'italic', icon: 'italic', titleKey: 'formatting.italic', shortcut: 'Ctrl+I', action: 'italic', group: 'inline' },
            { id: 'strikethrough', icon: 'strikethrough', titleKey: 'formatting.strikethrough', action: 'strikethrough', group: 'inline' },
            { id: 'code', icon: 'code', titleKey: 'formatting.code', shortcut: 'Ctrl+`', action: 'code', group: 'code' },
            { id: 'separator-1', type: 'separator' },
            { id: 'heading1', icon: 'heading1', titleKey: 'formatting.heading', level: 1, action: 'heading', group: 'heading' },
            { id: 'heading2', icon: 'heading2', titleKey: 'formatting.heading', level: 2, action: 'heading', group: 'heading' },
            { id: 'heading3', icon: 'heading3', titleKey: 'formatting.heading', level: 3, action: 'heading', group: 'heading' },
            { id: 'heading4', icon: 'heading1', titleKey: 'formatting.heading', level: 4, action: 'heading', group: 'heading', label: 'H4' },
            { id: 'heading5', icon: 'heading1', titleKey: 'formatting.heading', level: 5, action: 'heading', group: 'heading', label: 'H5' },
            { id: 'heading6', icon: 'heading1', titleKey: 'formatting.heading', level: 6, action: 'heading', group: 'heading', label: 'H6' },
            { id: 'separator-2', type: 'separator' },
            { id: 'unordered-list', icon: 'listBullet', titleKey: 'formatting.bulletList', action: 'unordered-list', group: 'list' },
            { id: 'ordered-list', icon: 'listOrdered', titleKey: 'formatting.numberedList', action: 'ordered-list', group: 'list' },
            { id: 'task-list', icon: 'listTask', titleKey: 'formatting.taskList', action: 'task-list', group: 'list' },
            { id: 'separator-3', type: 'separator' },
            { id: 'blockquote', icon: 'quote', titleKey: 'formatting.blockquote', action: 'blockquote', group: 'block' },
            { id: 'code-block', icon: 'codeBlock', titleKey: 'formatting.codeBlock', action: 'code-block', group: 'code' },
            { id: 'table', icon: 'table', titleKey: 'formatting.table', action: 'table', group: 'insert' },
            { id: 'horizontal-rule', icon: 'horizontalRule', titleKey: 'formatting.horizontalRule', action: 'horizontal-rule', group: 'insert' },
            { id: 'separator-4', type: 'separator' },
            { id: 'link', icon: 'link', titleKey: 'formatting.link', action: 'link', group: 'insert' },
            { id: 'image', icon: 'image', titleKey: 'formatting.image', action: 'image', group: 'insert' },
            { id: 'separator-5', type: 'separator' },
            { id: 'indent', icon: 'indent', titleKey: 'formatting.indent', action: 'indent', group: 'format' },
            { id: 'outdent', icon: 'outdent', titleKey: 'formatting.outdent', action: 'outdent', group: 'format' },
            { id: 'clear-format', icon: 'clearFormat', titleKey: 'formatting.clearFormat', action: 'clear-format', group: 'format' },
            { id: 'separator-6', type: 'separator' },
            { id: 'template', icon: 'template', titleKey: 'templates.insert', action: 'template', group: 'insert' }
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
        this.setupLocaleListener();
        this.initialized = true;
    }

    /**
     * Setup locale change listener
     */
    setupLocaleListener() {
        this.removeLocaleListener = i18n.onLocaleChange(() => {
            this.updateTranslations();
        });
    }

    /**
     * Update translations when locale changes
     */
    updateTranslations() {
        // Update button tooltips
        this.buttonConfig.forEach(config => {
            if (config.type === 'separator') return;

            const button = this.buttons.get(config.id);
            if (!button) return;

            let title = config.level
                ? i18n.t(config.titleKey, { level: config.level })
                : i18n.t(config.titleKey);

            if (config.shortcut) {
                title += ` (${config.shortcut})`;
            }

            button.setAttribute('title', title);
        });
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

        // Build title with translation and optional shortcut
        let title = config.level
            ? i18n.t(config.titleKey, { level: config.level })
            : i18n.t(config.titleKey);

        if (config.shortcut) {
            title += ` (${config.shortcut})`;
        }

        button.setAttribute('title', title);
        button.setAttribute('type', 'button');

        // Add group class for styling
        if (config.group) {
            button.classList.add(`toolbar-button-${config.group}`);
        }

        // Set button content (icon) - use SVG icon or label fallback
        if (config.label && config.group === 'quick') {
            // Quick action buttons with label show icon + text
            const iconSvg = getIcon(config.icon);
            button.innerHTML = `${iconSvg}<span class="toolbar-button__label">${config.label}</span>`;
            button.classList.add('toolbar-button-with-icon');
        } else if (config.label) {
            button.innerHTML = `<span class="toolbar-button__label">${config.label}</span>`;
        } else {
            const iconSvg = getIcon(config.icon);
            button.innerHTML = iconSvg || config.icon;
        }

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
        // Menu actions don't require the editor
        if (config.action === 'menu-action') {
            if (this.onMenuAction) {
                this.onMenuAction(config.menuAction);
            }
            return;
        }

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

        title.textContent = i18n.t('codeBlock.selectLanguage');
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

        cancelBtn.textContent = i18n.t('actions.cancel');
        cancelBtn.style.cssText = 'padding: 8px 16px; border: 1px solid var(--border-color, #ccc); border-radius: 4px; background: var(--bg-secondary, #f5f5f5); cursor: pointer;';
        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
            callback(null);
        };

        const okBtn = document.createElement('button');

        okBtn.textContent = i18n.t('codeBlock.insert');
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

        // Update active state on view mode buttons
        const updateViewModeButtons = (mode) => {
            const modeMap = { 'editor': 'quick-view-editor', 'split': 'quick-view-split', 'preview': 'quick-view-preview' };
            Object.entries(modeMap).forEach(([m, btnId]) => {
                const btn = this.buttons.get(btnId);
                if (btn) {
                    btn.classList.toggle('active', m === mode);
                }
            });
        };

        // Listen for view mode changes
        const removeListener = viewModeManager.onViewModeChange((mode) => {
            updateViewModeButtons(mode);
            // Show toolbar in editor-only and split-view modes
            // Hide toolbar in preview-only mode
            if (mode === 'preview') {
                this.hide();
            } else {
                this.show();
            }
        });

        // Set initial state
        const currentMode = viewModeManager.getCurrentViewMode();
        updateViewModeButtons(currentMode);

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

        // Remove locale listener
        if (this.removeLocaleListener) {
            this.removeLocaleListener();
            this.removeLocaleListener = null;
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
