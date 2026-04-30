/**
 * SnippetManager Tests
 * Requirements: 7.1, 7.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import SnippetManager from './snippet-manager.js';
import ConfigStore from './config-store.js';

describe('SnippetManager', () => {
    let snippetManager;
    let configStore;

    beforeEach(() => {
        configStore = new ConfigStore();
        configStore.reset();
        snippetManager = new SnippetManager(configStore);
    });

    describe('Constructor', () => {
        it('should throw error if ConfigStore is not provided', () => {
            expect(() => new SnippetManager()).toThrow('ConfigStore is required');
            expect(() => new SnippetManager(null)).toThrow('ConfigStore is required');
        });

        it('should initialize with ConfigStore', () => {
            expect(snippetManager).toBeDefined();
            expect(snippetManager.configStore).toBe(configStore);
        });
    });

    describe('getBuiltInSnippets', () => {
        it('should return an array of built-in snippets', () => {
            const snippets = snippetManager.getBuiltInSnippets();

            expect(Array.isArray(snippets)).toBe(true);
            expect(snippets.length).toBe(6);
        });

        it('should include all expected built-in triggers', () => {
            const snippets = snippetManager.getBuiltInSnippets();
            const triggers = snippets.map(s => s.trigger);

            expect(triggers).toContain('code');
            expect(triggers).toContain('table');
            expect(triggers).toContain('link');
            expect(triggers).toContain('img');
            expect(triggers).toContain('task');
            expect(triggers).toContain('quote');
        });

        it('should mark all built-in snippets with isBuiltIn: true', () => {
            const snippets = snippetManager.getBuiltInSnippets();

            snippets.forEach(snippet => {
                expect(snippet.isBuiltIn).toBe(true);
            });
        });

        it('should return a defensive copy', () => {
            const snippets1 = snippetManager.getBuiltInSnippets();
            const snippets2 = snippetManager.getBuiltInSnippets();

            expect(snippets1).not.toBe(snippets2);
            expect(snippets1).toEqual(snippets2);
        });

        it('should include placeholders for each snippet', () => {
            const snippets = snippetManager.getBuiltInSnippets();

            snippets.forEach(snippet => {
                expect(Array.isArray(snippet.placeholders)).toBe(true);
                expect(snippet.placeholders.length).toBeGreaterThan(0);
            });
        });
    });

    describe('getCustomSnippets', () => {
        it('should return empty array when no custom snippets exist', () => {
            const snippets = snippetManager.getCustomSnippets();

            expect(snippets).toEqual([]);
        });

        it('should return custom snippets after saving', () => {
            snippetManager.saveCustomSnippet({
                trigger: 'hello',
                content: 'Hello {{name}}!',
                description: 'Greeting'
            });

            const snippets = snippetManager.getCustomSnippets();

            expect(snippets.length).toBe(1);
            expect(snippets[0].trigger).toBe('hello');
        });
    });

    describe('saveCustomSnippet', () => {
        it('should save a custom snippet with computed placeholders', () => {
            const result = snippetManager.saveCustomSnippet({
                trigger: 'greet',
                content: 'Hello {{name}}, welcome to {{place}}!',
                description: 'A greeting'
            });

            expect(result.trigger).toBe('greet');
            expect(result.content).toBe('Hello {{name}}, welcome to {{place}}!');
            expect(result.description).toBe('A greeting');
            expect(result.placeholders).toEqual(['{{name}}', '{{place}}']);
            expect(result.isBuiltIn).toBe(false);
            expect(result.createdAt).toBeGreaterThan(0);
        });

        it('should trim the trigger', () => {
            const result = snippetManager.saveCustomSnippet({
                trigger: '  hello  ',
                content: 'Hello!'
            });

            expect(result.trigger).toBe('hello');
        });

        it('should default description to empty string', () => {
            const result = snippetManager.saveCustomSnippet({
                trigger: 'test',
                content: 'Test content'
            });

            expect(result.description).toBe('');
        });

        it('should persist snippet to config store', () => {
            snippetManager.saveCustomSnippet({
                trigger: 'test',
                content: 'Test {{value}}'
            });

            const stored = configStore.getCustomSnippets();

            expect(stored.length).toBe(1);
            expect(stored[0].trigger).toBe('test');
        });

        it('should throw error for invalid snippet object', () => {
            expect(() => snippetManager.saveCustomSnippet(null)).toThrow('Invalid snippet: Must be an object');
            expect(() => snippetManager.saveCustomSnippet('string')).toThrow('Invalid snippet: Must be an object');
        });

        it('should throw error for missing trigger', () => {
            expect(() => snippetManager.saveCustomSnippet({ content: 'test' })).toThrow('Invalid snippet: Must have a string trigger');
            expect(() => snippetManager.saveCustomSnippet({ trigger: '', content: 'test' })).toThrow('Invalid snippet: Must have a string trigger');
        });

        it('should throw error for missing content', () => {
            expect(() => snippetManager.saveCustomSnippet({ trigger: 'test' })).toThrow('Invalid snippet: Must have string content');
            expect(() => snippetManager.saveCustomSnippet({ trigger: 'test', content: '' })).toThrow('Invalid snippet: Must have string content');
        });

        it('should throw error for duplicate trigger', () => {
            snippetManager.saveCustomSnippet({ trigger: 'dup', content: 'first' });

            expect(() => snippetManager.saveCustomSnippet({ trigger: 'dup', content: 'second' }))
                .toThrow('Snippet with trigger dup already exists');
        });
    });

    describe('deleteCustomSnippet', () => {
        it('should delete an existing custom snippet', () => {
            snippetManager.saveCustomSnippet({ trigger: 'del', content: 'to delete' });

            expect(snippetManager.getCustomSnippets().length).toBe(1);

            snippetManager.deleteCustomSnippet('del');

            expect(snippetManager.getCustomSnippets().length).toBe(0);
        });

        it('should throw error for non-existent trigger', () => {
            expect(() => snippetManager.deleteCustomSnippet('nonexistent'))
                .toThrow('Snippet with trigger nonexistent not found');
        });
    });

    describe('findPlaceholders', () => {
        it('should find all placeholders in content', () => {
            const placeholders = snippetManager.findPlaceholders('Hello {{name}}, welcome to {{place}}!');

            expect(placeholders).toEqual(['{{name}}', '{{place}}']);
        });

        it('should return empty array for content without placeholders', () => {
            const placeholders = snippetManager.findPlaceholders('Hello world!');

            expect(placeholders).toEqual([]);
        });

        it('should return empty array for empty string', () => {
            const placeholders = snippetManager.findPlaceholders('');

            expect(placeholders).toEqual([]);
        });

        it('should return empty array for null or undefined', () => {
            expect(snippetManager.findPlaceholders(null)).toEqual([]);
            expect(snippetManager.findPlaceholders(undefined)).toEqual([]);
        });

        it('should return empty array for non-string input', () => {
            expect(snippetManager.findPlaceholders(123)).toEqual([]);
            expect(snippetManager.findPlaceholders({})).toEqual([]);
        });

        it('should find multiple occurrences of the same placeholder', () => {
            const placeholders = snippetManager.findPlaceholders('{{name}} and {{name}}');

            expect(placeholders).toEqual(['{{name}}', '{{name}}']);
        });

        it('should handle complex placeholder names', () => {
            const placeholders = snippetManager.findPlaceholders('{{my-placeholder}} {{another_one}}');

            expect(placeholders).toEqual(['{{my-placeholder}}', '{{another_one}}']);
        });
    });
});
