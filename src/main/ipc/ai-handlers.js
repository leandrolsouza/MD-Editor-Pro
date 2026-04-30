/**
 * IPC Handlers — AI Chat & Autocomplete Operations
 * Handles: ai:send-message, ai:clear-history, ai:get-api-key, ai:set-api-key,
 *          ai:get-model, ai:set-model, ai:get-models, ai:get-provider, ai:set-provider,
 *          ai:get-local-url, ai:set-local-url, ai:get-local-api-key, ai:set-local-api-key,
 *          ai:fetch-local-models, ai:test-local-connection, ai:test-api-key,
 *          ai:get-settings, ai:transform-text,
 *          ai-autocomplete:get-suggestion, ai-autocomplete:get-settings,
 *          ai-autocomplete:set-enabled, ai-autocomplete:set-debounce,
 *          ai-autocomplete:set-min-chars, ai-autocomplete:set-max-tokens
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de AI chat e autocomplete
 * @param {Object} deps - Dependências
 * @param {import('../ai-chat-manager')} deps.aiChatManager - Instância do AIChatManager
 * @param {import('../ai-autocomplete-manager')} deps.aiAutocompleteManager - Instância do AIAutocompleteManager
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ aiChatManager, aiAutocompleteManager, ipcMain }) {
    // ── AI Chat operations ──

    ipcMain.handle('ai:send-message', createIPCHandler(async (event, message, documentContent, selectedText) => {
        return await aiChatManager.sendMessage(message, documentContent, selectedText);
    }, 'sending AI message'));

    ipcMain.handle('ai:clear-history', createIPCHandler(async () => {
        aiChatManager.clearHistory();
        return { success: true };
    }, 'clearing AI history'));

    ipcMain.handle('ai:get-api-key', createIPCHandler(async () => {
        return aiChatManager.getApiKey() || '';
    }, 'getting API key'));

    ipcMain.handle('ai:set-api-key', createIPCHandler(async (event, apiKey, provider) => {
        aiChatManager.setApiKey(apiKey, provider);
        return { success: true };
    }, 'setting API key'));

    ipcMain.handle('ai:get-model', createIPCHandler(async (event, provider) => {
        return aiChatManager.getModel(provider);
    }, 'getting AI model'));

    ipcMain.handle('ai:set-model', createIPCHandler(async (event, model, provider) => {
        aiChatManager.setModel(model, provider);
        return { success: true };
    }, 'setting AI model'));

    ipcMain.handle('ai:get-models', createIPCHandler(async () => {
        return aiChatManager.getAvailableModels();
    }, 'getting AI models'));

    ipcMain.handle('ai:get-provider', createIPCHandler(async () => {
        return aiChatManager.getProvider();
    }, 'getting AI provider'));

    ipcMain.handle('ai:set-provider', createIPCHandler(async (event, provider) => {
        aiChatManager.setProvider(provider);
        return { success: true };
    }, 'setting AI provider'));

    ipcMain.handle('ai:get-local-url', createIPCHandler(async () => {
        return aiChatManager.getLocalServerUrl();
    }, 'getting local server URL'));

    ipcMain.handle('ai:set-local-url', createIPCHandler(async (event, url) => {
        aiChatManager.setLocalServerUrl(url);
        return { success: true };
    }, 'setting local server URL'));

    ipcMain.handle('ai:get-local-api-key', createIPCHandler(async () => {
        return aiChatManager.getLocalApiKey() || '';
    }, 'getting local API key'));

    ipcMain.handle('ai:set-local-api-key', createIPCHandler(async (event, apiKey) => {
        aiChatManager.setLocalApiKey(apiKey);
        return { success: true };
    }, 'setting local API key'));

    ipcMain.handle('ai:fetch-local-models', createIPCHandler(async () => {
        return await aiChatManager.fetchLocalModels();
    }, 'fetching local models'));

    ipcMain.handle('ai:test-local-connection', createIPCHandler(async () => {
        return await aiChatManager.testLocalConnection();
    }, 'testing local connection'));

    ipcMain.handle('ai:test-api-key', createIPCHandler(async (event, apiKey, provider) => {
        return await aiChatManager.testApiKey(apiKey, provider);
    }, 'testing API key'));

    ipcMain.handle('ai:get-settings', createIPCHandler(async () => {
        return aiChatManager.getSettings();
    }, 'getting AI settings'));

    ipcMain.handle('ai:transform-text', createIPCHandler(async (event, text, command, customPrompt, targetLanguage) => {
        return await aiChatManager.transformText(text, command, customPrompt, targetLanguage);
    }, 'transforming text'));

    // ── AI Autocomplete operations ──

    ipcMain.handle('ai-autocomplete:get-suggestion', createIPCHandler(async (event, textBefore, textAfter) => {
        return await aiAutocompleteManager.getSuggestion(textBefore, textAfter);
    }, 'getting autocomplete suggestion'));

    ipcMain.handle('ai-autocomplete:get-settings', createIPCHandler(async () => {
        return aiAutocompleteManager.getSettings();
    }, 'getting autocomplete settings'));

    ipcMain.handle('ai-autocomplete:set-enabled', createIPCHandler(async (event, enabled) => {
        aiAutocompleteManager.setEnabled(enabled);
        return { success: true };
    }, 'setting autocomplete enabled'));

    ipcMain.handle('ai-autocomplete:set-debounce', createIPCHandler(async (event, ms) => {
        aiAutocompleteManager.setDebounceMs(ms);
        return { success: true };
    }, 'setting autocomplete debounce'));

    ipcMain.handle('ai-autocomplete:set-min-chars', createIPCHandler(async (event, chars) => {
        aiAutocompleteManager.setMinCharsToTrigger(chars);
        return { success: true };
    }, 'setting autocomplete min chars'));

    ipcMain.handle('ai-autocomplete:set-max-tokens', createIPCHandler(async (event, tokens) => {
        aiAutocompleteManager.setMaxTokens(tokens);
        return { success: true };
    }, 'setting autocomplete max tokens'));
}

module.exports = { register };
