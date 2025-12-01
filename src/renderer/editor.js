/**
 * Editor class - Manages the CodeMirror 6 editor instance
 * Provides methods for text manipulation, formatting, and undo/redo
 */

const { EditorView, keymap } = require('@codemirror/view');
const { EditorState, Compartment } = require('@codemirror/state');
const { defaultKeymap, history, historyKeymap, undo, redo } = require('@codemirror/commands');
const { markdown } = require('@codemirror/lang-markdown');
const { search, highlightSelectionMatches } = require('@codemirror/search');

class Editor {
    constructor() {
        this.view = null;
        this.contentChangeCallbacks = [];
        this.customKeymapCompartment = new Compartment();
        this.snippetExtensionCompartment = new Compartment();
    }

    /**
     * Initialize the CodeMirror editor
     * @param {HTMLElement} element - The DOM element to attach the editor to
     * @param {Array} customKeymap - Optional custom keymap bindings
     */
    initialize(element, customKeymap = []) {
        if (!element) {
            throw new Error('Editor element is required');
        }

        const startState = EditorState.create({
            doc: '',
            extensions: [
                markdown(),
                history(),
                search(),
                highlightSelectionMatches(),
                // Snippet extension compartment (can be reconfigured dynamically)
                this.snippetExtensionCompartment.of([]),
                // Custom keymap compartment (can be reconfigured dynamically)
                this.customKeymapCompartment.of(keymap.of(customKeymap)),
                // Default keymaps (lower priority)
                keymap.of([
                    ...defaultKeymap,
                    ...historyKeymap
                ]),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const content = this.getValue();
                        this.contentChangeCallbacks.forEach(callback => {
                            if (callback) {
                                callback(content);
                            }
                        });
                    }
                }),
                EditorView.lineWrapping
            ]
        });

        this.view = new EditorView({
            state: startState,
            parent: element
        });
    }

    /**
     * Update the custom keymap dynamically
     * @param {Array} customKeymap - New keymap bindings
     */
    updateKeymap(customKeymap) {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        this.view.dispatch({
            effects: this.customKeymapCompartment.reconfigure(keymap.of(customKeymap))
        });
    }

    /**
     * Enable snippet extensions
     * @param {Array} snippetExtensions - Snippet extensions from SnippetManager
     */
    enableSnippetExtensions(snippetExtensions) {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        if (!Array.isArray(snippetExtensions)) {
            throw new Error('Snippet extensions must be an array');
        }

        this.view.dispatch({
            effects: this.snippetExtensionCompartment.reconfigure(snippetExtensions)
        });
    }

    /**
     * Get the current content of the editor
     * @returns {string} The editor content
     */
    getValue() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }
        return this.view.state.doc.toString();
    }

    /**
     * Set the content of the editor
     * @param {string} content - The content to set
     */
    setValue(content) {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const transaction = this.view.state.update({
            changes: {
                from: 0,
                to: this.view.state.doc.length,
                insert: content
            }
        });

        this.view.dispatch(transaction);
    }

    /**
     * Insert text at the current cursor position
     * @param {string} text - The text to insert
     */
    insertText(text) {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.view.state.selection.main;
        const transaction = this.view.state.update({
            changes: {
                from: selection.from,
                to: selection.to,
                insert: text
            },
            selection: {
                anchor: selection.from + text.length
            }
        });

        this.view.dispatch(transaction);
    }

    /**
     * Apply markdown formatting to selected text
     * @param {'bold' | 'italic' | 'code'} format - The format to apply
     */
    applyFormatting(format) {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.view.state.selection.main;
        const selectedText = this.view.state.doc.sliceString(selection.from, selection.to);

        let formattedText;
        let cursorOffset;

        switch (format) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                cursorOffset = 2;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                cursorOffset = 1;
                break;
            case 'code':
                formattedText = `\`${selectedText}\``;
                cursorOffset = 1;
                break;
            default:
                throw new Error(`Unknown format: ${format}`);
        }

        const transaction = this.view.state.update({
            changes: {
                from: selection.from,
                to: selection.to,
                insert: formattedText
            },
            selection: {
                anchor: selection.from + cursorOffset,
                head: selection.from + cursorOffset + selectedText.length
            }
        });

        this.view.dispatch(transaction);
    }

    /**
     * Undo the last change
     */
    undo() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }
        undo(this.view);
    }

    /**
     * Redo the last undone change
     */
    redo() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }
        redo(this.view);
    }

    /**
     * Register a callback for content changes
     * @param {Function} callback - Function to call when content changes
     */
    onContentChange(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.contentChangeCallbacks.push(callback);
    }

    /**
     * Get the current scroll position as a percentage
     * @returns {number} Scroll position (0-1)
     */
    getScrollPosition() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const scrollDOM = this.view.scrollDOM;
        const scrollTop = scrollDOM.scrollTop;
        const scrollHeight = scrollDOM.scrollHeight - scrollDOM.clientHeight;

        if (scrollHeight === 0) {
            return 0;
        }

        return scrollTop / scrollHeight;
    }

    /**
     * Set the scroll position as a percentage
     * @param {number} position - Scroll position (0-1)
     */
    setScrollPosition(position) {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        if (isNaN(position) || position < 0 || position > 1) {
            throw new Error('Position must be between 0 and 1');
        }

        const scrollDOM = this.view.scrollDOM;
        const scrollHeight = scrollDOM.scrollHeight - scrollDOM.clientHeight;
        scrollDOM.scrollTop = scrollHeight * position;
    }

    /**
     * Insert template at cursor position or replace entire document
     * Requirements: 6.1, 6.2, 6.3
     * @param {string} templateContent - Template content to insert
     * @param {string} mode - 'insert' or 'replace'
     */
    insertTemplate(templateContent, mode = 'insert') {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        if (!templateContent || typeof templateContent !== 'string') {
            throw new Error('Template content must be a non-empty string');
        }

        if (mode !== 'insert' && mode !== 'replace') {
            throw new Error('Mode must be "insert" or "replace"');
        }

        let transaction;

        if (mode === 'replace') {
            // Replace entire document
            transaction = this.view.state.update({
                changes: {
                    from: 0,
                    to: this.view.state.doc.length,
                    insert: templateContent
                }
            });
        } else {
            // Insert at cursor position
            const selection = this.view.state.selection.main;
            transaction = this.view.state.update({
                changes: {
                    from: selection.from,
                    to: selection.to,
                    insert: templateContent
                }
            });
        }

        this.view.dispatch(transaction);

        // Position cursor at first placeholder
        this.positionCursorAtFirstPlaceholder(templateContent, mode);
    }

    /**
     * Position cursor at the first placeholder in the template
     * Requirements: 6.3
     * @param {string} templateContent - Template content
     * @param {string} mode - 'insert' or 'replace'
     */
    positionCursorAtFirstPlaceholder(templateContent, mode) {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        // Find first placeholder {{...}}
        const placeholderRegex = /\{\{[^}]+\}\}/;
        const match = templateContent.match(placeholderRegex);

        if (!match) {
            // No placeholder found, position at end of inserted content
            return;
        }

        const placeholderPosition = templateContent.indexOf(match[0]);
        const placeholderLength = match[0].length;

        let absolutePosition;
        if (mode === 'replace') {
            // Position is from start of document
            absolutePosition = placeholderPosition;
        } else {
            // Position is from where we inserted
            const selection = this.view.state.selection.main;
            absolutePosition = selection.from + placeholderPosition;
        }

        // Select the placeholder
        const transaction = this.view.state.update({
            selection: {
                anchor: absolutePosition,
                head: absolutePosition + placeholderLength
            },
            scrollIntoView: true
        });

        this.view.dispatch(transaction);
        this.view.focus();
    }

    /**
     * Get cursor position in the document
     * @returns {number} Cursor position
     */
    getCursorPosition() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }
        return this.view.state.selection.main.from;
    }

    /**
     * Set cursor position in the document
     * @param {number} position - Position to set cursor to
     */
    setCursorPosition(position) {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        if (typeof position !== 'number' || position < 0) {
            throw new Error('Position must be a non-negative number');
        }

        const maxPosition = this.view.state.doc.length;
        const safePosition = Math.min(position, maxPosition);

        const transaction = this.view.state.update({
            selection: {
                anchor: safePosition
            },
            scrollIntoView: true
        });

        this.view.dispatch(transaction);
    }

    /**
     * Destroy the editor instance
     */
    destroy() {
        if (this.view) {
            this.view.destroy();
            this.view = null;
        }
        this.contentChangeCallbacks = [];
    }
}

module.exports = Editor;
