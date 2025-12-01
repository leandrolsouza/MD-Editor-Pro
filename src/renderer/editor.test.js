/**
 * Unit tests for Editor class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Editor from './editor.js';

describe('Editor', () => {
    let editor;
    let container;

    beforeEach(() => {
        // Create a container element for the editor
        container = document.createElement('div');
        document.body.appendChild(container);
        editor = new Editor();
    });

    afterEach(() => {
        if (editor) {
            editor.destroy();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('initialization', () => {
        it('should initialize with an element', () => {
            editor.initialize(container);
            expect(editor.view).toBeDefined();
            expect(editor.view).not.toBeNull();
        });

        it('should throw error when initializing without element', () => {
            expect(() => editor.initialize(null)).toThrow('Editor element is required');
        });
    });

    describe('getValue and setValue', () => {
        beforeEach(() => {
            editor.initialize(container);
        });

        it('should get empty string initially', () => {
            expect(editor.getValue()).toBe('');
        });

        it('should set and get content', () => {
            const content = 'Hello, World!';

            editor.setValue(content);
            expect(editor.getValue()).toBe(content);
        });

        it('should replace existing content', () => {
            editor.setValue('First content');
            editor.setValue('Second content');
            expect(editor.getValue()).toBe('Second content');
        });

        it('should throw error when getting value before initialization', () => {
            const uninitializedEditor = new Editor();

            expect(() => uninitializedEditor.getValue()).toThrow('Editor not initialized');
        });

        it('should throw error when setting value before initialization', () => {
            const uninitializedEditor = new Editor();

            expect(() => uninitializedEditor.setValue('test')).toThrow('Editor not initialized');
        });
    });

    describe('insertText', () => {
        beforeEach(() => {
            editor.initialize(container);
        });

        it('should insert text at cursor position', () => {
            editor.setValue('Hello World');
            // Move cursor to end
            const transaction = editor.view.state.update({
                selection: { anchor: 11, head: 11 }
            });

            editor.view.dispatch(transaction);

            editor.insertText(' Beautiful');
            expect(editor.getValue()).toBe('Hello World Beautiful');
        });

        it('should insert text in empty editor', () => {
            editor.insertText('New text');
            expect(editor.getValue()).toBe('New text');
        });

        it('should throw error before initialization', () => {
            const uninitializedEditor = new Editor();

            expect(() => uninitializedEditor.insertText('test')).toThrow('Editor not initialized');
        });
    });

    describe('applyFormatting', () => {
        beforeEach(() => {
            editor.initialize(container);
        });

        it('should apply bold formatting', () => {
            editor.setValue('text');
            // Select all text
            const transaction = editor.view.state.update({
                selection: { anchor: 0, head: 4 }
            });

            editor.view.dispatch(transaction);

            editor.applyFormatting('bold');
            expect(editor.getValue()).toBe('**text**');
        });

        it('should apply italic formatting', () => {
            editor.setValue('text');
            const transaction = editor.view.state.update({
                selection: { anchor: 0, head: 4 }
            });

            editor.view.dispatch(transaction);

            editor.applyFormatting('italic');
            expect(editor.getValue()).toBe('*text*');
        });

        it('should apply code formatting', () => {
            editor.setValue('text');
            const transaction = editor.view.state.update({
                selection: { anchor: 0, head: 4 }
            });

            editor.view.dispatch(transaction);

            editor.applyFormatting('code');
            expect(editor.getValue()).toBe('`text`');
        });

        it('should throw error for unknown format', () => {
            expect(() => editor.applyFormatting('unknown')).toThrow('Unknown format: unknown');
        });

        it('should throw error before initialization', () => {
            const uninitializedEditor = new Editor();

            expect(() => uninitializedEditor.applyFormatting('bold')).toThrow('Editor not initialized');
        });
    });

    describe('undo and redo', () => {
        beforeEach(() => {
            editor.initialize(container);
        });

        it('should undo last change', () => {
            // Start with some content
            editor.setValue('Hello');

            // Move cursor to end
            const len = editor.getValue().length;
            const transaction = editor.view.state.update({
                selection: { anchor: len, head: len }
            });

            editor.view.dispatch(transaction);

            // Make a change that can be undone
            editor.insertText(' World');
            const afterInsert = editor.getValue();

            expect(afterInsert).toBe('Hello World');

            // Undo should remove the last insertion
            editor.undo();
            expect(editor.getValue()).toBe('Hello');
        });

        it('should redo undone change', () => {
            editor.setValue('Initial');
            editor.setValue('Modified');
            editor.undo();
            editor.redo();
            expect(editor.getValue()).toBe('Modified');
        });

        it('should throw error when undo before initialization', () => {
            const uninitializedEditor = new Editor();

            expect(() => uninitializedEditor.undo()).toThrow('Editor not initialized');
        });

        it('should throw error when redo before initialization', () => {
            const uninitializedEditor = new Editor();

            expect(() => uninitializedEditor.redo()).toThrow('Editor not initialized');
        });
    });

    describe('onContentChange', () => {
        beforeEach(() => {
            editor.initialize(container);
        });

        it('should call callback when content changes', () => {
            const callback = vi.fn();

            editor.onContentChange(callback);

            editor.setValue('New content');

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith('New content');
        });

        it('should throw error if callback is not a function', () => {
            expect(() => editor.onContentChange('not a function')).toThrow('Callback must be a function');
        });
    });

    describe('scroll position', () => {
        beforeEach(() => {
            editor.initialize(container);
        });

        it('should get scroll position', () => {
            const position = editor.getScrollPosition();

            expect(position).toBeGreaterThanOrEqual(0);
            expect(position).toBeLessThanOrEqual(1);
        });

        it('should set scroll position', () => {
            editor.setScrollPosition(0.5);
            // Position should be set (exact value depends on content)
            expect(() => editor.setScrollPosition(0.5)).not.toThrow();
        });

        it('should throw error for invalid scroll position', () => {
            expect(() => editor.setScrollPosition(-0.1)).toThrow('Position must be between 0 and 1');
            expect(() => editor.setScrollPosition(1.1)).toThrow('Position must be between 0 and 1');
        });

        it('should throw error when getting scroll position before initialization', () => {
            const uninitializedEditor = new Editor();

            expect(() => uninitializedEditor.getScrollPosition()).toThrow('Editor not initialized');
        });

        it('should throw error when setting scroll position before initialization', () => {
            const uninitializedEditor = new Editor();

            expect(() => uninitializedEditor.setScrollPosition(0.5)).toThrow('Editor not initialized');
        });
    });

    describe('template insertion', () => {
        beforeEach(() => {
            editor.initialize(container);
        });

        it('should insert template at cursor position', () => {
            editor.setValue('Hello World');
            editor.insertTemplate('# {{title}}\n\n{{content}}', 'insert');
            const content = editor.getValue();

            expect(content).toContain('# {{title}}');
            expect(content).toContain('{{content}}');
        });

        it('should replace entire document with template', () => {
            editor.setValue('Old content');
            editor.insertTemplate('# {{title}}\n\n{{content}}', 'replace');
            const content = editor.getValue();

            expect(content).toBe('# {{title}}\n\n{{content}}');
            expect(content).not.toContain('Old content');
        });

        it('should throw error for invalid template content', () => {
            expect(() => editor.insertTemplate('', 'insert')).toThrow('Template content must be a non-empty string');
            expect(() => editor.insertTemplate(null, 'insert')).toThrow('Template content must be a non-empty string');
        });

        it('should throw error for invalid mode', () => {
            expect(() => editor.insertTemplate('content', 'invalid')).toThrow('Mode must be "insert" or "replace"');
        });

        it('should throw error when inserting before initialization', () => {
            const uninitializedEditor = new Editor();

            expect(() => uninitializedEditor.insertTemplate('content', 'insert')).toThrow('Editor not initialized');
        });
    });

    describe('cursor positioning', () => {
        beforeEach(() => {
            editor.initialize(container);
        });

        it('should get cursor position', () => {
            editor.setValue('Hello World');
            const position = editor.getCursorPosition();

            expect(position).toBeGreaterThanOrEqual(0);
        });

        it('should set cursor position', () => {
            editor.setValue('Hello World');
            editor.setCursorPosition(5);
            const position = editor.getCursorPosition();

            expect(position).toBe(5);
        });

        it('should throw error for invalid cursor position', () => {
            expect(() => editor.setCursorPosition(-1)).toThrow('Position must be a non-negative number');
        });

        it('should clamp cursor position to document length', () => {
            editor.setValue('Hello');
            editor.setCursorPosition(1000);
            const position = editor.getCursorPosition();

            expect(position).toBeLessThanOrEqual(5);
        });

        it('should throw error when getting cursor position before initialization', () => {
            const uninitializedEditor = new Editor();

            expect(() => uninitializedEditor.getCursorPosition()).toThrow('Editor not initialized');
        });

        it('should throw error when setting cursor position before initialization', () => {
            const uninitializedEditor = new Editor();

            expect(() => uninitializedEditor.setCursorPosition(0)).toThrow('Editor not initialized');
        });
    });

    describe('destroy', () => {
        it('should destroy editor instance', () => {
            editor.initialize(container);
            editor.destroy();
            expect(editor.view).toBeNull();
        });

        it('should clear content change callbacks', () => {
            editor.initialize(container);
            editor.onContentChange(() => { });
            editor.destroy();
            expect(editor.contentChangeCallbacks).toEqual([]);
        });
    });

    describe('new formatting methods', () => {
        beforeEach(() => {
            editor.initialize(container);
        });

        describe('selection utilities', () => {
            it('should get selection', () => {
                editor.setValue('Hello World');
                const transaction = editor.view.state.update({
                    selection: { anchor: 0, head: 5 }
                });

                editor.view.dispatch(transaction);

                const selection = editor.getSelection();

                expect(selection.from).toBe(0);
                expect(selection.to).toBe(5);
                expect(selection.text).toBe('Hello');
                expect(selection.isEmpty).toBe(false);
            });

            it('should get current line', () => {
                editor.setValue('Line 1\nLine 2\nLine 3');
                const transaction = editor.view.state.update({
                    selection: { anchor: 7 }
                });

                editor.view.dispatch(transaction);

                const line = editor.getCurrentLine();

                expect(line.text).toBe('Line 2');
                expect(line.lineNumber).toBe(2);
            });

            it('should replace selection', () => {
                editor.setValue('Hello World');
                const transaction = editor.view.state.update({
                    selection: { anchor: 6, head: 11 }
                });

                editor.view.dispatch(transaction);

                editor.replaceSelection('Universe');
                expect(editor.getValue()).toBe('Hello Universe');
            });

            it('should replace current line', () => {
                editor.setValue('Line 1\nLine 2\nLine 3');
                const transaction = editor.view.state.update({
                    selection: { anchor: 7 }
                });

                editor.view.dispatch(transaction);

                editor.replaceCurrentLine('New Line');
                expect(editor.getValue()).toBe('Line 1\nNew Line\nLine 3');
            });
        });

        describe('applyBold', () => {
            it('should wrap selected text with bold markers', () => {
                editor.setValue('text');
                const transaction = editor.view.state.update({
                    selection: { anchor: 0, head: 4 }
                });

                editor.view.dispatch(transaction);

                editor.applyBold();
                expect(editor.getValue()).toBe('**text**');
            });

            it('should insert markers with empty selection', () => {
                editor.setValue('');
                editor.applyBold();
                expect(editor.getValue()).toBe('****');
            });

            it('should remove bold markers when already bolded', () => {
                editor.setValue('**text**');
                const transaction = editor.view.state.update({
                    selection: { anchor: 2, head: 6 }
                });

                editor.view.dispatch(transaction);

                editor.applyBold();
                expect(editor.getValue()).toBe('text');
            });
        });

        describe('applyItalic', () => {
            it('should wrap selected text with italic markers', () => {
                editor.setValue('text');
                const transaction = editor.view.state.update({
                    selection: { anchor: 0, head: 4 }
                });

                editor.view.dispatch(transaction);

                editor.applyItalic();
                expect(editor.getValue()).toBe('*text*');
            });

            it('should remove italic markers when already italicized', () => {
                editor.setValue('*text*');
                const transaction = editor.view.state.update({
                    selection: { anchor: 1, head: 5 }
                });

                editor.view.dispatch(transaction);

                editor.applyItalic();
                expect(editor.getValue()).toBe('text');
            });
        });

        describe('applyStrikethrough', () => {
            it('should wrap selected text with strikethrough markers', () => {
                editor.setValue('text');
                const transaction = editor.view.state.update({
                    selection: { anchor: 0, head: 4 }
                });

                editor.view.dispatch(transaction);

                editor.applyStrikethrough();
                expect(editor.getValue()).toBe('~~text~~');
            });

            it('should remove strikethrough markers when already strikethrough', () => {
                editor.setValue('~~text~~');
                const transaction = editor.view.state.update({
                    selection: { anchor: 2, head: 6 }
                });

                editor.view.dispatch(transaction);

                editor.applyStrikethrough();
                expect(editor.getValue()).toBe('text');
            });
        });

        describe('applyHeading', () => {
            it('should add heading markers', () => {
                editor.setValue('Heading');
                editor.applyHeading(1);
                expect(editor.getValue()).toBe('# Heading');
            });

            it('should replace heading level', () => {
                editor.setValue('# Heading');
                editor.applyHeading(2);
                expect(editor.getValue()).toBe('## Heading');
            });

            it('should remove heading when same level applied', () => {
                editor.setValue('## Heading');
                editor.applyHeading(2);
                expect(editor.getValue()).toBe('Heading');
            });
        });

        describe('applyUnorderedList', () => {
            it('should add unordered list marker', () => {
                editor.setValue('Item');
                editor.applyUnorderedList();
                expect(editor.getValue()).toBe('- Item');
            });

            it('should remove list marker when already a list', () => {
                editor.setValue('- Item');
                editor.applyUnorderedList();
                expect(editor.getValue()).toBe('Item');
            });

            it('should apply to multiple lines', () => {
                editor.setValue('Item 1\nItem 2');
                const transaction = editor.view.state.update({
                    selection: { anchor: 0, head: 13 }
                });

                editor.view.dispatch(transaction);

                editor.applyUnorderedList();
                expect(editor.getValue()).toBe('- Item 1\n- Item 2');
            });
        });

        describe('applyOrderedList', () => {
            it('should add ordered list marker', () => {
                editor.setValue('Item');
                editor.applyOrderedList();
                expect(editor.getValue()).toBe('1. Item');
            });

            it('should remove list marker when already a list', () => {
                editor.setValue('1. Item');
                editor.applyOrderedList();
                expect(editor.getValue()).toBe('Item');
            });
        });

        describe('applyBlockquote', () => {
            it('should add blockquote marker', () => {
                editor.setValue('Quote');
                editor.applyBlockquote();
                expect(editor.getValue()).toBe('> Quote');
            });

            it('should remove blockquote marker when already a blockquote', () => {
                editor.setValue('> Quote');
                editor.applyBlockquote();
                expect(editor.getValue()).toBe('Quote');
            });
        });

        describe('applyInlineCode', () => {
            it('should wrap selected text with code markers', () => {
                editor.setValue('code');
                const transaction = editor.view.state.update({
                    selection: { anchor: 0, head: 4 }
                });

                editor.view.dispatch(transaction);

                editor.applyInlineCode();
                expect(editor.getValue()).toBe('`code`');
            });

            it('should remove code markers when already code', () => {
                editor.setValue('`code`');
                const transaction = editor.view.state.update({
                    selection: { anchor: 1, head: 5 }
                });

                editor.view.dispatch(transaction);

                editor.applyInlineCode();
                expect(editor.getValue()).toBe('code');
            });
        });

        describe('applyCodeBlock', () => {
            it('should insert code block', () => {
                editor.setValue('');
                editor.applyCodeBlock();
                expect(editor.getValue()).toBe('```\n\n```');
            });
        });

        describe('insertLink', () => {
            it('should insert link with selected text', () => {
                editor.setValue('link text');
                const transaction = editor.view.state.update({
                    selection: { anchor: 0, head: 9 }
                });

                editor.view.dispatch(transaction);

                editor.insertLink();
                expect(editor.getValue()).toBe('[link text](url)');
            });

            it('should insert link with placeholder when no selection', () => {
                editor.setValue('');
                editor.insertLink();
                expect(editor.getValue()).toBe('[text](url)');
            });
        });

        describe('insertImage', () => {
            it('should insert image syntax', () => {
                editor.setValue('');
                editor.insertImage();
                expect(editor.getValue()).toBe('![alt](url)');
            });
        });

        describe('format detection', () => {
            it('should detect bold formatting', () => {
                editor.setValue('**text**');
                const transaction = editor.view.state.update({
                    selection: { anchor: 2, head: 6 }
                });

                editor.view.dispatch(transaction);

                expect(editor.isBoldActive()).toBe(true);
            });

            it('should detect italic formatting', () => {
                editor.setValue('*text*');
                const transaction = editor.view.state.update({
                    selection: { anchor: 1, head: 5 }
                });

                editor.view.dispatch(transaction);

                expect(editor.isItalicActive()).toBe(true);
            });

            it('should detect strikethrough formatting', () => {
                editor.setValue('~~text~~');
                const transaction = editor.view.state.update({
                    selection: { anchor: 2, head: 6 }
                });

                editor.view.dispatch(transaction);

                expect(editor.isStrikethroughActive()).toBe(true);
            });

            it('should detect heading level', () => {
                editor.setValue('## Heading');
                expect(editor.getActiveHeadingLevel()).toBe(2);
            });

            it('should detect unordered list', () => {
                editor.setValue('- Item');
                expect(editor.isUnorderedListActive()).toBe(true);
            });

            it('should detect ordered list', () => {
                editor.setValue('1. Item');
                expect(editor.isOrderedListActive()).toBe(true);
            });

            it('should detect blockquote', () => {
                editor.setValue('> Quote');
                expect(editor.isBlockquoteActive()).toBe(true);
            });

            it('should detect inline code', () => {
                editor.setValue('`code`');
                const transaction = editor.view.state.update({
                    selection: { anchor: 1, head: 5 }
                });

                editor.view.dispatch(transaction);

                expect(editor.isInlineCodeActive()).toBe(true);
            });
        });
    });
});
