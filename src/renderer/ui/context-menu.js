/**
 * Context Menu for the Markdown Editor
 * Provides right-click menu with common editing actions
 */

const { EditorSelection } = require('@codemirror/state');
const i18n = require('../i18n/index.js');

const MENU_ACTIONS = {
    cut: 'executeCut',
    copy: 'executeCopy',
    paste: 'executePaste',
    undo: 'executeUndo',
    redo: 'executeRedo',
    selectAll: 'executeSelectAll',
    bold: 'executeBold',
    italic: 'executeItalic',
    strikethrough: 'executeStrikethrough',
    insertLink: 'executeInsertLink',
    insertImage: 'executeInsertImage',
    insertTable: 'executeInsertTable',
    insertCodeBlock: 'executeInsertCodeBlock',
    // AI Edit actions
    aiRewrite: 'executeAIRewrite',
    aiFixGrammar: 'executeAIFixGrammar',
    aiSummarize: 'executeAISummarize',
    aiExpand: 'executeAIExpand',
    aiMakeFormal: 'executeAIMakeFormal',
    aiMakeCasual: 'executeAIMakeCasual',
    aiTranslate: 'executeAITranslate',
    aiCustom: 'executeAICustom'
};

class ContextMenu {
    constructor(editor) {
        this.editor = editor;
        this.menuElement = null;
        this.isVisible = false;
        this.boundHideMenu = this.hide.bind(this);
        this.boundHandleKeydown = this.handleKeydown.bind(this);
        this.removeLocaleListener = null;
    }

    /**
     * Initialize the context menu
     * @param {HTMLElement} editorContainer - The editor container element
     */
    initialize(editorContainer) {
        this.editorContainer = editorContainer;
        this.createMenuElement();
        this.attachEventListeners();

        // Listen for locale changes to rebuild menu
        this.removeLocaleListener = i18n.onLocaleChange(() => {
            this.rebuildMenu();
        });
    }

    /**
     * Get menu items configuration with translations
     * @param {boolean} hasSelection - Whether text is selected
     */
    getMenuItems(hasSelection = false) {
        const items = [
            { action: 'cut', labelKey: 'contextMenu.cut', icon: '✂️', shortcut: 'Ctrl+X' },
            { action: 'copy', labelKey: 'contextMenu.copy', icon: '📋', shortcut: 'Ctrl+C' },
            { action: 'paste', labelKey: 'contextMenu.paste', icon: '📄', shortcut: 'Ctrl+V' },
            { separator: true },
            { action: 'undo', labelKey: 'contextMenu.undo', icon: '↩️', shortcut: 'Ctrl+Z' },
            { action: 'redo', labelKey: 'contextMenu.redo', icon: '↪️', shortcut: 'Ctrl+Y' },
            { separator: true },
            { action: 'selectAll', labelKey: 'contextMenu.selectAll', icon: '📝', shortcut: 'Ctrl+A' },
            { separator: true },
            // Formatting submenu
            {
                labelKey: 'menu.format',
                icon: '🔤',
                submenu: [
                    { action: 'bold', labelKey: 'contextMenu.bold', icon: '𝐁', shortcut: 'Ctrl+B' },
                    { action: 'italic', labelKey: 'contextMenu.italic', icon: '𝐼', shortcut: 'Ctrl+I' },
                    { action: 'strikethrough', labelKey: 'contextMenu.strikethrough', icon: 'S̶' }
                ]
            },
            // Insert submenu
            {
                labelKey: 'contextMenu.insert',
                icon: '➕',
                submenu: [
                    { action: 'insertLink', labelKey: 'contextMenu.insertLink', icon: '🔗', shortcut: 'Ctrl+K' },
                    { action: 'insertImage', labelKey: 'contextMenu.insertImage', icon: '🖼️' },
                    { action: 'insertTable', labelKey: 'contextMenu.insertTable', icon: '📊' },
                    { action: 'insertCodeBlock', labelKey: 'contextMenu.codeBlock', icon: '💻' }
                ]
            }
        ];

        // Add AI edit submenu when text is selected
        if (hasSelection) {
            items.push({
                labelKey: 'aiEdit.title',
                icon: '✨',
                submenu: [
                    { action: 'aiRewrite', labelKey: 'aiEdit.rewrite', icon: '✏️' },
                    { action: 'aiFixGrammar', labelKey: 'aiEdit.fixGrammar', icon: '📝' },
                    { action: 'aiSummarize', labelKey: 'aiEdit.summarize', icon: '📋' },
                    { action: 'aiExpand', labelKey: 'aiEdit.expand', icon: '📖' },
                    { separator: true },
                    { action: 'aiMakeFormal', labelKey: 'aiEdit.makeFormal', icon: '👔' },
                    { action: 'aiMakeCasual', labelKey: 'aiEdit.makeCasual', icon: '😊' },
                    { separator: true },
                    { action: 'aiTranslate', labelKey: 'aiEdit.translate', icon: '🌐' },
                    { action: 'aiCustom', labelKey: 'aiEdit.custom', icon: '💬' }
                ]
            });
        }

        return items;
    }

