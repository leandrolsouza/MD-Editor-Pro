/**
 * AI initialization module
 * Initializes AI components: AIChatPanel, AIAutocomplete, AIEditCommands
 *
 * @module init-ai
 * Requirements: 3.3, 3.4
 */

const AIChatPanel = require('./ai/ai-chat-panel.js');
const AIAutocomplete = require('./ai/ai-autocomplete.js');
const AIEditCommands = require('./ai/ai-edit-commands.js');

/**
 * Initializes AI components and registers them in the ComponentRegistry.
 * Depends on core components (editor) being registered first.
 *
 * @param {ComponentRegistry} registry - The component registry to register instances in
 * @param {EventBus} eventBus - The event bus for inter-component communication
 */
async function initialize(registry, eventBus) {
    const editor = registry.get('editor');

    // Initialize AI Chat Panel
    const aiChatPanel = new AIChatPanel(editor);
    registry.register('aiChatPanel', aiChatPanel);
    console.log('AIChatPanel created');

    // Initialize AI Edit Commands
    const aiEditCommands = new AIEditCommands(editor);
    registry.register('aiEditCommands', aiEditCommands);
    console.log('AIEditCommands created');

    // Initialize AI Autocomplete
    const aiAutocomplete = new AIAutocomplete(editor);
    registry.register('aiAutocomplete', aiAutocomplete);
    console.log('AIAutocomplete created');
}

module.exports = { initialize };
