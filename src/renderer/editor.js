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
