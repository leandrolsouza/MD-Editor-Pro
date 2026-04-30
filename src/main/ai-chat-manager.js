/**
 * AI Chat Manager
 * Handles communication with multiple AI providers:
 * - OpenAI (GPT-4o, GPT-4o-mini, etc.)
 * - Anthropic Claude (Claude 3.5 Sonnet, Claude 3 Opus, etc.)
 * - Google Gemini (Gemini 1.5 Pro, Gemini 1.5 Flash)
 * - Groq (Llama 3, Mixtral - fast inference)
 * - Local LLM servers (LM Studio, Ollama, etc.)
 */

const { net } = require('electron');

/**
 * Default timeout for AI API requests (30 seconds)
 */
const API_REQUEST_TIMEOUT_MS = 30000;

/**
 * Creates an AbortSignal that times out after the specified duration
 * @param {number} ms - Timeout in milliseconds
 * @returns {AbortSignal}
 */
function createTimeoutSignal(ms = API_REQUEST_TIMEOUT_MS) {
    return AbortSignal.timeout(ms);
}

/**
 * Validates a URL string for safe network requests
 * @param {string} url - The URL to validate
 * @param {string[]} allowedProtocols - Allowed protocols
 * @returns {string} The validated URL
 * @throws {Error} If URL is invalid or uses a disallowed protocol
 */
function validateUrl(url, allowedProtocols = ['http:', 'https:']) {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL: must be a non-empty string');
    }

    let parsed;

    try {
        parsed = new URL(url);
    } catch {
        throw new Error(`Invalid URL format: ${url}`);
    }

    if (!allowedProtocols.includes(parsed.protocol)) {
        throw new Error(`Blocked URL with disallowed protocol "${parsed.protocol}"`);
    }

    return url;
}

class AIChatManager {
    constructor(configStore) {
        this.configStore = configStore;
        this.conversationHistory = [];
        this.maxHistoryLength = 20;

        // Provider configurations
        this.providerConfigs = {
            openai: {
                endpoint: 'https://api.openai.com/v1/chat/completions',
                keyPath: 'ai.openai.apiKey',
                modelPath: 'ai.openai.model',
                defaultModel: 'gpt-4o-mini'
            },
            anthropic: {
                endpoint: 'https://api.anthropic.com/v1/messages',
                keyPath: 'ai.anthropic.apiKey',
                modelPath: 'ai.anthropic.model',
                defaultModel: 'claude-3-5-sonnet-20241022'
            },
            gemini: {
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
                keyPath: 'ai.gemini.apiKey',
                modelPath: 'ai.gemini.model',
                defaultModel: 'gemini-1.5-flash'
            },
            groq: {
                endpoint: 'https://api.groq.com/openai/v1/chat/completions',
                keyPath: 'ai.groq.apiKey',
                modelPath: 'ai.groq.model',
                defaultModel: 'llama-3.3-70b-versatile'
            },
            local: {
                keyPath: 'ai.local.apiKey',
                modelPath: 'ai.local.model',
                defaultModel: 'default'
            }
        };
    }

    /**
     * Get the current provider
     * @returns {string}
     */
    getProvider() {
        return this.configStore.get('ai.provider') || 'openai';
    }

    /**
     * Set the provider
     * @param {string} provider
     */
    setProvider(provider) {
        this.configStore.set('ai.provider', provider);
    }

    /**
     * Get API key for current or specified provider
     * @param {string} [provider] - Optional provider, defaults to current
     * @returns {string|null}
     */
    getApiKey(provider) {
        const p = provider || this.getProvider();
        const config = this.providerConfigs[p];
        if (!config) return null;
        return this.configStore.get(config.keyPath) || null;
    }

    /**
     * Set API key for current or specified provider
     * @param {string} apiKey
     * @param {string} [provider] - Optional provider, defaults to current
     */
    setApiKey(apiKey, provider) {
        const p = provider || this.getProvider();
        const config = this.providerConfigs[p];
        if (config) {
            this.configStore.set(config.keyPath, apiKey);
        }
    }

    /**
     * Get the selected model for current or specified provider
     * @param {string} [provider] - Optional provider
     * @returns {string}
     */
    getModel(provider) {
        const p = provider || this.getProvider();
        const config = this.providerConfigs[p];
        if (!config) return 'default';
        return this.configStore.get(config.modelPath) || config.defaultModel;
    }

