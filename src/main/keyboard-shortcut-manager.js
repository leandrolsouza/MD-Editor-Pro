/**
 * KeyboardShortcutManager - Manages customizable keyboard shortcuts
 * Handles shortcut configuration, conflict detection, and persistence
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

class KeyboardShortcutManager {
    constructor(configStore) {
        if (!configStore) {
            throw new Error('ConfigStore is required');
        }
        this.configStore = configStore;

        // Define default keyboard shortcuts for all actions
        // Platform-specific modifiers handled by renderer
        this.defaultShortcuts = {
            // File operations
            'file:new': 'Mod-N',
            'file:open': 'Mod-O',
            'file:save': 'Mod-S',
            'file:save-as': 'Mod-Shift-S',
            'file:export-html': 'Mod-E',
            'file:export-pdf': 'Mod-Shift-E',

            // Edit operations
            'edit:undo': 'Mod-Z',
            'edit:redo': 'Mod-Shift-Z',
            'edit:cut': 'Mod-X',
            'edit:copy': 'Mod-C',
            'edit:paste': 'Mod-V',
            'edit:select-all': 'Mod-A',

            // Formatting operations
            'format:bold': 'Mod-B',
            'format:italic': 'Mod-I',
            'format:code': 'Mod-`',
            'format:heading': 'Mod-H',
            'format:list': 'Mod-L',

            // View operations
            'view:toggle-preview': 'Mod-P',
            'view:toggle-theme': 'Mod-T',
            'view:focus-mode': 'F11',
            'view:toggle-statistics': 'Mod-Shift-S',

            // Navigation operations
            'nav:next-tab': 'Ctrl-Tab',
            'nav:previous-tab': 'Ctrl-Shift-Tab',
            'nav:close-tab': 'Mod-W',

            // Search operations
            'search:find': 'Mod-F',
            'search:find-next': 'F3',
            'search:find-previous': 'Shift-F3',
            'search:replace': 'Mod-H'
        };

        // Action metadata for UI display
        this.actionMetadata = {
            'file:new': { name: 'New File', category: 'File' },
            'file:open': { name: 'Open File', category: 'File' },
            'file:save': { name: 'Save File', category: 'File' },
            'file:save-as': { name: 'Save File As', category: 'File' },
            'file:export-html': { name: 'Export to HTML', category: 'File' },
            'file:export-pdf': { name: 'Export to PDF', category: 'File' },

            'edit:undo': { name: 'Undo', category: 'Edit' },
            'edit:redo': { name: 'Redo', category: 'Edit' },
            'edit:cut': { name: 'Cut', category: 'Edit' },
            'edit:copy': { name: 'Copy', category: 'Edit' },
            'edit:paste': { name: 'Paste', category: 'Edit' },
            'edit:select-all': { name: 'Select All', category: 'Edit' },

            'format:bold': { name: 'Bold', category: 'Format' },
            'format:italic': { name: 'Italic', category: 'Format' },
            'format:code': { name: 'Code', category: 'Format' },
            'format:heading': { name: 'Heading', category: 'Format' },
            'format:list': { name: 'List', category: 'Format' },

            'view:toggle-preview': { name: 'Toggle Preview', category: 'View' },
            'view:toggle-theme': { name: 'Toggle Theme', category: 'View' },
            'view:focus-mode': { name: 'Focus Mode', category: 'View' },
            'view:toggle-statistics': { name: 'Toggle Statistics', category: 'View' },

            'nav:next-tab': { name: 'Next Tab', category: 'Navigation' },
            'nav:previous-tab': { name: 'Previous Tab', category: 'Navigation' },
            'nav:close-tab': { name: 'Close Tab', category: 'Navigation' },

            'search:find': { name: 'Find', category: 'Search' },
            'search:find-next': { name: 'Find Next', category: 'Search' },
            'search:find-previous': { name: 'Find Previous', category: 'Search' },
            'search:replace': { name: 'Replace', category: 'Search' }
        };
    }

    /**
     * Get keyboard shortcut for an action
     * Returns custom shortcut if set, otherwise returns default
     * @param {string} actionId - Action identifier
     * @returns {string|undefined} Key binding for the action
     */
    getShortcut(actionId) {
        // Check for custom shortcut first
        const customShortcut = this.configStore.getKeyboardShortcut(actionId);

        if (customShortcut) {
            return customShortcut;
        }

        // Fall back to default
        return this.defaultShortcuts[actionId];
    }

    /**
     * Set keyboard shortcut for an action
     * @param {string} actionId - Action identifier
     * @param {string} keyBinding - Key binding (e.g., 'Mod-S')
     * @throws {Error} If actionId is invalid or keyBinding is empty
     */
    setShortcut(actionId, keyBinding) {
        if (!Object.prototype.hasOwnProperty.call(this.defaultShortcuts, actionId)) {
            throw new Error(`Invalid action ID: ${actionId}`);
        }

        if (typeof keyBinding !== 'string' || keyBinding.trim() === '') {
            throw new Error(`Invalid key binding: ${keyBinding}. Must be a non-empty string`);
        }

        this.configStore.setKeyboardShortcut(actionId, keyBinding);
    }

    /**
     * Reset a keyboard shortcut to its default value
     * @param {string} actionId - Action identifier
     */
    resetShortcut(actionId) {
        if (!Object.prototype.hasOwnProperty.call(this.defaultShortcuts, actionId)) {
            throw new Error(`Invalid action ID: ${actionId}`);
        }

        this.configStore.deleteKeyboardShortcut(actionId);
    }

    /**
     * Reset all keyboard shortcuts to default values
     */
    resetAllShortcuts() {
        this.configStore.setAllKeyboardShortcuts({});
    }

    /**
     * Check if a key binding conflicts with existing shortcuts
     * @param {string} keyBinding - Key binding to check
     * @param {string} excludeActionId - Action ID to exclude from conflict check (for editing existing shortcut)
     * @returns {boolean} True if there's a conflict
     */
    hasConflict(keyBinding, excludeActionId = null) {
        const conflictingAction = this.getConflictingAction(keyBinding, excludeActionId);

        return conflictingAction !== null;
    }

    /**
     * Get the action that conflicts with a key binding
     * @param {string} keyBinding - Key binding to check
     * @param {string} excludeActionId - Action ID to exclude from conflict check
     * @returns {string|null} Conflicting action ID or null if no conflict
     */
    getConflictingAction(keyBinding, excludeActionId = null) {
        // Normalize key binding for comparison (case-insensitive)
        const normalizedBinding = keyBinding.toLowerCase().trim();

        // Check all actions
        for (const actionId of Object.keys(this.defaultShortcuts)) {
            if (actionId === excludeActionId) {
                continue;
            }

            const existingBinding = this.getShortcut(actionId);

            if (existingBinding && existingBinding.toLowerCase().trim() === normalizedBinding) {
                return actionId;
            }
        }

        return null;
    }

    /**
     * Get all available actions with their metadata
     * @returns {Array} Array of action objects with id, name, category, and current shortcut
     */
    getAvailableActions() {
        return Object.keys(this.defaultShortcuts).map(actionId => ({
            id: actionId,
            name: this.actionMetadata[actionId]?.name || actionId,
            category: this.actionMetadata[actionId]?.category || 'Other',
            shortcut: this.getShortcut(actionId),
            isDefault: !this.configStore.getKeyboardShortcut(actionId)
        }));
    }

    /**
     * Get all keyboard shortcuts (custom and default)
     * @returns {Object} Object mapping action IDs to key bindings
     */
    getAllShortcuts() {
        const shortcuts = {};

        for (const actionId of Object.keys(this.defaultShortcuts)) {
            shortcuts[actionId] = this.getShortcut(actionId);
        }

        return shortcuts;
    }

    /**
     * Save current shortcuts to persistent storage
     * (This is handled automatically by ConfigStore, but provided for consistency)
     */
    saveShortcuts() {
        // ConfigStore automatically persists changes
        // This method is a no-op but provided for API consistency
    }

    /**
     * Load shortcuts from persistent storage
     * (This is handled automatically by ConfigStore, but provided for consistency)
     * @returns {Object} Loaded shortcuts
     */
    loadShortcuts() {
        return this.configStore.getAllKeyboardShortcuts();
    }

    /**
     * Get default shortcut for an action
     * @param {string} actionId - Action identifier
     * @returns {string|undefined} Default key binding
     */
    getDefaultShortcut(actionId) {
        return this.defaultShortcuts[actionId];
    }

    /**
     * Check if an action has a custom shortcut
     * @param {string} actionId - Action identifier
     * @returns {boolean} True if action has custom shortcut
     */
    hasCustomShortcut(actionId) {
        return !!this.configStore.getKeyboardShortcut(actionId);
    }
}

module.exports = KeyboardShortcutManager;
