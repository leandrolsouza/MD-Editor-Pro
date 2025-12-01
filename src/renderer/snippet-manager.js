/**
 * SnippetManager - Manages markdown snippets
 * Provides built-in and custom snippets for quick insertion
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

const { StateField, StateEffect } = require('@codemirror/state');
const { keymap } = require('@codemirror/view');

/**
 * Built-in snippets for common markdown elements
 */
const BUILT_IN_SNIPPETS = [
    {
        trigger: 'code',
        content: '```{{language}}\n{{code}}\n```',
        description: 'Code block with syntax highlighting',
        placeholders: ['{{language}}', '{{code}}'],
        isBuiltIn: true
    },
    {
        trigger: 'table',
        content: '| {{header1}} | {{header2}} | {{header3}} |\n|------------|------------|------------|\n| {{cell1}}   | {{cell2}}   | {{cell3}}   |',
        description: 'Markdown table structure',
        placeholders: ['{{header1}}', '{{header2}}', '{{header3}}', '{{cell1}}', '{{cell2}}', '{{cell3}}'],
        isBuiltIn: true
    },
    {
        trigger: 'link',
        content: '[{{text}}]({{url}})',
        description: 'Markdown link',
        placeholders: ['{{text}}', '{{url}}'],
        isBuiltIn: true
    },
    {
        trigger: 'img',
        content: '![{{alt}}]({{url}})',
        description: 'Markdown image',
        placeholders: ['{{alt}}', '{{url}}'],
        isBuiltIn: true
    },
    {
        trigger: 'task',
        content: '- [ ] {{task}}',
        description: 'Task list item',
        placeholders: ['{{task}}'],
        isBuiltIn: true
    },
    {
        trigger: 'quote',
        content: '> {{quote}}',
        description: 'Block quote',
        placeholders: ['{{quote}}'],
        isBuiltIn: true
    }
];

/**
 * State effect for tracking snippet placeholders
 */
const setSnippetPlaceholders = StateEffect.define();

/**
 * State field for storing current snippet placeholders
 */
const snippetPlaceholdersField = StateField.define({
    create() {
        return { placeholders: [], currentIndex: -1 };
    },
    update(value, tr) {
        for (let effect of tr.effects) {
            if (effect.is(setSnippetPlaceholders)) {
                return effect.value;
            }
        }
        return value;
    }
});

/**
 * SnippetManager class manages markdown snippets
 */
class SnippetManager {
    /**
     * Create a new SnippetManager
     * @param {Editor} editor - Editor instance
     * @param {Object} configStore - Configuration store (via IPC or direct)
     */
    constructor(editor, configStore) {
        if (!editor) {
            throw new Error('Editor is required');
        }
        this.editor = editor;
        this.configStore = configStore;
        this.customSnippets = [];

        // Load custom snippets if configStore is available
        if (this.configStore && typeof this.configStore.getCustomSnippets === 'function') {
            this.customSnippets = this.configStore.getCustomSnippets();
        }
    }

    /**
     * Get a snippet by trigger (built-in or custom)
     * @param {string} trigger - Snippet trigger
     * @returns {Object|null} Snippet object or null if not found
     */
    getSnippet(trigger) {
        if (!trigger || typeof trigger !== 'string') {
            throw new Error('Trigger must be a non-empty string');
        }

        // Check built-in snippets first
        const builtIn = BUILT_IN_SNIPPETS.find(s => s.trigger === trigger);
        if (builtIn) {
            return builtIn;
        }

        // Check custom snippets
        const custom = this.customSnippets.find(s => s.trigger === trigger);
        return custom || null;
    }

    /**
     * Get all snippets (built-in and custom)
     * @returns {Array} Array of all snippets
     */
    getAllSnippets() {
        return [...BUILT_IN_SNIPPETS, ...this.customSnippets];
    }

    /**
     * Get all built-in snippets
     * @returns {Array} Array of built-in snippets
     */
    getBuiltInSnippets() {
        return [...BUILT_IN_SNIPPETS];
    }

    /**
     * Get all custom snippets
     * @returns {Array} Array of custom snippets
     */
    getCustomSnippets() {
        return [...this.customSnippets];
    }

    /**
     * Save a custom snippet
     * Requirements: 7.5, 7.6
     * @param {string} trigger - Snippet trigger
     * @param {string} content - Snippet content
     * @param {string} description - Snippet description
     * @returns {Object} The created snippet
     */
    saveCustomSnippet(trigger, content, description = '') {
        if (!trigger || typeof trigger !== 'string' || trigger.trim() === '') {
            throw new Error('Trigger must be a non-empty string');
        }
        if (!content || typeof content !== 'string') {
            throw new Error('Content must be a non-empty string');
        }

        // Check for duplicate trigger in both built-in and custom
        const existingSnippet = this.getSnippet(trigger.trim());
        if (existingSnippet) {
            throw new Error(`Snippet with trigger "${trigger.trim()}" already exists`);
        }

        const snippet = {
            trigger: trigger.trim(),
            content: content,
            description: description || '',
            placeholders: this.findPlaceholders(content),
            isBuiltIn: false,
            createdAt: Date.now()
        };

        // Save to config store if available
        if (this.configStore && typeof this.configStore.addCustomSnippet === 'function') {
            this.configStore.addCustomSnippet(snippet);
        }

        // Add to local cache
        this.customSnippets.push(snippet);
        return snippet;
    }