    /**
     * Set the model for current or specified provider
     * @param {string} model
     * @param {string} [provider] - Optional provider
     */
    setModel(model, provider) {
        const p = provider || this.getProvider();
        const config = this.providerConfigs[p];
        if (config) {
            this.configStore.set(config.modelPath, model);
        }
    }

    /**
     * Get local server URL
     * @returns {string}
     */
    getLocalServerUrl() {
        return this.configStore.get('ai.local.serverUrl') || 'http://localhost:1234';
    }

    /**
     * Set local server URL
     * @param {string} url
     * @throws {Error} If URL is invalid
     */
    setLocalServerUrl(url) {
        validateUrl(url, ['http:', 'https:']);
        this.configStore.set('ai.local.serverUrl', url);
    }

    /**
     * Get local server API key
     * @returns {string|null}
     */
    getLocalApiKey() {
        return this.configStore.get('ai.local.apiKey') || null;
    }

    /**
     * Set local server API key
     * @param {string} apiKey
     */
    setLocalApiKey(apiKey) {
        this.configStore.set('ai.local.apiKey', apiKey);
    }

    /**
     * Clear conversation history
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * Add message to conversation history
     * @param {string} role
     * @param {string} content
     */
    addToHistory(role, content) {
        this.conversationHistory.push({ role, content });

        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
    }

    /**
     * Remove last message from history
     */
    removeLastFromHistory() {
        if (this.conversationHistory.length > 0) {
            this.conversationHistory.pop();
        }
    }

    /**
     * Get the API endpoint URL based on provider
     * @returns {string}
     */
    getApiEndpoint() {
        const provider = this.getProvider();

        if (provider === 'local') {
            const baseUrl = this.getLocalServerUrl().replace(/\/$/, '');
            return `${baseUrl}/v1/chat/completions`;
        }

        if (provider === 'gemini') {
            const model = this.getModel();
            return `${this.providerConfigs.gemini.endpoint}/${model}:generateContent`;
        }

        const config = this.providerConfigs[provider];
        return config ? config.endpoint : this.providerConfigs.openai.endpoint;
    }

    /**
     * Build request headers based on provider
     * @returns {Object}
     */
    buildHeaders() {
        const provider = this.getProvider();
        const headers = {
            'Content-Type': 'application/json'
        };

        if (provider === 'local') {
            const localApiKey = this.getLocalApiKey();
            if (localApiKey) {
                headers['Authorization'] = `Bearer ${localApiKey}`;
            }
        } else if (provider === 'anthropic') {
            const apiKey = this.getApiKey();
            if (apiKey) {
                headers['x-api-key'] = apiKey;
                headers['anthropic-version'] = '2023-06-01';
            }
        } else if (provider === 'gemini') {
            // Gemini uses API key in URL, not headers
        } else {
            // OpenAI and Groq use Bearer token
            const apiKey = this.getApiKey();
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
        }

        return headers;
    }

