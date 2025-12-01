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

    // ========== Selection and Line Utility Methods ==========

    /**
     * Get the current selection
     * @returns {{from: number, to: number, text: string, isEmpty: boolean}}
     */
    getSelection() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.view.state.selection.main;
        return {
            from: selection.from,
            to: selection.to,
            text: this.view.state.doc.sliceString(selection.from, selection.to),
            isEmpty: selection.from === selection.to
        };
    }

    /**
     * Get the current line where the cursor is positioned
     * @returns {{lineNumber: number, text: string, from: number, to: number}}
     */
    getCurrentLine() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.view.state.selection.main;
        const line = this.view.state.doc.lineAt(selection.from);

        return {
            lineNumber: line.number,
            text: line.text,
            from: line.from,
            to: line.to
        };
    }

    /**
     * Replace the current selection with new text
     * @param {string} text - Text to insert
     * @param {boolean} selectAfter - Whether to select the inserted text after replacement
     */
    replaceSelection(text, selectAfter = false) {
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
            selection: selectAfter ? {
                anchor: selection.from,
                head: selection.from + text.length
            } : {
                anchor: selection.from + text.length
            },
            scrollIntoView: true
        });

        this.view.dispatch(transaction);
    }

    /**
     * Replace the current line with new text
     * @param {string} text - Text to replace the line with
     */
    replaceCurrentLine(text) {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const line = this.getCurrentLine();
        const transaction = this.view.state.update({
            changes: {
                from: line.from,
                to: line.to,
                insert: text
            },
            scrollIntoView: true
        });

        this.view.dispatch(transaction);
    }

    // ========== Formatting Application Methods ==========

    /**
     * Apply bold formatting to selected text
     * Requirements: 1.1, 1.2, 1.3
     */
    applyBold() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();

        if (selection.isEmpty) {
            // No selection - insert markers and place cursor between them
            this.replaceSelection('****');
            this.setCursorPosition(selection.from + 2);
        } else {
            // Check if already bolded
            const beforeText = this.view.state.doc.sliceString(
                Math.max(0, selection.from - 2),
                selection.from
            );
            const afterText = this.view.state.doc.sliceString(
                selection.to,
                Math.min(this.view.state.doc.length, selection.to + 2)
            );

            if (beforeText === '**' && afterText === '**') {
                // Remove bold markers (remove from end first to maintain positions)
                const transaction = this.view.state.update({
                    changes: [
                        { from: selection.to, to: selection.to + 2, insert: '' },
                        { from: selection.from - 2, to: selection.from, insert: '' }
                    ],
                    selection: {
                        anchor: selection.from - 2,
                        head: selection.to - 2
                    }
                });
                this.view.dispatch(transaction);
            } else {
                // Add bold markers
                this.replaceSelection(`**${selection.text}**`, true);
            }
        }
    }

    /**
     * Apply italic formatting to selected text
     * Requirements: 2.1, 2.2, 2.3
     */
    applyItalic() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();

        if (selection.isEmpty) {
            // No selection - insert markers and place cursor between them
            this.replaceSelection('**');
            this.setCursorPosition(selection.from + 1);
        } else {
            // Check if already italicized
            const beforeText = this.view.state.doc.sliceString(
                Math.max(0, selection.from - 1),
                selection.from
            );
            const afterText = this.view.state.doc.sliceString(
                selection.to,
                Math.min(this.view.state.doc.length, selection.to + 1)
            );

            if (beforeText === '*' && afterText === '*') {
                // Remove italic markers (remove from end first to maintain positions)
                const transaction = this.view.state.update({
                    changes: [
                        { from: selection.to, to: selection.to + 1, insert: '' },
                        { from: selection.from - 1, to: selection.from, insert: '' }
                    ],
                    selection: {
                        anchor: selection.from - 1,
                        head: selection.to - 1
                    }
                });
                this.view.dispatch(transaction);
            } else {
                // Add italic markers
                this.replaceSelection(`*${selection.text}*`, true);
            }
        }
    }

    /**
     * Apply strikethrough formatting to selected text
     * Requirements: 3.1, 3.2, 3.3
     */
    applyStrikethrough() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();

        if (selection.isEmpty) {
            // No selection - insert markers and place cursor between them
            this.replaceSelection('~~~~');
            this.setCursorPosition(selection.from + 2);
        } else {
            // Check if already strikethrough
            const beforeText = this.view.state.doc.sliceString(
                Math.max(0, selection.from - 2),
                selection.from
            );
            const afterText = this.view.state.doc.sliceString(
                selection.to,
                Math.min(this.view.state.doc.length, selection.to + 2)
            );

            if (beforeText === '~~' && afterText === '~~') {
                // Remove strikethrough markers (remove from end first to maintain positions)
                const transaction = this.view.state.update({
                    changes: [
                        { from: selection.to, to: selection.to + 2, insert: '' },
                        { from: selection.from - 2, to: selection.from, insert: '' }
                    ],
                    selection: {
                        anchor: selection.from - 2,
                        head: selection.to - 2
                    }
                });
                this.view.dispatch(transaction);
            } else {
                // Add strikethrough markers
                this.replaceSelection(`~~${selection.text}~~`, true);
            }
        }
    }

    /**
     * Apply heading formatting to current line
     * Requirements: 4.1, 4.2, 4.3
     * @param {number} level - Heading level (1-6)
     */
    applyHeading(level) {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        if (level < 1 || level > 6) {
            throw new Error('Heading level must be between 1 and 6');
        }

        const line = this.getCurrentLine();
        const headingMatch = line.text.match(/^(#{1,6})\s/);
        const newHeadingMarker = '#'.repeat(level) + ' ';

        if (headingMatch) {
            const currentLevel = headingMatch[1].length;
            if (currentLevel === level) {
                // Remove heading formatting
                const newText = line.text.replace(/^#{1,6}\s/, '');
                this.replaceCurrentLine(newText);
            } else {
                // Replace heading level
                const newText = line.text.replace(/^#{1,6}\s/, newHeadingMarker);
                this.replaceCurrentLine(newText);
            }
        } else {
            // Add heading formatting
            this.replaceCurrentLine(newHeadingMarker + line.text);
        }
    }

    /**
     * Apply unordered list formatting to current line(s)
     * Requirements: 5.1, 5.3, 5.4
     */
    applyUnorderedList() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();
        const startLine = this.view.state.doc.lineAt(selection.from);
        const endLine = this.view.state.doc.lineAt(selection.to);

        const changes = [];
        let allLinesAreUnorderedList = true;

        // Check all lines in selection
        for (let i = startLine.number; i <= endLine.number; i++) {
            const line = this.view.state.doc.line(i);
            if (!line.text.match(/^-\s/)) {
                allLinesAreUnorderedList = false;
                break;
            }
        }

        // Apply or remove formatting
        for (let i = startLine.number; i <= endLine.number; i++) {
            const line = this.view.state.doc.line(i);

            if (allLinesAreUnorderedList) {
                // Remove list formatting
                const newText = line.text.replace(/^-\s/, '');
                changes.push({
                    from: line.from,
                    to: line.to,
                    insert: newText
                });
            } else {
                // Add list formatting if not already present
                if (!line.text.match(/^-\s/)) {
                    changes.push({
                        from: line.from,
                        to: line.to,
                        insert: '- ' + line.text
                    });
                }
            }
        }

        if (changes.length > 0) {
            const transaction = this.view.state.update({
                changes,
                scrollIntoView: true
            });
            this.view.dispatch(transaction);
        }
    }

    /**
     * Apply ordered list formatting to current line(s)
     * Requirements: 5.2, 5.3, 5.4
     */
    applyOrderedList() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();
        const startLine = this.view.state.doc.lineAt(selection.from);
        const endLine = this.view.state.doc.lineAt(selection.to);

        const changes = [];
        let allLinesAreOrderedList = true;

        // Check all lines in selection
        for (let i = startLine.number; i <= endLine.number; i++) {
            const line = this.view.state.doc.line(i);
            if (!line.text.match(/^\d+\.\s/)) {
                allLinesAreOrderedList = false;
                break;
            }
        }

        // Apply or remove formatting
        for (let i = startLine.number; i <= endLine.number; i++) {
            const line = this.view.state.doc.line(i);
            const lineNumber = i - startLine.number + 1;

            if (allLinesAreOrderedList) {
                // Remove list formatting
                const newText = line.text.replace(/^\d+\.\s/, '');
                changes.push({
                    from: line.from,
                    to: line.to,
                    insert: newText
                });
            } else {
                // Add list formatting if not already present
                if (!line.text.match(/^\d+\.\s/)) {
                    changes.push({
                        from: line.from,
                        to: line.to,
                        insert: `${lineNumber}. ` + line.text
                    });
                }
            }
        }

        if (changes.length > 0) {
            const transaction = this.view.state.update({
                changes,
                scrollIntoView: true
            });
            this.view.dispatch(transaction);
        }
    }

    /**
     * Apply blockquote formatting to current line(s)
     * Requirements: 8.1, 8.2, 8.3
     */
    applyBlockquote() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();
        const startLine = this.view.state.doc.lineAt(selection.from);
        const endLine = this.view.state.doc.lineAt(selection.to);

        const changes = [];
        let allLinesAreBlockquote = true;

        // Check all lines in selection
        for (let i = startLine.number; i <= endLine.number; i++) {
            const line = this.view.state.doc.line(i);
            if (!line.text.match(/^>\s/)) {
                allLinesAreBlockquote = false;
                break;
            }
        }

        // Apply or remove formatting
        for (let i = startLine.number; i <= endLine.number; i++) {
            const line = this.view.state.doc.line(i);

            if (allLinesAreBlockquote) {
                // Remove blockquote formatting
                const newText = line.text.replace(/^>\s/, '');
                changes.push({
                    from: line.from,
                    to: line.to,
                    insert: newText
                });
            } else {
                // Add blockquote formatting if not already present
                if (!line.text.match(/^>\s/)) {
                    changes.push({
                        from: line.from,
                        to: line.to,
                        insert: '> ' + line.text
                    });
                }
            }
        }

        if (changes.length > 0) {
            const transaction = this.view.state.update({
                changes,
                scrollIntoView: true
            });
            this.view.dispatch(transaction);
        }
    }

    /**
     * Apply inline code formatting to selected text
     * Requirements: 7.1, 7.3
     */
    applyInlineCode() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();

        if (selection.isEmpty) {
            // No selection - insert markers and place cursor between them
            this.replaceSelection('``');
            this.setCursorPosition(selection.from + 1);
        } else {
            // Check if already code formatted
            const beforeText = this.view.state.doc.sliceString(
                Math.max(0, selection.from - 1),
                selection.from
            );
            const afterText = this.view.state.doc.sliceString(
                selection.to,
                Math.min(this.view.state.doc.length, selection.to + 1)
            );

            if (beforeText === '`' && afterText === '`') {
                // Remove code markers (remove from end first to maintain positions)
                const transaction = this.view.state.update({
                    changes: [
                        { from: selection.to, to: selection.to + 1, insert: '' },
                        { from: selection.from - 1, to: selection.from, insert: '' }
                    ],
                    selection: {
                        anchor: selection.from - 1,
                        head: selection.to - 1
                    }
                });
                this.view.dispatch(transaction);
            } else {
                // Add code markers
                this.replaceSelection(`\`${selection.text}\``, true);
            }
        }
    }

    /**
     * Insert code block at cursor position
     * Requirements: 7.2
     */
    applyCodeBlock() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();
        const codeBlock = '```\n\n```';

        this.replaceSelection(codeBlock);
        // Position cursor between the backticks
        this.setCursorPosition(selection.from + 4);
    }

    /**
     * Insert link syntax
     * Requirements: 6.1, 6.2, 6.4
     */
    insertLink() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();

        if (selection.isEmpty) {
            // No selection - insert placeholder text and URL
            const linkText = '[text](url)';
            this.replaceSelection(linkText);
            // Select the URL placeholder
            const urlStart = selection.from + 7; // After '[text]('
            this.view.dispatch(this.view.state.update({
                selection: {
                    anchor: urlStart,
                    head: urlStart + 3
                }
            }));
        } else {
            // Wrap selection in link syntax
            const linkText = `[${selection.text}](url)`;
            const transaction = this.view.state.update({
                changes: {
                    from: selection.from,
                    to: selection.to,
                    insert: linkText
                },
                selection: {
                    anchor: selection.from + selection.text.length + 3, // After ']('
                    head: selection.from + selection.text.length + 6 // Select 'url'
                }
            });
            this.view.dispatch(transaction);
        }
    }

    /**
     * Insert image syntax
     * Requirements: 6.3, 6.4
     */
    insertImage() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();
        const imageText = '![alt](url)';

        this.replaceSelection(imageText);
        // Select the URL placeholder
        const urlStart = selection.from + 7; // After '![alt]('
        this.view.dispatch(this.view.state.update({
            selection: {
                anchor: urlStart,
                head: urlStart + 3
            }
        }));
    }

    // ========== Format Detection Methods ==========

    /**
     * Check if bold formatting is active at cursor position
     * Requirements: 1.4
     * @returns {boolean}
     */
    isBoldActive() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();

        // Check if cursor is within bold markers
        const beforeText = this.view.state.doc.sliceString(
            Math.max(0, selection.from - 2),
            selection.from
        );
        const afterText = this.view.state.doc.sliceString(
            selection.to,
            Math.min(this.view.state.doc.length, selection.to + 2)
        );

        return beforeText === '**' && afterText === '**';
    }

    /**
     * Check if italic formatting is active at cursor position
     * Requirements: 2.4
     * @returns {boolean}
     */
    isItalicActive() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();

        // Check if cursor is within italic markers
        const beforeText = this.view.state.doc.sliceString(
            Math.max(0, selection.from - 1),
            selection.from
        );
        const afterText = this.view.state.doc.sliceString(
            selection.to,
            Math.min(this.view.state.doc.length, selection.to + 1)
        );

        return beforeText === '*' && afterText === '*';
    }

    /**
     * Check if strikethrough formatting is active at cursor position
     * Requirements: 3.4
     * @returns {boolean}
     */
    isStrikethroughActive() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();

        // Check if cursor is within strikethrough markers
        const beforeText = this.view.state.doc.sliceString(
            Math.max(0, selection.from - 2),
            selection.from
        );
        const afterText = this.view.state.doc.sliceString(
            selection.to,
            Math.min(this.view.state.doc.length, selection.to + 2)
        );

        return beforeText === '~~' && afterText === '~~';
    }

    /**
     * Get the active heading level at cursor position
     * Requirements: 4.4
     * @returns {number} - 0 if no heading, 1-6 for heading level
     */
    getActiveHeadingLevel() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const line = this.getCurrentLine();
        const headingMatch = line.text.match(/^(#{1,6})\s/);

        return headingMatch ? headingMatch[1].length : 0;
    }

    /**
     * Check if unordered list formatting is active at cursor position
     * Requirements: 5.5
     * @returns {boolean}
     */
    isUnorderedListActive() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const line = this.getCurrentLine();
        return /^-\s/.test(line.text);
    }

    /**
     * Check if ordered list formatting is active at cursor position
     * Requirements: 5.5
     * @returns {boolean}
     */
    isOrderedListActive() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const line = this.getCurrentLine();
        return /^\d+\.\s/.test(line.text);
    }

    /**
     * Check if blockquote formatting is active at cursor position
     * Requirements: 8.4
     * @returns {boolean}
     */
    isBlockquoteActive() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const line = this.getCurrentLine();
        return /^>\s/.test(line.text);
    }

    /**
     * Check if inline code formatting is active at cursor position
     * Requirements: 7.4
     * @returns {boolean}
     */
    isInlineCodeActive() {
        if (!this.view) {
            throw new Error('Editor not initialized');
        }

        const selection = this.getSelection();

        // Check if cursor is within code markers
        const beforeText = this.view.state.doc.sliceString(
            Math.max(0, selection.from - 1),
            selection.from
        );
        const afterText = this.view.state.doc.sliceString(
            selection.to,
            Math.min(this.view.state.doc.length, selection.to + 1)
        );

        return beforeText === '`' && afterText === '`';
    }
}

module.exports = Editor;
