/**
 * AdvancedMarkdownManager Client - Renderer-side wrapper
 * Provides a simple interface to advanced markdown settings for the renderer process
 * Requirements: 6.1, 6.2, 6.3
 */

class AdvancedMarkdownManagerClient {
    constructor() {
        this.features = {
            mermaid: true,
            katex: true,
            callouts: true
        };
    }

    /**
     * Load settings from main process
     */
    async loadSettings() {
        try {
            const result = await window.electronAPI.getAdvancedMarkdownSettings();

            if (result.success && result.features) {
                this.features = result.features;
            }
        } catch (error) {
            console.error('Error loading advanced markdown settings:', error);
        }
    }

    /**
     * Check if a feature is enabled
     * @param {string} featureName - Feature name ('mermaid', 'katex', or 'callouts')
     * @returns {boolean} Whether the feature is enabled
     */
    isFeatureEnabled(featureName) {
        return this.features[featureName] || false;
    }

    /**
     * Get all features
     * @returns {Object} Features object
     */
    getAllFeatures() {
        return { ...this.features };
    }

    /**
     * Update local feature state (called when settings change)
     * @param {string} featureName - Feature name
     * @param {boolean} enabled - Whether the feature is enabled
     */
    updateFeature(featureName, enabled) {
        this.features[featureName] = enabled;
    }
}

module.exports = AdvancedMarkdownManagerClient;
