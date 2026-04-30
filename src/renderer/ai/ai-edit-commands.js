/**
 * AI Edit Commands
 * Provides AI-powered text transformation commands for selected text
 */

const i18n = require('../i18n/index.js');

class AIEditCommands {
    constructor(editor) {
        this.editor = editor;
        this.menu = null;
        this.isProcessing = false;
        this.boundHandleKeydown = this.handleKeydown.bind(this);
        this.boundHandleClickOutside = this.handleClickOutside.bind(this);
    }

    /**
     * Initialize the AI edit commands
     */
    initialize() {
        this.createMenu();
        document.addEventListener('keydown', this.boundHandleKeydown);
        console.log('[AI Edit] Initialized - use Ctrl+Shift+A to open menu');
    }

    /**
     * Create the floating command menu
     */
    createMenu() {
        this.menu = document.createElement('div');
        this.menu.className = 'ai-edit-menu';
        this.menu.innerHTML = `
            <div class="ai-edit-menu-header">
                <span class="ai-edit-menu-icon">✨</span>
                <span>${i18n.t('aiEdit.title')}</span>
            </div>
            <div class="ai-edit-menu-items">
                <button class="ai-edit-item" data-command="rewrite">
                    <span class="ai-edit-item-icon">✏️</span>
                    <span>${i18n.t('aiEdit.rewrite')}</span>
                    <span class="ai-edit-item-hint">${i18n.t('aiEdit.rewriteHint')}</span>
                </button>
                <button class="ai-edit-item" data-command="fix-grammar">
                    <span class="ai-edit-item-icon">📝</span>
                    <span>${i18n.t('aiEdit.fixGrammar')}</span>
                    <span class="ai-edit-item-hint">${i18n.t('aiEdit.fixGrammarHint')}</span>
                </button>
                <button class="ai-edit-item" data-command="summarize">
                    <span class="ai-edit-item-icon">📋</span>
                    <span>${i18n.t('aiEdit.summarize')}</span>
                    <span class="ai-edit-item-hint">${i18n.t('aiEdit.summarizeHint')}</span>
                </button>
                <button class="ai-edit-item" data-command="expand">
                    <span class="ai-edit-item-icon">📖</span>
                    <span>${i18n.t('aiEdit.expand')}</span>
                    <span class="ai-edit-item-hint">${i18n.t('aiEdit.expandHint')}</span>
                </button>
                <button class="ai-edit-item" data-command="formal">
                    <span class="ai-edit-item-icon">👔</span>
                    <span>${i18n.t('aiEdit.makeFormal')}</span>
                    <span class="ai-edit-item-hint">${i18n.t('aiEdit.makeFormalHint')}</span>
                </button>
                <button class="ai-edit-item" data-command="casual">
                    <span class="ai-edit-item-icon">😊</span>
                    <span>${i18n.t('aiEdit.makeCasual')}</span>
                    <span class="ai-edit-item-hint">${i18n.t('aiEdit.makeCasualHint')}</span>
                </button>
                <div class="ai-edit-separator"></div>
                <button class="ai-edit-item" data-command="translate">
                    <span class="ai-edit-item-icon">🌐</span>
                    <span>${i18n.t('aiEdit.translate')}</span>
                    <span class="ai-edit-item-hint">${i18n.t('aiEdit.translateHint')}</span>
                </button>
                <button class="ai-edit-item" data-command="custom">
                    <span class="ai-edit-item-icon">💬</span>
                    <span>${i18n.t('aiEdit.custom')}</span>
                    <span class="ai-edit-item-hint">${i18n.t('aiEdit.customHint')}</span>
                </button>
            </div>
            <div class="ai-edit-loading" style="display: none;">
                <div class="ai-edit-spinner"></div>
                <span>${i18n.t('aiEdit.processing')}</span>
            </div>
        `;
        this.menu.style.display = 'none';
        document.body.appendChild(this.menu);

        // Add click handlers
        this.menu.querySelectorAll('.ai-edit-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleCommand(e.currentTarget.dataset.command));
        });
    }


    /**
     * Handle keyboard shortcut (Ctrl+Shift+A)
     */
    handleKeydown(e) {
        console.log('[AI Edit] Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Shift:', e.shiftKey);

        if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            console.log('[AI Edit] Shortcut matched!');
            e.preventDefault();
            e.stopPropagation();
            this.showMenu();
        } else if (e.key === 'Escape' && this.menu.style.display !== 'none') {
            this.hideMenu();
        }
    }

    /**
     * Handle click outside menu
     */
    handleClickOutside(e) {
        if (this.menu && !this.menu.contains(e.target)) {
            this.hideMenu();
        }
    }

    /**
     * Show the command menu at cursor position
     */
    showMenu() {
        const selection = this.editor.getSelection();

        if (!selection || !selection.text || selection.text.trim() === '') {
            this.showNotification('Please select some text first', 'warning');
            return;
        }

        // Get cursor position in the editor
        const editorElement = document.querySelector('.cm-editor');

        if (!editorElement) return;

        const rect = editorElement.getBoundingClientRect();
        const cursorCoords = this.getCursorCoords();

        // Position menu near cursor
        let left = cursorCoords.left;
        let top = cursorCoords.top + 20;

        // Ensure menu stays within viewport
        const menuWidth = 220;
        const menuHeight = 380;

        if (left + menuWidth > window.innerWidth) {
            left = window.innerWidth - menuWidth - 10;
        }

        if (top + menuHeight > window.innerHeight) {
            top = cursorCoords.top - menuHeight - 10;
        }

        this.menu.style.left = `${Math.max(10, left)}px`;
        this.menu.style.top = `${Math.max(10, top)}px`;
        this.menu.style.display = 'block';

        // Add click outside listener
        setTimeout(() => {
            document.addEventListener('click', this.boundHandleClickOutside);
        }, 0);

        // Focus first item
        const firstItem = this.menu.querySelector('.ai-edit-item');

        if (firstItem) firstItem.focus();
    }

    /**
     * Get cursor coordinates
     */
    getCursorCoords() {
        const cmEditor = document.querySelector('.cm-editor');

        if (!cmEditor) return { left: 100, top: 100 };

        const cursor = cmEditor.querySelector('.cm-cursor-primary') || cmEditor.querySelector('.cm-cursor');

        if (cursor) {
            const rect = cursor.getBoundingClientRect();

            return { left: rect.left, top: rect.bottom };
        }

        // Fallback to selection
        const sel = window.getSelection();

        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            return { left: rect.left, top: rect.bottom };
        }

        return { left: 100, top: 100 };
    }

    /**
     * Hide the command menu
     */
    hideMenu() {
        this.menu.style.display = 'none';
        document.removeEventListener('click', this.boundHandleClickOutside);
    }

    /**
     * Handle command selection
     */
    async handleCommand(command) {
        if (this.isProcessing) return;

        const selection = this.editor.getSelection();

        if (!selection || !selection.text) {
            this.hideMenu();
            return;
        }

        let customPrompt = '';
        let targetLanguage = 'English';

        // Handle special commands that need input
        if (command === 'translate') {
            this.hideMenu();
            targetLanguage = await this.promptForLanguage();

            if (!targetLanguage) {
                return;
            }
        } else if (command === 'custom') {
            this.hideMenu();
            customPrompt = await this.promptForCustomInstruction();

            if (!customPrompt) {
                return;
            }
        } else {
            this.hideMenu();
        }

        // Show global loading overlay
        this.showLoadingOverlay();

        try {
            const result = await window.electronAPI.aiTransformText(
                selection.text,
                command,
                customPrompt,
                targetLanguage
            );

            if (result.success) {
                this.editor.replaceSelection(result.result);
                this.showNotification(i18n.t('aiEdit.textTransformed'), 'success');
            } else {
                this.showNotification(result.error || i18n.t('aiEdit.failedToTransform'), 'error');
            }
        } catch (error) {
            console.error('AI transform error:', error);
            this.showNotification(i18n.t('aiEdit.failedToTransform'), 'error');
        } finally {
            this.hideLoadingOverlay();
            this.isProcessing = false;
        }
    }

    /**
     * Show loading overlay
     */
    showLoadingOverlay() {
        this.isProcessing = true;

        if (!this.loadingOverlay) {
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.className = 'ai-edit-loading-overlay';
            this.loadingOverlay.innerHTML = `
                <div class="ai-edit-loading-content">
                    <div class="ai-edit-spinner"></div>
                    <span>✨ AI is processing...</span>
                </div>
            `;
            document.body.appendChild(this.loadingOverlay);
        }

        this.loadingOverlay.style.display = 'flex';
    }

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
    }


    /**
     * Prompt for target language
     */
    promptForLanguage() {
        return new Promise((resolve) => {
            const languages = ['English', 'Portuguese', 'Spanish', 'French', 'German', 'Italian', 'Chinese', 'Japanese', 'Korean'];
            const dialog = document.createElement('div');

            dialog.className = 'ai-edit-dialog';
            dialog.innerHTML = `
                <div class="ai-edit-dialog-content">
                    <h3>${i18n.t('aiEdit.translateTo')}</h3>
                    <select class="ai-edit-language-select">
                        ${languages.map(lang => `<option value="${lang}">${lang}</option>`).join('')}
                    </select>
                    <div class="ai-edit-dialog-buttons">
                        <button class="ai-edit-dialog-cancel">${i18n.t('aiEdit.cancel')}</button>
                        <button class="ai-edit-dialog-confirm">${i18n.t('aiEdit.translate')}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(dialog);

            const select = dialog.querySelector('select');
            const cancelBtn = dialog.querySelector('.ai-edit-dialog-cancel');
            const confirmBtn = dialog.querySelector('.ai-edit-dialog-confirm');

            const cleanup = (result) => {
                dialog.remove();
                resolve(result);
            };

            cancelBtn.addEventListener('click', () => cleanup(null));
            confirmBtn.addEventListener('click', () => cleanup(select.value));
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) cleanup(null);
            });

            select.focus();
        });
    }

    /**
     * Prompt for custom instruction
     */
    promptForCustomInstruction() {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');

            dialog.className = 'ai-edit-dialog';
            dialog.innerHTML = `
                <div class="ai-edit-dialog-content">
                    <h3>${i18n.t('aiEdit.customInstruction')}</h3>
                    <textarea class="ai-edit-custom-input" placeholder="${i18n.t('aiEdit.customPlaceholder')}"></textarea>
                    <div class="ai-edit-dialog-buttons">
                        <button class="ai-edit-dialog-cancel">${i18n.t('aiEdit.cancel')}</button>
                        <button class="ai-edit-dialog-confirm">${i18n.t('aiEdit.apply')}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(dialog);

            const textarea = dialog.querySelector('textarea');
            const cancelBtn = dialog.querySelector('.ai-edit-dialog-cancel');
            const confirmBtn = dialog.querySelector('.ai-edit-dialog-confirm');

            const cleanup = (result) => {
                dialog.remove();
                resolve(result);
            };

            cancelBtn.addEventListener('click', () => cleanup(null));
            confirmBtn.addEventListener('click', () => cleanup(textarea.value.trim() || null));
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    cleanup(textarea.value.trim() || null);
                }
            });
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) cleanup(null);
            });

            textarea.focus();
        });
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isProcessing = loading;
        const items = this.menu.querySelector('.ai-edit-menu-items');
        const loadingEl = this.menu.querySelector('.ai-edit-loading');

        items.style.display = loading ? 'none' : 'block';
        loadingEl.style.display = loading ? 'flex' : 'none';
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');

        notification.className = `ai-edit-notification ai-edit-notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('ai-edit-notification-fade');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Cleanup
     */
    destroy() {
        document.removeEventListener('keydown', this.boundHandleKeydown);
        document.removeEventListener('click', this.boundHandleClickOutside);

        if (this.menu) {
            this.menu.remove();
        }

        if (this.loadingOverlay) {
            this.loadingOverlay.remove();
        }
    }
}

module.exports = AIEditCommands;
