/**
 * SnippetManager - Manages built-in and custom snippets
 * Extracted from src/main/index.js for separation of concerns
 * Requirements: 7.1, 7.2
 */

/**
 * Built-in snippets for common markdown elements
 */
const BUILT_IN_SNIPPETS = [
    { trigger: 'code', content: '```{{language}}\n{{code}}\n```', description: 'Code block with syntax highlighting', placeholders: ['{{language}}', '{{code}}'], isBuiltIn: true },
    { trigger: 'table', content: '| {{header1}} | {{header2}} | {{header3}} |\n|------------|------------|------------|\n| {{cell1}}   | {{cell2}}   | {{cell3}}   |', description: 'Markdown table structure', placeholders: ['{{header1}}', '{{header2}}', '{{header3}}', '{{cell1}}', '{{cell2}}', '{{cell3}}'], isBuiltIn: true },
    { trigger: 'link', content: '[{{text}}]({{url}})', description: 'Markdown link', placeholders: ['{{text}}', '{{url}}'], isBuiltIn: true },
    { trigger: 'img', content: '![{{alt}}]({{url}})', description: 'Markdown image', placeholders: ['{{alt}}', '{{url}}'], isBuiltIn: true },
    { trigger: 'task', content: '- [ ] {{task}}', description: 'Task list item', placeholders: ['{{task}}'], isBuiltIn: true },
    { trigger: 'quote', content: '> {{quote}}', description: 'Block quote', placeholders: ['{{quote}}'], isBuiltIn: true }
];

class SnippetManager {
    /**
     * @param {import('./config-store')} configStore - ConfigStore instance for persistence
     */
    constructor(configStore) {
        if (!configStore) {
            throw new Error('ConfigStore is required');
        }
        this.configStore = configStore;
    }

    /**
     * Get all built-in snippets
     * @returns {Array} Array of built-in snippets (defensive copy)
     */
    getBuiltInSnippets() {
        return [...BUILT_IN_SNIPPETS];
    }

    /**
     * Get all custom snippets from the config store
     * @returns {Array} Array of custom snippets
     */
    getCustomSnippets() {
        return this.configStore.getCustomSnippets();
    }

    /**
     * Save a new custom snippet
     * @param {Object} snippet - Snippet object with trigger, content, and optional description
     * @param {string} snippet.trigger - Trigger text for the snippet
     * @param {string} snippet.content - Snippet content with optional placeholders
     * @param {string} [snippet.description] - Optional description
     * @returns {Object} The saved snippet with computed placeholders
     */
    saveCustomSnippet(snippet) {
        if (!snippet || typeof snippet !== 'object') {
            throw new Error('Invalid snippet: Must be an object');
        }
        if (!snippet.trigger || typeof snippet.trigger !== 'string') {
            throw new Error('Invalid snippet: Must have a string trigger');
        }
        if (!snippet.content || typeof snippet.content !== 'string') {
            throw new Error('Invalid snippet: Must have string content');
        }

        const fullSnippet = {
            trigger: snippet.trigger.trim(),
            content: snippet.content,
            description: snippet.description || '',
            placeholders: this.findPlaceholders(snippet.content),
            isBuiltIn: false,
            createdAt: Date.now()
        };

        this.configStore.addCustomSnippet(fullSnippet);
        return fullSnippet;
    }

    /**
     * Delete a custom snippet by trigger
     * @param {string} trigger - Trigger of the snippet to delete
     */
    deleteCustomSnippet(trigger) {
        this.configStore.deleteCustomSnippet(trigger);
    }

    /**
     * Find placeholders in snippet content
     * @param {string} content - Snippet content
     * @returns {Array<string>} Array of placeholder strings
     */
    findPlaceholders(content) {
        if (!content || typeof content !== 'string') {
            return [];
        }
        const matches = content.match(/\{\{[^}]+\}\}/g);
        return matches || [];
    }
}

module.exports = SnippetManager;
