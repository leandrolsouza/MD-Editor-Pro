/**
 * Tests for SnippetManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import SnippetManager from './snippet-manager';
import Editor from './editor';

describe('SnippetManager', () => {
    let editor;
    let mockConfigStore;
    let snippetManager;

    beforeEach(() => {
        // Create a real editor instance
        editor = new Editor();
        const container = document.createElement('div');

        document.body.appendChild(container);
        editor.initialize(container);

        // Mock config store
        mockConfigStore = {
            getCustomSnippets: vi.fn(() => []),
            addCustomSnippet: vi.fn(),
            deleteCustomSnippet: vi.fn(),
            updateCustomSnippet: vi.fn()
        };

        snippetManager = new SnippetManager(editor, mockConfigStore);
    });

    describe('Constructor', () => {
        it('should throw error if editor is not provided', () => {
            expect(() => new SnippetManager(null, mockConfigStore)).toThrow('Editor is required');
        });

        it('should load custom snippets from config store', () => {
            const customSnippets = [
                { trigger: 'custom1', content: 'Custom content 1' }
            ];

            mockConfigStore.getCustomSnippets.mockReturnValue(customSnippets);

            const manager = new SnippetManager(editor, mockConfigStore);

            expect(manager.customSnippets).toEqual(customSnippets);
        });
    });

    describe('getSnippet', () => {
        it('should return built-in snippet by trigger', () => {
            const snippet = snippetManager.getSnippet('code');

            expect(snippet).toBeDefined();
            expect(snippet.trigger).toBe('code');
            expect(snippet.isBuiltIn).toBe(true);
        });

        it('should return custom snippet by trigger', () => {
            const customSnippet = {
                trigger: 'custom',
                content: 'Custom content',
                description: 'Custom snippet'
            };

            snippetManager.customSnippets = [customSnippet];

            const snippet = snippetManager.getSnippet('custom');

            expect(snippet).toEqual(customSnippet);
        });

        it('should return null if snippet not found', () => {
            const snippet = snippetManager.getSnippet('nonexistent');

            expect(snippet).toBeNull();
        });

        it('should throw error if trigger is not a string', () => {
            expect(() => snippetManager.getSnippet(null)).toThrow('Trigger must be a non-empty string');
        });
    });

    describe('getAllSnippets', () => {
        it('should return all built-in and custom snippets', () => {
            const customSnippet = {
                trigger: 'custom',
                content: 'Custom content'
            };

            snippetManager.customSnippets = [customSnippet];

            const allSnippets = snippetManager.getAllSnippets();

            expect(allSnippets.length).toBeGreaterThan(6); // At least 6 built-in + 1 custom
            expect(allSnippets.some(s => s.trigger === 'code')).toBe(true);
            expect(allSnippets.some(s => s.trigger === 'custom')).toBe(true);
        });
    });

    describe('getBuiltInSnippets', () => {
        it('should return only built-in snippets', () => {
            const builtIn = snippetManager.getBuiltInSnippets();

            expect(builtIn.length).toBe(6);
            expect(builtIn.every(s => s.isBuiltIn)).toBe(true);
        });
    });

    describe('getCustomSnippets', () => {
        it('should return only custom snippets', () => {
            const customSnippet = {
                trigger: 'custom',
                content: 'Custom content'
            };

            snippetManager.customSnippets = [customSnippet];

            const custom = snippetManager.getCustomSnippets();

            expect(custom.length).toBe(1);
            expect(custom[0].trigger).toBe('custom');
        });
    });

    describe('saveCustomSnippet', () => {
        it('should save a custom snippet', () => {
            const snippet = snippetManager.saveCustomSnippet('mysnippet', 'My content', 'My description');

            expect(snippet.trigger).toBe('mysnippet');
            expect(snippet.content).toBe('My content');
            expect(snippet.description).toBe('My description');
            expect(snippet.isBuiltIn).toBe(false);
            expect(snippet.createdAt).toBeDefined();
            expect(mockConfigStore.addCustomSnippet).toHaveBeenCalledWith(snippet);
        });

        it('should throw error if trigger already exists (built-in)', () => {
            expect(() => snippetManager.saveCustomSnippet('code', 'Content')).toThrow('already exists');
        });

        it('should throw error if trigger already exists (custom)', () => {
            snippetManager.saveCustomSnippet('custom', 'Content 1');
            expect(() => snippetManager.saveCustomSnippet('custom', 'Content 2')).toThrow('already exists');
        });

        it('should throw error if trigger is empty', () => {
            expect(() => snippetManager.saveCustomSnippet('', 'Content')).toThrow('Trigger must be a non-empty string');
        });

        it('should throw error if content is empty', () => {
            expect(() => snippetManager.saveCustomSnippet('trigger', '')).toThrow('Content must be a non-empty string');
        });

        it('should find placeholders in content', () => {
            const snippet = snippetManager.saveCustomSnippet('test', 'Hello {{name}}, welcome to {{place}}!');

            expect(snippet.placeholders).toEqual(['{{name}}', '{{place}}']);
        });
    });

    describe('deleteCustomSnippet', () => {
        it('should delete a custom snippet', () => {
            snippetManager.saveCustomSnippet('custom', 'Content');
            const result = snippetManager.deleteCustomSnippet('custom');

            expect(result).toBe(true);
            expect(snippetManager.customSnippets.length).toBe(0);
            expect(mockConfigStore.deleteCustomSnippet).toHaveBeenCalledWith('custom');
        });

        it('should return false if snippet not found', () => {
            const result = snippetManager.deleteCustomSnippet('nonexistent');

            expect(result).toBe(false);
        });

        it('should throw error if trigger is not a string', () => {
            expect(() => snippetManager.deleteCustomSnippet(null)).toThrow('Trigger must be a non-empty string');
        });
    });

    describe('updateCustomSnippet', () => {
        it('should update a custom snippet', () => {
            snippetManager.saveCustomSnippet('custom', 'Old content');
            const result = snippetManager.updateCustomSnippet('custom', { content: 'New content' });

            expect(result).toBe(true);
            expect(snippetManager.customSnippets[0].content).toBe('New content');
            expect(mockConfigStore.updateCustomSnippet).toHaveBeenCalledWith('custom', expect.objectContaining({
                content: 'New content'
            }));
        });

        it('should recalculate placeholders when content is updated', () => {
            snippetManager.saveCustomSnippet('custom', 'Old {{placeholder}}');
            snippetManager.updateCustomSnippet('custom', { content: 'New {{a}} and {{b}}' });

            expect(snippetManager.customSnippets[0].placeholders).toEqual(['{{a}}', '{{b}}']);
        });

        it('should return false if snippet not found', () => {
            const result = snippetManager.updateCustomSnippet('nonexistent', { content: 'New' });

            expect(result).toBe(false);
        });

        it('should throw error if trigger is not a string', () => {
            expect(() => snippetManager.updateCustomSnippet(null, {})).toThrow('Trigger must be a non-empty string');
        });

        it('should throw error if updates is not an object', () => {
            expect(() => snippetManager.updateCustomSnippet('custom', null)).toThrow('Updates must be an object');
        });
    });

    describe('detectTrigger', () => {
        it('should detect snippet trigger at cursor position', () => {
            const text = 'Hello world code';
            const result = snippetManager.detectTrigger(text, text.length);

            expect(result).toBeDefined();
            expect(result.trigger).toBe('code');
            expect(result.snippet.trigger).toBe('code');
            expect(result.start).toBe(12);
            expect(result.end).toBe(16);
        });

        it('should return null if no trigger found', () => {
            const text = 'Hello world ';
            const result = snippetManager.detectTrigger(text, text.length);

            expect(result).toBeNull();
        });

        it('should return null if text is empty', () => {
            const result = snippetManager.detectTrigger('', 0);

            expect(result).toBeNull();
        });

        it('should detect trigger after newline', () => {
            const text = 'First line\ncode';
            const result = snippetManager.detectTrigger(text, text.length);

            expect(result).toBeDefined();
            expect(result.trigger).toBe('code');
        });
    });

    describe('findPlaceholders', () => {
        it('should find all placeholders in content', () => {
            const content = 'Hello {{name}}, welcome to {{place}}!';
            const placeholders = snippetManager.findPlaceholders(content);

            expect(placeholders).toEqual(['{{name}}', '{{place}}']);
        });

        it('should return empty array if no placeholders', () => {
            const content = 'Hello world';
            const placeholders = snippetManager.findPlaceholders(content);

            expect(placeholders).toEqual([]);
        });

        it('should return empty array if content is empty', () => {
            const placeholders = snippetManager.findPlaceholders('');

            expect(placeholders).toEqual([]);
        });

        it('should handle multiple occurrences of same placeholder', () => {
            const content = '{{name}} and {{name}} again';
            const placeholders = snippetManager.findPlaceholders(content);

            expect(placeholders).toEqual(['{{name}}', '{{name}}']);
        });
    });

    describe('expandSnippet', () => {
        it('should expand snippet at cursor position', () => {
            editor.setValue('code');
            editor.setCursorPosition(4);

            const result = snippetManager.expandSnippet('code');

            expect(result).toBe(true);
            const content = editor.getValue();

            expect(content).toContain('```');
        });

        it('should return false if snippet not found', () => {
            editor.setValue('nonexistent');
            editor.setCursorPosition(11);

            const result = snippetManager.expandSnippet('nonexistent');

            expect(result).toBe(false);
        });

        it('should throw error if editor not initialized', () => {
            const uninitializedEditor = new Editor();
            const manager = new SnippetManager(uninitializedEditor, mockConfigStore);

            expect(() => manager.expandSnippet('code')).toThrow('Editor not initialized');
        });
    });

    describe('Built-in snippets', () => {
        it('should have code snippet', () => {
            const snippet = snippetManager.getSnippet('code');

            expect(snippet.content).toContain('```');
            expect(snippet.placeholders).toContain('{{language}}');
            expect(snippet.placeholders).toContain('{{code}}');
        });

        it('should have table snippet', () => {
            const snippet = snippetManager.getSnippet('table');

            expect(snippet.content).toContain('|');
            expect(snippet.placeholders.length).toBeGreaterThan(0);
        });

        it('should have link snippet', () => {
            const snippet = snippetManager.getSnippet('link');

            expect(snippet.content).toBe('[{{text}}]({{url}})');
        });

        it('should have img snippet', () => {
            const snippet = snippetManager.getSnippet('img');

            expect(snippet.content).toBe('![{{alt}}]({{url}})');
        });

        it('should have task snippet', () => {
            const snippet = snippetManager.getSnippet('task');

            expect(snippet.content).toBe('- [ ] {{task}}');
        });

        it('should have quote snippet', () => {
            const snippet = snippetManager.getSnippet('quote');

            expect(snippet.content).toBe('> {{quote}}');
        });
    });

    describe('reloadCustomSnippets', () => {
        it('should reload custom snippets from config store', () => {
            const newSnippets = [
                { trigger: 'new1', content: 'New content 1' },
                { trigger: 'new2', content: 'New content 2' }
            ];

            mockConfigStore.getCustomSnippets.mockReturnValue(newSnippets);

            snippetManager.reloadCustomSnippets();

            expect(snippetManager.customSnippets).toEqual(newSnippets);
        });
    });
});
