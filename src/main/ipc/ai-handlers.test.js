/**
 * Tests for ai-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./ai-handlers');

describe('ai-handlers', () => {
    let aiChatManager;
    let aiAutocompleteManager;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        aiChatManager = {
            sendMessage: vi.fn(),
            clearHistory: vi.fn(),
            getApiKey: vi.fn(),
            setApiKey: vi.fn(),
            getModel: vi.fn(),
            setModel: vi.fn(),
            getAvailableModels: vi.fn(),
            getProvider: vi.fn(),
            setProvider: vi.fn(),
            getLocalServerUrl: vi.fn(),
            setLocalServerUrl: vi.fn(),
            getLocalApiKey: vi.fn(),
            setLocalApiKey: vi.fn(),
            fetchLocalModels: vi.fn(),
            testLocalConnection: vi.fn(),
            testApiKey: vi.fn(),
            getSettings: vi.fn(),
            transformText: vi.fn()
        };

        aiAutocompleteManager = {
            getSuggestion: vi.fn(),
            getSettings: vi.fn(),
            setEnabled: vi.fn(),
            setDebounceMs: vi.fn(),
            setMinCharsToTrigger: vi.fn(),
            setMaxTokens: vi.fn()
        };

        ipcMain = {
            handle: vi.fn()
        };

        register({ aiChatManager, aiAutocompleteManager, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 24 AI IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(24);

        // AI Chat handlers (18)
        expect(handlers['ai:send-message']).toBeDefined();
        expect(handlers['ai:clear-history']).toBeDefined();
        expect(handlers['ai:get-api-key']).toBeDefined();
        expect(handlers['ai:set-api-key']).toBeDefined();
        expect(handlers['ai:get-model']).toBeDefined();
        expect(handlers['ai:set-model']).toBeDefined();
        expect(handlers['ai:get-models']).toBeDefined();
        expect(handlers['ai:get-provider']).toBeDefined();
        expect(handlers['ai:set-provider']).toBeDefined();
        expect(handlers['ai:get-local-url']).toBeDefined();
        expect(handlers['ai:set-local-url']).toBeDefined();
        expect(handlers['ai:get-local-api-key']).toBeDefined();
        expect(handlers['ai:set-local-api-key']).toBeDefined();
        expect(handlers['ai:fetch-local-models']).toBeDefined();
        expect(handlers['ai:test-local-connection']).toBeDefined();
        expect(handlers['ai:test-api-key']).toBeDefined();
        expect(handlers['ai:get-settings']).toBeDefined();
        expect(handlers['ai:transform-text']).toBeDefined();

        // AI Autocomplete handlers (6)
        expect(handlers['ai-autocomplete:get-suggestion']).toBeDefined();
        expect(handlers['ai-autocomplete:get-settings']).toBeDefined();
        expect(handlers['ai-autocomplete:set-enabled']).toBeDefined();
        expect(handlers['ai-autocomplete:set-debounce']).toBeDefined();
        expect(handlers['ai-autocomplete:set-min-chars']).toBeDefined();
        expect(handlers['ai-autocomplete:set-max-tokens']).toBeDefined();
    });

    // ── AI Chat handlers ──

    describe('ai:send-message', () => {
        it('calls aiChatManager.sendMessage with correct args and returns result', async () => {
            const mockResult = { success: true, response: 'Hello!' };
            aiChatManager.sendMessage.mockResolvedValue(mockResult);

            const result = await handlers['ai:send-message']({}, 'hi', '# Doc', 'selected');

            expect(aiChatManager.sendMessage).toHaveBeenCalledWith('hi', '# Doc', 'selected');
            expect(result).toEqual(mockResult);
        });

        it('throws when sendMessage throws', async () => {
            aiChatManager.sendMessage.mockRejectedValue(new Error('API error'));

            await expect(handlers['ai:send-message']({}, 'hi', '', '')).rejects.toThrow('API error');
        });
    });

    describe('ai:clear-history', () => {
        it('calls clearHistory and returns success', async () => {
            const result = await handlers['ai:clear-history']({});

            expect(aiChatManager.clearHistory).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true });
        });
    });

    describe('ai:get-api-key', () => {
        it('returns the API key', async () => {
            aiChatManager.getApiKey.mockReturnValue('sk-test-key');

            const result = await handlers['ai:get-api-key']({});

            expect(result).toBe('sk-test-key');
        });

        it('returns empty string when no key is set', async () => {
            aiChatManager.getApiKey.mockReturnValue(null);

            const result = await handlers['ai:get-api-key']({});

            expect(result).toBe('');
        });
    });

    describe('ai:set-api-key', () => {
        it('calls setApiKey with key and provider', async () => {
            const result = await handlers['ai:set-api-key']({}, 'sk-new-key', 'openai');

            expect(aiChatManager.setApiKey).toHaveBeenCalledWith('sk-new-key', 'openai');
            expect(result).toEqual({ success: true });
        });
    });

    describe('ai:get-model', () => {
        it('returns the model for a provider', async () => {
            aiChatManager.getModel.mockReturnValue('gpt-4o');

            const result = await handlers['ai:get-model']({}, 'openai');

            expect(aiChatManager.getModel).toHaveBeenCalledWith('openai');
            expect(result).toBe('gpt-4o');
        });
    });

    describe('ai:set-model', () => {
        it('calls setModel with model and provider', async () => {
            const result = await handlers['ai:set-model']({}, 'gpt-4o', 'openai');

            expect(aiChatManager.setModel).toHaveBeenCalledWith('gpt-4o', 'openai');
            expect(result).toEqual({ success: true });
        });
    });

    describe('ai:get-models', () => {
        it('returns available models', async () => {
            const models = ['gpt-4o', 'gpt-4o-mini'];
            aiChatManager.getAvailableModels.mockReturnValue(models);

            const result = await handlers['ai:get-models']({});

            expect(result).toEqual(models);
        });
    });

    describe('ai:get-provider', () => {
        it('returns the current provider', async () => {
            aiChatManager.getProvider.mockReturnValue('anthropic');

            const result = await handlers['ai:get-provider']({});

            expect(result).toBe('anthropic');
        });
    });

    describe('ai:set-provider', () => {
        it('calls setProvider and returns success', async () => {
            const result = await handlers['ai:set-provider']({}, 'anthropic');

            expect(aiChatManager.setProvider).toHaveBeenCalledWith('anthropic');
            expect(result).toEqual({ success: true });
        });
    });

    describe('ai:get-local-url', () => {
        it('returns the local server URL', async () => {
            aiChatManager.getLocalServerUrl.mockReturnValue('http://localhost:1234');

            const result = await handlers['ai:get-local-url']({});

            expect(result).toBe('http://localhost:1234');
        });
    });

    describe('ai:set-local-url', () => {
        it('calls setLocalServerUrl and returns success', async () => {
            const result = await handlers['ai:set-local-url']({}, 'http://localhost:5678');

            expect(aiChatManager.setLocalServerUrl).toHaveBeenCalledWith('http://localhost:5678');
            expect(result).toEqual({ success: true });
        });
    });

    describe('ai:get-local-api-key', () => {
        it('returns the local API key', async () => {
            aiChatManager.getLocalApiKey.mockReturnValue('local-key');

            const result = await handlers['ai:get-local-api-key']({});

            expect(result).toBe('local-key');
        });

        it('returns empty string when no local key is set', async () => {
            aiChatManager.getLocalApiKey.mockReturnValue(null);

            const result = await handlers['ai:get-local-api-key']({});

            expect(result).toBe('');
        });
    });

    describe('ai:set-local-api-key', () => {
        it('calls setLocalApiKey and returns success', async () => {
            const result = await handlers['ai:set-local-api-key']({}, 'new-local-key');

            expect(aiChatManager.setLocalApiKey).toHaveBeenCalledWith('new-local-key');
            expect(result).toEqual({ success: true });
        });
    });

    describe('ai:fetch-local-models', () => {
        it('returns fetched local models', async () => {
            const models = ['llama-3', 'mistral'];
            aiChatManager.fetchLocalModels.mockResolvedValue(models);

            const result = await handlers['ai:fetch-local-models']({});

            expect(result).toEqual(models);
        });

        it('throws when fetchLocalModels throws', async () => {
            aiChatManager.fetchLocalModels.mockRejectedValue(new Error('connection refused'));

            await expect(handlers['ai:fetch-local-models']({})).rejects.toThrow('connection refused');
        });
    });

    describe('ai:test-local-connection', () => {
        it('returns connection test result', async () => {
            const mockResult = { success: true, models: ['llama-3'] };
            aiChatManager.testLocalConnection.mockResolvedValue(mockResult);

            const result = await handlers['ai:test-local-connection']({});

            expect(result).toEqual(mockResult);
        });

        it('throws when testLocalConnection throws', async () => {
            aiChatManager.testLocalConnection.mockRejectedValue(new Error('timeout'));

            await expect(handlers['ai:test-local-connection']({})).rejects.toThrow('timeout');
        });
    });

    describe('ai:test-api-key', () => {
        it('calls testApiKey with key and provider', async () => {
            const mockResult = { success: true };
            aiChatManager.testApiKey.mockResolvedValue(mockResult);

            const result = await handlers['ai:test-api-key']({}, 'sk-test', 'openai');

            expect(aiChatManager.testApiKey).toHaveBeenCalledWith('sk-test', 'openai');
            expect(result).toEqual(mockResult);
        });
    });

    describe('ai:get-settings', () => {
        it('returns AI settings', async () => {
            const settings = { provider: 'openai', model: 'gpt-4o' };
            aiChatManager.getSettings.mockReturnValue(settings);

            const result = await handlers['ai:get-settings']({});

            expect(result).toEqual(settings);
        });
    });

    describe('ai:transform-text', () => {
        it('calls transformText with all arguments', async () => {
            const mockResult = { success: true, text: 'transformed' };
            aiChatManager.transformText.mockResolvedValue(mockResult);

            const result = await handlers['ai:transform-text']({}, 'hello', 'translate', null, 'pt');

            expect(aiChatManager.transformText).toHaveBeenCalledWith('hello', 'translate', null, 'pt');
            expect(result).toEqual(mockResult);
        });

        it('throws when transformText throws', async () => {
            aiChatManager.transformText.mockRejectedValue(new Error('transform failed'));

            await expect(handlers['ai:transform-text']({}, 'text', 'cmd', null, null)).rejects.toThrow('transform failed');
        });
    });

    // ── AI Autocomplete handlers ──

    describe('ai-autocomplete:get-suggestion', () => {
        it('calls getSuggestion with textBefore and textAfter', async () => {
            const mockResult = { success: true, suggestion: 'world' };
            aiAutocompleteManager.getSuggestion.mockResolvedValue(mockResult);

            const result = await handlers['ai-autocomplete:get-suggestion']({}, 'hello ', '');

            expect(aiAutocompleteManager.getSuggestion).toHaveBeenCalledWith('hello ', '');
            expect(result).toEqual(mockResult);
        });

        it('throws when getSuggestion throws', async () => {
            aiAutocompleteManager.getSuggestion.mockRejectedValue(new Error('no suggestion'));

            await expect(handlers['ai-autocomplete:get-suggestion']({}, '', '')).rejects.toThrow('no suggestion');
        });
    });

    describe('ai-autocomplete:get-settings', () => {
        it('returns autocomplete settings', async () => {
            const settings = { enabled: true, debounceMs: 300 };
            aiAutocompleteManager.getSettings.mockReturnValue(settings);

            const result = await handlers['ai-autocomplete:get-settings']({});

            expect(result).toEqual(settings);
        });
    });

    describe('ai-autocomplete:set-enabled', () => {
        it('calls setEnabled and returns success', async () => {
            const result = await handlers['ai-autocomplete:set-enabled']({}, true);

            expect(aiAutocompleteManager.setEnabled).toHaveBeenCalledWith(true);
            expect(result).toEqual({ success: true });
        });
    });

    describe('ai-autocomplete:set-debounce', () => {
        it('calls setDebounceMs and returns success', async () => {
            const result = await handlers['ai-autocomplete:set-debounce']({}, 500);

            expect(aiAutocompleteManager.setDebounceMs).toHaveBeenCalledWith(500);
            expect(result).toEqual({ success: true });
        });
    });

    describe('ai-autocomplete:set-min-chars', () => {
        it('calls setMinCharsToTrigger and returns success', async () => {
            const result = await handlers['ai-autocomplete:set-min-chars']({}, 3);

            expect(aiAutocompleteManager.setMinCharsToTrigger).toHaveBeenCalledWith(3);
            expect(result).toEqual({ success: true });
        });
    });

    describe('ai-autocomplete:set-max-tokens', () => {
        it('calls setMaxTokens and returns success', async () => {
            const result = await handlers['ai-autocomplete:set-max-tokens']({}, 100);

            expect(aiAutocompleteManager.setMaxTokens).toHaveBeenCalledWith(100);
            expect(result).toEqual({ success: true });
        });
    });
});
