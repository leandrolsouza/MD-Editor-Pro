/**
 * AI Chat Panel
 * Provides a chat interface for interacting with OpenAI
 */

const i18n = require('../i18n/index.js');

class AIChatPanel {
    constructor(editor) {
        this.editor = editor;
        this.container = null;
        this.messagesContainer = null;
        this.inputField = null;
        this.sendButton = null;
        this.isLoading = false;
        this.removeLocaleListener = null;
        // Store the editor selection when user focuses on chat input
        // This is needed because clicking on the chat input loses the editor selection
        this.savedSelection = null;
    }

    /**
     * Initialize the chat panel
     * @param {HTMLElement} container
     */
    initialize(container) {
        this.container = container;
        this.render();
        this.attachEventListeners();
        this.setupLocaleListener();
    }

    /**
     * Setup locale change listener
     */
    setupLocaleListener() {
        this.removeLocaleListener = i18n.onLocaleChange(() => {
            this.updateTranslations();
        });
    }

    /**
     * Update translations when locale changes
     */
    updateTranslations() {
        if (!this.container) return;

        // Update header title
        const title = this.container.querySelector('.ai-chat-title');
        if (title) title.textContent = i18n.t('aiChat.title');

        // Update button tooltips
        const settingsBtn = this.container.querySelector('.ai-chat-settings-btn');
        if (settingsBtn) {
            settingsBtn.title = i18n.t('aiChat.settings');
            settingsBtn.setAttribute('aria-label', i18n.t('aiChat.settings'));
        }

        const clearBtn = this.container.querySelector('.ai-chat-clear-btn');
        if (clearBtn) {
            clearBtn.title = i18n.t('aiChat.clear');
            clearBtn.setAttribute('aria-label', i18n.t('aiChat.clear'));
        }

        // Update input placeholder
        if (this.inputField) {
            this.inputField.placeholder = i18n.t('aiChat.placeholder');
            this.inputField.setAttribute('aria-label', i18n.t('aiChat.placeholder'));
        }

        // Update send button
        if (this.sendButton) {
            this.sendButton.title = i18n.t('aiChat.send');
            this.sendButton.setAttribute('aria-label', i18n.t('aiChat.send'));
        }

        // Update welcome message if present
        const welcome = this.container.querySelector('.ai-chat-welcome');
        if (welcome) {
            const welcomeText = welcome.querySelector('p:not(.ai-chat-welcome-hint)');
            if (welcomeText) welcomeText.textContent = i18n.t('aiChat.welcome');

            const welcomeHint = welcome.querySelector('.ai-chat-welcome-hint');
            if (welcomeHint) welcomeHint.textContent = i18n.t('aiChat.welcomeHint');
        }

        // Update copy buttons in code blocks
        const copyBtns = this.container.querySelectorAll('.ai-chat-copy-btn');
        copyBtns.forEach(btn => {
            if (btn.textContent !== i18n.t('aiChat.copied')) {
                btn.textContent = i18n.t('aiChat.copy');
            }
        });
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.removeLocaleListener) {
            this.removeLocaleListener();
            this.removeLocaleListener = null;
        }
    }

    /**
     * Render the chat panel UI
     */
    render() {
        this.container.innerHTML = `
            <div class="ai-chat-panel">
                <div class="ai-chat-header">
                    <span class="ai-chat-title">${i18n.t('aiChat.title')}</span>
                    <div class="ai-chat-model-selector">
                        <select class="ai-provider-select" title="Provedor de IA">
                            <option value="">Carregando...</option>
                        </select>
                        <select class="ai-model-select" title="Modelo">
                            <option value="">Carregando...</option>
                        </select>
                    </div>
                    <div class="ai-chat-actions">
                        <button class="ai-chat-settings-btn" title="${i18n.t('aiChat.settings')}" aria-label="${i18n.t('aiChat.settings')}">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
                            </svg>
                        </button>
                        <button class="ai-chat-clear-btn" title="${i18n.t('aiChat.clear')}" aria-label="${i18n.t('aiChat.clear')}">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="ai-chat-messages" role="log" aria-live="polite">
                    <div class="ai-chat-welcome">
                        <div class="ai-chat-welcome-icon">🤖</div>
                        <p>${i18n.t('aiChat.welcome')}</p>
                        <p class="ai-chat-welcome-hint">${i18n.t('aiChat.welcomeHint')}</p>
                    </div>
                </div>
                <div class="ai-chat-input-container">
                    <textarea 
                        class="ai-chat-input" 
                        placeholder="${i18n.t('aiChat.placeholder')}" 
                        rows="1"
                        aria-label="${i18n.t('aiChat.placeholder')}"
                    ></textarea>
                    <button class="ai-chat-send-btn" title="${i18n.t('aiChat.send')}" aria-label="${i18n.t('aiChat.send')}" disabled>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        this.messagesContainer = this.container.querySelector('.ai-chat-messages');
        this.inputField = this.container.querySelector('.ai-chat-input');
        this.sendButton = this.container.querySelector('.ai-chat-send-btn');
        this.providerSelect = this.container.querySelector('.ai-provider-select');
        this.modelSelect = this.container.querySelector('.ai-model-select');

        // Load current provider and model
        this.loadCurrentProviderAndModel();
    }

    /**
     * Get available models for a provider
     * @param {string} provider
     * @returns {Array<{id: string, name: string}>}
     */
    getModelsForProvider(provider) {
        const models = {
            openai: [
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Rápido)' },
                { id: 'gpt-4o', name: 'GPT-4o (Mais Capaz)' },
                { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
            ],
            anthropic: [
                { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
                { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Rápido)' },
                { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
                { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
                { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
            ],
            gemini: [
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Rápido)' },
                { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B' },
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
                { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Exp)' }
            ],
            groq: [
                { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
                { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B' },
                { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Rápido)' },
                { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
                { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
            ],
            local: [
                { id: 'default', name: 'Modelo Padrão' }
            ]
        };
        return models[provider] || models.openai;
    }

    /**
     * Load current provider and model from settings
     */
    async loadCurrentProviderAndModel() {
        try {
            const settings = await window.electronAPI.aiGetSettings();
            const currentProvider = settings?.provider || 'openai';

            // Build provider options based on configured API keys
            this.updateProviderOptions(settings, currentProvider);

            // Update model options
            await this.updateModelOptions(this.providerSelect.value, settings);
        } catch (error) {
            console.error('Failed to load provider/model settings:', error);
        }
    }

    /**
     * Update provider dropdown to only show providers with API keys configured
     * @param {Object} settings
     * @param {string} currentProvider
     */
    async updateProviderOptions(settings, currentProvider) {
        const providers = [
            { id: 'openai', name: 'OpenAI', hasKey: !!settings?.openai?.apiKey },
            { id: 'anthropic', name: 'Claude', hasKey: !!settings?.anthropic?.apiKey },
            { id: 'gemini', name: 'Gemini', hasKey: !!settings?.gemini?.apiKey },
            { id: 'groq', name: 'Groq', hasKey: !!settings?.groq?.apiKey },
            { id: 'local', name: 'Local', hasKey: true } // Local doesn't need API key
        ];

        // Filter to only providers with API keys
        const availableProviders = providers.filter(p => p.hasKey);

        if (availableProviders.length === 0) {
            // No providers configured - show message
            this.providerSelect.innerHTML = '<option value="">Configure API Key</option>';
            this.providerSelect.disabled = true;
            this.modelSelect.innerHTML = '<option value="">-</option>';
            this.modelSelect.disabled = true;
            return;
        }

        this.providerSelect.disabled = false;
        this.modelSelect.disabled = false;

        // Build options HTML
        this.providerSelect.innerHTML = availableProviders.map(p =>
            `<option value="${p.id}" ${p.id === currentProvider ? 'selected' : ''}>${p.name}</option>`
        ).join('');

        // If current provider doesn't have key, select first available
        const currentHasKey = availableProviders.some(p => p.id === currentProvider);
        if (!currentHasKey && availableProviders.length > 0) {
            this.providerSelect.value = availableProviders[0].id;
            // Update provider in settings
            try {
                await window.electronAPI.aiSetProvider(availableProviders[0].id);
            } catch (error) {
                console.error('Error setting AI provider:', error);
            }
        }
    }

    /**
     * Update model dropdown options based on provider
     * @param {string} provider
     * @param {Object} settings - Optional settings object
     */
    async updateModelOptions(provider, settings = null) {
        let models;
        let currentModel;

        if (provider === 'local') {
            // Fetch models from local server
            this.modelSelect.innerHTML = '<option value="">Carregando...</option>';
            try {
                models = await window.electronAPI.aiFetchLocalModels();
                if (!models || models.length === 0) {
                    models = [{ id: 'default', name: 'Modelo Padrão' }];
                }
            } catch (error) {
                console.error('Failed to fetch local models:', error);
                models = [{ id: 'default', name: 'Modelo Padrão' }];
            }
            currentModel = settings?.local?.model || 'default';
        } else {
            models = this.getModelsForProvider(provider);
            // Get current model from settings
            if (settings) {
                currentModel = settings[provider]?.model;
            }
            if (!currentModel) {
                currentModel = models[0]?.id;
            }
        }

        // Build options HTML
        this.modelSelect.innerHTML = models.map(m =>
            `<option value="${m.id}" ${m.id === currentModel ? 'selected' : ''}>${m.name}</option>`
        ).join('');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Capture editor selection when chat input receives focus
        // This is critical because clicking on the input loses the editor selection
        this.inputField.addEventListener('focus', () => {
            this.captureEditorSelection();
        });

        // Input field events
        this.inputField.addEventListener('input', () => {
            this.autoResizeInput();
            this.updateSendButtonState();
        });

        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Settings button
        const settingsBtn = this.container.querySelector('.ai-chat-settings-btn');
        settingsBtn.addEventListener('click', () => this.showSettings());

        // Clear button
        const clearBtn = this.container.querySelector('.ai-chat-clear-btn');
        clearBtn.addEventListener('click', () => this.clearChat());

        // Provider selector change
        this.providerSelect.addEventListener('change', async (e) => {
            const provider = e.target.value;
            try {
                await window.electronAPI.aiSetProvider(provider);
            } catch (error) {
                console.error('Error setting AI provider:', error);
            }
            await this.updateModelOptions(provider);
        });

        // Model selector change
        this.modelSelect.addEventListener('change', async (e) => {
            const model = e.target.value;
            const provider = this.providerSelect.value;
            try {
                await window.electronAPI.aiSetModel(model, provider);
            } catch (error) {
                console.error('Error setting AI model:', error);
            }
        });
    }

    /**
     * Capture the current editor selection before it's lost
     * Called when the chat input receives focus
     */
    captureEditorSelection() {
        if (!this.editor) {
            this.savedSelection = null;
            return;
        }

        try {
            const selection = this.editor.getSelection();
            if (selection && selection.text && selection.text.trim().length > 0) {
                this.savedSelection = {
                    from: selection.from,
                    to: selection.to,
                    text: selection.text
                };
            } else {
                this.savedSelection = null;
            }
        } catch (error) {
            console.error('Error capturing editor selection:', error);
            this.savedSelection = null;
        }
    }

    /**
     * Auto-resize the input textarea
     */
    autoResizeInput() {
        this.inputField.style.height = 'auto';
        const maxHeight = 120;
        this.inputField.style.height = Math.min(this.inputField.scrollHeight, maxHeight) + 'px';
    }

    /**
     * Update send button enabled state
     */
    updateSendButtonState() {
        const hasText = this.inputField.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isLoading;
    }

    /**
     * Send a message to the AI
     */
    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message || this.isLoading) return;

        // Clear input
        this.inputField.value = '';
        this.autoResizeInput();
        this.updateSendButtonState();

        // Remove welcome message if present
        const welcome = this.messagesContainer.querySelector('.ai-chat-welcome');
        if (welcome) {
            welcome.remove();
        }

        // Add user message to UI
        this.addMessage('user', message);

        // Show loading indicator
        this.isLoading = true;
        this.updateSendButtonState();
        const loadingEl = this.addLoadingIndicator();

        try {
            // Get current document content
            const documentContent = this.editor ? this.editor.getValue() : '';

            // Use the saved selection (captured when input received focus)
            const selection = this.savedSelection;
            const hasSelection = selection && selection.text && selection.text.trim().length > 0;

            // Send to API with selection info
            const result = await window.electronAPI.aiSendMessage(
                message,
                documentContent,
                hasSelection ? selection.text : null
            );

            // Remove loading indicator
            loadingEl.remove();

            if (result.success) {
                // Check if there's content to apply to editor
                if (result.applyContent) {
                    // If user had selection and mode is replace, use selection mode instead
                    if (hasSelection && result.applyContent.mode === 'replace') {
                        result.applyContent.mode = 'selection';
                        // Store the selection range for later use
                        result.applyContent.selectionRange = {
                            from: selection.from,
                            to: selection.to
                        };
                    }
                    this.handleApplyContent(result.applyContent, result.message);
                } else {
                    this.addMessage('assistant', result.message);
                }
            } else {
                this.addMessage('error', result.error);
            }
        } catch (error) {
            loadingEl.remove();
            this.addMessage('error', 'Failed to send message: ' + error.message);
        } finally {
            this.isLoading = false;
            this.updateSendButtonState();
            // Clear saved selection after message is processed
            this.savedSelection = null;
        }
    }

    /**
     * Handle content that should be applied to the editor
     * @param {Object} applyContent - { content, mode, displayMessage }
     * @param {string} fullMessage - The full AI response
     */
    handleApplyContent(applyContent, fullMessage) {
        const { content, mode, displayMessage, selectionRange } = applyContent;

        // Show the explanation message if present
        if (displayMessage) {
            this.addMessage('assistant', displayMessage);
        }

        // Create the apply content UI
        this.addApplyContentMessage(content, mode, selectionRange);
    }

    /**
     * Add a message with apply content UI
     * @param {string} content - The content to apply
     * @param {string} mode - 'replace', 'insert', 'append', or 'selection'
     * @param {Object|null} selectionRange - { from, to } for selection mode
     */
    addApplyContentMessage(content, mode, selectionRange = null) {
        const messageEl = document.createElement('div');
        messageEl.className = 'ai-chat-message ai-chat-message--apply';

        const modeLabels = {
            'replace': i18n.t('aiChat.applyReplace'),
            'insert': i18n.t('aiChat.applyInsert'),
            'append': i18n.t('aiChat.applyAppend'),
            'selection': i18n.t('aiChat.applySelection')
        };

        const modeLabel = modeLabels[mode] || modeLabels['replace'];

        // Truncate preview if too long
        const previewContent = content.length > 500
            ? content.substring(0, 500) + '...'
            : content;

        messageEl.innerHTML = `
            <div class="ai-apply-content">
                <div class="ai-apply-header">
                    <span class="ai-apply-icon">✨</span>
                    <span class="ai-apply-label">${i18n.t('aiChat.contentGenerated')}</span>
                    <span class="ai-apply-mode">${modeLabel}</span>
                </div>
                <div class="ai-apply-preview">
                    <pre><code>${this.escapeHtml(previewContent)}</code></pre>
                </div>
                <div class="ai-apply-actions">
                    <button class="ai-apply-btn ai-apply-btn--apply" title="${i18n.t('aiChat.applyToEditor')}">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                        </svg>
                        ${i18n.t('aiChat.apply')}
                    </button>
                    <button class="ai-apply-btn ai-apply-btn--copy" title="${i18n.t('aiChat.copy')}">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                        </svg>
                        ${i18n.t('aiChat.copy')}
                    </button>
                    <button class="ai-apply-btn ai-apply-btn--dismiss" title="${i18n.t('aiChat.dismiss')}">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for buttons
        const applyBtn = messageEl.querySelector('.ai-apply-btn--apply');
        const copyBtn = messageEl.querySelector('.ai-apply-btn--copy');
        const dismissBtn = messageEl.querySelector('.ai-apply-btn--dismiss');

        applyBtn.addEventListener('click', () => {
            this.applyContentToEditor(content, mode, selectionRange);
            this.markAsApplied(messageEl);
        });

        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(content);
                this.showCopyFeedback(copyBtn);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });

        dismissBtn.addEventListener('click', () => {
            messageEl.classList.add('ai-apply-dismissed');
            setTimeout(() => messageEl.remove(), 300);
        });

        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }

    /**
     * Apply content to the editor
     * @param {string} content - The content to apply
     * @param {string} mode - 'replace', 'insert', 'append', or 'selection'
     * @param {Object|null} selectionRange - { from, to } for selection mode
     */
    applyContentToEditor(content, mode, selectionRange = null) {
        if (!this.editor) return;

        switch (mode) {
            case 'selection':
                // Replace only the selected text using stored range
                if (selectionRange && selectionRange.from !== undefined && selectionRange.to !== undefined) {
                    // Use CodeMirror's dispatch to replace the specific range
                    const view = this.editor.view;
                    if (view) {
                        view.dispatch({
                            changes: {
                                from: selectionRange.from,
                                to: selectionRange.to,
                                insert: content
                            }
                        });
                    }
                } else {
                    // Fallback: try current selection
                    const selection = this.editor.getSelection();
                    if (selection && selection.text) {
                        this.editor.replaceSelection(content);
                    } else {
                        // Last fallback: insert at cursor
                        this.editor.insertText(content);
                    }
                }
                break;
            case 'replace':
                // Replace entire document
                this.editor.setValue(content);
                break;
            case 'insert':
                // Insert at cursor position
                this.editor.insertText(content);
                break;
            case 'append':
                // Append at the end
                const currentContent = this.editor.getValue();
                const separator = currentContent.endsWith('\n') ? '\n' : '\n\n';
                this.editor.setValue(currentContent + separator + content);
                break;
            default:
                this.editor.setValue(content);
        }

        this.showNotification(i18n.t('aiChat.contentApplied'), 'success');
    }

    /**
     * Mark the apply message as applied
     * @param {HTMLElement} messageEl
     */
    markAsApplied(messageEl) {
        const actionsEl = messageEl.querySelector('.ai-apply-actions');
        if (actionsEl) {
            actionsEl.innerHTML = `
                <span class="ai-apply-status ai-apply-status--applied">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                    </svg>
                    ${i18n.t('aiChat.applied')}
                </span>
            `;
        }
    }

    /**
     * Show copy feedback on button
     * @param {HTMLElement} btn
     */
    showCopyFeedback(btn) {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
            </svg>
            ${i18n.t('aiChat.copied')}
        `;
        btn.classList.add('ai-apply-btn--copied');

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('ai-apply-btn--copied');
        }, 2000);
    }

    /**
     * Show a notification
     * @param {string} message
     * @param {string} type - 'success', 'error', 'info'
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `ai-notification ai-notification--${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('ai-notification--visible');
        });

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('ai-notification--visible');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Add a message to the chat
     * @param {string} role - 'user', 'assistant', or 'error'
     * @param {string} content
     */
    addMessage(role, content) {
        const messageEl = document.createElement('div');
        messageEl.className = `ai-chat-message ai-chat-message--${role}`;

        if (role === 'assistant') {
            // Parse markdown in assistant messages
            messageEl.innerHTML = this.parseMarkdown(content);
            this.addCopyButtons(messageEl);
        } else if (role === 'error') {
            messageEl.innerHTML = `<span class="ai-chat-error-icon">⚠️</span> ${this.escapeHtml(content)}`;
        } else {
            messageEl.textContent = content;
        }

        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }

    /**
     * Add loading indicator
     * @returns {HTMLElement}
     */
    addLoadingIndicator() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'ai-chat-loading';
        loadingEl.innerHTML = `
            <div class="ai-chat-loading-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        this.messagesContainer.appendChild(loadingEl);
        this.scrollToBottom();
        return loadingEl;
    }

    /**
     * Scroll messages to bottom
     */
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    /**
     * Simple markdown parser for assistant messages
     * @param {string} text
     * @returns {string}
     */
    parseMarkdown(text) {
        let html = this.escapeHtml(text);

        // Code blocks
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre class="ai-chat-code-block" data-lang="${lang}"><code>${code.trim()}</code></pre>`;
        });

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code class="ai-chat-inline-code">$1</code>');

        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    /**
     * Escape HTML special characters
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Add copy buttons to code blocks
     * @param {HTMLElement} messageEl
     */
    addCopyButtons(messageEl) {
        const codeBlocks = messageEl.querySelectorAll('.ai-chat-code-block');
        codeBlocks.forEach(block => {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'ai-chat-copy-btn';
            copyBtn.textContent = i18n.t('aiChat.copy');
            copyBtn.addEventListener('click', async () => {
                const code = block.querySelector('code').textContent;
                try {
                    await navigator.clipboard.writeText(code);
                    copyBtn.textContent = i18n.t('aiChat.copied');
                    setTimeout(() => {
                        copyBtn.textContent = i18n.t('aiChat.copy');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            });
            block.appendChild(copyBtn);
        });
    }

    /**
     * Clear chat history
     */
    async clearChat() {
        try {
            await window.electronAPI.aiClearHistory();
            this.messagesContainer.innerHTML = `
                <div class="ai-chat-welcome">
                    <div class="ai-chat-welcome-icon">🤖</div>
                    <p>${i18n.t('aiChat.welcome')}</p>
                    <p class="ai-chat-welcome-hint">${i18n.t('aiChat.welcomeHint')}</p>
                </div>
            `;
        } catch (error) {
            console.error('Failed to clear chat:', error);
        }
    }

    /**
     * Show settings dialog
     */
    async showSettings() {
        const modal = document.createElement('div');
        modal.className = 'ai-chat-settings-modal';

        try {
            const settings = await window.electronAPI.aiGetSettings();
            const provider = settings?.provider || 'openai';

            modal.innerHTML = this.buildSettingsHTML(settings);
            document.body.appendChild(modal);

            this.setupSettingsEventListeners(modal, provider);
        } catch (error) {
            console.error('Failed to load settings:', error);
            modal.remove();
        }
    }

    /**
     * Build settings HTML
     * @param {Object} settings
     * @returns {string}
     */
    buildSettingsHTML(settings) {
        const openaiKey = settings?.openai?.apiKey || '';
        const anthropicKey = settings?.anthropic?.apiKey || '';
        const geminiKey = settings?.gemini?.apiKey || '';
        const groqKey = settings?.groq?.apiKey || '';
        const localUrl = settings?.local?.serverUrl || 'http://localhost:1234';
        const localApiKey = settings?.local?.apiKey || '';

        const providers = [
            { id: 'openai', name: 'OpenAI', key: openaiKey, placeholder: 'sk-...', url: 'https://platform.openai.com/api-keys', icon: '🤖' },
            { id: 'anthropic', name: 'Claude', key: anthropicKey, placeholder: 'sk-ant-...', url: 'https://console.anthropic.com/settings/keys', icon: '🧠' },
            { id: 'gemini', name: 'Gemini', key: geminiKey, placeholder: 'AIza...', url: 'https://aistudio.google.com/app/apikey', icon: '✨', free: true },
            { id: 'groq', name: 'Groq', key: groqKey, placeholder: 'gsk_...', url: 'https://console.groq.com/keys', icon: '⚡', free: true }
        ];

        const providerCards = providers.map(p => {
            const statusClass = p.key ? 'configured' : 'not-configured';
            const statusIcon = p.key ? '✓' : '○';
            const statusText = p.key ? i18n.t('aiSettings.configured') : i18n.t('aiSettings.notConfigured');

            return `
                <div class="ai-provider-card" data-provider="${p.id}">
                    <div class="ai-provider-header">
                        <div class="ai-provider-info">
                            <span class="ai-provider-icon">${p.icon}</span>
                            <span class="ai-provider-name">${p.name}</span>
                            ${p.free ? `<span class="ai-badge-free">${i18n.t('aiSettings.free')}</span>` : ''}
                        </div>
                        <div class="ai-provider-status ${statusClass}">
                            <span class="ai-status-icon">${statusIcon}</span>
                            <span class="ai-status-text">${statusText}</span>
                        </div>
                    </div>
                    <div class="ai-provider-body">
                        <div class="ai-key-input-wrapper">
                            <input type="password" 
                                   id="ai-${p.id}-key" 
                                   class="ai-key-input"
                                   value="${p.key}" 
                                   placeholder="${p.placeholder}">
                            <button type="button" class="ai-toggle-visibility" data-target="ai-${p.id}-key" title="${i18n.t('aiSettings.toggleVisibility')}">
                                <span class="ai-eye-icon">👁</span>
                            </button>
                            <button type="button" class="ai-test-key-btn" data-provider="${p.id}" title="${i18n.t('actions.test')}">
                                ${i18n.t('actions.test')}
                            </button>
                        </div>
                        <div class="ai-key-status" id="ai-${p.id}-status"></div>
                        <a href="${p.url}" target="_blank" class="ai-get-key-link">
                            <span class="ai-link-icon">🔗</span> ${i18n.t('aiSettings.getApiKey')}
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="ai-chat-settings-content">
                <div class="ai-settings-header">
                    <h3>${i18n.t('aiSettings.title')}</h3>
                    <p class="ai-settings-hint">${i18n.t('aiSettings.hint')}</p>
                </div>
                
                <div class="ai-settings-section">
                    <h4 class="ai-settings-section-title">
                        <span class="ai-section-icon">☁️</span>
                        ${i18n.t('aiSettings.cloudProviders')}
                    </h4>
                    <div class="ai-providers-grid">
                        ${providerCards}
                    </div>
                </div>

                <div class="ai-settings-section">
                    <h4 class="ai-settings-section-title">
                        <span class="ai-section-icon">🖥️</span>
                        ${i18n.t('aiSettings.localServer')}
                    </h4>
                    <div class="ai-provider-card local-server-card">
                        <div class="ai-provider-body">
                            <div class="ai-chat-settings-field">
                                <label for="ai-local-url">${i18n.t('aiSettings.serverUrl')}</label>
                                <div class="ai-key-input-wrapper">
                                    <input type="text" id="ai-local-url" value="${localUrl}" placeholder="http://localhost:1234">
                                    <button id="ai-test-connection" class="ai-test-key-btn">${i18n.t('actions.test')}</button>
                                </div>
                                <div class="ai-key-status" id="ai-connection-status"></div>
                            </div>
                            <div class="ai-chat-settings-field">
                                <label for="ai-local-api-key">${i18n.t('aiSettings.apiKeyOptional')}</label>
                                <div class="ai-key-input-wrapper">
                                    <input type="password" id="ai-local-api-key" value="${localApiKey}" placeholder="lm-studio-...">
                                    <button type="button" class="ai-toggle-visibility" data-target="ai-local-api-key" title="${i18n.t('aiSettings.toggleVisibility')}">
                                        <span class="ai-eye-icon">👁</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="ai-chat-settings-actions">
                    <button class="ai-chat-settings-cancel">${i18n.t('actions.cancel')}</button>
                    <button class="ai-chat-settings-save">${i18n.t('actions.save')}</button>
                </div>
            </div>
        `;
    }

    /**
     * Setup settings event listeners
     * @param {HTMLElement} modal
     * @param {string} currentProvider
 */
    setupSettingsEventListeners(modal, currentProvider) {
        // Toggle visibility buttons
        modal.querySelectorAll('.ai-toggle-visibility').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const input = modal.querySelector(`#${targetId}`);
                if (input) {
                    const isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';
                    btn.querySelector('.ai-eye-icon').textContent = isPassword ? '🙈' : '👁';
                }
            });
        });

        // Test API key buttons for cloud providers
        modal.querySelectorAll('.ai-test-key-btn[data-provider]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const provider = btn.dataset.provider;
                const input = modal.querySelector(`#ai-${provider}-key`);
                const statusEl = modal.querySelector(`#ai-${provider}-status`);

                if (!input || !statusEl) return;

                const apiKey = input.value.trim();
                if (!apiKey) {
                    statusEl.textContent = '✗ ' + i18n.t('aiSettings.enterKeyFirst');
                    statusEl.className = 'ai-key-status ai-chat-status-error';
                    return;
                }

                statusEl.textContent = i18n.t('aiSettings.testingConnection');
                statusEl.className = 'ai-key-status';
                btn.disabled = true;

                try {
                    const result = await window.electronAPI.aiTestApiKey(apiKey, provider);
                    if (result.success) {
                        statusEl.textContent = '✓ ' + i18n.t('aiSettings.keyValid');
                        statusEl.className = 'ai-key-status ai-chat-status-success';
                        this.updateProviderCardStatus(modal, provider, true);
                    } else {
                        statusEl.textContent = '✗ ' + (result.error || i18n.t('aiSettings.keyInvalid'));
                        statusEl.className = 'ai-key-status ai-chat-status-error';
                    }
                } catch (error) {
                    statusEl.textContent = '✗ ' + i18n.t('aiSettings.testFailed');
                    statusEl.className = 'ai-key-status ai-chat-status-error';
                }

                btn.disabled = false;
            });
        });

        // Test local server connection
        const testBtn = modal.querySelector('#ai-test-connection');
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                const statusEl = modal.querySelector('#ai-connection-status');

                statusEl.textContent = i18n.t('aiSettings.testingConnection');
                statusEl.className = 'ai-key-status';

                const url = modal.querySelector('#ai-local-url').value.trim();
                const apiKey = modal.querySelector('#ai-local-api-key').value.trim();

                await window.electronAPI.aiSetLocalUrl(url);
                await window.electronAPI.aiSetLocalApiKey(apiKey);

                const result = await window.electronAPI.aiTestLocalConnection();

                if (result.success) {
                    statusEl.textContent = '✓ ' + i18n.t('aiSettings.connectedSuccessfully');
                    statusEl.className = 'ai-key-status ai-chat-status-success';
                } else {
                    statusEl.textContent = '✗ ' + i18n.t('aiSettings.connectionFailed') + ': ' + result.error;
                    statusEl.className = 'ai-key-status ai-chat-status-error';
                }
            });
        }

        const cancelBtn = modal.querySelector('.ai-chat-settings-cancel');
        const saveBtn = modal.querySelector('.ai-chat-settings-save');

        cancelBtn.addEventListener('click', () => modal.remove());

        saveBtn.addEventListener('click', async () => {
            try {
                // Save ALL API keys
                const openaiKey = modal.querySelector('#ai-openai-key').value.trim();
                await window.electronAPI.aiSetApiKey(openaiKey, 'openai');

                const anthropicKey = modal.querySelector('#ai-anthropic-key').value.trim();
                await window.electronAPI.aiSetApiKey(anthropicKey, 'anthropic');

                const geminiKey = modal.querySelector('#ai-gemini-key').value.trim();
                await window.electronAPI.aiSetApiKey(geminiKey, 'gemini');

                const groqKey = modal.querySelector('#ai-groq-key').value.trim();
                await window.electronAPI.aiSetApiKey(groqKey, 'groq');

                // Save local settings
                const localUrl = modal.querySelector('#ai-local-url').value.trim();
                const localApiKey = modal.querySelector('#ai-local-api-key').value.trim();
                await window.electronAPI.aiSetLocalUrl(localUrl);
                await window.electronAPI.aiSetLocalApiKey(localApiKey);

                modal.remove();

                // Reload provider options to reflect new API keys
                await this.loadCurrentProviderAndModel();
            } catch (error) {
                console.error('Error saving AI settings:', error);
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Update provider card status indicator
     * @param {HTMLElement} modal
     * @param {string} provider
     * @param {boolean} isConfigured
     */
    updateProviderCardStatus(modal, provider, isConfigured) {
        const card = modal.querySelector(`.ai-provider-card[data-provider="${provider}"]`);
        if (!card) return;

        const statusEl = card.querySelector('.ai-provider-status');
        if (statusEl) {
            statusEl.className = `ai-provider-status ${isConfigured ? 'configured' : 'not-configured'}`;
            statusEl.querySelector('.ai-status-icon').textContent = isConfigured ? '✓' : '○';
            statusEl.querySelector('.ai-status-text').textContent = isConfigured
                ? i18n.t('aiSettings.configured')
                : i18n.t('aiSettings.notConfigured');
        }
    }

    /**
     * Load models from local server
     * @param {HTMLElement} modal
     */
    async loadLocalModels(modal) {
        const select = modal.querySelector('#ai-local-model');
        const currentValue = select.value;

        select.innerHTML = `<option value="">${i18n.t('actions.loading')}</option>`;

        try {
            const models = await window.electronAPI.aiFetchLocalModels();

            select.innerHTML = models.map(m =>
                `<option value="${m.id}" ${m.id === currentValue ? 'selected' : ''}>${m.name}</option>`
            ).join('');
        } catch (error) {
            console.error('Failed to load local models:', error);
            select.innerHTML = `<option value="default">${i18n.t('aiSettings.defaultModel')}</option>`;
        }
    }
}

module.exports = AIChatPanel;