    /**
     * Convert messages to Anthropic format
     * @param {Array} messages - OpenAI format messages
     * @returns {Object} - { system, messages }
     */
    convertToAnthropicFormat(messages) {
        let systemMessage = '';
        const anthropicMessages = [];

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemMessage = msg.content;
            } else {
                anthropicMessages.push({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                });
            }
        }

        return { system: systemMessage, messages: anthropicMessages };
    }

    /**
     * Convert messages to Gemini format
     * @param {Array} messages - OpenAI format messages
     * @returns {Object} - Gemini request body
     */
    convertToGeminiFormat(messages) {
        let systemInstruction = '';
        const contents = [];

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemInstruction = msg.content;
            } else {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                });
            }
        }

        const body = {
            contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
            }
        };

        if (systemInstruction) {
            body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        return body;
    }


    /**
     * Make API request
     * @param {Array} messages
     * @returns {Promise<Response>}
     */
    async makeApiRequest(messages) {
        const provider = this.getProvider();

        if (provider === 'anthropic') {
            return this.makeAnthropicRequest(messages);
        }

        if (provider === 'gemini') {
            return this.makeGeminiRequest(messages);
        }

        // OpenAI, Groq, and Local use the same format
        return net.fetch(this.getApiEndpoint(), {
            method: 'POST',
            headers: this.buildHeaders(),
            signal: createTimeoutSignal(),
            body: JSON.stringify({
                model: this.getModel(),
                messages: messages,
                temperature: 0.7,
                max_tokens: 2048
            })
        });
    }

    /**
     * Make Anthropic API request
     * @param {Array} messages
     * @returns {Promise<Response>}
     */
    async makeAnthropicRequest(messages) {
        const { system, messages: anthropicMessages } = this.convertToAnthropicFormat(messages);

        const body = {
            model: this.getModel(),
            max_tokens: 2048,
            messages: anthropicMessages
        };

        if (system) {
            body.system = system;
        }

        return net.fetch(this.getApiEndpoint(), {
            method: 'POST',
            headers: this.buildHeaders(),
            signal: createTimeoutSignal(),
            body: JSON.stringify(body)
        });
    }

    /**
     * Make Gemini API request
     * @param {Array} messages
     * @returns {Promise<Response>}
     */
    async makeGeminiRequest(messages) {
        const body = this.convertToGeminiFormat(messages);
        const apiKey = this.getApiKey();
        const endpoint = `${this.getApiEndpoint()}?key=${apiKey}`;

        return net.fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: createTimeoutSignal(),
            body: JSON.stringify(body)
        });
    }

    /**
     * Parse response based on provider
     * @param {Object} data - Response data
     * @returns {string} - Assistant message content
     */
    parseResponseContent(data) {
        const provider = this.getProvider();

        if (provider === 'anthropic') {
            return data.content?.[0]?.text || '';
        }

        if (provider === 'gemini') {
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }

        // OpenAI, Groq, Local
        return data.choices?.[0]?.message?.content || '';
    }

    /**
     * Send a message and get a response
     * @param {string} userMessage - The user's message
     * @param {string} documentContent - Current document content for context
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    async sendMessage(userMessage, documentContent = '', selectedText = null) {
        const provider = this.getProvider();

        // Check API key (not required for local)
        if (provider !== 'local' && !this.getApiKey()) {
            const providerNames = {
                openai: 'OpenAI',
                anthropic: 'Anthropic',
                gemini: 'Google Gemini',
                groq: 'Groq'
            };
            return {
                success: false,
                error: `API key not configured. Please set your ${providerNames[provider] || provider} API key in settings.`
            };
        }

        try {
            const systemMessage = this.buildSystemMessage(documentContent, selectedText);

            this.addToHistory('user', userMessage);

            const messages = [
                { role: 'system', content: systemMessage },
                ...this.conversationHistory
            ];

            const response = await this.makeApiRequest(messages);

            if (!response.ok) {
                this.removeLastFromHistory();
                const errorData = await response.json().catch(() => ({}));

                // Handle provider-specific error formats
                let errorMessage = `API error: ${response.status}`;
                if (errorData.error?.message) {
                    errorMessage = errorData.error.message;
                } else if (errorData.error?.error?.message) {
                    errorMessage = errorData.error.error.message;
                }

                return {
                    success: false,
                    error: errorMessage
                };
            }

            const data = await response.json();
            const assistantMessage = this.parseResponseContent(data);

            this.addToHistory('assistant', assistantMessage);

            // Check if the response contains content to apply to editor
            const applyContent = this.extractApplyContent(assistantMessage);

            return {
                success: true,
                message: assistantMessage,
                applyContent: applyContent
            };
        } catch (error) {
            this.removeLastFromHistory();
            console.error('AI API error:', error);

            return {
                success: false,
                error: error.message || 'Failed to communicate with AI service'
            };
        }
    }

    /**
     * Extract content marked for application to editor
     * @param {string} message - The AI response message
     * @returns {Object|null} - { content: string, mode: string, displayMessage: string } or null
     */
    extractApplyContent(message) {
        // Match the apply markers with optional mode attribute
        const applyRegex = /<<<APPLY_TO_EDITOR(?:\s+mode="(replace|insert|append)")?>>>([\s\S]*?)<<<END_APPLY>>>/;
        const match = message.match(applyRegex);

        if (!match) {
            return null;
        }

        const mode = match[1] || 'replace';
        const content = match[2].trim();

        // Get the message without the apply block for display
        const displayMessage = message
            .replace(applyRegex, '')
            .trim();

        return {
            content,
            mode,
            displayMessage: displayMessage || null
        };
    }

    /**
     * Build the system message with document context
     * @param {string} documentContent
     * @param {string|null} selectedText
     * @returns {string}
     */
    buildSystemMessage(documentContent, selectedText = null) {
        let systemMessage = `You are a helpful writing assistant integrated into a Markdown editor called MD Editor Pro. 
Your role is to help users with their markdown documents - answering questions, suggesting improvements, 
helping with formatting, generating content, and providing writing assistance.

Be concise and helpful. When suggesting markdown, use proper formatting.

IMPORTANT - Content Generation Rules:
When the user asks you to EDIT, MODIFY, REWRITE, GENERATE, CREATE, ADD, or CHANGE content in their document, you MUST:
1. Wrap the content to be applied in special markers: <<<APPLY_TO_EDITOR>>> and <<<END_APPLY>>>
2. The content between these markers will be automatically applied to the editor
3. You can include a brief explanation BEFORE the markers
4. Use the appropriate mode based on the operation type

MODES AVAILABLE:
- mode="replace" - Replaces the ENTIRE document with the new content
- mode="insert" - Inserts content at the cursor position
- mode="append" - Adds content at the end of the document

CRITICAL RULES FOR PARTIAL EDITS (when user asks to edit a specific part WITHOUT selecting text):
When the user asks to edit/rewrite/improve a SPECIFIC PART of the document (like "rewrite the introduction", 
"improve the second paragraph", "fix the conclusion"), you MUST:
1. Use mode="replace" 
2. Return the COMPLETE document with ONLY that specific part modified
3. Keep all other parts of the document EXACTLY as they are
4. This ensures the edit is applied correctly without losing any content

Example - User asks "rewrite the first paragraph to be more engaging":
"I've improved the first paragraph:"
<<<APPLY_TO_EDITOR mode="replace">>>
[The entire document with only the first paragraph changed, everything else identical]
<<<END_APPLY>>>

CRITICAL RULES FOR SELECTED TEXT (when user has text selected):
When the user has SELECTED TEXT and asks to edit/rewrite/modify it:
- Return ONLY the replacement for the selected portion, NOT the entire document
- Use mode="replace" - the system will automatically apply it only to the selection
- Do NOT include content that wasn't selected

Example for editing selected text:
"Here's the improved version of your selection:"
<<<APPLY_TO_EDITOR mode="replace">>>
The rewritten selected text only...
<<<END_APPLY>>>

RULES FOR NEW CONTENT:
- To add new content at the end: use mode="append"
- To insert at cursor position: use mode="insert"

Example for generating new content:
"I've created a new section for you:"
<<<APPLY_TO_EDITOR mode="append">>>
## New Section
New content here...
<<<END_APPLY>>>

If the user is just asking questions or wants suggestions without automatic application, respond normally without the markers.`;

        // Add selected text context if present
        if (selectedText && selectedText.trim()) {
            systemMessage += `

IMPORTANT: The user has SELECTED the following text in their editor:

---SELECTED TEXT---
${selectedText.substring(0, 2000)}
${selectedText.length > 2000 ? '\n[Selection truncated...]' : ''}
---END SELECTED TEXT---

When asked to edit, rewrite, or modify, apply changes ONLY to this selected text. Return only the replacement content, not the entire document.`;
        } else if (documentContent && documentContent.trim()) {
            // Only add this instruction when there's NO selection
            systemMessage += `

NOTE: The user has NOT selected any specific text. If they ask to edit a specific part of the document 
(like a paragraph, section, or sentence), you must return the COMPLETE document with only that part modified.`;
        }

        if (documentContent && documentContent.trim()) {
            systemMessage += `

The user is currently working on the following document:

---FULL DOCUMENT---
${documentContent.substring(0, 8000)}
${documentContent.length > 8000 ? '\n[Document truncated...]' : ''}
---END DOCUMENT---

Use this context to provide relevant assistance. When editing specific parts, preserve all other content exactly.`;
        }

        return systemMessage;
    }


    /**
     * Get available models for current provider
     * @returns {Array<{id: string, name: string}>}
     */
    getAvailableModels() {
        const provider = this.getProvider();

        if (provider === 'local') {
            return [
                { id: 'default', name: 'Default Model (from server)' }
            ];
        }

        if (provider === 'anthropic') {
            return [
                { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Recommended)' },
                { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
                { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Most Capable)' },
                { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
                { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
            ];
        }

        if (provider === 'gemini') {
            return [
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast & Free)' },
                { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B (Fastest)' },
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Most Capable)' },
                { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' }
            ];
        }

        if (provider === 'groq') {
            return [
                { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Recommended)' },
                { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B' },
                { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fastest)' },
                { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
                { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
            ];
        }

        // OpenAI
        return [
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Affordable)' },
            { id: 'gpt-4o', name: 'GPT-4o (Most Capable)' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Legacy)' }
        ];
    }

    /**
     * Build headers for local server requests
     * @returns {Object}
     */
    buildLocalHeaders() {
        const headers = {};
        const localApiKey = this.getLocalApiKey();

        if (localApiKey) {
            headers['Authorization'] = `Bearer ${localApiKey}`;
        }

        return headers;
    }

    /**
     * Try to fetch from an endpoint
     * @param {string} endpoint
     * @param {Object} headers
     * @returns {Promise<Response|null>}
     */
    async tryFetchEndpoint(endpoint, headers) {
        try {
            return await net.fetch(endpoint, { headers, signal: createTimeoutSignal(10000) });
        } catch (error) {
            console.log(`Endpoint ${endpoint} failed:`, error.message);

            return null;
        }
    }

    /**
     * Extract model ID from model object
     * @param {Object|string} model
     * @returns {{id: string, name: string}}
     */
    extractModelInfo(model) {
        if (typeof model === 'string') {
            return { id: model, name: model };
        }

        if (!model || typeof model !== 'object') {
            return { id: 'unknown', name: 'Unknown Model' };
        }

        // LM Studio uses 'key' for ID and 'display_name' for friendly name
        // OpenAI-compatible servers typically use 'id'
        const id = model.key || model.id || model.model || model.name || model.path || 'unknown';
        const name = model.display_name || model.name || id;

        return { id, name };
    }

    /**
     * Fetch models from local server
     * @returns {Promise<Array<{id: string, name: string}>>}
     */
    async fetchLocalModels() {
        const baseUrl = this.getLocalServerUrl().replace(/\/$/, '');
        const headers = this.buildLocalHeaders();
        const endpoints = [`${baseUrl}/api/v1/models`, `${baseUrl}/v1/models`];

        for (const endpoint of endpoints) {
            const response = await this.tryFetchEndpoint(endpoint, headers);

            if (response && response.ok) {
                const data = await response.json();
                console.log('[AI Chat] Models response from', endpoint);
                console.log('[AI Chat] Raw data:', JSON.stringify(data, null, 2));

                // Handle different response formats
                let models = [];

                if (Array.isArray(data)) {
                    models = data;
                } else if (data.data && Array.isArray(data.data)) {
                    models = data.data;
                } else if (data.models && Array.isArray(data.models)) {
                    models = data.models;
                } else if (typeof data === 'object' && data !== null) {
                    // Maybe the response itself is a single model or has unexpected structure
                    console.log('[AI Chat] Data keys:', Object.keys(data));
                }

                console.log('[AI Chat] Extracted models array:', models.length, 'items');

                if (models.length > 0) {
                    // Filter out embedding models for chat (only keep LLMs)
                    const llmModels = models.filter(m => !m.type || m.type === 'llm');
                    const modelsToUse = llmModels.length > 0 ? llmModels : models;

                    const result = modelsToUse.map((m, index) => {
                        console.log(`[AI Chat] Model ${index}:`, typeof m, JSON.stringify(m));
                        const info = this.extractModelInfo(m);

                        return info;
                    });

                    console.log('[AI Chat] Final models:', result);

                    return result;
                }

                return [{ id: 'default', name: 'Default Model' }];
            }
        }

        return [{ id: 'default', name: 'Default Model' }];
    }

    /**
     * Test connection to local server
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async testLocalConnection() {
        const baseUrl = this.getLocalServerUrl().replace(/\/$/, '');
        const headers = this.buildLocalHeaders();
        const endpoints = [`${baseUrl}/api/v1/models`, `${baseUrl}/v1/models`];

        for (const endpoint of endpoints) {
            const response = await this.tryFetchEndpoint(endpoint, headers);

            if (response) {
                if (response.ok) {
                    return { success: true };
                }

                if (response.status === 401 || response.status === 403) {
                    const data = await response.json().catch(() => ({}));

                    return {
                        success: false,
                        error: data.error?.message || 'Authentication required. Please provide an API key.'
                    };
                }
            }
        }

        return { success: false, error: 'Could not connect to server' };
    }

    /**
     * Test if an API key is valid for a given provider
     * @param {string} apiKey - The API key to test
     * @param {string} provider - The provider (openai, anthropic, gemini, groq)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async testApiKey(apiKey, provider) {
        if (!apiKey) {
            return { success: false, error: 'No API key provided' };
        }

        try {
            const endpoints = {
                openai: 'https://api.openai.com/v1/models',
                anthropic: 'https://api.anthropic.com/v1/models',
                gemini: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
                groq: 'https://api.groq.com/openai/v1/models'
            };

            const endpoint = endpoints[provider];
            if (!endpoint) {
                return { success: false, error: 'Unknown provider' };
            }

            const headers = { 'Content-Type': 'application/json' };

            if (provider === 'openai' || provider === 'groq') {
                headers['Authorization'] = `Bearer ${apiKey}`;
            } else if (provider === 'anthropic') {
                headers['x-api-key'] = apiKey;
                headers['anthropic-version'] = '2023-06-01';
            }
            // Gemini uses key in URL

            const response = await net.fetch(endpoint, {
                method: 'GET',
                headers,
                signal: createTimeoutSignal(10000)
            });

            if (response.ok) {
                return { success: true };
            }

            const data = await response.json().catch(() => ({}));
            const errorMsg = data.error?.message || data.message || `HTTP ${response.status}`;

            return { success: false, error: errorMsg };
        } catch (error) {
            return { success: false, error: error.message || 'Connection failed' };
        }
    }

    /**
     * Get current settings
     * @returns {Object}
     */
    getSettings() {
        return {
            provider: this.getProvider(),
            openai: {
                apiKey: this.getApiKey('openai') || '',
                model: this.configStore.get('ai.openai.model') || 'gpt-4o-mini'
            },
            anthropic: {
                apiKey: this.getApiKey('anthropic') || '',
                model: this.configStore.get('ai.anthropic.model') || 'claude-3-5-sonnet-20241022'
            },
            gemini: {
                apiKey: this.getApiKey('gemini') || '',
                model: this.configStore.get('ai.gemini.model') || 'gemini-1.5-flash'
            },
            groq: {
                apiKey: this.getApiKey('groq') || '',
                model: this.configStore.get('ai.groq.model') || 'llama-3.3-70b-versatile'
            },
            local: {
                serverUrl: this.getLocalServerUrl(),
                apiKey: this.getLocalApiKey() || '',
                model: this.configStore.get('ai.local.model') || 'default'
            }
        };
    }

    /**
     * Transform selected text using AI
     * @param {string} selectedText - The text to transform
     * @param {string} command - The transformation command (rewrite, summarize, expand, fix-grammar, translate, custom)
     * @param {string} customPrompt - Custom prompt for 'custom' command
     * @param {string} targetLanguage - Target language for translation
     * @returns {Promise<{success: boolean, result?: string, error?: string}>}
     */
    async transformText(selectedText, command, customPrompt = '', targetLanguage = 'English') {
        const provider = this.getProvider();

        if (provider !== 'local' && !this.getApiKey()) {
            return {
                success: false,
                error: 'API key not configured. Please set your API key in AI Chat settings.'
            };
        }

        const prompts = {
            'rewrite': `Rewrite the following text to improve clarity and flow while maintaining the same meaning. Keep the same language as the original. Return ONLY the rewritten text, no explanations:\n\n${selectedText}`,
            'summarize': `Summarize the following text concisely. Keep the same language as the original. Return ONLY the summary, no explanations:\n\n${selectedText}`,
            'expand': `Expand the following text with more details and examples. Keep the same language and markdown formatting. Return ONLY the expanded text, no explanations:\n\n${selectedText}`,
            'fix-grammar': `Fix any grammar, spelling, and punctuation errors in the following text. Keep the same language. Return ONLY the corrected text, no explanations:\n\n${selectedText}`,
            'translate': `Translate the following text to ${targetLanguage}. Return ONLY the translation, no explanations:\n\n${selectedText}`,
            'formal': `Rewrite the following text in a more formal, professional tone. Keep the same language. Return ONLY the rewritten text, no explanations:\n\n${selectedText}`,
            'casual': `Rewrite the following text in a more casual, friendly tone. Keep the same language. Return ONLY the rewritten text, no explanations:\n\n${selectedText}`,
            'custom': `${customPrompt}\n\nText:\n${selectedText}`
        };

        const prompt = prompts[command] || prompts['rewrite'];

        try {
            const messages = [
                { role: 'system', content: 'You are a helpful writing assistant. Follow the instructions precisely and return only the requested output without any additional commentary or explanations.' },
                { role: 'user', content: prompt }
            ];

            const response = await this.makeApiRequest(messages);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = `API error: ${response.status}`;
                if (errorData.error?.message) {
                    errorMessage = errorData.error.message;
                }

                return {
                    success: false,
                    error: errorMessage
                };
            }

            const data = await response.json();
            const result = this.parseResponseContent(data);

            return { success: true, result: result.trim() };
        } catch (error) {
            console.error('AI transform error:', error);

            return {
                success: false,
                error: error.message || 'Failed to transform text'
            };
        }
    }
}

module.exports = AIChatManager;
