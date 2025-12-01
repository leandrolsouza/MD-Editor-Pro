/**
 * ConfigStore - Settings Persistence Manager
 * Uses electron-store to persist user preferences across sessions
 * Requirements: 6.3, 6.4, 1.6, 1.7, 2.7, 5.5, 6.6, 7.6
 */

const Store = require('electron-store').default || require('electron-store');

/**
 * ConfigStore class manages application configuration
 * Provides methods for getting/setting theme and view mode preferences
 */
class ConfigStore {
    constructor() {
        // Initialize electron-store with default values
        // projectName is required when running outside of packaged Electron app
        this.store = new Store({
            name: 'config',
            projectName: 'md-editor-pro',
            defaults: {
                theme: 'light',
                viewMode: 'split',
                fontSize: 14,
                lineNumbers: true,
                lineWrapping: true,
                // Auto-save settings (Requirements: 1.6, 1.7)
                autoSave: {
                    enabled: true,
                    delay: 5  // seconds (1-60)
                },
                // Statistics settings (Requirement: 2.7)
                statistics: {
                    visible: true,
                    wordsPerMinute: 200  // for reading time calculation
                },
                // Focus mode settings
                focusMode: {
                    lastUsed: false  // restore focus mode on startup
                },
                // Keyboard shortcuts (Requirement: 5.5)
                keyboardShortcuts: {},
                // Custom templates (Requirement: 6.6)
                customTemplates: [],
                // Custom snippets (Requirement: 7.6)
                customSnippets: [],
                // Tab management
                tabs: {
                    lastOpenTabs: [],
                    activeTabId: null
                }
            }
        });
    }

    /**
     * Get a configuration value by key
     * @param {string} key - Configuration key
     * @returns {any} Configuration value
     */
    get(key) {
        return this.store.get(key);
    }

    /**
     * Set a configuration value
     * @param {string} key - Configuration key
     * @param {any} value - Configuration value
     */
    set(key, value) {
        this.store.set(key, value);
    }

    /**
     * Get the current theme preference
     * @returns {'light' | 'dark'} Current theme
     */
    getTheme() {
        return this.store.get('theme');
    }

