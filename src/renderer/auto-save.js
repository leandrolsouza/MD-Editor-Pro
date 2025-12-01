/**
 * AutoSaveManager - Manages automatic saving of document content
 * Implements debouncing mechanism and visual feedback
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

class AutoSaveManager {
    constructor(editor) {
        if (!editor) {
            throw new Error('Editor instance is required');
        }

        this.editor = editor;
        this.enabled = false;
        this.delay = 5; // Default 5 seconds
        this.saveTimeoutId = null;
        this.currentFilePath = null;
        this.lastSavedContent = '';

        // Event callbacks
        this.saveStartCallback = null;
        this.saveCompleteCallback = null;
        this.saveErrorCallback = null;

        // Status indicator element
        this.statusIndicator = null;
    }

    /**
     * Initialize the auto-save manager
     * Loads configuration and sets up status indicator
     */
    async initialize() {
        // Load configuration from electronAPI
        try {
            const config = await window.electronAPI.getConfig('autoSave');

            if (config && config.value) {
                this.enabled = config.value.enabled !== false;
                this.delay = config.value.delay || 5;
            }
        } catch (error) {
            console.warn('Failed to load auto-save config, using defaults:', error);
        }

        // Validate delay
        if (this.delay < 1 || this.delay > 60) {
            this.delay = 5;
        }

        // Setup status indicator
        this._setupStatusIndicator();

        // Listen to editor content changes
        this.editor.onContentChange(() => {
            if (this.enabled && this.currentFilePath) {
                this._scheduleAutoSave();
            }
        });
    }

    /**
     * Setup the status indicator UI element
     * @private
     */
    _setupStatusIndicator() {
        this.statusIndicator = document.getElementById('auto-save-status');
        if (!this.statusIndicator) {
            console.warn('Auto-save status indicator not found in DOM');
        }
    }

    /**
     * Enable auto-save functionality
     */
    async enable() {
        this.enabled = true;
        await this._saveConfig();
    }

    /**
     * Disable auto-save functionality
     */
    async disable() {
        this.enabled = false;
        this._cancelScheduledSave();
        await this._saveConfig();
    }

    /**
     * Check if auto-save is enabled
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Set the auto-save delay
     * @param {number} seconds - Delay in seconds (1-60)
     */
    async setDelay(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds)) {
            throw new Error('Delay must be a number');
        }
        if (seconds < 1 || seconds > 60) {
            throw new Error('Delay must be between 1 and 60 seconds');
        }

        this.delay = seconds;
        await this._saveConfig();

        // Reschedule if there's a pending save
        if (this.saveTimeoutId !== null) {
            this._cancelScheduledSave();
            this._scheduleAutoSave();
        }
    }

    /**
     * Get the current auto-save delay
     * @returns {number} Delay in seconds
     */
    getDelay() {
        return this.delay;
    }

    /**
     * Set the current file path for saving
     * @param {string | null} filePath - The file path
     */
    setCurrentFilePath(filePath) {
        this.currentFilePath = filePath;
    }

    /**
     * Set the last saved content (to track changes)
     * @param {string} content - The content
     */
    setLastSavedContent(content) {
        this.lastSavedContent = content;
    }

    /**
     * Trigger save manually
     */
    async saveNow() {
        this._cancelScheduledSave();
        await this._performSave();
    }

    /**
     * Register callback for save start event
     * @param {Function} callback - Callback function
     */
    onSaveStart(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.saveStartCallback = callback;
    }

    /**
     * Register callback for save complete event
     * @param {Function} callback - Callback function
     */
    onSaveComplete(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.saveCompleteCallback = callback;
    }

    /**
     * Register callback for save error event
     * @param {Function} callback - Callback function
     */
    onSaveError(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.saveErrorCallback = callback;
    }

    /**
     * Schedule an auto-save operation with debouncing
     * @private
     */
    _scheduleAutoSave() {
        // Cancel any existing scheduled save
        this._cancelScheduledSave();

        // Schedule new save
        this.saveTimeoutId = setTimeout(() => {
            this._performSave();
        }, this.delay * 1000);
    }

    /**
     * Cancel any scheduled auto-save operation
     * @private
     */
    _cancelScheduledSave() {
        if (this.saveTimeoutId !== null) {
            clearTimeout(this.saveTimeoutId);
            this.saveTimeoutId = null;
        }
    }

    /**
     * Perform the actual save operation
     * @private
     */
    async _performSave() {
        if (!this.currentFilePath) {
            return;
        }

        const content = this.editor.getValue();

        // Don't save if content hasn't changed
        if (content === this.lastSavedContent) {
            return;
        }

        try {
            // Update status indicator to "saving"
            this._updateStatusIndicator('saving');

            // Trigger save start callback
            if (this.saveStartCallback) {
                this.saveStartCallback();
            }

            // Save file via IPC
            await window.electronAPI.saveFile(this.currentFilePath, content);

            // Update last saved content
            this.lastSavedContent = content;

            // Update status indicator to "saved"
            this._updateStatusIndicator('saved');

            // Trigger save complete callback
            if (this.saveCompleteCallback) {
                this.saveCompleteCallback();
            }

            console.log('Auto-save completed:', this.currentFilePath);
        } catch (error) {
            console.error('Auto-save error:', error);

            // Update status indicator to "error"
            this._updateStatusIndicator('error', error.message);

            // Trigger save error callback
            if (this.saveErrorCallback) {
                this.saveErrorCallback(error);
            }
        }
    }

    /**
     * Update the status indicator UI
     * @param {string} status - Status: 'saving', 'saved', 'error'
     * @param {string} errorMessage - Optional error message
     * @private
     */
    _updateStatusIndicator(status, errorMessage = null) {
        if (!this.statusIndicator) {
            return;
        }

        // Remove all status classes
        this.statusIndicator.classList.remove('saving', 'saved', 'error');

        // Add new status class
        this.statusIndicator.classList.add(status);

        // Update text content
        switch (status) {
            case 'saving':
                this.statusIndicator.textContent = 'Saving...';
                this.statusIndicator.title = 'Auto-saving document';
                break;
            case 'saved':
                this.statusIndicator.textContent = 'Saved';
                this.statusIndicator.title = 'Document saved successfully';
                // Auto-hide after 2 seconds
                setTimeout(() => {
                    if (this.statusIndicator && this.statusIndicator.classList.contains('saved')) {
                        this.statusIndicator.textContent = '';
                        this.statusIndicator.classList.remove('saved');
                    }
                }, 2000);
                break;
            case 'error':
                this.statusIndicator.textContent = 'Save Error';
                this.statusIndicator.title = errorMessage || 'Failed to save document';
                break;
        }
    }

    /**
     * Save configuration via electronAPI
     * @private
     */
    async _saveConfig() {
        try {
            await window.electronAPI.setConfig('autoSave', {
                enabled: this.enabled,
                delay: this.delay
            });
        } catch (error) {
            console.error('Failed to save auto-save config:', error);
        }
    }

    /**
     * Destroy the auto-save manager
     */
    destroy() {
        this._cancelScheduledSave();
        this.saveStartCallback = null;
        this.saveCompleteCallback = null;
        this.saveErrorCallback = null;
        this.statusIndicator = null;
    }
}

module.exports = AutoSaveManager;
