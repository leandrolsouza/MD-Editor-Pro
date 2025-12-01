/**
 * AutoSaveSettingsUI - Settings dialog for auto-save configuration
 * Allows users to enable/disable auto-save and configure delay
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

const notificationManager = require('./notification.js');

class AutoSaveSettingsUI {
    constructor() {
        this.dialog = null;
        this.onChangeCallback = null;
    }

    /**
     * Show the auto-save settings dialog
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
     * Hide the auto-save settings dialog
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
        this.dialog.className = 'autosave-dialog-overlay';
        this.dialog.innerHTML = `
            <div class="autosave-dialog">
                <div class="autosave-dialog-header">
                    <h2>Auto-Save Settings</h2>
                    <button class="autosave-close-btn" aria-label="Close">&times;</button>
                </div>
                <div class="autosave-dialog-body">
                    <div class="autosave-setting-group">
                        <div class="autosave-setting-row">
                            <label class="autosave-setting-label">
                                <input type="checkbox" id="autosave-enabled" class="autosave-checkbox" />
                                <span>Enable Auto-Save</span>
                            </label>
                            <p class="autosave-setting-description">
                                Automatically save your document after a period of inactivity
                            </p>
                        </div>
                    </div>

                    <div class="autosave-setting-group" id="delay-group">
                        <div class="autosave-setting-row">
                            <label class="autosave-setting-label">
                                <span>Auto-Save Delay</span>
                            </label>
                            <div class="autosave-delay-controls">
                                <input type="range" id="autosave-delay-slider" class="autosave-slider" 
                                       min="1" max="60" value="5" step="1" />
                                <input type="number" id="autosave-delay-input" class="autosave-number-input" 
                                       min="1" max="60" value="5" />
                                <span class="autosave-unit">seconds</span>
                            </div>
                            <p class="autosave-setting-description">
                                Time to wait after you stop typing before auto-saving (1-60 seconds)
                            </p>
                        </div>
                    </div>

                    <div class="autosave-info">
                        <svg class="autosave-info-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                        </svg>
                        <span>Auto-save only works when a file has been saved at least once. Unsaved new documents must be manually saved first.</span>
                    </div>
                </div>
                <div class="autosave-dialog-footer">
                    <button class="autosave-cancel-btn">Cancel</button>
                    <button class="autosave-save-btn">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.dialog);

        // Add event listeners
        this.dialog.querySelector('.autosave-close-btn').addEventListener('click', () => this.hide());
        this.dialog.querySelector('.autosave-cancel-btn').addEventListener('click', () => this.hide());
        this.dialog.querySelector('.autosave-save-btn').addEventListener('click', () => this.saveSettings());

        // Sync slider and number input
        const slider = this.dialog.querySelector('#autosave-delay-slider');
        const numberInput = this.dialog.querySelector('#autosave-delay-input');

        slider.addEventListener('input', (e) => {
            numberInput.value = e.target.value;
        });

        numberInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value, 10);
            if (isNaN(value)) value = 5;
            if (value < 1) value = 1;
            if (value > 60) value = 60;
            slider.value = value;
            numberInput.value = value;
        });

        // Enable/disable delay controls based on checkbox
        const enabledCheckbox = this.dialog.querySelector('#autosave-enabled');
        const delayGroup = this.dialog.querySelector('#delay-group');

        enabledCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                delayGroup.classList.remove('disabled');
                slider.disabled = false;
                numberInput.disabled = false;
            } else {
                delayGroup.classList.add('disabled');
                slider.disabled = true;
                numberInput.disabled = true;
            }
        });

        // Close dialog when clicking overlay
        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) {
                this.hide();
            }
        });
    }

    /**
     * Load current settings
     */
    async loadSettings() {
        try {
            const config = await window.electronAPI.getConfig('autoSave');
            const settings = config?.value || { enabled: false, delay: 5 };

            const enabledCheckbox = this.dialog.querySelector('#autosave-enabled');
            const slider = this.dialog.querySelector('#autosave-delay-slider');
            const numberInput = this.dialog.querySelector('#autosave-delay-input');
            const delayGroup = this.dialog.querySelector('#delay-group');

            enabledCheckbox.checked = settings.enabled !== false;
            slider.value = settings.delay || 5;
            numberInput.value = settings.delay || 5;

            if (enabledCheckbox.checked) {
                delayGroup.classList.remove('disabled');
                slider.disabled = false;
                numberInput.disabled = false;
            } else {
                delayGroup.classList.add('disabled');
                slider.disabled = true;
                numberInput.disabled = true;
            }
        } catch (error) {
            console.error('Error loading auto-save settings:', error);
        }
    }

    /**
     * Save settings
     */
    async saveSettings() {
        try {
            const enabledCheckbox = this.dialog.querySelector('#autosave-enabled');
            const numberInput = this.dialog.querySelector('#autosave-delay-input');

            const enabled = enabledCheckbox.checked;
            const delay = parseInt(numberInput.value, 10);

            // Validate delay
            if (isNaN(delay) || delay < 1 || delay > 60) {
                notificationManager.warning('Invalid delay. Please enter a number between 1 and 60.');
                return;
            }

            // Save to config
            await window.electronAPI.setConfig('autoSave', {
                enabled,
                delay
            });

            // Notify callback
            if (this.onChangeCallback) {
                this.onChangeCallback(enabled, delay);
            }

            // Close dialog
            this.hide();
        } catch (error) {
            console.error('Error saving auto-save settings:', error);
            notificationManager.error('Failed to save settings: ' + error.message);
        }
    }

    /**
     * Register callback for settings changes
     */
    onChange(callback) {
        this.onChangeCallback = callback;
    }
}

module.exports = AutoSaveSettingsUI;