    /**
     * Create the menu DOM element
     */
    createMenuElement() {
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'context-menu';
        this.menuElement.setAttribute('role', 'menu');
        this.menuElement.setAttribute('aria-hidden', 'true');

        this.populateMenuItems();
        document.body.appendChild(this.menuElement);
    }

    /**
     * Populate menu with items
     * @param {boolean} hasSelection - Whether text is selected
     */
    populateMenuItems(hasSelection = false) {
        this.menuElement.innerHTML = '';
        const menuItems = this.getMenuItems(hasSelection);

        menuItems.forEach((item) => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                separator.setAttribute('role', 'separator');
                this.menuElement.appendChild(separator);
            } else if (item.submenu) {
                // Create submenu container
                const submenuContainer = document.createElement('div');
                submenuContainer.className = 'context-menu-submenu-container';

                const submenuTrigger = document.createElement('button');
                const label = i18n.t(item.labelKey);
                submenuTrigger.className = 'context-menu-item context-menu-submenu-trigger';
                submenuTrigger.setAttribute('role', 'menuitem');
                submenuTrigger.setAttribute('aria-haspopup', 'true');
                submenuTrigger.innerHTML = `
                    <span class="context-menu-icon">${item.icon || ''}</span>
                    <span class="context-menu-label">${label}</span>
                    <span class="context-menu-arrow">▶</span>
                `;

                const submenu = document.createElement('div');
                submenu.className = 'context-menu-submenu';
                submenu.setAttribute('role', 'menu');

                item.submenu.forEach((subItem) => {
                    if (subItem.separator) {
                        const sep = document.createElement('div');
                        sep.className = 'context-menu-separator';
                        sep.setAttribute('role', 'separator');
                        submenu.appendChild(sep);
                    } else {
                        const subMenuItem = document.createElement('button');
                        const subLabel = i18n.t(subItem.labelKey);
                        subMenuItem.className = 'context-menu-item';
                        subMenuItem.setAttribute('role', 'menuitem');
                        subMenuItem.setAttribute('data-action', subItem.action);
                        subMenuItem.innerHTML = `
                            <span class="context-menu-icon">${subItem.icon || ''}</span>
                            <span class="context-menu-label">${subLabel}</span>
                            <span class="context-menu-shortcut">${subItem.shortcut || ''}</span>
                        `;
                        subMenuItem.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.executeAction(subItem.action);
                        });
                        submenu.appendChild(subMenuItem);
                    }
                });

                // Add hover listener to position submenu correctly
                submenuContainer.addEventListener('mouseenter', () => {
                    this.positionSubmenu(submenuContainer, submenu);
                });

