/**
 * ThemeManager - Manages theme switching across multiple themes
 * Applies theme to both editor and preview components
 * Persists theme preference using ConfigStore
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'light'; // Default theme
        this.initialized = false;

        // Available themes with metadata
        this.availableThemes = [
            { id: 'light', name: 'Light', category: 'default', description: 'Clean light theme' },
            { id: 'dark', name: 'Dark', category: 'default', description: 'Modern dark theme' },
            { id: 'solarized-light', name: 'Solarized Light', category: 'popular', description: 'Precision colors for machines and people' },
            { id: 'solarized-dark', name: 'Solarized Dark', category: 'popular', description: 'Dark variant of Solarized' },
            { id: 'dracula', name: 'Dracula', category: 'popular', description: 'Modern dark theme with vibrant colors' },
            { id: 'monokai', name: 'Monokai', category: 'popular', description: 'Classic dark theme' },
            { id: 'nord', name: 'Nord', category: 'popular', description: 'Arctic, north-bluish color palette' }
        ];
    }

    /**
     * Initialize the theme manager
     * Loads saved theme preference from ConfigStore and applies it
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            // Load theme preference from ConfigStore
            const result = await window.electronAPI.getConfig('theme');
            const savedTheme = result?.value;

            // Use saved theme if available and valid
            if (savedTheme && this.isValidTheme(savedTheme)) {
                this.currentTheme = savedTheme;
            }

            // Apply the theme
            this.applyTheme(this.currentTheme);
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize theme:', error);
            // Fall back to default light theme
            this.applyTheme('light');
            this.initialized = true;
        }
    }

    /**
     * Check if a theme ID is valid
     * @param {string} themeId - Theme ID to validate
     * @returns {boolean} True if theme is valid
     */
    isValidTheme(themeId) {
        return this.availableThemes.some(theme => theme.id === themeId);
    }

    /**
     * Get list of available themes
     * @returns {Array} Array of theme objects
     */
    getAvailableThemes() {
        return this.availableThemes;
    }

    /**
     * Get themes by category
     * @param {string} category - Category to filter by
     * @returns {Array} Array of theme objects
     */
    getThemesByCategory(category) {
        return this.availableThemes.filter(theme => theme.category === category);
    }

    /**
     * Set the theme
     * @param {string} theme - Theme ID (e.g., 'light', 'dark', 'dracula', etc.)
     */
    async setTheme(theme) {
        if (!this.isValidTheme(theme)) {
            console.error(`Invalid theme: ${theme}`);
            return;
        }

        this.currentTheme = theme;
        this.applyTheme(theme);

        // Persist theme preference to ConfigStore
        try {
            await window.electronAPI.setConfig('theme', theme);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    }

    /**
     * Get the current theme
     * @returns {string} Current theme ('light' or 'dark')
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Toggle between light and dark themes (legacy support)
     */
    async toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        await this.setTheme(newTheme);
    }

    /**
     * Cycle to next theme in the list
     */
    async cycleTheme() {
        const currentIndex = this.availableThemes.findIndex(t => t.id === this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.availableThemes.length;
        const nextTheme = this.availableThemes[nextIndex].id;
        await this.setTheme(nextTheme);
    }

    /**
     * Apply theme by toggling CSS classes and stylesheet states
     * @private
     * @param {string} theme - Theme ID
     */
    applyTheme(theme) {
        const body = document.body;

        // Remove all theme classes
        this.availableThemes.forEach(t => {
            body.classList.remove(`theme-${t.id}`);
        });

        // Add current theme class
        body.classList.add(`theme-${theme}`);

        // Enable only the current theme stylesheet
        this.availableThemes.forEach(t => {
            const stylesheet = document.getElementById(`theme-${t.id}`);
            if (stylesheet) {
                stylesheet.disabled = (t.id !== theme);
            }
        });

        // Copy CSS variables from theme class to root for global access
        this.copyThemeVariablesToRoot(theme);

        // Apply theme to editor and preview panes
        const editorPane = document.getElementById('editor-pane');
        const previewPane = document.getElementById('preview-pane');

        if (editorPane) {
            this.availableThemes.forEach(t => {
                editorPane.classList.remove(`theme-${t.id}`);
            });
            editorPane.classList.add(`theme-${theme}`);
        }

        if (previewPane) {
            this.availableThemes.forEach(t => {
                previewPane.classList.remove(`theme-${t.id}`);
            });
            previewPane.classList.add(`theme-${theme}`);
        }

        // Notify theme change callback if registered
        if (this.onThemeChangeCallback) {
            this.onThemeChangeCallback(theme);
        }
    }

    /**
     * Copy CSS variables from theme class to :root for global access
     * @private
     * @param {string} theme - Theme ID
     */
    copyThemeVariablesToRoot(theme) {
        // Use requestAnimationFrame to ensure styles are computed
        requestAnimationFrame(() => {
            // Create a temporary element with the theme class to read computed styles
            const tempDiv = document.createElement('div');
            tempDiv.className = `theme-${theme}`;
            tempDiv.style.display = 'none';
            document.body.appendChild(tempDiv);

            // Force a reflow to ensure styles are applied
            tempDiv.offsetHeight;

            const computedStyle = getComputedStyle(tempDiv);
            const root = document.documentElement;

            // List of CSS variables to copy
            const variables = [
                '--bg-primary', '--bg-secondary', '--text-primary', '--text-secondary',
                '--border-color', '--accent-color', '--accent-hover', '--accent-active',
                '--success-color', '--warning-color', '--error-color',
                '--activity-bar-bg', '--activity-bar-border', '--activity-bar-fg',
                '--activity-bar-fg-hover', '--activity-bar-fg-active',
                '--sidebar-bg', '--sidebar-border', '--sidebar-header-bg', '--sidebar-title-fg',
                '--button-bg', '--button-text', '--button-border', '--button-hover-bg',
                '--input-bg', '--input-text', '--input-border', '--input-focus-border',
                '--toolbar-bg', '--toolbar-border', '--tab-bar-bg', '--tab-bar-border'
            ];

            // Copy each variable to :root
            variables.forEach(varName => {
                const value = computedStyle.getPropertyValue(varName).trim();
                if (value) {
                    root.style.setProperty(varName, value);
                }
            });

            // Remove temporary element
            document.body.removeChild(tempDiv);
        });
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