    /**
     * Delete a custom snippet
     * @param {string} trigger - Snippet trigger
     * @returns {boolean} True if deleted, false if not found
     */
    deleteCustomSnippet(trigger) {
        if (!trigger || typeof trigger !== 'string') {
            throw new Error('Trigger must be a non-empty string');
        }

        const index = this.customSnippets.findIndex(s => s.trigger === trigger);
        if (index === -1) {
            return false;
        }

        // Delete from config store if available
        if (this.configStore && typeof this.configStore.deleteCustomSnippet === 'function') {
            try {
                this.configStore.deleteCustomSnippet(trigger);
            } catch (error) {
                // Ignore errors if snippet not found in store
            }
        }

        // Remove from local cache
        this.customSnippets.splice(index, 1);
        return true;
    }

    /**
     * Update a custom snippet
     * @param {string} trigger - Snippet trigger
     * @param {Object} updates - Snippet updates
     * @returns {boolean} True if updated, false if not found
     */
    updateCustomSnippet(trigger, updates) {
        if (!trigger || typeof trigger !== 'string') {
            throw new Error('Trigger must be a non-empty string');
        }
        if (!updates || typeof updates !== 'object') {
            throw new Error('Updates must be an object');
        }

        const index = this.customSnippets.findIndex(s => s.trigger === trigger);
        if (index === -1) {
            return false;
        }

        // If content is being updated, recalculate placeholders
        if (updates.content) {
            updates.placeholders = this.findPlaceholders(updates.content);
        }

        // Update in config store if available
        if (this.configStore && typeof this.configStore.updateCustomSnippet === 'function') {
            try {
                this.configStore.updateCustomSnippet(trigger, updates);
            } catch (error) {
                // Ignore errors if snippet not found in store
            }
        }

        // Update local cache
        this.customSnippets[index] = { ...this.customSnippets[index], ...updates };
        return true;
    }

    /**
     * Detect snippet trigger at cursor position
     * Requirements: 7.1
     * @param {string} text - Text before cursor
     * @param {number} cursorPosition - Cursor position in document
     * @returns {Object|null} Object with trigger and position, or null
     */
    detectTrigger(text, cursorPosition) {
        if (!text || typeof text !== 'string') {
            return null;
        }

        // Get the word before the cursor (up to the last whitespace or start of line)
        const beforeCursor = text.substring(0, cursorPosition);
        const lastLineBreak = Math.max(beforeCursor.lastIndexOf('\n'), 0);
        const lineText = beforeCursor.substring(lastLineBreak);

        // Match word at end of line (word boundary)
        const wordMatch = lineText.match(/(\w+)$/);
        if (!wordMatch) {
            return null;
        }

        const word = wordMatch[1];
        const snippet = this.getSnippet(word);

        if (snippet) {
            return {
                trigger: word,
                snippet: snippet,
                start: cursorPosition - word.length,
                end: cursorPosition
            };
        }

        return null;
    }

    /**
     * Expand snippet at cursor position
     * Requirements: 7.1, 7.2
     * @param {string} trigger - Snippet trigger
     * @returns {boolean} True if expanded, false if trigger not found
     */
    expandSnippet(trigger) {
        if (!this.editor || !this.editor.view) {
            throw new Error('Editor not initialized');
        }

        const snippet = this.getSnippet(trigger);
        if (!snippet) {
            return false;
        }

        const view = this.editor.view;
        const state = view.state;
        const selection = state.selection.main;

        // Get text before cursor to find trigger position
        const textBeforeCursor = state.doc.sliceString(0, selection.from);
        const triggerInfo = this.detectTrigger(textBeforeCursor, selection.from);

        if (!triggerInfo) {
            return false;
        }

        // Replace trigger with snippet content
        const transaction = state.update({
            changes: {
                from: triggerInfo.start,
                to: triggerInfo.end,
                insert: snippet.content
            }
        });

        view.dispatch(transaction);

        // Position cursor at first placeholder
        this.positionCursorAtFirstPlaceholder(snippet.content, triggerInfo.start);

        return true;
    }

    /**
     * Position cursor at the first placeholder in the snippet
     * Requirements: 7.2
     * @param {string} content - Snippet content
     * @param {number} insertPosition - Position where snippet was inserted
     */
    positionCursorAtFirstPlaceholder(content, insertPosition) {
        if (!this.editor || !this.editor.view) {
            throw new Error('Editor not initialized');
        }

        const placeholders = this.findPlaceholders(content);
        if (placeholders.length === 0) {
            // No placeholders, position at end of snippet
            const endPosition = insertPosition + content.length;
            this.editor.setCursorPosition(endPosition);
            return;
        }

        // Find position of first placeholder
        const firstPlaceholder = placeholders[0];
        const placeholderPosition = content.indexOf(firstPlaceholder);
        const absolutePosition = insertPosition + placeholderPosition;

        // Calculate all placeholder positions for Tab navigation
        const placeholderPositions = placeholders.map(ph => {
            const pos = content.indexOf(ph);
            return {
                from: insertPosition + pos,
                to: insertPosition + pos + ph.length,
                text: ph
            };
        });

        // Store placeholder positions in editor state
        const view = this.editor.view;
        view.dispatch({
            effects: setSnippetPlaceholders.of({
                placeholders: placeholderPositions,
                currentIndex: 0
            })
        });

        // Select the first placeholder
        const transaction = view.state.update({
            selection: {
                anchor: absolutePosition,
                head: absolutePosition + firstPlaceholder.length
            },
            scrollIntoView: true
        });

        view.dispatch(transaction);
        view.focus();
    }