    /**
     * Set the theme preference
     * @param {'light' | 'dark'} theme - Theme to set
     */
    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            throw new Error(`Invalid theme: ${theme}. Must be 'light' or 'dark'`);
        }
        this.store.set('theme', theme);
    }

    /**
     * Get the current view mode preference
     * @returns {'editor' | 'preview' | 'split'} Current view mode
     */
    getViewMode() {
        return this.store.get('viewMode');
    }

    /**
     * Set the view mode preference
     * @param {'editor' | 'preview' | 'split'} mode - View mode to set
     */
    setViewMode(mode) {
        if (mode !== 'editor' && mode !== 'preview' && mode !== 'split') {
            throw new Error(`Invalid view mode: ${mode}. Must be 'editor', 'preview', or 'split'`);
        }
        this.store.set('viewMode', mode);
    }

    /**
     * Reset all configuration to defaults
     */
    reset() {
        // Manually set all default values
        this.store.set('theme', 'light');
        this.store.set('viewMode', 'split');
        this.store.set('fontSize', 14);
        this.store.set('lineNumbers', true);
        this.store.set('lineWrapping', true);
        this.store.set('autoSave', {
            enabled: true,
            delay: 5
        });
        this.store.set('statistics', {
            visible: true,
            wordsPerMinute: 200
        });
        this.store.set('focusMode', {
            lastUsed: false
        });
        this.store.set('keyboardShortcuts', {});
        this.store.set('customTemplates', []);
        this.store.set('customSnippets', []);
        this.store.set('tabs', {
            lastOpenTabs: [],
            activeTabId: null
        });
    }

    // ========== Auto-Save Methods (Requirements: 1.6, 1.7) ==========

    /**
     * Get auto-save enabled status
     * @returns {boolean} Whether auto-save is enabled
     */
    getAutoSaveEnabled() {
        return this.store.get('autoSave.enabled');
    }

    /**
     * Set auto-save enabled status
     * @param {boolean} enabled - Whether to enable auto-save
     */
    setAutoSaveEnabled(enabled) {
        if (typeof enabled !== 'boolean') {
            throw new Error(`Invalid auto-save enabled value: ${enabled}. Must be a boolean`);
        }
        this.store.set('autoSave.enabled', enabled);
    }

    /**
     * Get auto-save delay in seconds
     * @returns {number} Auto-save delay (1-60 seconds)
     */
    getAutoSaveDelay() {
        return this.store.get('autoSave.delay');
    }

    /**
     * Set auto-save delay in seconds
     * @param {number} delay - Delay in seconds (must be between 1 and 60)
     */
    setAutoSaveDelay(delay) {
        if (typeof delay !== 'number' || !Number.isInteger(delay)) {
            throw new Error(`Invalid auto-save delay: ${delay}. Must be an integer`);
        }
        if (delay < 1 || delay > 60) {
            throw new Error(`Invalid auto-save delay: ${delay}. Must be between 1 and 60 seconds`);
        }
        this.store.set('autoSave.delay', delay);
    }

    /**
     * Get complete auto-save configuration
     * @returns {{enabled: boolean, delay: number}} Auto-save configuration
     */
    getAutoSaveConfig() {
        return this.store.get('autoSave');
    }

    /**
     * Set complete auto-save configuration
     * @param {{enabled: boolean, delay: number}} config - Auto-save configuration
     */
    setAutoSaveConfig(config) {
        if (config.enabled !== undefined) {
            this.setAutoSaveEnabled(config.enabled);
        }
        if (config.delay !== undefined) {
            this.setAutoSaveDelay(config.delay);
        }
    }

    // ========== Statistics Methods (Requirement: 2.7) ==========

    /**
     * Get statistics panel visibility
     * @returns {boolean} Whether statistics panel is visible
     */
    getStatisticsVisible() {
        return this.store.get('statistics.visible');
    }

    /**
     * Set statistics panel visibility
     * @param {boolean} visible - Whether to show statistics panel
     */
    setStatisticsVisible(visible) {
        if (typeof visible !== 'boolean') {
            throw new Error(`Invalid statistics visible value: ${visible}. Must be a boolean`);
        }
        this.store.set('statistics.visible', visible);
    }

    /**
     * Get words per minute for reading time calculation
     * @returns {number} Words per minute
     */
    getWordsPerMinute() {
        return this.store.get('statistics.wordsPerMinute');
    }

    /**
     * Set words per minute for reading time calculation
     * @param {number} wpm - Words per minute (must be positive)
     */
    setWordsPerMinute(wpm) {
        if (typeof wpm !== 'number' || wpm <= 0) {
            throw new Error(`Invalid words per minute: ${wpm}. Must be a positive number`);
        }
        this.store.set('statistics.wordsPerMinute', wpm);
    }

    /**
     * Get complete statistics configuration
     * @returns {{visible: boolean, wordsPerMinute: number}} Statistics configuration
     */
    getStatisticsConfig() {
        return this.store.get('statistics');
    }

    // ========== Focus Mode Methods ==========

    /**
     * Get focus mode last used status
     * @returns {boolean} Whether focus mode was last used
     */
    getFocusModeLastUsed() {
        return this.store.get('focusMode.lastUsed');
    }

    /**
     * Set focus mode last used status
     * @param {boolean} lastUsed - Whether focus mode was last used
     */
    setFocusModeLastUsed(lastUsed) {
        if (typeof lastUsed !== 'boolean') {
            throw new Error(`Invalid focus mode last used value: ${lastUsed}. Must be a boolean`);
        }
        this.store.set('focusMode.lastUsed', lastUsed);
    }

    // ========== Keyboard Shortcuts Methods (Requirement: 5.5) ==========

    /**
     * Get keyboard shortcut for an action
     * @param {string} actionId - Action identifier
     * @returns {string|undefined} Key binding for the action
     */
    getKeyboardShortcut(actionId) {
        return this.store.get(`keyboardShortcuts.${actionId}`);
    }

    /**
     * Set keyboard shortcut for an action
     * @param {string} actionId - Action identifier
     * @param {string} keyBinding - Key binding (e.g., 'Ctrl-S')
     */
    setKeyboardShortcut(actionId, keyBinding) {
        if (typeof actionId !== 'string' || actionId.trim() === '') {
            throw new Error(`Invalid action ID: ${actionId}. Must be a non-empty string`);
        }
        if (typeof keyBinding !== 'string' || keyBinding.trim() === '') {
            throw new Error(`Invalid key binding: ${keyBinding}. Must be a non-empty string`);
        }
        this.store.set(`keyboardShortcuts.${actionId}`, keyBinding);
    }

    /**
     * Get all keyboard shortcuts
     * @returns {Object} All keyboard shortcuts
     */
    getAllKeyboardShortcuts() {
        return this.store.get('keyboardShortcuts');
    }

    /**
     * Set all keyboard shortcuts
     * @param {Object} shortcuts - Keyboard shortcuts object
     */
    setAllKeyboardShortcuts(shortcuts) {
        if (typeof shortcuts !== 'object' || shortcuts === null) {
            throw new Error(`Invalid shortcuts: ${shortcuts}. Must be an object`);
        }
        this.store.set('keyboardShortcuts', shortcuts);
    }

    /**
     * Delete a keyboard shortcut
     * @param {string} actionId - Action identifier
     */
    deleteKeyboardShortcut(actionId) {
        this.store.delete(`keyboardShortcuts.${actionId}`);
    }

    // ========== Custom Templates Methods (Requirement: 6.6) ==========

    /**
     * Get all custom templates
     * @returns {Array} Array of custom templates
     */
    getCustomTemplates() {
        return this.store.get('customTemplates');
    }

    /**
     * Add a custom template
     * @param {Object} template - Template object with id, name, category, content, createdAt
     */
    addCustomTemplate(template) {
        if (!template || typeof template !== 'object') {
            throw new Error('Invalid template: Must be an object');
        }
        if (!template.id || typeof template.id !== 'string') {
            throw new Error('Invalid template: Must have a string id');
        }
        if (!template.name || typeof template.name !== 'string') {
            throw new Error('Invalid template: Must have a string name');
        }
        if (!template.content || typeof template.content !== 'string') {
            throw new Error('Invalid template: Must have string content');
        }

        const templates = this.getCustomTemplates();

        // Check for duplicate ID
        if (templates.some(t => t.id === template.id)) {
            throw new Error(`Template with id ${template.id} already exists`);
        }
        templates.push(template);
        this.store.set('customTemplates', templates);
    }

    /**
     * Update a custom template
     * @param {string} templateId - Template ID
     * @param {Object} updates - Template updates
     */
    updateCustomTemplate(templateId, updates) {
        const templates = this.getCustomTemplates();
        const index = templates.findIndex(t => t.id === templateId);

        if (index === -1) {
            throw new Error(`Template with id ${templateId} not found`);
        }
        templates[index] = { ...templates[index], ...updates };
        this.store.set('customTemplates', templates);
    }

    /**
     * Delete a custom template
     * @param {string} templateId - Template ID
     */
    deleteCustomTemplate(templateId) {
        const templates = this.getCustomTemplates();
        const filtered = templates.filter(t => t.id !== templateId);

        if (filtered.length === templates.length) {
            throw new Error(`Template with id ${templateId} not found`);
        }
        this.store.set('customTemplates', filtered);
    }

    /**
     * Get a custom template by ID
     * @param {string} templateId - Template ID
     * @returns {Object|undefined} Template object or undefined
     */
    getCustomTemplate(templateId) {
        const templates = this.getCustomTemplates();

        return templates.find(t => t.id === templateId);
    }

    // ========== Custom Snippets Methods (Requirement: 7.6) ==========

    /**
     * Get all custom snippets
     * @returns {Array} Array of custom snippets
     */
    getCustomSnippets() {
        return this.store.get('customSnippets');
    }

    /**
     * Add a custom snippet
     * @param {Object} snippet - Snippet object with trigger, content, description, createdAt
     */
    addCustomSnippet(snippet) {
        if (!snippet || typeof snippet !== 'object') {
            throw new Error('Invalid snippet: Must be an object');
        }
        if (!snippet.trigger || typeof snippet.trigger !== 'string') {
            throw new Error('Invalid snippet: Must have a string trigger');
        }
        if (!snippet.content || typeof snippet.content !== 'string') {
            throw new Error('Invalid snippet: Must have string content');
        }

        const snippets = this.getCustomSnippets();

        // Check for duplicate trigger
        if (snippets.some(s => s.trigger === snippet.trigger)) {
            throw new Error(`Snippet with trigger ${snippet.trigger} already exists`);
        }
        snippets.push(snippet);
        this.store.set('customSnippets', snippets);
    }

    /**
     * Update a custom snippet
     * @param {string} trigger - Snippet trigger
     * @param {Object} updates - Snippet updates
     */
    updateCustomSnippet(trigger, updates) {
        const snippets = this.getCustomSnippets();
        const index = snippets.findIndex(s => s.trigger === trigger);

        if (index === -1) {
            throw new Error(`Snippet with trigger ${trigger} not found`);
        }
        snippets[index] = { ...snippets[index], ...updates };
        this.store.set('customSnippets', snippets);
    }

    /**
     * Delete a custom snippet
     * @param {string} trigger - Snippet trigger
     */
    deleteCustomSnippet(trigger) {
        const snippets = this.getCustomSnippets();
        const filtered = snippets.filter(s => s.trigger !== trigger);

        if (filtered.length === snippets.length) {
            throw new Error(`Snippet with trigger ${trigger} not found`);
        }
        this.store.set('customSnippets', filtered);
    }

    /**
     * Get a custom snippet by trigger
     * @param {string} trigger - Snippet trigger
     * @returns {Object|undefined} Snippet object or undefined
     */
    getCustomSnippet(trigger) {
        const snippets = this.getCustomSnippets();

        return snippets.find(s => s.trigger === trigger);
    }

    // ========== Tab Management Methods ==========

    /**
     * Get last open tabs
     * @returns {Array} Array of tab IDs
     */
    getLastOpenTabs() {
        return this.store.get('tabs.lastOpenTabs');
    }

    /**
     * Set last open tabs
     * @param {Array} tabIds - Array of tab IDs
     */
    setLastOpenTabs(tabIds) {
        if (!Array.isArray(tabIds)) {
            throw new Error(`Invalid tab IDs: ${tabIds}. Must be an array`);
        }
        this.store.set('tabs.lastOpenTabs', tabIds);
    }

    /**
     * Get active tab ID
     * @returns {string|null} Active tab ID
     */
    getActiveTabId() {
        return this.store.get('tabs.activeTabId');
    }

    /**
     * Set active tab ID
     * @param {string|null} tabId - Active tab ID
     */
    setActiveTabId(tabId) {
        if (tabId !== null && typeof tabId !== 'string') {
            throw new Error(`Invalid tab ID: ${tabId}. Must be a string or null`);
        }
        this.store.set('tabs.activeTabId', tabId);
    }
}

module.exports = ConfigStore;
