/**
 * AdvancedMarkdownManager - Advanced Markdown Features Configuration Manager
 * Manages feature toggles for Mermaid diagrams, KaTeX math, and callout blocks
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

/**
 * AdvancedMarkdownManager class manages advanced markdown feature configuration
 * Provides methods for enabling/disabling features and persisting preferences
 */
class AdvancedMarkdownManager {
    /**
     * Create an AdvancedMarkdownManager
     * @param {ConfigStore} configStore - ConfigStore instance for persistence
     */
    constructor(configStore) {
        if (!configStore) {
            throw new Error('ConfigStore is required');
        }

        this.configStore = configStore;

        // Default configuration: all features enabled by default
        this.defaultFeatures = {
            mermaid: true,
            katex: true,
            callouts: true
        };

        // Load configuration from store
        this.loadConfig();
    }

    /**
     * Load feature configuration from ConfigStore
     * If no configuration exists, use defaults
     * Requirement: 6.4 - Load saved feature preferences on startup
     */
    loadConfig() {
        const savedConfig = this.configStore.get('advancedMarkdown');

        if (savedConfig && savedConfig.features) {
            this.features = { ...this.defaultFeatures, ...savedConfig.features };
        } else {
            // No saved config, use defaults
            this.features = { ...this.defaultFeatures };
            // Save defaults to store
            this.saveConfig();
        }
    }

    /**
     * Save current feature configuration to ConfigStore
     * Requirement: 6.4 - Persist feature preferences
     */
    saveConfig() {
        this.configStore.set('advancedMarkdown', {
            features: this.features
        });
    }

    /**
     * Check if a specific feature is enabled
     * @param {string} featureName - Feature name ('mermaid', 'katex', or 'callouts')
     * @returns {boolean} Whether the feature is enabled
     * Requirement: 6.1 - Display toggle options based on current state
     */
    isFeatureEnabled(featureName) {
        if (!Object.prototype.hasOwnProperty.call(this.features, featureName)) {
            throw new Error(`Unknown feature: ${featureName}. Valid features are: mermaid, katex, callouts`);
        }
        return this.features[featureName];
    }

    /**
     * Enable or disable a specific feature
     * @param {string} featureName - Feature name ('mermaid', 'katex', or 'callouts')
     * @param {boolean} enabled - Whether to enable the feature
     * Requirements: 6.2 - Disable feature, 6.3 - Enable feature
     */
    toggleFeature(featureName, enabled) {
        if (!Object.prototype.hasOwnProperty.call(this.features, featureName)) {
            throw new Error(`Unknown feature: ${featureName}. Valid features are: mermaid, katex, callouts`);
        }

        if (typeof enabled !== 'boolean') {
            throw new Error(`Invalid enabled value: ${enabled}. Must be a boolean`);
        }

        this.features[featureName] = enabled;
        this.saveConfig();
    }

    /**
     * Get list of all enabled features
     * @returns {string[]} Array of enabled feature names
     * Requirement: 6.1 - Provide current feature state
     */
    getEnabledFeatures() {
        return Object.keys(this.features).filter(feature => this.features[feature]);
    }

    /**
     * Get all features with their enabled/disabled status
     * @returns {Object} Object with feature names as keys and boolean values
     * Requirement: 6.1 - Display all feature toggle options
     */
    getAllFeatures() {
        return { ...this.features };
    }

    /**
     * Reset all features to default configuration
     */
    resetToDefaults() {
        this.features = { ...this.defaultFeatures };
        this.saveConfig();
    }
}

module.exports = AdvancedMarkdownManager;
