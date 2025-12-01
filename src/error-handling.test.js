/**
 * Error Handling Tests
 * Tests error scenarios and graceful degradation
 * Requirements: All
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Editor from './renderer/editor.js';
import Preview from './renderer/preview.js';
import SearchManager from './renderer/search.js';
import ThemeManager from './renderer/theme.js';
import ViewModeManager from './renderer/view-mode.js';

describe('Error Handling Tests', () => {
    let editor;
    let preview;
    let searchManager;
    let editorContainer;
    let previewContainer;

    beforeEach(() => {
        // Setup DOM structure
        document.body.innerHTML = `
            <div id="app-container">
                <div id="editor-pane" class="pane">
                    <div id="editor-container"></div>
                </div>
                <div id="preview-pane" class="pane">
                    <div id="preview-container" class="markdown-preview"></div>
                </div>
            </div>
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
            <link rel="stylesheet" id="theme-light">
            <link rel="stylesheet" id="theme-dark" disabled>
        `;

        editorContainer = document.getElementById('editor-container');
        previewContainer = document.getElementById('preview-container');

        // Initialize components
        editor = new Editor();
        editor.initialize(editorContainer);

        preview = new Preview();
        preview.initialize(previewContainer);

        searchManager = new SearchManager(editor);
        searchManager.initialize();
    });

    afterEach(() => {
        if (editor) editor.destroy();
        if (preview) preview.destroy();
        document.body.innerHTML = '';
    });

    describe('Editor Error Handling', () => {
        it('should throw error when initializing without element', () => {
            const newEditor = new Editor();

            expect(() => newEditor.initialize(null)).toThrow('Editor element is required');
        });

        it('should throw error when getting value before initialization', () => {
            const newEditor = new Editor();

            expect(() => newEditor.getValue()).toThrow('Editor not initialized');
        });

        it('should throw error when setting value before initialization', () => {
            const newEditor = new Editor();

            expect(() => newEditor.setValue('test')).toThrow('Editor not initialized');
        });

        it('should throw error when inserting text before initialization', () => {
            const newEditor = new Editor();

            expect(() => newEditor.insertText('test')).toThrow('Editor not initialized');
        });

        it('should throw error for unknown formatting type', () => {
            expect(() => editor.applyFormatting('unknown')).toThrow('Unknown format: unknown');
        });

        it('should throw error when applying formatting before initialization', () => {
            const newEditor = new Editor();

            expect(() => newEditor.applyFormatting('bold')).toThrow('Editor not initialized');
        });

        it('should throw error when undoing before initialization', () => {
            const newEditor = new Editor();

            expect(() => newEditor.undo()).toThrow('Editor not initialized');
        });

        it('should throw error when redoing before initialization', () => {
            const newEditor = new Editor();

            expect(() => newEditor.redo()).toThrow('Editor not initialized');
        });

        it('should throw error for invalid scroll position', () => {
            expect(() => editor.setScrollPosition(-0.1)).toThrow('Position must be between 0 and 1');
            expect(() => editor.setScrollPosition(1.1)).toThrow('Position must be between 0 and 1');
            expect(() => editor.setScrollPosition(NaN)).toThrow('Position must be between 0 and 1');
        });

        it('should throw error when getting scroll position before initialization', () => {
            const newEditor = new Editor();

            expect(() => newEditor.getScrollPosition()).toThrow('Editor not initialized');
        });

        it('should throw error when setting scroll position before initialization', () => {
            const newEditor = new Editor();

            expect(() => newEditor.setScrollPosition(0.5)).toThrow('Editor not initialized');
        });

        it('should throw error if content change callback is not a function', () => {
            expect(() => editor.onContentChange('not a function')).toThrow('Callback must be a function');
            expect(() => editor.onContentChange(null)).toThrow('Callback must be a function');
            expect(() => editor.onContentChange(123)).toThrow('Callback must be a function');
        });

        it('should handle empty string content gracefully', () => {
            expect(() => editor.setValue('')).not.toThrow();
            expect(editor.getValue()).toBe('');
        });

        it('should handle very long single line gracefully', () => {
            const longLine = 'a'.repeat(100000);

            expect(() => editor.setValue(longLine)).not.toThrow();
            expect(editor.getValue().length).toBe(100000);
        });

        it('should handle special characters gracefully', () => {
            const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`\n\t\r';

            expect(() => editor.setValue(specialChars)).not.toThrow();
            // CodeMirror normalizes \r to \n
            const expected = specialChars.replace(/\r/g, '\n');

            expect(editor.getValue()).toBe(expected);
        });

        it('should handle unicode characters gracefully', () => {
            const unicode = '你好世界 🌍 Привет мир';

            expect(() => editor.setValue(unicode)).not.toThrow();
            expect(editor.getValue()).toBe(unicode);
        });
    });

    describe('Preview Error Handling', () => {
        it('should throw error when initializing without element', () => {
            const newPreview = new Preview();

            expect(() => newPreview.initialize(null)).toThrow('Preview element is required');
        });

        it('should throw error when rendering before initialization', () => {
            const newPreview = new Preview();

            expect(() => newPreview.render('test')).toThrow('Preview not initialized');
        });

        it('should handle empty content gracefully', () => {
            expect(() => preview.render('')).not.toThrow();
        });

        it('should handle invalid markdown gracefully', () => {
            const invalidMarkdown = '# Unclosed [link\n**Unclosed bold\n`Unclosed code';

            expect(() => preview.render(invalidMarkdown)).not.toThrow();
        });

        it('should handle malformed HTML in markdown gracefully', () => {
            // HTML should be disabled for security, so this should be safe
            const malformedHTML = '<div><span>Unclosed tags';

            expect(() => preview.render(malformedHTML)).not.toThrow();
        });

        it('should handle very large content gracefully', () => {
            const largeContent = '# Heading\n\n'.repeat(10000);

            expect(() => preview.render(largeContent)).not.toThrow();
        });

        it('should throw error for invalid scroll position', () => {
            expect(() => preview.syncScroll(-0.1)).toThrow('Position must be between 0 and 1');
            expect(() => preview.syncScroll(1.1)).toThrow('Position must be between 0 and 1');
            expect(() => preview.syncScroll(NaN)).toThrow('Position must be between 0 and 1');
        });

        it('should throw error when syncing scroll before initialization', () => {
            const newPreview = new Preview();

            expect(() => newPreview.syncScroll(0.5)).toThrow('Preview not initialized');
        });

        it('should handle special markdown characters gracefully', () => {
            const specialMarkdown = '\\* \\# \\[ \\] \\( \\) \\` \\~ \\_ \\-';

            expect(() => preview.render(specialMarkdown)).not.toThrow();
        });
    });

    describe('SearchManager Error Handling', () => {
        it('should throw error if editor is not provided', () => {
            expect(() => new SearchManager()).toThrow('Editor instance is required');
            expect(() => new SearchManager(null)).toThrow('Editor instance is required');
        });

        it('should throw error if required DOM elements are missing', () => {
            document.body.innerHTML = '<div></div>';
            const newEditor = new Editor();
            const newSearchManager = new SearchManager(newEditor);

            expect(() => newSearchManager.initialize()).toThrow();
        });

        it('should throw error when showing panel without initialization', () => {
            const newEditor = new Editor();
            const newSearchManager = new SearchManager(newEditor);

            expect(() => newSearchManager.show()).toThrow('SearchManager not initialized');
        });

        it('should throw error when hiding panel without initialization', () => {
            const newEditor = new Editor();
            const newSearchManager = new SearchManager(newEditor);

            expect(() => newSearchManager.hide()).toThrow('SearchManager not initialized');
        });

        it('should throw error when searching without initialized editor', () => {
            const newEditor = new Editor();
            const newSearchManager = new SearchManager(newEditor);

            newSearchManager.initialize();
            expect(() => newSearchManager.search('test')).toThrow('Editor not initialized');
        });

        it('should throw error when navigating without initialized editor', () => {
            const newEditor = new Editor();
            const newSearchManager = new SearchManager(newEditor);

            newSearchManager.initialize();
            expect(() => newSearchManager.navigateNext()).toThrow('Editor not initialized');
            expect(() => newSearchManager.navigatePrevious()).toThrow('Editor not initialized');
        });

        it('should throw error when replacing without initialized editor', () => {
            const newEditor = new Editor();
            const newSearchManager = new SearchManager(newEditor);

            newSearchManager.initialize();
            expect(() => newSearchManager.replace('test')).toThrow('Editor not initialized');
        });

        it('should handle empty search query gracefully', () => {
            const results = searchManager.search('');

            expect(results).toEqual([]);
        });

        it('should handle search with no matches gracefully', () => {
            editor.setValue('Hello world');
            const results = searchManager.search('xyz');

            expect(results).toEqual([]);
        });

        it('should handle replace with no search query gracefully', () => {
            editor.setValue('Hello world');
            expect(() => searchManager.replace('test')).not.toThrow();
        });

        it('should handle special regex characters in search gracefully', () => {
            editor.setValue('Test [brackets] and (parens) and $dollar');
            // These should be treated as literal characters, not regex
            expect(() => searchManager.search('[brackets]')).not.toThrow();
            expect(() => searchManager.search('(parens)')).not.toThrow();
            expect(() => searchManager.search('$dollar')).not.toThrow();
        });
    });

    describe('ThemeManager Error Handling', () => {
        it('should handle invalid theme gracefully', async () => {
            const themeManager = new ThemeManager();

            await themeManager.initialize();

            // Should not throw, but log error
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await themeManager.setTheme('invalid');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle missing theme stylesheets gracefully', async () => {
            // Remove theme stylesheets
            document.getElementById('theme-light')?.remove();
            document.getElementById('theme-dark')?.remove();

            const themeManager = new ThemeManager();

            await themeManager.initialize();

            // Should not throw even without stylesheets
            expect(() => themeManager.setTheme('dark')).not.toThrow();
        });

        it('should handle missing DOM elements gracefully', async () => {
            // Remove editor and preview panes
            document.getElementById('editor-pane')?.remove();
            document.getElementById('preview-pane')?.remove();

            const themeManager = new ThemeManager();

            await themeManager.initialize();

            // Should not throw even without panes
            expect(() => themeManager.setTheme('dark')).not.toThrow();
        });

        it('should handle config errors gracefully', async () => {
            // Mock electronAPI to throw errors
            global.window = global.window || {};
            global.window.electronAPI = {
                getConfig: vi.fn().mockRejectedValue(new Error('Config error')),
                setConfig: vi.fn().mockRejectedValue(new Error('Config error'))
            };

            const themeManager = new ThemeManager();

            // Should not throw, but fall back to default
            await expect(themeManager.initialize()).resolves.not.toThrow();
            expect(themeManager.getCurrentTheme()).toBe('light');
        });

        it('should handle multiple initializations gracefully', async () => {
            const themeManager = new ThemeManager();

            await themeManager.initialize();
            await themeManager.initialize();
            await themeManager.initialize();

            // Should not cause issues
            expect(themeManager.getCurrentTheme()).toBeDefined();
        });
    });

    describe('ViewModeManager Error Handling', () => {
        it('should handle invalid view mode gracefully', async () => {
            const viewModeManager = new ViewModeManager();

            await viewModeManager.initialize();

            // Should not throw, but log error
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            await viewModeManager.setViewMode('invalid');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle missing DOM elements gracefully', async () => {
            // Remove panes
            document.getElementById('editor-pane')?.remove();
            document.getElementById('preview-pane')?.remove();

            const viewModeManager = new ViewModeManager();

            await viewModeManager.initialize();

            // Should not throw even without panes
            expect(() => viewModeManager.setViewMode('split')).not.toThrow();
        });

        it('should handle config errors gracefully', async () => {
            // Mock electronAPI to throw errors
            global.window = global.window || {};
            global.window.electronAPI = {
                getConfig: vi.fn().mockRejectedValue(new Error('Config error')),
                setConfig: vi.fn().mockRejectedValue(new Error('Config error'))
            };

            const viewModeManager = new ViewModeManager();

            // Should not throw, but fall back to default
            await expect(viewModeManager.initialize()).resolves.not.toThrow();
        });

        it('should handle multiple initializations gracefully', async () => {
            const viewModeManager = new ViewModeManager();

            await viewModeManager.initialize();
            await viewModeManager.initialize();
            await viewModeManager.initialize();

            // Should not cause issues
            expect(() => viewModeManager.setViewMode('split')).not.toThrow();
        });
    });

    describe('Graceful Degradation', () => {
        it('should continue working after editor errors', () => {
            // Cause an error
            try {
                editor.applyFormatting('invalid');
            } catch (e) {
                // Error caught
            }

            // Editor should still work
            expect(() => editor.setValue('Test')).not.toThrow();
            expect(editor.getValue()).toBe('Test');
        });

        it('should continue working after preview errors', () => {
            // Render some content
            preview.render('# Test');

            // Try to cause an error with invalid scroll
            try {
                preview.syncScroll(999);
            } catch (e) {
                // Error caught
            }

            // Preview should still work
            expect(() => preview.render('# New Test')).not.toThrow();
        });

        it('should continue working after search errors', () => {
            editor.setValue('Test content');

            // Try to cause an error
            try {
                searchManager.replace('replacement');
            } catch (e) {
                // Error caught
            }

            // Search should still work
            expect(() => searchManager.search('Test')).not.toThrow();
        });

        it('should handle component destruction gracefully', () => {
            // Destroy components
            editor.destroy();
            preview.destroy();

            // Should not throw
            expect(editor.view).toBeNull();
            expect(preview.container).toBeNull();
        });

        it('should handle multiple destroy calls gracefully', () => {
            editor.destroy();
            editor.destroy();
            editor.destroy();

            // Should not throw
            expect(editor.view).toBeNull();
        });
    });

    describe('User-Friendly Error Messages', () => {
        it('should provide clear error message for missing editor element', () => {
            const newEditor = new Editor();

            try {
                newEditor.initialize(null);
            } catch (error) {
                expect(error.message).toBe('Editor element is required');
                expect(error.message).not.toContain('undefined');
                expect(error.message).not.toContain('null');
            }
        });

        it('should provide clear error message for uninitialized editor', () => {
            const newEditor = new Editor();

            try {
                newEditor.getValue();
            } catch (error) {
                expect(error.message).toBe('Editor not initialized');
                expect(error.message).toContain('not initialized');
            }
        });

        it('should provide clear error message for invalid format', () => {
            try {
                editor.applyFormatting('invalid');
            } catch (error) {
                expect(error.message).toContain('Unknown format');
                expect(error.message).toContain('invalid');
            }
        });

        it('should provide clear error message for invalid scroll position', () => {
            try {
                editor.setScrollPosition(2.0);
            } catch (error) {
                expect(error.message).toContain('Position must be between 0 and 1');
                expect(error.message).toContain('0 and 1');
            }
        });

        it('should provide clear error message for missing editor instance', () => {
            try {
                new SearchManager(null);
            } catch (error) {
                expect(error.message).toBe('Editor instance is required');
                expect(error.message).toContain('required');
            }
        });
    });
});
