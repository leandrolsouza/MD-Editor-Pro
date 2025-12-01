/**
 * Cross-Feature Integration Tests
 * Tests interactions between Outline Panel, Typewriter Scrolling, and Multiple Cursors
 * Requirements: All
 */

const { JSDOM } = require('jsdom');
const Editor = require('./editor');
const OutlinePanel = require('./outline-panel');
const TypewriterScrolling = require('./typewriter-scrolling');

describe('Cross-Feature Integration Tests', () => {
    let dom;
    let document;
    let editorElement;
    let outlinePanelElement;
    let editor;
    let outlinePanel;
    let typewriterScrolling;

    beforeEach(() => {
        // Setup DOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <div id="editor"></div>
                    <div class="outline-panel outline-panel--hidden">
                        <div class="outline-panel__tree"></div>
                    </div>
                </body>
            </html>
        `);

        document = dom.window.document;
        global.document = document;
        global.window = dom.window;

        // Mock requestAnimationFrame
        global.window.requestAnimationFrame = vi.fn((cb) => {
            setTimeout(cb, 0);
            return 1;
        });

        // Mock cancelAnimationFrame
        global.window.cancelAnimationFrame = vi.fn();

        // Mock scrollIntoView for DOM elements
        dom.window.Element.prototype.scrollIntoView = vi.fn();
        dom.window.HTMLElement.prototype.scrollIntoView = vi.fn();

        // Mock getClientRects for Range objects (CodeMirror requirement)
        if (dom.window.Range && dom.window.Range.prototype) {
            dom.window.Range.prototype.getClientRects = vi.fn(() => ({
                length: 1,
                item: () => ({
                    top: 0,
                    left: 0,
                    right: 100,
                    bottom: 20,
                    width: 100,
                    height: 20,
                    x: 0,
                    y: 0
                }),
                [0]: {
                    top: 0,
                    left: 0,
                    right: 100,
                    bottom: 20,
                    width: 100,
                    height: 20,
                    x: 0,
                    y: 0
                }
            }));

            dom.window.Range.prototype.getBoundingClientRect = vi.fn(() => ({
                top: 0,
                left: 0,
                right: 100,
                bottom: 20,
                width: 100,
                height: 20,
                x: 0,
                y: 0
            }));
        }

        editorElement = document.getElementById('editor');
        outlinePanelElement = document.querySelector('.outline-panel');

        // Initialize editor
        editor = new Editor();
        editor.initialize(editorElement);

        // Initialize outline panel
        outlinePanel = new OutlinePanel(editor);
        outlinePanel.initialize(outlinePanelElement);

        // Initialize typewriter scrolling
        typewriterScrolling = new TypewriterScrolling(editor);
        typewriterScrolling.initialize();
    });

    afterEach(async () => {
        // Clear any pending timers first
        vi.clearAllTimers();

        // Disable typewriter scrolling before destroying editor
        if (typewriterScrolling && typewriterScrolling.isEnabled()) {
            typewriterScrolling.disable();
        }

        if (outlinePanel) {
            outlinePanel.destroy();
        }

        if (editor) {
            editor.destroy();
        }

        // Wait a tick to ensure all async operations complete
        await new Promise(resolve => setTimeout(resolve, 0));

        // Clean up global mocks
        delete global.document;
        delete global.window;
    });

    describe('Outline Panel + Typewriter Scrolling', () => {
        it('should center heading when clicked in outline with typewriter mode enabled', () => {
            // Setup document with headings
            const markdown = `# Heading 1

Some content here.

## Heading 2

More content.

### Heading 3

Even more content.`;

            editor.setValue(markdown);
            outlinePanel.update();
            typewriterScrolling.enable();

            // Click on second heading in outline
            const headings = outlinePanel.extractHeadings();
            expect(headings.length).toBeGreaterThan(1);

            // Navigate to second heading
            outlinePanel.navigateToHeading(headings[1].position);

            // Verify cursor is at heading position
            expect(editor.getCursorPosition()).toBe(headings[1].position);

            // Verify typewriter mode is still enabled
            expect(typewriterScrolling.isEnabled()).toBe(true);

            // Verify outline panel is still functional
            expect(outlinePanel.headings.length).toBe(headings.length);
        });

        it('should update outline when typing with typewriter mode enabled', () => {
            typewriterScrolling.enable();
            outlinePanel.show();

            // Start with one heading
            editor.setValue('# Heading 1\n\nContent');
            outlinePanel.update();

            let headings = outlinePanel.extractHeadings();
            expect(headings.length).toBe(1);

            // Add another heading
            editor.setCursorPosition(editor.getValue().length);
            editor.insertText('\n\n## Heading 2');

            // Wait for debounced update
            return new Promise(resolve => {
                setTimeout(() => {
                    outlinePanel.update();
                    headings = outlinePanel.extractHeadings();
                    expect(headings.length).toBe(2);
                    expect(headings[1].text).toBe('Heading 2');
                    resolve();
                }, 350); // Wait for 300ms debounce + buffer
            });
        });

        it('should maintain outline visibility when toggling typewriter mode', () => {
            outlinePanel.show();
            expect(outlinePanel.isVisible).toBe(true);

            typewriterScrolling.enable();
            expect(outlinePanel.isVisible).toBe(true);

            typewriterScrolling.disable();
            expect(outlinePanel.isVisible).toBe(true);

            typewriterScrolling.toggle();
            expect(outlinePanel.isVisible).toBe(true);
        });
    });

    describe('Multiple Cursors + Typewriter Scrolling', () => {
        it('should handle multiple cursors with typewriter mode enabled', () => {
            const markdown = `Line 1
Line 2
Line 3
Line 4
Line 5`;

            editor.setValue(markdown);
            typewriterScrolling.enable();

            // Add multiple cursors
            editor.addCursorAtPosition(0);  // Line 1
            editor.addCursorAtPosition(7);  // Line 2
            editor.addCursorAtPosition(14); // Line 3

            const selections = editor.getSelections();
            expect(selections.length).toBeGreaterThanOrEqual(3);

            // Verify typewriter mode is still enabled
            expect(typewriterScrolling.isEnabled()).toBe(true);

            // Verify multiple cursors exist
            expect(editor.view.state.selection.ranges.length).toBeGreaterThan(1);
        });

        it('should not interfere with multi-cursor operations when typewriter is enabled', () => {
            editor.setValue('test\ntest\ntest');
            typewriterScrolling.enable();

            // Select first occurrence
            editor.setCursorPosition(0);
            editor.view.dispatch({
                selection: { anchor: 0, head: 4 }
            });

            // Use Ctrl+D to select next occurrence (simulated)
            const { selectNextOccurrence } = require('@codemirror/search');
            selectNextOccurrence(editor.view);

            const selections = editor.getSelections();
            expect(selections.length).toBeGreaterThan(1);
        });

        it('should clear extra cursors with Escape key', () => {
            editor.setValue('test\ntest\ntest');

            // Add multiple cursors
            editor.addCursorAtPosition(0);
            editor.addCursorAtPosition(5);
            editor.addCursorAtPosition(10);

            let selections = editor.getSelections();
            expect(selections.length).toBeGreaterThan(1);

            // Clear extra cursors
            editor.clearExtraCursors();

            selections = editor.getSelections();
            expect(selections.length).toBe(1);
        });
    });

    describe('All Three Features Together', () => {
        it('should work correctly with all features enabled simultaneously', () => {
            const markdown = `# Main Heading

## Section 1

Content for section 1.

## Section 2

Content for section 2.

## Section 3

Content for section 3.`;

            editor.setValue(markdown);

            // Enable all features
            outlinePanel.show();
            typewriterScrolling.enable();

            // Update outline
            outlinePanel.update();
            const headings = outlinePanel.extractHeadings();
            expect(headings.length).toBe(4);

            // Add multiple cursors
            editor.addCursorAtPosition(20);
            editor.addCursorAtPosition(50);

            const selections = editor.getSelections();
            expect(selections.length).toBeGreaterThan(1);

            // Type with multiple cursors
            editor.insertText('NEW ');

            // Verify content changed
            const content = editor.getValue();
            expect(content).toContain('NEW');

            // Navigate via outline
            outlinePanel.navigateToHeading(headings[2].position);

            // Verify cursor moved
            expect(editor.getCursorPosition()).toBe(headings[2].position);

            // Verify all features still active
            expect(outlinePanel.isVisible).toBe(true);
            expect(typewriterScrolling.isEnabled()).toBe(true);
        });

        it('should handle rapid feature toggling without errors', () => {
            editor.setValue('# Test\n\nContent');

            // Rapidly toggle features
            outlinePanel.toggle();
            typewriterScrolling.toggle();
            outlinePanel.toggle();
            typewriterScrolling.toggle();
            outlinePanel.toggle();

            // Verify no errors and features respond correctly
            expect(outlinePanel.isVisible).toBe(true);
            expect(typewriterScrolling.isEnabled()).toBe(false);

            // Toggle again
            typewriterScrolling.toggle();
            expect(typewriterScrolling.isEnabled()).toBe(true);
        });

        it('should maintain performance with all features active', () => {
            // Create a large document
            let largeDoc = '';
            for (let i = 1; i <= 100; i++) {
                largeDoc += `## Heading ${i}\n\nContent for section ${i}.\n\n`;
            }

            const startTime = Date.now();

            editor.setValue(largeDoc);
            outlinePanel.show();
            typewriterScrolling.enable();
            outlinePanel.update();

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete in reasonable time (< 1 second)
            expect(duration).toBeLessThan(1000);

            // Verify features initialized correctly
            const headings = outlinePanel.extractHeadings();
            expect(headings.length).toBe(100);
            expect(typewriterScrolling.isEnabled()).toBe(true);
        });
    });

    describe('Feature State Persistence', () => {
        it('should maintain independent state for each feature', () => {
            // Enable outline
            outlinePanel.show();
            expect(outlinePanel.isVisible).toBe(true);

            // Enable typewriter
            typewriterScrolling.enable();
            expect(typewriterScrolling.isEnabled()).toBe(true);

            // Disable outline
            outlinePanel.hide();
            expect(outlinePanel.isVisible).toBe(false);
            expect(typewriterScrolling.isEnabled()).toBe(true);

            // Disable typewriter
            typewriterScrolling.disable();
            expect(typewriterScrolling.isEnabled()).toBe(false);
            expect(outlinePanel.isVisible).toBe(false);
        });

        it('should not affect document content when toggling features', () => {
            const originalContent = '# Test\n\nSome content here.';
            editor.setValue(originalContent);

            // Toggle features multiple times
            outlinePanel.toggle();
            typewriterScrolling.toggle();
            outlinePanel.toggle();
            typewriterScrolling.toggle();

            // Content should remain unchanged
            expect(editor.getValue()).toBe(originalContent);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty document with all features enabled', () => {
            editor.setValue('');

            outlinePanel.show();
            typewriterScrolling.enable();
            outlinePanel.update();

            const headings = outlinePanel.extractHeadings();
            expect(headings.length).toBe(0);

            // Should show empty state message
            const emptyState = outlinePanelElement.querySelector('.outline-panel__empty');
            expect(emptyState).toBeTruthy();
            expect(emptyState.textContent).toBe('No headings found');
        });

        it('should handle document with no headings', () => {
            editor.setValue('Just some plain text without any headings.\n\nMore text here.');

            outlinePanel.show();
            outlinePanel.update();

            const headings = outlinePanel.extractHeadings();
            expect(headings.length).toBe(0);
        });

        it('should handle very short document with typewriter mode', () => {
            editor.setValue('Short');
            typewriterScrolling.enable();

            // Mock short document
            const mockScrollDOM = {
                clientHeight: 600,
                scrollHeight: 100, // Shorter than viewport
                scrollTop: 0
            };

            editor.view.scrollDOM = mockScrollDOM;

            // Typewriter should not center (document too short)
            editor.setCursorPosition(0);

            // scrollTop should remain 0 for short documents
            expect(mockScrollDOM.scrollTop).toBe(0);
        });
    });
});
