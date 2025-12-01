/**
 * ThemeManager - Manages light and dark theme switching
 * Applies theme to both editor and preview components
 * Persists theme preference using ConfigStore
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'light' // Default theme
        this.initialized = false
    }

    /**
     * Initialize the theme manager
     * Loads saved theme preference from ConfigStore and applies it
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            return
        }

        try {
            // Load theme preference from ConfigStore
            const savedTheme = await window.electronAPI.getConfig('theme')

            // Use saved theme if available, otherwise default to 'light'
            if (savedTheme === 'light' || savedTheme === 'dark') {
                this.currentTheme = savedTheme
            }

            // Apply the theme
            this.applyTheme(this.currentTheme)
            this.initialized = true
        } catch (error) {
            console.error('Failed to initialize theme:', error)
            // Fall back to default light theme
            this.applyTheme('light')
            this.initialized = true
        }
    }

    /**
     * Set the theme to light or dark
     * @param {string} theme - 'light' or 'dark'
     */
    async setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.error(`Invalid theme: ${theme}. Must be 'light' or 'dark'`)
            return
        }

        this.currentTheme = theme
        this.applyTheme(theme)

        // Persist theme preference to ConfigStore
        try {
            await window.electronAPI.setConfig('theme', theme)
        } catch (error) {
            console.error('Failed to save theme preference:', error)
        }
    }

    /**
     * Get the current theme
     * @returns {string} Current theme ('light' or 'dark')
     */
    getCurrentTheme() {
        return this.currentTheme
    }

    /**
     * Toggle between light and dark themes
     */
    async toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
        await this.setTheme(newTheme)
    }

    /**
     * Apply theme by toggling CSS classes and stylesheet states
     * @private
     * @param {string} theme - 'light' or 'dark'
     */
    applyTheme(theme) {
        const body = document.body
        const lightStylesheet = document.getElementById('theme-light')
        const darkStylesheet = document.getElementById('theme-dark')

        if (theme === 'light') {
            // Apply light theme
            body.classList.remove('theme-dark')
            body.classList.add('theme-light')

            if (lightStylesheet) lightStylesheet.disabled = false
            if (darkStylesheet) darkStylesheet.disabled = true
        } else {
            // Apply dark theme
            body.classList.remove('theme-light')
            body.classList.add('theme-dark')

            if (lightStylesheet) lightStylesheet.disabled = true
            if (darkStylesheet) darkStylesheet.disabled = false
        }

        // Apply theme to editor and preview panes
        const editorPane = document.getElementById('editor-pane')
        const previewPane = document.getElementById('preview-pane')

        if (editorPane) {
            editorPane.classList.remove('theme-light', 'theme-dark')
            editorPane.classList.add(`theme-${theme}`)
        }

        if (previewPane) {
            previewPane.classList.remove('theme-light', 'theme-dark')
            previewPane.classList.add(`theme-${theme}`)
        }

        // Notify theme change callback if registered
        if (this.onThemeChangeCallback) {
            this.onThemeChangeCallback(theme);
        }
    }

    /**
     * Register a callback for theme changes
     * @param {Function} callback - Callback function(theme)
     */
    onThemeChange(callback) {
        this.onThemeChangeCallback = callback;
    }
}

module.exports = ThemeManager;


