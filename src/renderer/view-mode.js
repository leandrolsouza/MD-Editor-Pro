/**
 * ViewModeManager - Manages view mode switching between editor, preview, and split views
 * Controls visibility of editor and preview panes
 * Persists view mode preference using ConfigStore
 * Requirements: 6.2, 6.3, 6.4
 */

class ViewModeManager {
    constructor() {
        this.currentViewMode = 'split'; // Default view mode
        this.initialized = false;
        this.editorPane = null;
        this.previewPane = null;
        this.divider = null;
        this.viewModeChangeListeners = []; // Listeners for view mode changes
    }

    /**
     * Initialize the view mode manager
     * Loads saved view mode preference from ConfigStore and applies it
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        // Get DOM elements
        this.editorPane = document.getElementById('editor-pane');
        this.previewPane = document.getElementById('preview-pane');
        this.divider = document.getElementById('divider');

        if (!this.editorPane || !this.previewPane) {
            console.error('Required DOM elements not found');
            return;
        }

        try {
            // Load view mode preference from ConfigStore
            const result = await window.electronAPI.getConfig('viewMode');
            const savedViewMode = result?.value;

            // Use saved view mode if available, otherwise default to 'split'
            if (savedViewMode === 'editor' || savedViewMode === 'preview' || savedViewMode === 'split') {
                this.currentViewMode = savedViewMode;
            }

            // Apply the view mode
            this.applyViewMode(this.currentViewMode);
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize view mode:', error);
            // Fall back to default split view
            this.applyViewMode('split');
            this.initialized = true;
        }
    }

    /**
     * Set the view mode
     * @param {string} mode - 'editor', 'preview', or 'split'
     */
    async setViewMode(mode) {
        if (mode !== 'editor' && mode !== 'preview' && mode !== 'split') {
            console.error(`Invalid view mode: ${mode}. Must be 'editor', 'preview', or 'split'`);
            return;
        }

        this.currentViewMode = mode;
        this.applyViewMode(mode);

        // Notify listeners of view mode change
        this.notifyViewModeChange(mode);

        // Persist view mode preference to ConfigStore
        try {
            await window.electronAPI.setConfig('viewMode', mode);
        } catch (error) {
            console.error('Failed to save view mode preference:', error);
        }
    }

    /**
     * Register a listener for view mode changes
     * @param {Function} callback - Callback function that receives the new view mode
     * @returns {Function} Function to remove the listener
     */
    onViewModeChange(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        this.viewModeChangeListeners.push(callback);

        // Return a function to remove this listener
        return () => {
            const index = this.viewModeChangeListeners.indexOf(callback);

            if (index !== -1) {
                this.viewModeChangeListeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify all listeners of a view mode change
     * @private
     * @param {string} mode - The new view mode
     */
    notifyViewModeChange(mode) {
        this.viewModeChangeListeners.forEach(listener => {
            try {
                listener(mode);
            } catch (error) {
                console.error('Error in view mode change listener:', error);
            }
        });
    }

    /**
     * Get the current view mode
     * @returns {string} Current view mode ('editor', 'preview', or 'split')
     */
    getCurrentViewMode() {
        return this.currentViewMode;
    }

    /**
     * Apply view mode by showing/hiding appropriate containers
     * @private
     * @param {string} mode - 'editor', 'preview', or 'split'
     */
    applyViewMode(mode) {
        if (!this.editorPane || !this.previewPane) {
            console.error('DOM elements not initialized');
            return;
        }

        // Remove all view mode classes first
        this.editorPane.classList.remove('hidden', 'full-width');
        this.previewPane.classList.remove('hidden', 'full-width');
        if (this.divider) {
            this.divider.classList.remove('hidden');
        }

        switch (mode) {
            case 'editor':
                // Show only editor
                this.editorPane.classList.add('full-width');
                this.editorPane.style.display = '';
                this.previewPane.classList.add('hidden');
                this.previewPane.style.display = 'none';
                if (this.divider) {
                    this.divider.classList.add('hidden');
                }
                break;

            case 'preview':
                // Show only preview
                this.editorPane.classList.add('hidden');
                this.editorPane.style.display = 'none';
                this.previewPane.classList.add('full-width');
                this.previewPane.style.display = '';
                if (this.divider) {
                    this.divider.classList.add('hidden');
                }
                break;

            case 'split':
                // Show both editor and preview (default state)
                // No additional classes needed, both are visible by default
                this.editorPane.style.display = '';
                this.previewPane.style.display = '';
                break;

            default:
                console.error(`Unknown view mode: ${mode}`);
        }
    }
}

module.exports = ViewModeManager;
