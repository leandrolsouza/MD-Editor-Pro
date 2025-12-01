/**
 * KeyboardShortcutsIntegration - Integrates custom keyboard shortcuts with CodeMirror
 * Updates CodeMirror keymap dynamically when shortcuts change
 * Handles platform-specific modifiers (Ctrl vs Cmd)
 * Requirements: 5.6
 */

const { keymap } = require('@codemirror/view');

class KeyboardShortcutsIntegration {
    constructor(editor) {
        if (!editor) {
            throw new Error('Editor is required');
        }
        this.editor = editor;
        this.shortcuts = {};
        this.keymapCompartment = null;
        this.actionHandlers = new Map();
    }

    /**
     * Initialize keyboard shortcuts integration
     */
    async initialize() {
        // Load shortcuts from main process
        await this.loadShortcuts();

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
     * Apply shortcuts to CodeMirror editor
     */
    applyShortcuts() {
        if (!this.editor.view) {
            console.warn('Editor view not initialized');
            return;
        }

        // Build keymap from shortcuts
        const keymapBindings = this.buildKeymapBindings();

        // Create keymap extension
        const keymapExtension = keymap.of(keymapBindings);

        // If we already have a keymap compartment, reconfigure it
        // Otherwise, add it to the editor
        if (this.keymapCompartment) {
            this.editor.view.dispatch({
                effects: this.keymapCompartment.reconfigure(keymapExtension)
            });
        } else {
            // For initial setup, we need to add the keymap to the editor
            // This should be done during editor initialization
            console.warn('Keymap compartment not initialized. Shortcuts may not work until editor is reinitialized.');
        }
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

        // CodeMirror uses different separator
        result = result.replace(/-/g, '-');

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
     * Update shortcuts and reapply to editor
     */
    async updateShortcuts() {
        await this.loadShortcuts();
        this.applyShortcuts();
    }

    /**
     * Get the keymap extension for initial editor setup
     * This should be called during editor initialization
     */
    getKeymapExtension() {
        const { Compartment } = require('@codemirror/state');
        this.keymapCompartment = new Compartment();

        const keymapBindings = this.buildKeymapBindings();
        return this.keymapCompartment.of(keymap.of(keymapBindings));
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

        // Edit actions (undo/redo are handled by CodeMirror's default keymap)
        // We don't need to override them unless we want custom behavior
    }

    /**
     * Handle shortcut change event
     * @param {string} actionId - Action that changed (null for reset all)
     */
    async handleShortcutChange(actionId) {
        await this.updateShortcuts();
    }
}

module.exports = KeyboardShortcutsIntegration;
