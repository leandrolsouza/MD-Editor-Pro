/**
 * ConfigStore - Settings Persistence Manager
 * Uses electron-store to persist user preferences across sessions
 * Requirements: 6.3, 6.4
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
                lineWrapping: true
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
        this.store.clear();
    }
}

module.exports = ConfigStore;
