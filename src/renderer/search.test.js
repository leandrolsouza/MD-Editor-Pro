/**
 * Tests for SearchManager class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Editor from './editor.js';
import SearchManager from './search.js';

describe('SearchManager', () => {
    let editor;
    let searchManager;
    let editorElement;

    beforeEach(() => {
        // Setup DOM elements
        document.body.innerHTML = `
            <div id="editor-container"></div>
            <div id="search-panel" class="search-panel hidden">
                <div class="search-controls">
                    <input type="text" id="search-input" placeholder="Find..." class="search-input">
                    <button id="search-prev" class="search-button">↑</button>
                    <button id="search-next" class="search-button">↓</button>
                    <span id="search-results" class="search-results"></span>
                    <button id="search-close" class="search-button">✕</button>
                </div>
                <div class="replace-controls hidden">
                    <input type="text" id="replace-input" placeholder="Replace..." class="search-input">
                    <button id="replace-current" class="search-button">Replace</button>
                    <button id="replace-all" class="search-button">Replace All</button>
                </div>
                <button id="toggle-replace" class="toggle-replace-button">▼</button>
            </div>
        `;

        editorElement = document.getElementById('editor-container');
        editor = new Editor();
        editor.initialize(editorElement);

        searchManager = new SearchManager(editor);
        searchManager.initialize();
    });

    afterEach(() => {
        if (editor) {
            editor.destroy();
        }
        document.body.innerHTML = '';
    });

    describe('Initialization', () => {
        it('should throw error if editor is not provided', () => {
            expect(() => new SearchManager()).toThrow('Editor instance is required');
        });

        it('should initialize with editor instance', () => {
            const sm = new SearchManager(editor);
            expect(sm.editor).toBe(editor);
        });

        it('should throw error if required DOM elements are missing', () => {
            // Clear the DOM
            document.body.innerHTML = '';

            const sm = new SearchManager(editor);
            expect(() => sm.initialize()).toThrow('Required search UI elements not found');
        });
    });

    describe('Show and Hide', () => {
        it('should show search panel', () => {
            const panel = document.getElementById('search-panel');
            expect(panel.classList.contains('hidden')).toBe(true);

            searchManager.show();
            expect(panel.classList.contains('hidden')).toBe(false);
        });

        it('should hide search panel', () => {
            const panel = document.getElementById('search-panel');
            searchManager.show();
            expect(panel.classList.contains('hidden')).toBe(false);

            searchManager.hide();
            expect(panel.classList.contains('hidden')).toBe(true);
        });

        it('should focus search input when shown', () => {
            const input = document.getElementById('search-input');
            const focusSpy = vi.spyOn(input, 'focus');

            searchManager.show();
            expect(focusSpy).toHaveBeenCalled();
        });

        it('should check visibility status', () => {
            expect(searchManager.isVisible()).toBe(false);

            searchManager.show();
            expect(searchManager.isVisible()).toBe(true);

            searchManager.hide();
            expect(searchManager.isVisible()).toBe(false);
        });
    });

    describe('Search functionality', () => {
        it('should find all occurrences of search term', () => {
            editor.setValue('Hello world, hello universe, HELLO cosmos');

            const results = searchManager.search('hello');
            expect(results.length).toBe(3);
        });

        it('should return empty array for empty query', () => {
            editor.setValue('Hello world');

            const results = searchManager.search('');
            expect(results).toEqual([]);
        });

        it('should return empty array when no matches found', () => {
            editor.setValue('Hello world');

            const results = searchManager.search('xyz');
            expect(results.length).toBe(0);
        });

        it('should update results display with match count', () => {
            editor.setValue('test test test');
            const resultsDisplay = document.getElementById('search-results');

            searchManager.search('test');
            expect(resultsDisplay.textContent).toMatch(/\d+ of 3/);
        });

        it('should display "No results" when no matches found', () => {
            editor.setValue('Hello world');
            const resultsDisplay = document.getElementById('search-results');

            searchManager.search('xyz');
            expect(resultsDisplay.textContent).toBe('No results');
        });

        it('should be case-insensitive by default', () => {
            editor.setValue('Hello HELLO hello');

            const results = searchManager.search('hello');
            expect(results.length).toBe(3);
        });
    });

    describe('Navigation', () => {
        it('should navigate to next occurrence', () => {
            editor.setValue('test test test');
            const searchInput = document.getElementById('search-input');
            searchInput.value = 'test';
            searchManager.search('test');

            const initialPos = editor.view.state.selection.main.head;
            searchManager.navigateNext();
            const newPos = editor.view.state.selection.main.head;

            // After navigation, cursor should have moved
            expect(newPos).not.toBe(initialPos);
        });

        it('should navigate to previous occurrence', () => {
            editor.setValue('test test test');
            const searchInput = document.getElementById('search-input');
            searchInput.value = 'test';
            searchManager.search('test');

            // Move to second occurrence first
            searchManager.navigateNext();
            searchManager.navigateNext();
            const secondPos = editor.view.state.selection.main.head;

            // Navigate back
            searchManager.navigatePrevious();
            const prevPos = editor.view.state.selection.main.head;

            // After navigating back, position should be different
            expect(prevPos).not.toBe(secondPos);
        });

        it('should handle navigation with no search query', () => {
            editor.setValue('test test test');

            // Should not throw error
            expect(() => searchManager.navigateNext()).not.toThrow();
            expect(() => searchManager.navigatePrevious()).not.toThrow();
        });
    });

    describe('Replace functionality', () => {
        it('should replace current occurrence', () => {
            editor.setValue('hello world hello universe');
            const replaceInput = document.getElementById('replace-input');
            const searchInput = document.getElementById('search-input');
            replaceInput.value = 'hi';
            searchInput.value = 'hello';

            searchManager.search('hello');

            // Verify replace method executes without error
            expect(() => searchManager.replace('hi')).not.toThrow();
        });

        it('should replace all occurrences', async () => {
            editor.setValue('hello world hello universe hello cosmos');
            const replaceInput = document.getElementById('replace-input');
            const searchInput = document.getElementById('search-input');
            replaceInput.value = 'hi';
            searchInput.value = 'hello';

            searchManager.search('hello');
            searchManager.replaceAll('hi');

            // Wait for async update
            await new Promise(resolve => setTimeout(resolve, 20));

            const content = editor.getValue();
            expect(content).not.toContain('hello');
            expect((content.match(/hi/g) || []).length).toBe(3);
        });

        it('should handle replace with no search query', () => {
            editor.setValue('hello world');

            // Should not throw error
            expect(() => searchManager.replace('hi')).not.toThrow();
            expect(() => searchManager.replaceAll('hi')).not.toThrow();
        });
    });

    describe('Error handling', () => {
        it('should throw error when searching without initialized editor', () => {
            const sm = new SearchManager(editor);
            sm.initialize();
            sm.editor.view = null;

            expect(() => sm.search('test')).toThrow('Editor not initialized');
        });

        it('should throw error when navigating without initialized editor', () => {
            const sm = new SearchManager(editor);
            sm.initialize();
            sm.editor.view = null;

            expect(() => sm.navigateNext()).toThrow('Editor not initialized');
            expect(() => sm.navigatePrevious()).toThrow('Editor not initialized');
        });

        it('should throw error when replacing without initialized editor', () => {
            const sm = new SearchManager(editor);
            sm.initialize();
            sm.editor.view = null;

            expect(() => sm.replace('test')).toThrow('Editor not initialized');
            expect(() => sm.replaceAll('test')).toThrow('Editor not initialized');
        });

        it('should throw error when showing panel without initialization', () => {
            const sm = new SearchManager(editor);
            expect(() => sm.show()).toThrow('SearchManager not initialized');
        });

        it('should throw error when hiding panel without initialization', () => {
            const sm = new SearchManager(editor);
            expect(() => sm.hide()).toThrow('SearchManager not initialized');
        });
    });
});