    /**
     * Navigate to next placeholder
     * Requirements: 7.3
     * @returns {boolean} True if navigated, false if no more placeholders
     */
    nextPlaceholder() {
        if (!this.editor || !this.editor.view) {
            throw new Error('Editor not initialized');
        }

        const view = this.editor.view;
        const state = view.state;
        const placeholderState = state.field(snippetPlaceholdersField, false);

        if (!placeholderState || placeholderState.placeholders.length === 0) {
            return false;
        }

        const nextIndex = placeholderState.currentIndex + 1;
        if (nextIndex >= placeholderState.placeholders.length) {
            // No more placeholders, clear state and position at end
            view.dispatch({
                effects: setSnippetPlaceholders.of({
                    placeholders: [],
                    currentIndex: -1
                })
            });
            return false;
        }

        const nextPlaceholder = placeholderState.placeholders[nextIndex];

        // Update current index
        view.dispatch({
            effects: setSnippetPlaceholders.of({
                placeholders: placeholderState.placeholders,
                currentIndex: nextIndex
            }),
            selection: {
                anchor: nextPlaceholder.from,
                head: nextPlaceholder.to
            },
            scrollIntoView: true
        });

        view.focus();
        return true;
    }

    /**
     * Navigate to previous placeholder
     * @returns {boolean} True if navigated, false if at first placeholder
     */
    previousPlaceholder() {
        if (!this.editor || !this.editor.view) {
            throw new Error('Editor not initialized');
        }

        const view = this.editor.view;
        const state = view.state;
        const placeholderState = state.field(snippetPlaceholdersField, false);

        if (!placeholderState || placeholderState.placeholders.length === 0) {
            return false;
        }

        const prevIndex = placeholderState.currentIndex - 1;
        if (prevIndex < 0) {
            return false;
        }

        const prevPlaceholder = placeholderState.placeholders[prevIndex];

        // Update current index
        view.dispatch({
            effects: setSnippetPlaceholders.of({
                placeholders: placeholderState.placeholders,
                currentIndex: prevIndex
            }),
            selection: {
                anchor: prevPlaceholder.from,
                head: prevPlaceholder.to
            },
            scrollIntoView: true
        });

        view.focus();
        return true;
    }

    /**
     * Find all placeholders in snippet content
     * Placeholders are in the format {{placeholder_name}}
     * @param {string} content - Snippet content
     * @returns {Array<string>} Array of placeholder strings
     */
    findPlaceholders(content) {
        if (!content || typeof content !== 'string') {
            return [];
        }

        const placeholderRegex = /\{\{[^}]+\}\}/g;
        const matches = content.match(placeholderRegex);

        if (!matches) {
            return [];
        }

        // Keep duplicates in order (don't use Set)
        return matches;
    }

    /**
     * Create CodeMirror extension for snippet expansion
     * Requirements: 7.1, 7.3
     * @returns {Array} Array of CodeMirror extensions
     */
    createSnippetExtension() {
        const snippetManager = this;

        // Keymap for Tab key to expand snippets or navigate placeholders
        const snippetKeymap = keymap.of([
            {
                key: 'Tab',
                run(view) {
                    const state = view.state;
                    const selection = state.selection.main;

                    // Check if we're in placeholder navigation mode
                    const placeholderState = state.field(snippetPlaceholdersField, false);
                    if (placeholderState && placeholderState.placeholders.length > 0) {
                        // Navigate to next placeholder
                        return snippetManager.nextPlaceholder();
                    }

                    // Try to expand snippet
                    const textBeforeCursor = state.doc.sliceString(0, selection.from);
                    const triggerInfo = snippetManager.detectTrigger(textBeforeCursor, selection.from);

                    if (triggerInfo) {
                        return snippetManager.expandSnippet(triggerInfo.trigger);
                    }

                    // Default Tab behavior (insert tab or indent)
                    return false;
                }
            },
            {
                key: 'Shift-Tab',
                run(view) {
                    // Navigate to previous placeholder
                    return snippetManager.previousPlaceholder();
                }
            }
        ]);

        return [
            snippetPlaceholdersField,
            snippetKeymap
        ];
    }

    /**
     * Reload custom snippets from config store
     */
    reloadCustomSnippets() {
        if (this.configStore && typeof this.configStore.getCustomSnippets === 'function') {
            this.customSnippets = this.configStore.getCustomSnippets();
        }
    }
}

module.exports = SnippetManager;
