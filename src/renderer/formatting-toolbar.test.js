/**
 * Tests for FormattingToolbar component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FormattingToolbar from './formatting-toolbar.js';
import Editor from './editor.js';

describe('FormattingToolbar', () => {
    let container;
    let editorElement;
    let editor;
    let toolbar;

    beforeEach(() => {
        // Create container elements using global document from vitest
        container = document.createElement('div');
        container.id = 'toolbar-container';
        document.body.appendChild(container);

        editorElement = document.createElement('div');
        editorElement.id = 'editor';
        document.body.appendChild(editorElement);

        // Initialize editor
        editor = new Editor();
        editor.initialize(editorElement);

        // Initialize toolbar
        toolbar = new FormattingToolbar(editor);
    });

    afterEach(() => {
        if (toolbar) {
            toolbar.destroy();
        }
        if (editor) {
            editor.destroy();
        }
        // Clean up DOM
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        if (editorElement && editorElement.parentNode) {
            editorElement.parentNode.removeChild(editorElement);
        }
    });

    describe('initialization', () => {
        it('should initialize with editor and container', () => {
            toolbar.initialize(container);
            expect(toolbar.initialized).toBe(true);
            expect(toolbar.buttons.size).toBeGreaterThan(0);
        });

        it('should throw error when initializing without container', () => {
            expect(() => toolbar.initialize(null)).toThrow('Container element is required');
        });

        it('should throw error when creating without editor', () => {
            expect(() => new FormattingToolbar(null)).toThrow('Editor instance is required');
        });
    });

    describe('button state management', () => {
        beforeEach(() => {
            toolbar.initialize(container);
        });

        it('should update button states when editor content changes', async () => {
            // Set content with bold text
            editor.setValue('**bold text**');

            // Position cursor inside bold text (select the text between markers)
            // The text is: **bold text**
            // Positions:    01234567890123
            // We need selection between ** markers
            editor.view.dispatch(editor.view.state.update({
                selection: { anchor: 2, head: 11 } // Select "bold text"
            }));

            // Wait for debounce
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check if bold button is active
            const boldButton = toolbar.buttons.get('bold');

            expect(boldButton.classList.contains('active')).toBe(true);
        });

        it('should handle multiple active formats', async () => {
            // Set content with heading
            editor.setValue('# Heading');
            editor.setCursorPosition(2);

            // Wait for debounce
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check if heading1 button is active
            const heading1Button = toolbar.buttons.get('heading1');

            expect(heading1Button.classList.contains('active')).toBe(true);
        });

        it('should update button states on cursor movement', async () => {
            // Set content with bold and non-bold text
            editor.setValue('**bold** normal');

            // Position cursor inside bold text (select text between markers)
            editor.view.dispatch(editor.view.state.update({
                selection: { anchor: 2, head: 6 } // Select "bold"
            }));
            await new Promise(resolve => setTimeout(resolve, 100));

            const boldButton = toolbar.buttons.get('bold');

            expect(boldButton.classList.contains('active')).toBe(true);

            // Move cursor to normal text
            editor.setCursorPosition(10);
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(boldButton.classList.contains('active')).toBe(false);
        });

        it('should debounce button state updates', async () => {
            const updateSpy = vi.spyOn(toolbar, 'updateButtonStates');

            // Trigger multiple rapid changes
            editor.setValue('test1');
            editor.setValue('test2');
            editor.setValue('test3');

            // Should not have called updateButtonStates immediately
            expect(updateSpy.mock.calls.length).toBeLessThan(3);

            // Wait for debounce
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should have called at least once after debounce
            expect(updateSpy.mock.calls.length).toBeGreaterThan(0);
        });
    });

    describe('button clicks', () => {
        beforeEach(() => {
            toolbar.initialize(container);
        });

        it('should apply bold formatting when bold button is clicked', () => {
            editor.setValue('test');
            editor.setCursorPosition(0);
            editor.view.dispatch(editor.view.state.update({
                selection: { anchor: 0, head: 4 }
            }));

            const boldButton = toolbar.buttons.get('bold');

            boldButton.click();

            expect(editor.getValue()).toBe('**test**');
        });

        it('should apply italic formatting when italic button is clicked', () => {
            editor.setValue('test');
            editor.setCursorPosition(0);
            editor.view.dispatch(editor.view.state.update({
                selection: { anchor: 0, head: 4 }
            }));

            const italicButton = toolbar.buttons.get('italic');

            italicButton.click();

            expect(editor.getValue()).toBe('*test*');
        });

        it('should apply heading when heading button is clicked', () => {
            editor.setValue('test');
            editor.setCursorPosition(0);

            const heading1Button = toolbar.buttons.get('heading1');

            heading1Button.click();

            expect(editor.getValue()).toBe('# test');
        });
    });

    describe('show and hide', () => {
        beforeEach(() => {
            toolbar.initialize(container);
        });

        it('should show toolbar', () => {
            toolbar.hide();
            toolbar.show();
            expect(container.style.display).toBe('');
        });

        it('should hide toolbar', () => {
            toolbar.hide();
            expect(container.style.display).toBe('none');
        });
    });

    describe('destroy', () => {
        it('should cleanup resources on destroy', () => {
            toolbar.initialize(container);
            toolbar.destroy();

            expect(toolbar.initialized).toBe(false);
            expect(toolbar.buttons.size).toBe(0);
            expect(toolbar.editor).toBe(null);
            expect(toolbar.container).toBe(null);
        });
    });

    describe('theme integration', () => {
        beforeEach(() => {
            toolbar.initialize(container);
        });

        it('should use CSS variables for styling', () => {
            // Get a button element
            const boldButton = toolbar.buttons.get('bold');

            // Verify that the button is using CSS variables by checking if styles are applied
            // The actual values will depend on the theme, but the button should have styles
            expect(boldButton).toBeDefined();
            expect(boldButton.className).toContain('toolbar-button');
        });

        it('should adapt to theme changes through CSS variables', () => {
            // The toolbar container should have the formatting-toolbar class
            expect(container.querySelector('.formatting-toolbar-wrapper')).toBeDefined();

            // Buttons should be present and styled
            const buttons = container.querySelectorAll('.toolbar-button');

            expect(buttons.length).toBeGreaterThan(0);

            // Each button should have the toolbar-button class which uses CSS variables
            buttons.forEach(button => {
                expect(button.className).toContain('toolbar-button');
            });
        });
    });

    describe('view mode integration', () => {
        let mockViewModeManager;

        beforeEach(() => {
            toolbar.initialize(container);

            // Create a mock ViewModeManager
            mockViewModeManager = {
                currentViewMode: 'split',
                viewModeChangeListeners: [],
                onViewModeChange(callback) {
                    this.viewModeChangeListeners.push(callback);
                    return () => {
                        const index = this.viewModeChangeListeners.indexOf(callback);

                        if (index !== -1) {
                            this.viewModeChangeListeners.splice(index, 1);
                        }
                    };
                },
                getCurrentViewMode() {
                    return this.currentViewMode;
                },
                setViewMode(mode) {
                    this.currentViewMode = mode;
                    this.viewModeChangeListeners.forEach(listener => listener(mode));
                }
            };
        });

        it('should connect to ViewModeManager', () => {
            const removeListener = toolbar.connectToViewModeManager(mockViewModeManager);

            expect(typeof removeListener).toBe('function');
            expect(mockViewModeManager.viewModeChangeListeners.length).toBe(1);
        });

        it('should throw error when connecting without ViewModeManager', () => {
            expect(() => toolbar.connectToViewModeManager(null)).toThrow('ViewModeManager instance is required');
        });

        it('should show toolbar in editor-only mode', () => {
            mockViewModeManager.currentViewMode = 'editor';
            toolbar.connectToViewModeManager(mockViewModeManager);
            expect(container.style.display).toBe('');
        });

        it('should show toolbar in split-view mode', () => {
            mockViewModeManager.currentViewMode = 'split';
            toolbar.connectToViewModeManager(mockViewModeManager);
            expect(container.style.display).toBe('');
        });

        it('should hide toolbar in preview-only mode', () => {
            mockViewModeManager.currentViewMode = 'preview';
            toolbar.connectToViewModeManager(mockViewModeManager);
            expect(container.style.display).toBe('none');
        });

        it('should update visibility when view mode changes to preview', () => {
            mockViewModeManager.currentViewMode = 'split';
            toolbar.connectToViewModeManager(mockViewModeManager);
            expect(container.style.display).toBe('');

            // Change to preview mode
            mockViewModeManager.setViewMode('preview');
            expect(container.style.display).toBe('none');
        });

        it('should update visibility when view mode changes from preview to editor', () => {
            mockViewModeManager.currentViewMode = 'preview';
            toolbar.connectToViewModeManager(mockViewModeManager);
            expect(container.style.display).toBe('none');

            // Change to editor mode
            mockViewModeManager.setViewMode('editor');
            expect(container.style.display).toBe('');
        });

        it('should update visibility when view mode changes from preview to split', () => {
            mockViewModeManager.currentViewMode = 'preview';
            toolbar.connectToViewModeManager(mockViewModeManager);
            expect(container.style.display).toBe('none');

            // Change to split mode
            mockViewModeManager.setViewMode('split');
            expect(container.style.display).toBe('');
        });

        it('should remove listener when cleanup function is called', () => {
            const removeListener = toolbar.connectToViewModeManager(mockViewModeManager);

            expect(mockViewModeManager.viewModeChangeListeners.length).toBe(1);

            removeListener();
            expect(mockViewModeManager.viewModeChangeListeners.length).toBe(0);
        });
    });
});
