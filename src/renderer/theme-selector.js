/**
 * ThemeSelector - UI component for theme selection
 * Provides a visual interface for browsing and selecting themes
 */

class ThemeSelector {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.isOpen = false;
        this.panel = null;
    }

    /**
     * Initialize the theme selector
     */
    initialize() {
        this.createPanel();
        this.attachEventListeners();
    }

    /**
     * Create the theme selector panel
     * @private
     */
    createPanel() {
        // Create backdrop
        this.panel = document.createElement('div');
        this.panel.id = 'theme-selector-panel';
        this.panel.className = 'theme-selector-panel hidden';
        this.panel.setAttribute('role', 'dialog');
        this.panel.setAttribute('aria-label', 'Theme Selector');

        // Create content container
        const content = document.createElement('div');
        content.className = 'theme-selector-content';

        // Create header
        const header = document.createElement('div');
        header.className = 'theme-selector-header';
        header.innerHTML = `
            <h3>Select Theme</h3>
            <button id="theme-selector-close" class="close-button" aria-label="Close theme selector">✕</button>
        `;

        // Create theme grid
        const grid = document.createElement('div');
        grid.className = 'theme-grid';
        grid.id = 'theme-grid';

        // Populate themes
        const themes = this.themeManager.getAvailableThemes();
        themes.forEach(theme => {
            const themeCard = this.createThemeCard(theme);
            grid.appendChild(themeCard);
        });

        content.appendChild(header);
        content.appendChild(grid);
        this.panel.appendChild(content);
        document.body.appendChild(this.panel);
    }

    /**
     * Create a theme card element
     * @private
     */
    createThemeCard(theme) {
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.dataset.themeId = theme.id;

        // Mark as active if current theme
        if (theme.id === this.themeManager.getCurrentTheme()) {
            card.classList.add('active');
        }

        // Create preview
        const preview = document.createElement('div');
        preview.className = `theme-preview theme-${theme.id}`;
        preview.innerHTML = `
            <div class="preview-content">
                <div class="preview-line"></div>
                <div class="preview-line short"></div>
                <div class="preview-line"></div>
            </div>
        `;

        // Create info
        const info = document.createElement('div');
        info.className = 'theme-info';
        info.innerHTML = `
            <div class="theme-name">${theme.name}</div>
            <div class="theme-description">${theme.description}</div>
        `;

        card.appendChild(preview);
        card.appendChild(info);

        // Add click handler
        card.addEventListener('click', () => {
            this.selectTheme(theme.id);
        });

        return card;
    }

    /**
     * Attach event listeners
     * @private
     */
    attachEventListeners() {
        // Close button
        const closeButton = document.getElementById('theme-selector-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.close();
            });
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Close on backdrop click
        this.panel.addEventListener('click', (e) => {
            if (e.target === this.panel) {
                this.close();
            }
        });
    }

    /**
     * Select a theme
     * @param {string} themeId - Theme ID to select
     */
    async selectTheme(themeId) {
        await this.themeManager.setTheme(themeId);

        // Update active state
        const cards = this.panel.querySelectorAll('.theme-card');
        cards.forEach(card => {
            if (card.dataset.themeId === themeId) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    /**
     * Open the theme selector
     */
    open() {
        this.panel.classList.remove('hidden');
        this.isOpen = true;
    }

    /**
     * Close the theme selector
     */
    close() {
        this.panel.classList.add('hidden');
        this.isOpen = false;
    }

    /**
     * Toggle the theme selector
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}

module.exports = ThemeSelector;
