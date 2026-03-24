/**
 * AI Autocomplete Settings UI
 * Provides modal UI for configuring AI autocomplete settings
 */

const i18n = require('./i18n/index.js');

class AIAutocompleteSettingsUI {
    constructor() {
        this.modal = null;
        this.changeCallback = null;
    }

    /**
     * Show the AI autocomplete settings modal
     */
    async show() {
        try {
            console.log('AIAutocompleteSettingsUI: show() called');

            if (!this.modal) {
                console.log('AIAutocompleteSettingsUI: creating modal');
                this.createModal();
            }

            console.log('AIAutocompleteSettingsUI: loading settings');
            await this.loadSettings();

            console.log('AIAutocompleteSettingsUI: displaying modal');
            this.modal.style.display = 'flex';
        } catch (error) {
            console.error('Failed to show AI autocomplete settings:', error);
        }
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
        this.modal = document.createElement('div');
        this.modal.className = 'modal ai-autocomplete-settings-modal';
        this.modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center;';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = 'background: var(--bg-primary, #fff); padding: 20px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;';

        const header = this.createHeader();
        const body = this.createBody();
        const footer = this.createFooter();

        modalContent.appendChild(header);
        modalContent.appendChild(body);
        modalContent.appendChild(footer);
        this.modal.appendChild(modalContent);

        document.body.appendChild(this.modal);

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        console.log('AIAutocompleteSettingsUI: modal created and appended to body');
    }

    /**
     * Create modal header
     */
    createHeader() {
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `<h2>${i18n.t('settings.aiAutocomplete.title') || 'Autocomplete com IA'}</h2>`;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => this.hide();
        header.appendChild(closeBtn);

        return header;
    }

    /**
     * Create modal body with settings
     */
    createBody() {
        const body = document.createElement('div');
        body.className = 'modal-body';

        body.appendChild(this.createEnableSection());
        body.appendChild(this.createDebounceSection());
        body.appendChild(this.createMinCharsSection());
        body.appendChild(this.createHintsSection());
        body.appendChild(this.createNoticeSection());

        return body;
    }

    /**
     * Create enable/disable section
     */
    createEnableSection() {
        const container = document.createElement('div');
        container.className = 'setting-item';
        container.innerHTML = `
            <label>
                <input type="checkbox" id="ai-autocomplete-enabled">
                ${i18n.t('settings.aiAutocomplete.enabled') || 'Habilitar Autocomplete com IA'}
            </label>
            <p class="setting-description">
                ${i18n.t('settings.aiAutocomplete.enabledDescription') || 'Sugere continuação do texto enquanto você escreve usando IA'}
            </p>
        `;

        return container;
    }

    /**
     * Create debounce input section
     */
    createDebounceSection() {
        const container = document.createElement('div');
        container.className = 'setting-item';
        container.innerHTML = `
            <label for="ai-autocomplete-debounce">${i18n.t('settings.aiAutocomplete.debounce') || 'Atraso (ms)'}</label>
            <input type="number" id="ai-autocomplete-debounce" value="500" min="200" max="2000" step="100">
            <p class="setting-description">
                ${i18n.t('settings.aiAutocomplete.debounceDescription') || 'Tempo de espera após parar de digitar antes de solicitar sugestão'}
            </p>
        `;

        return container;
    }

    /**
     * Create min chars input section
     */
    createMinCharsSection() {
        const container = document.createElement('div');
        container.className = 'setting-item';
        container.innerHTML = `
            <label for="ai-autocomplete-min-chars">${i18n.t('settings.aiAutocomplete.minChars') || 'Caracteres mínimos'}</label>
            <input type="number" id="ai-autocomplete-min-chars" value="10" min="5" max="50" step="5">
            <p class="setting-description">
                ${i18n.t('settings.aiAutocomplete.minCharsDescription') || 'Quantidade mínima de texto antes de ativar o autocomplete'}
            </p>
        `;

        return container;
    }

    /**
     * Create usage hints section
     */
    createHintsSection() {
        const container = document.createElement('div');
        container.className = 'setting-item setting-hints';
        container.innerHTML = `
            <p class="setting-hint"><strong>Tab</strong> - ${i18n.t('settings.aiAutocomplete.tabHint') || 'Aceitar sugestão'}</p>
            <p class="setting-hint"><strong>Esc</strong> - ${i18n.t('settings.aiAutocomplete.escHint') || 'Dispensar sugestão'}</p>
        `;

        return container;
    }

    /**
     * Create API notice section
     */
    createNoticeSection() {
        const container = document.createElement('div');
        container.className = 'setting-item setting-notice';
        container.innerHTML = `
            <p class="setting-notice-text">
                <strong>${i18n.t('settings.aiAutocomplete.notice') || 'Nota'}:</strong> 
                ${i18n.t('settings.aiAutocomplete.noticeText') || 'O autocomplete usa a mesma configuração de IA do painel de chat (OpenAI ou servidor local).'}
            </p>
        `;

        return container;
    }

    /**
     * Create modal footer with buttons
     */
    createFooter() {
        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = i18n.t('actions.cancel') || 'Cancelar';
        cancelBtn.onclick = () => this.hide();

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = i18n.t('actions.save') || 'Salvar';
        saveBtn.onclick = () => this.saveSettings();

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        return footer;
    }

    /**
     * Load current settings
     */
    async loadSettings() {
        try {
            const settings = await window.electronAPI.aiAutocompleteGetSettings();

            const enabledCheckbox = document.getElementById('ai-autocomplete-enabled');
            const debounceInput = document.getElementById('ai-autocomplete-debounce');
            const minCharsInput = document.getElementById('ai-autocomplete-min-chars');

            if (settings) {
                if (enabledCheckbox) enabledCheckbox.checked = settings.enabled;
                if (debounceInput) debounceInput.value = settings.debounceMs || 500;
                if (minCharsInput) minCharsInput.value = settings.minCharsToTrigger || 10;
            }
        } catch (error) {
            console.error('Failed to load AI autocomplete settings:', error);
        }
    }

    /**
     * Save settings
     */
    async saveSettings() {
        try {
            const enabledCheckbox = document.getElementById('ai-autocomplete-enabled');
            const debounceInput = document.getElementById('ai-autocomplete-debounce');
            const minCharsInput = document.getElementById('ai-autocomplete-min-chars');

            const enabled = enabledCheckbox?.checked || false;
            const debounceMs = parseInt(debounceInput?.value, 10) || 500;
            const minChars = parseInt(minCharsInput?.value, 10) || 10;

            await window.electronAPI.aiAutocompleteSetEnabled(enabled);
            await window.electronAPI.aiAutocompleteSetDebounce(debounceMs);
            await window.electronAPI.aiAutocompleteSetMinChars(minChars);

            // Update the live instance if available
            if (window.aiAutocomplete) {
                window.aiAutocomplete.enabled = enabled;
                window.aiAutocomplete.debounceMs = debounceMs;
                window.aiAutocomplete.minCharsToTrigger = minChars;
                console.log('AIAutocomplete live instance updated');
            }

            if (this.changeCallback) {
                this.changeCallback({ enabled, debounceMs, minCharsToTrigger: minChars });
            }

            this.hide();
            console.log('AI autocomplete settings saved:', { enabled, debounceMs, minChars });
        } catch (error) {
            console.error('Failed to save AI autocomplete settings:', error);
            const errorMsg = i18n.t('settings.aiAutocomplete.failedToSave') || 'Falha ao salvar configurações';
            alert(errorMsg + ': ' + error.message);
        }
    }

    /**
     * Register callback for settings changes
     * @param {Function} callback - Called with settings object
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

module.exports = AIAutocompleteSettingsUI;
