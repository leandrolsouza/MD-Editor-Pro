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

    describe('destroy', () => {
        it('should destroy editor instance', () => {
            editor.initialize(container);
            editor.destroy();
            expect(editor.view).toBeNull();
        });

        it('should clear content change callback', () => {
            editor.initialize(container);
            editor.onContentChange(() => { });
            editor.destroy();
            expect(editor.contentChangeCallback).toBeNull();
        });
    });
});