                submenuContainer.appendChild(submenuTrigger);
                submenuContainer.appendChild(submenu);
                this.menuElement.appendChild(submenuContainer);
            } else {
                const menuItem = document.createElement('button');
                const label = i18n.t(item.labelKey);

                menuItem.className = 'context-menu-item';
                menuItem.setAttribute('role', 'menuitem');
                menuItem.setAttribute('data-action', item.action);
                menuItem.innerHTML = `
                    <span class="context-menu-icon">${item.icon || ''}</span>
                    <span class="context-menu-label">${label}</span>
                    <span class="context-menu-shortcut">${item.shortcut || ''}</span>
                `;
                menuItem.addEventListener('click', () => this.executeAction(item.action));
                this.menuElement.appendChild(menuItem);
            }
        });
    }

    /**
     * Position submenu to avoid going off-screen
     * @param {HTMLElement} container - The submenu container
     * @param {HTMLElement} submenu - The submenu element
     */
    positionSubmenu(container, submenu) {
        const containerRect = container.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Temporarily show submenu to get its dimensions
        submenu.style.visibility = 'hidden';
        submenu.style.display = 'block';
        const submenuRect = submenu.getBoundingClientRect();
        submenu.style.display = '';
        submenu.style.visibility = '';

        // Check horizontal position - flip to left if needed
        if (containerRect.right + submenuRect.width > viewportWidth) {
            submenu.classList.add('flip-left');
        } else {
            submenu.classList.remove('flip-left');
        }

        // Check vertical position - adjust if submenu goes below viewport
        const submenuTop = containerRect.top;
        const submenuBottom = submenuTop + submenuRect.height;

        if (submenuBottom > viewportHeight) {
            const offset = submenuBottom - viewportHeight + 10;
            submenu.style.top = `-${offset}px`;
        } else {
            submenu.style.top = '0';
        }
    }

    /**
     * Rebuild menu when locale changes
     */
    rebuildMenu() {
        if (this.menuElement) {
            this.populateMenuItems();
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.editorContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.show(e.clientX, e.clientY);
        });

        document.addEventListener('click', this.boundHideMenu);
        document.addEventListener('keydown', this.boundHandleKeydown);
    }

    /**
     * Handle keyboard events when menu is visible
     */
    handleKeydown(e) {
        if (!this.isVisible) return;

        if (e.key === 'Escape') {
            this.hide();
        }
    }

    /**
     * Show the context menu at specified position
     */
    show(x, y) {
        const selection = this.editor.getSelection();
        const hasSelection = selection && !selection.isEmpty && selection.text && selection.text.length > 0;

        // Rebuild menu with AI options if text is selected
        this.populateMenuItems(hasSelection);
        this.updateMenuState();
        this.menuElement.style.display = 'block';

        // Position the menu
        const menuRect = this.menuElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Adjust position if menu would go off screen
        let finalX = x;
        let finalY = y;

        if (x + menuRect.width > viewportWidth) {
            finalX = viewportWidth - menuRect.width - 10;
        }

        if (y + menuRect.height > viewportHeight) {
            finalY = viewportHeight - menuRect.height - 10;
        }

        this.menuElement.style.left = `${finalX}px`;
        this.menuElement.style.top = `${finalY}px`;
        this.menuElement.setAttribute('aria-hidden', 'false');
        this.isVisible = true;
    }

    /**
     * Hide the context menu
     */
    hide() {
        if (this.menuElement) {
            this.menuElement.style.display = 'none';
            this.menuElement.setAttribute('aria-hidden', 'true');
            this.isVisible = false;
        }
    }

    /**
     * Update menu item states (enable/disable based on context)
     */
    updateMenuState() {
        const selection = this.editor.getSelection();
        const hasSelection = selection && !selection.isEmpty && selection.text && selection.text.length > 0;

        // Disable cut/copy if no selection
        const cutItem = this.menuElement.querySelector('[data-action="cut"]');
        const copyItem = this.menuElement.querySelector('[data-action="copy"]');

        if (cutItem) cutItem.disabled = !hasSelection;
        if (copyItem) copyItem.disabled = !hasSelection;
    }

    /**
     * Execute the selected action using action map
     */
    executeAction(action) {
        this.hide();

        const methodName = MENU_ACTIONS[action];

        if (methodName && typeof this[methodName] === 'function') {
            this[methodName]();
        }
    }

    /**
     * Execute cut operation
     */
    executeCut() {
        const selection = this.editor.getSelection();

        if (selection) {
            navigator.clipboard.writeText(selection)
                .then(() => {
                    this.editor.replaceSelection('');
                })
                .catch((err) => {
                    console.error('Failed to cut:', err);
                });
        }
    }

    /**
     * Execute copy operation
     */
    executeCopy() {
        const selection = this.editor.getSelection();

        if (selection) {
            navigator.clipboard.writeText(selection).catch((err) => {
                console.error('Failed to copy:', err);
            });
        }
    }

    /**
     * Execute paste operation
     */
    async executePaste() {
        try {
            const text = await navigator.clipboard.readText();

            this.editor.replaceSelection(text);
        } catch (err) {
            console.error('Failed to paste:', err);
        }
    }

    /**
     * Execute undo operation
     */
    executeUndo() {
        this.editor.undo();
    }

    /**
     * Execute redo operation
     */
    executeRedo() {
        this.editor.redo();
    }

    /**
     * Execute select all operation
     */
    executeSelectAll() {
        if (this.editor.view) {
            const docLength = this.editor.view.state.doc.length;

            this.editor.view.dispatch({
                selection: EditorSelection.single(0, docLength)
            });
        }
    }

    /**
     * Execute bold formatting
     */
    executeBold() {
        this.editor.applyBold();
    }

    /**
     * Execute italic formatting
     */
    executeItalic() {
        this.editor.applyItalic();
    }

    /**
     * Execute strikethrough formatting
     */
    executeStrikethrough() {
        this.editor.applyStrikethrough();
    }

    /**
     * Execute insert link
     */
    executeInsertLink() {
        this.editor.insertLink();
    }

    /**
     * Execute insert image
     */
    executeInsertImage() {
        this.editor.insertImage();
    }

    /**
     * Execute insert table
     */
    executeInsertTable() {
        this.editor.insertTable();
    }

    /**
     * Execute insert code block
     */
    executeInsertCodeBlock() {
        this.editor.applyCodeBlock();
    }

    /**
     * Get AIEditCommands instance from window
     */
    getAIEditCommands() {
        // AIEditCommands is typically stored on window or can be accessed via editor
        return window.aiEditCommands;
    }

    /**
     * Execute AI rewrite command
     */
    executeAIRewrite() {
        const aiEdit = this.getAIEditCommands();
        if (aiEdit) {
            aiEdit.handleCommand('rewrite');
        }
    }

    /**
     * Execute AI fix grammar command
     */
    executeAIFixGrammar() {
        const aiEdit = this.getAIEditCommands();
        if (aiEdit) {
            aiEdit.handleCommand('fix-grammar');
        }
    }

    /**
     * Execute AI summarize command
     */
    executeAISummarize() {
        const aiEdit = this.getAIEditCommands();
        if (aiEdit) {
            aiEdit.handleCommand('summarize');
        }
    }

    /**
     * Execute AI expand command
     */
    executeAIExpand() {
        const aiEdit = this.getAIEditCommands();
        if (aiEdit) {
            aiEdit.handleCommand('expand');
        }
    }

    /**
     * Execute AI make formal command
     */
    executeAIMakeFormal() {
        const aiEdit = this.getAIEditCommands();
        if (aiEdit) {
            aiEdit.handleCommand('formal');
        }
    }

    /**
     * Execute AI make casual command
     */
    executeAIMakeCasual() {
        const aiEdit = this.getAIEditCommands();
        if (aiEdit) {
            aiEdit.handleCommand('casual');
        }
    }

    /**
     * Execute AI translate command
     */
    executeAITranslate() {
        const aiEdit = this.getAIEditCommands();
        if (aiEdit) {
            aiEdit.handleCommand('translate');
        }
    }

    /**
     * Execute AI custom command
     */
    executeAICustom() {
        const aiEdit = this.getAIEditCommands();
        if (aiEdit) {
            aiEdit.handleCommand('custom');
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        document.removeEventListener('click', this.boundHideMenu);
        document.removeEventListener('keydown', this.boundHandleKeydown);

        if (this.removeLocaleListener) {
            this.removeLocaleListener();
        }

        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.removeChild(this.menuElement);
        }
    }
}

module.exports = { ContextMenu };
