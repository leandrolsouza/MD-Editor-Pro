/**
 * ImagePasteSettingsUI - UI for configuring image paste settings
 * Allows users to enable/disable image paste and configure assets folder
 */

class ImagePasteSettingsUI {
    constructor() {
        this.modal = null;
        this.changeCallback = null;
    }

    /**
     * Show the image paste settings modal
     */
    async show() {
        // Create modal if it doesn't exist
        if (!this.modal) {
            this.createModal();
        }

        // Load current settings
        await this.loadSettings();

        // Show modal
        this.modal.style.display = 'flex';
    }

    /**
     * Hide the modal
     */
    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    /**
     * Create the modal UI
     */
    createModal() {
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.className = 'modal image-paste-settings-modal';
        this.modal.style.display = 'none';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        // Create header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = '<h2>Image Paste Settings</h2>';

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => this.hide();
        header.appendChild(closeBtn);

        // Create body
        const body = document.createElement('div');
        body.className = 'modal-body';

        // Enable/disable checkbox
        const enableContainer = document.createElement('div');
        enableContainer.className = 'setting-item';
        enableContainer.innerHTML = `
            <label>
                <input type="checkbox" id="image-paste-enabled" checked>
                Enable automatic image paste
            </label>
            <p class="setting-description">
                When enabled, pasting images from clipboard (Ctrl+V) will automatically save them to the assets folder and insert markdown links.
            </p>
        `;

        // Assets folder input
        const folderContainer = document.createElement('div');
        folderContainer.className = 'setting-item';
        folderContainer.innerHTML = `
            <label for="assets-folder">Assets Folder Path:</label>
            <input type="text" id="assets-folder" value="./assets" placeholder="./assets">
            <p class="setting-description">
                Relative path from the markdown file where images will be saved. The folder will be created automatically if it doesn't exist.
            </p>
        `;

        body.appendChild(enableContainer);
        body.appendChild(folderContainer);

        // Create footer with save button
        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => this.saveSettings();

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => this.hide();

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(body);
        modalContent.appendChild(footer);
        this.modal.appendChild(modalContent);

        // Add to document
        document.body.appendChild(this.modal);

        // Close on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    /**
     * Load current settings from config
     */
    async loadSettings() {
        try {
            const config = await window.electronAPI.getConfig('imagePaste');
            const settings = config.value || {
                enabled: true,
                saveToAssets: true,
                assetsFolder: './assets'
            };

            // Update UI
            const enabledCheckbox = document.getElementById('image-paste-enabled');
            const folderInput = document.getElementById('assets-folder');

            if (enabledCheckbox) {
                enabledCheckbox.checked = settings.enabled !== false;
            }

            if (folderInput) {
                folderInput.value = settings.assetsFolder || './assets';
            }
        } catch (error) {
            console.error('Failed to load image paste settings:', error);
        }
    }

    /**
     * Save settings to config
     */
    async saveSettings() {
        try {
            const enabledCheckbox = document.getElementById('image-paste-enabled');
            const folderInput = document.getElementById('assets-folder');

            const enabled = enabledCheckbox?.checked !== false;
            const assetsFolder = folderInput?.value?.trim() || './assets';

            // Save to config
            await window.electronAPI.setConfig('imagePaste.enabled', enabled);
            await window.electronAPI.setConfig('imagePaste.assetsFolder', assetsFolder);

            // Notify callback
            if (this.changeCallback) {
                this.changeCallback(enabled, assetsFolder);
            }

            // Hide modal
            this.hide();

            console.log('Image paste settings saved:', { enabled, assetsFolder });
        } catch (error) {
            console.error('Failed to save image paste settings:', error);
            alert('Failed to save settings: ' + error.message);
        }
    }

    /**
     * Register callback for settings changes
     * @param {Function} callback - Called with (enabled, assetsFolder)
     */
    onChange(callback) {
        this.changeCallback = callback;
    }

    /**
     * Destroy the UI
     */
    destroy() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
        this.changeCallback = null;
    }
}

module.exports = ImagePasteSettingsUI;
