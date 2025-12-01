/**
 * KeyboardShortcutsManager (Renderer) - Manages keyboard shortcuts in renderer process
 * Coordinates between shortcuts UI, editor integration, and main process
 * Requirements: 5.6
 */

class KeyboardShortcutsManager {
    constructor(editor) {
        if (!editor) {
            throw new Error('Editor is required');
        }
        this.editor = editor;
        this.shortcuts = {};
        this.actionHandlers = new Map();
    }

    /**
     * Initialize keyboard shortcuts
     */
    async initialize() {
        // Load shortcuts from main process
        await this.loadShortcuts();

        // Register default action handlers
        this.registerDefaultActions();

        // Apply shortcuts to editor
        this.applyShortcuts();
    }

    /**
     * Load shortcuts from main process
     */
    async loadShortcuts() {
        try {
            const result = await window.electronAPI.getAllShortcuts();
            if (result.success) {
                this.shortcuts = result.shortcuts;
            }
        } catch (error) {
            console.error('Error loading shortcuts:', error);
        }
    }

    /**
     * Apply shortcuts to editor
     */
    applyShortcuts() {
        if (!this.editor.view) {
            console.warn('Editor view not initialized');
            return;
        }

        // Build keymap from shortcuts
        const keymapBindings = this.buildKeymapBindings();

        // Update editor keymap
        this.editor.updateKeymap(keymapBindings);
    }

    /**
     * Build CodeMirror keymap bindings from shortcuts
     */
    buildKeymapBindings() {
        const bindings = [];

        for (const [actionId, keyBinding] of Object.entries(this.shortcuts)) {
            const handler = this.actionHandlers.get(actionId);
            if (handler) {
                const codemirrorKey = this.convertToCodeMirrorKey(keyBinding);
                bindings.push({
                    key: codemirrorKey,
                    run: handler,
                    preventDefault: true
                });
            }
        }

        return bindings;
    }

    /**
     * Convert key binding to CodeMirror format
     * Handles platform-specific modifiers
     */
    convertToCodeMirrorKey(keyBinding) {
        if (!keyBinding) return '';

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

        // Replace Mod with platform-specific modifier
        let result = keyBinding.replace(/Mod/g, isMac ? 'Cmd' : 'Ctrl');

        return result;
    }

    /**
     * Register an action handler
     * @param {string} actionId - Action identifier
     * @param {Function} handler - Handler function that returns boolean
     */
    registerAction(actionId, handler) {
        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function');
        }
        this.actionHandlers.set(actionId, handler);
    }

    /**
     * Unregister an action handler
     * @param {string} actionId - Action identifier
     */
    unregisterAction(actionId) {
        this.actionHandlers.delete(actionId);
    }

    /**
     * Register default action handlers for common editor operations
     */
    registerDefaultActions() {
        // Format actions
        this.registerAction('format:bold', (view) => {
            if (this.editor.applyFormatting) {
                this.editor.applyFormatting('bold');
                return true;
            }
            return false;
        });

        this.registerAction('format:italic', (view) => {
            if (this.editor.applyFormatting) {
                this.editor.applyFormatting('italic');
                return true;
            }
            return false;
        });

        this.registerAction('format:code', (view) => {
            if (this.editor.applyFormatting) {
                this.editor.applyFormatting('code');
                return true;
            }
            return false;
        });

        // Note: File operations, view operations, and navigation operations
        // are typically handled at the application level, not in the editor
        // These would be registered by the main application code
    }

    /**
     * Update shortcuts and reapply to editor
     */
    async updateShortcuts() {
        await this.loadShortcuts();
        this.applyShortcuts();
    }

    /**
     * Handle shortcut change event
     * @param {string} actionId - Action that changed (null for reset all)
     */
    async handleShortcutChange(actionId) {
        await this.updateShortcuts();
    }

    /**
     * Get shortcut for an action
     * @param {string} actionId - Action identifier
     * @returns {string|undefined} Key binding
     */
    getShortcut(actionId) {
        return this.shortcuts[actionId];
    }

    /**
     * Get all shortcuts
     * @returns {Object} All shortcuts
     */
    getAllShortcuts() {
        return { ...this.shortcuts };
    }
}

module.exports = KeyboardShortcutsManager;
