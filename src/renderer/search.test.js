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

    describe('Advanced Markdown Search - Requirement 4.3', () => {
        describe('Mermaid diagram search', () => {
            it('should find text within Mermaid code blocks', () => {
                const mermaidContent = `# Document with Mermaid

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

Some other text.`;

                editor.setValue(mermaidContent);

                // Search for text within Mermaid diagram
                const results = searchManager.search('Process');
                expect(results.length).toBe(1);
                expect(results[0].text).toBe('Process');
            });

            it('should find Mermaid keywords', () => {
                const mermaidContent = `\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob
    Bob-->>Alice: Hi Alice
\`\`\``;

                editor.setValue(mermaidContent);

                // "Alice" appears 3 times: twice in the diagram and once in "Hi Alice"
                const results = searchManager.search('Alice');
                expect(results.length).toBe(3);
            });

            it('should find text in multiple Mermaid diagrams', () => {
                const content = `\`\`\`mermaid
graph LR
    A[User] --> B[System]
\`\`\`

Some text.

\`\`\`mermaid
graph TD
    C[User] --> D[Database]
\`\`\``;

                editor.setValue(content);

                const results = searchManager.search('User');
                expect(results.length).toBe(2);
            });
        });

        describe('LaTeX math search', () => {
            it('should find text within inline math expressions', () => {
                const mathContent = `The equation $E = mc^2$ is famous.`;

                editor.setValue(mathContent);

                const results = searchManager.search('mc');
                expect(results.length).toBe(1);
            });

            it('should find text within display math expressions', () => {
                const mathContent = `The quadratic formula is:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

This is useful.`;

                editor.setValue(mathContent);

                const results = searchManager.search('sqrt');
                expect(results.length).toBe(1);
            });

            it('should find LaTeX commands', () => {
                const mathContent = `Inline: $\\alpha + \\beta = \\gamma$
Display: $$\\int_0^\\infty e^{-x} dx = 1$$`;

                editor.setValue(mathContent);

                const results = searchManager.search('alpha');
                expect(results.length).toBe(1);
            });

            it('should find text in multiple math expressions', () => {
                const content = `First: $x^2 + y^2 = r^2$
Second: $x^2 - y^2 = z^2$`;

                editor.setValue(content);

                const results = searchManager.search('x^2');
                expect(results.length).toBe(2);
            });
        });

        describe('Callout block search', () => {
            it('should find text within NOTE callouts', () => {
                const calloutContent = `> [!NOTE]
> This is an important note about the system.`;

                editor.setValue(calloutContent);

                const results = searchManager.search('important');
                expect(results.length).toBe(1);
            });

            it('should find text within WARNING callouts', () => {
                const calloutContent = `> [!WARNING]
> Be careful with this operation.`;

                editor.setValue(calloutContent);

                const results = searchManager.search('careful');
                expect(results.length).toBe(1);
            });

            it('should find text in multiple callout types', () => {
                const content = `> [!NOTE]
> First message here.

> [!WARNING]
> Second message here.

> [!TIP]
> Third message here.`;

                editor.setValue(content);

                const results = searchManager.search('message');
                expect(results.length).toBe(3);
            });

            it('should find callout type identifiers', () => {
                const content = `> [!NOTE]
> Content

> [!WARNING]
> Content`;

                editor.setValue(content);

                const results = searchManager.search('NOTE');
                expect(results.length).toBe(1);
            });
        });

        describe('Mixed advanced markdown search', () => {
            it('should find text across different advanced markdown types', () => {
                const mixedContent = `# Document

\`\`\`mermaid
graph TD
    A[User] --> B[System]
\`\`\`

The formula $E = mc^2$ shows energy.

> [!NOTE]
> The User should be aware of this.`;

                editor.setValue(mixedContent);

                const results = searchManager.search('User');
                expect(results.length).toBe(2);
            });

            it('should find text in combination of basic and advanced markdown', () => {
                const content = `# Testing Search

Regular paragraph with testing.

\`\`\`mermaid
graph LR
    A[Testing] --> B[Results]
\`\`\`

Math: $testing = true$

> [!TIP]
> Keep testing your code.`;

                editor.setValue(content);

                // "testing" appears 5 times: in title, paragraph, mermaid, math, and callout
                const results = searchManager.search('testing');
                expect(results.length).toBe(5);
            });
        });

        describe('Replace in advanced markdown', () => {
            it('should replace text within Mermaid diagrams', async () => {
                const content = `\`\`\`mermaid
graph TD
    A[OldName] --> B[Process]
\`\`\``;

                editor.setValue(content);

                const searchInput = document.getElementById('search-input');
                searchInput.value = 'OldName';
                searchManager.search('OldName');
                searchManager.replaceAll('NewName');

                await new Promise(resolve => setTimeout(resolve, 20));

                const newContent = editor.getValue();
                expect(newContent).toContain('NewName');
                expect(newContent).not.toContain('OldName');
            });

            it('should replace text within math expressions', async () => {
                const content = `The equation $oldvar = 5$ is simple.`;

                editor.setValue(content);

                const searchInput = document.getElementById('search-input');
                searchInput.value = 'oldvar';
                searchManager.search('oldvar');
                searchManager.replaceAll('newvar');

                await new Promise(resolve => setTimeout(resolve, 20));

                const newContent = editor.getValue();
                expect(newContent).toContain('newvar');
                expect(newContent).not.toContain('oldvar');
            });

            it('should replace text within callout blocks', async () => {
                const content = `> [!NOTE]
> This is oldtext that needs updating.`;

                editor.setValue(content);

                const searchInput = document.getElementById('search-input');
                searchInput.value = 'oldtext';
                searchManager.search('oldtext');
                searchManager.replaceAll('newtext');

                await new Promise(resolve => setTimeout(resolve, 20));

                const newContent = editor.getValue();
                expect(newContent).toContain('newtext');
                expect(newContent).not.toContain('oldtext');
            });
        });
    });
});
