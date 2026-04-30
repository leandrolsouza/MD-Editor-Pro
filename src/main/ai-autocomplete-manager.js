/**
 * AI Autocomplete Manager
 * Handles AI-powered text completion suggestions while typing
 * Supports: OpenAI, Anthropic Claude, Google Gemini, Groq, Local LLM
 */

const { net } = require('electron');

/**
 * Timeout for autocomplete API requests (15 seconds — shorter than chat)
 */
const AUTOCOMPLETE_TIMEOUT_MS = 15000;

class AIAutocompleteManager {
    constructor(configStore) {
        this.configStore = configStore;
        // Default to true for easier testing, users can disable if needed
        this.enabled = this.configStore.get('aiAutocomplete.enabled') ?? true;
        this.debounceMs = this.configStore.get('aiAutocomplete.debounceMs') ?? 500;
        this.minCharsToTrigger = this.configStore.get('aiAutocomplete.minChars') ?? 10;
        this.maxTokens = this.configStore.get('aiAutocomplete.maxTokens') ?? 50;

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
                defaultModel: 'claude-3-5-haiku-20241022'
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
                defaultModel: 'llama-3.1-8b-instant'
            },
            local: {
                keyPath: 'ai.local.apiKey',
                modelPath: 'ai.local.model',
                defaultModel: 'default'
            }
        };
    }

    isEnabled() {
        return this.enabled;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.configStore.set('aiAutocomplete.enabled', enabled);
    }

    getDebounceMs() {
        return this.debounceMs;
    }

    setDebounceMs(ms) {
        this.debounceMs = ms;
        this.configStore.set('aiAutocomplete.debounceMs', ms);
    }

    getMinCharsToTrigger() {
        return this.minCharsToTrigger;
    }

    setMinCharsToTrigger(chars) {
        this.minCharsToTrigger = chars;
        this.configStore.set('aiAutocomplete.minChars', chars);
    }

    getMaxTokens() {
        return this.maxTokens;
    }

    setMaxTokens(tokens) {
        this.maxTokens = tokens;
        this.configStore.set('aiAutocomplete.maxTokens', tokens);
    }

    getSettings() {
        return {
            enabled: this.enabled,
            debounceMs: this.debounceMs,
            minCharsToTrigger: this.minCharsToTrigger,
            maxTokens: this.maxTokens
        };
    }

    getProvider() {
        return this.configStore.get('ai.provider') || 'openai';
    }

    getApiKey() {
        const provider = this.getProvider();
        const config = this.providerConfigs[provider];
        if (!config) return '';
        return this.configStore.get(config.keyPath) || '';
    }

    getModel() {
        const provider = this.getProvider();
        const config = this.providerConfigs[provider];
        if (!config) return 'default';

        // Use faster models for autocomplete
        const autocompleteModels = {
            openai: 'gpt-4o-mini',
            anthropic: 'claude-3-5-haiku-20241022',
            gemini: 'gemini-1.5-flash',
            groq: 'llama-3.1-8b-instant',
            local: this.configStore.get('ai.local.model') || 'default'
        };

        return autocompleteModels[provider] || config.defaultModel;
    }

    getLocalServerUrl() {
        return this.configStore.get('ai.local.serverUrl') || 'http://localhost:1234';
    }

    getLocalApiKey() {
        return this.configStore.get('ai.local.apiKey') || '';
    }

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
            // Gemini uses API key in URL
        } else {
            // OpenAI and Groq
            const apiKey = this.getApiKey();
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
        }

        return headers;
    }

    /**
     * Get autocomplete suggestion for the given context
     * @param {string} textBefore - Text before cursor
     * @param {string} textAfter - Text after cursor (for context)
     * @returns {Promise<{success: boolean, suggestion?: string, error?: string}>}
     */
    async getSuggestion(textBefore, textAfter = '') {
        if (!this.enabled) {
            return { success: false, error: 'Autocomplete is disabled' };
        }

        const provider = this.getProvider();
        if (provider !== 'local' && !this.getApiKey()) {
            return { success: false, error: 'API key not configured' };
        }

        // Don't trigger for very short text
        if (textBefore.length < this.minCharsToTrigger) {
            return { success: false, error: 'Text too short' };
        }

        try {
            const systemPrompt = `You are an autocomplete engine. Complete the user's text naturally.

RULES:
- Output ONLY the continuation (3-12 words max)
- NO explanations, NO quotes, NO prefixes like "Completion:"
- Match the language (Portuguese/English/etc)
- Complete the current thought naturally
- If mid-word, finish that word first
- Empty response if no good completion`;

            const userPrompt = this.buildUserPrompt(textBefore, textAfter);

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            let response;
            let suggestion = '';

            if (provider === 'anthropic') {
                response = await this.makeAnthropicRequest(messages);
            } else if (provider === 'gemini') {
                response = await this.makeGeminiRequest(messages);
            } else {
                // OpenAI, Groq, Local
                response = await net.fetch(this.getApiEndpoint(), {
                    method: 'POST',
                    headers: this.buildHeaders(),
                    signal: AbortSignal.timeout(AUTOCOMPLETE_TIMEOUT_MS),
                    body: JSON.stringify({
                        model: this.getModel(),
                        messages: messages,
                        temperature: 0.2,
                        max_tokens: this.maxTokens,
                        stop: ['\n\n', '\n#', '---', '```', '\n-', '\n*']
                    })
                });
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.error?.message || `API error: ${response.status}`
                };
            }

            const data = await response.json();
            suggestion = this.parseResponseContent(data, provider);

            // Clean up the suggestion
            suggestion = this.cleanSuggestion(suggestion, textBefore);

            // Filter out empty or unhelpful suggestions
            if (!suggestion || suggestion.length < 2) {
                return { success: false, error: 'No suggestion available' };
            }

            return { success: true, suggestion };
        } catch (error) {
            console.error('AI Autocomplete error:', error);
            return { success: false, error: error.message || 'Failed to get suggestion' };
        }
    }

    /**
     * Make Anthropic API request for autocomplete
     */
    async makeAnthropicRequest(messages) {
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

        const body = {
            model: this.getModel(),
            max_tokens: this.maxTokens,
            messages: anthropicMessages
        };

        if (systemMessage) {
            body.system = systemMessage;
        }

        return net.fetch(this.getApiEndpoint(), {
            method: 'POST',
            headers: this.buildHeaders(),
            signal: AbortSignal.timeout(AUTOCOMPLETE_TIMEOUT_MS),
            body: JSON.stringify(body)
        });
    }

    /**
     * Make Gemini API request for autocomplete
     */
    async makeGeminiRequest(messages) {
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
                temperature: 0.2,
                maxOutputTokens: this.maxTokens
            }
        };

        if (systemInstruction) {
            body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const apiKey = this.getApiKey();
        const endpoint = `${this.getApiEndpoint()}?key=${apiKey}`;

        return net.fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(AUTOCOMPLETE_TIMEOUT_MS),
            body: JSON.stringify(body)
        });
    }

    /**
     * Parse response content based on provider
     */
    parseResponseContent(data, provider) {
        if (provider === 'anthropic') {
            return data.content?.[0]?.text?.trim() || '';
        }

        if (provider === 'gemini') {
            return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        }

        // OpenAI, Groq, Local
        return data.choices?.[0]?.message?.content?.trim() || '';
    }

    /**
     * Clean up the suggestion to remove unwanted artifacts
     * @param {string} suggestion - Raw suggestion from AI
     * @param {string} textBefore - Text before cursor
     * @returns {string}
     */
    cleanSuggestion(suggestion, textBefore) {
        if (!suggestion) return '';

        // Remove quotes if the AI wrapped the response
        suggestion = suggestion.replace(/^["'`]|["'`]$/g, '');

        // Remove common prefixes the AI might add
        suggestion = suggestion.replace(/^(Completion:|Suggestion:|Continue:|Continuação:|→\s*|\.{3}\s*)/i, '');

        // Remove leading ellipsis
        suggestion = suggestion.replace(/^…\s*/, '');

        // Get the last word of textBefore to check for repetition
        const lastWord = textBefore.trim().split(/\s+/).pop()?.toLowerCase() || '';
        const firstSuggestionWord = suggestion.trim().split(/\s+/)[0]?.toLowerCase() || '';

        // If suggestion starts with the same word that textBefore ends with, remove it
        if (lastWord && firstSuggestionWord === lastWord) {
            suggestion = suggestion.trim().split(/\s+/).slice(1).join(' ');
        }

        // If textBefore ends with space and suggestion starts with space, trim
        if (/\s$/.test(textBefore) && /^\s/.test(suggestion)) {
            suggestion = suggestion.trimStart();
        }

        // Limit length - max ~60 chars or first sentence
        const sentenceEnd = suggestion.search(/[.!?]\s|[.!?]$/);
        if (sentenceEnd > 5 && sentenceEnd < 60) {
            suggestion = suggestion.slice(0, sentenceEnd + 1);
        } else if (suggestion.length > 60) {
            // Cut at word boundary
            const cutPoint = suggestion.lastIndexOf(' ', 60);
            if (cutPoint > 20) {
                suggestion = suggestion.slice(0, cutPoint);
            }
        }

        return suggestion.trim();
    }

    /**
     * Build the user prompt with context
     * @param {string} textBefore - Text before cursor
     * @param {string} textAfter - Text after cursor
     * @returns {string}
     */
    buildUserPrompt(textBefore, textAfter) {
        // Get the current line and some context
        const lines = textBefore.split('\n');
        const currentLine = lines[lines.length - 1] || '';
        const previousLines = lines.slice(-3, -1).join('\n');

        // Build a focused prompt showing what to complete
        let prompt = '';

        if (previousLines.trim()) {
            prompt += `Context:\n${previousLines}\n\n`;
        }

        prompt += `Complete this: ${currentLine}`;

        return prompt;
    }
}

module.exports = AIAutocompleteManager;
