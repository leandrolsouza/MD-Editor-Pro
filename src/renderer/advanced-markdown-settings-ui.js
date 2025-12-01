/**
 * AdvancedMarkdownSettingsUI - Settings dialog for advanced markdown features
 * Displays toggles for Mermaid diagrams, KaTeX math, and callout blocks
 * Requirements: 6.1, 6.2, 6.3
 */

class AdvancedMarkdownSettingsUI {
    constructor() {
        this.dialog = null;
        this.features = {
            mermaid: true,
            katex: true,
            callouts: true
        };
        this.onSettingsChanged = null;
    }

    /**
     * Show the advanced markdown settings dialog
     */
    async show() {
        // Create dialog if it doesn't exist
        if (!this.dialog) {
            this.createDialog();
        }

        // Load current settings
        await this.loadSettings();

        // Show dialog
        this.dialog.style.display = 'flex';

        // Add event listener for escape key to close dialog
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    /**
     * Hide the advanced markdown settings dialog
     */
    hide() {
        if (this.dialog) {
            this.dialog.style.display = 'none';
        }

        // Remove escape key listener
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
    }

    /**
     * Create the dialog HTML structure
     */
    createDialog() {
        this.dialog = document.createElement('div');
        this.dialog.className = 'settings-dialog-overlay';
        this.dialog.innerHTML = `
            <div class="settings-dialog">
                <div class="settings-dialog-header">
                    <h2>Advanced Markdown Features</h2>
                    <button class="settings-close-btn" aria-label="Close">&times;</button>
                </div>
                <div class="settings-dialog-body">
                    <div class="settings-section">
                        <p class="settings-description">
                            Enable or disable advanced markdown features. Changes take effect immediately.
                        </p>
                        
                        <div class="settings-feature">
                            <label class="settings-feature-label">
                                <input type="checkbox" id="feature-mermaid" class="settings-checkbox">
                                <span class="settings-feature-name">Mermaid Diagrams</span>
                            </label>
                            <p class="settings-feature-description">
                                Render diagrams using Mermaid syntax in fenced code blocks
                            </p>
                        </div>

                        <div class="settings-feature">
                            <label class="settings-feature-label">
                                <input type="checkbox" id="feature-katex" class="settings-checkbox">
                                <span class="settings-feature-name">Mathematical Formulas (KaTeX)</span>
                            </label>
                            <p class="settings-feature-description">
                                Render LaTeX math expressions using $ delimiters
                            </p>
                        </div>

                        <div class="settings-feature">
                            <label class="settings-feature-label">
                                <input type="checkbox" id="feature-callouts" class="settings-checkbox">
                                <span class="settings-feature-name">Callout Blocks</span>
                            </label>
                            <p class="settings-feature-description">
                                Display styled callout blocks for notes, warnings, and tips
                            </p>
                        </div>
                    </div>
                </div>
                <div class="settings-dialog-footer">
                    <button class="settings-done-btn">Done</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.dialog);

        // Add event listeners
        this.dialog.querySelector('.settings-close-btn').addEventListener('click', () => this.hide());
        this.dialog.querySelector('.settings-done-btn').addEventListener('click', () => this.hide());

        // Add checkbox change listeners
        this.dialog.querySelector('#feature-mermaid').addEventListener('change', (e) => {
            this.handleFeatureToggle('mermaid', e.target.checked);
        });

        this.dialog.querySelector('#feature-katex').addEventListener('change', (e) => {
            this.handleFeatureToggle('katex', e.target.checked);
        });

        this.dialog.querySelector('#feature-callouts').addEventListener('change', (e) => {
            this.handleFeatureToggle('callouts', e.target.checked);
        });

        // Close dialog when clicking overlay
        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) {
                this.hide();
            }
        });
    }

    /**
     * Load settings from the main process
     * Requirement: 6.1 - Load current settings from AdvancedMarkdownManager
     */
    async loadSettings() {
        try {
            const result = await window.electronAPI.getAdvancedMarkdownSettings();

            if (result.success && result.features) {
                this.features = result.features;
                this.updateCheckboxes();
            }
        } catch (error) {
            console.error('Error loading advanced markdown settings:', error);
        }
    }

    /**
     * Update checkbox states based on current features
     */
    updateCheckboxes() {
        if (!this.dialog) return;

        const mermaidCheckbox = this.dialog.querySelector('#feature-mermaid');
        const katexCheckbox = this.dialog.querySelector('#feature-katex');
        const calloutsCheckbox = this.dialog.querySelector('#feature-callouts');

        if (mermaidCheckbox) mermaidCheckbox.checked = this.features.mermaid;
        if (katexCheckbox) katexCheckbox.checked = this.features.katex;
        if (calloutsCheckbox) calloutsCheckbox.checked = this.features.callouts;
    }

    /**
     * Handle feature toggle
     * Requirements: 6.2 - Disable feature, 6.3 - Enable feature
     * @param {string} featureName - Feature name ('mermaid', 'katex', or 'callouts')
     * @param {boolean} enabled - Whether to enable the feature
     */
    async handleFeatureToggle(featureName, enabled) {
        try {
            const result = await window.electronAPI.toggleAdvancedMarkdownFeature(featureName, enabled);

            if (result.success) {
                // Update local state
                this.features[featureName] = enabled;

                // Notify listeners
                if (this.onSettingsChanged) {
                    this.onSettingsChanged(featureName, enabled);
                }

                console.log(`Advanced markdown feature '${featureName}' ${enabled ? 'enabled' : 'disabled'}`);
            }
        } catch (error) {
            console.error('Error toggling advanced markdown feature:', error);
            // Revert checkbox state on error
            this.updateCheckboxes();
        }
    }

    /**
     * Register callback for settings changes
     * @param {Function} callback - Callback function(featureName, enabled)
     */
    onChange(callback) {
        this.onSettingsChanged = callback;
    }
}

module.exports = AdvancedMarkdownSettingsUI;
