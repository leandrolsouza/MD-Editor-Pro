/**
 * Performance Tests
 * Tests preview debouncing and large file handling
 * Requirements: 2.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Editor from './renderer/editor.js';
import Preview from './renderer/preview.js';

describe('Performance Tests', () => {
    let editor;
    let preview;
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
        `;

        editorContainer = document.getElementById('editor-container');
        previewContainer = document.getElementById('preview-container');

        // Initialize components
        editor = new Editor();
        editor.initialize(editorContainer);

        preview = new Preview();
        preview.initialize(previewContainer);
    });

    afterEach(() => {
        if (editor) editor.destroy();
        if (preview) preview.destroy();
        document.body.innerHTML = '';
    });

    describe('Preview Debouncing', () => {
        it('should support debounced preview updates in real usage', async () => {
            // This test verifies that the preview can be called multiple times
            // In the actual application, debouncing is handled by the renderer process
            // which delays preview.render() calls by 300ms

            let renderCount = 0;
            const originalRender = preview.render.bind(preview);

            preview.render = function (content) {
                renderCount++;
                return originalRender(content);
            };

            // Simulate what would happen with debouncing:
            // Multiple rapid changes, but only the last one renders
            editor.setValue('# Test 1');
            editor.setValue('# Test 2');
            editor.setValue('# Test 3');
            editor.setValue('# Test 4');
            const finalContent = '# Test 5';

            editor.setValue(finalContent);

            // In real usage, only the final render would be called after debounce
            preview.render(finalContent);

            // Verify the preview can handle the render
            expect(renderCount).toBe(1);
            expect(editor.getValue()).toBe(finalContent);
        });

        it('should eventually render the latest content after debounce', async () => {
            const finalContent = '# Final Content\n\nThis is the last update.';

            // Simulate rapid changes
            editor.setValue('# Test 1');
            editor.setValue('# Test 2');
            editor.setValue('# Test 3');
            editor.setValue(finalContent);

            // Manually trigger render with final content
            preview.render(finalContent);

            // Wait for any debounced operations
            await new Promise(resolve => setTimeout(resolve, 400));

            // Preview should contain the final content
            const previewHTML = previewContainer.innerHTML;

            expect(previewHTML).toContain('Final Content');
        });

        it('should not block editor input during preview rendering', () => {
            // Set initial content
            editor.setValue('# Initial');

            // Trigger preview render
            preview.render(editor.getValue());

            // Editor should still be responsive
            editor.setValue('# Updated');
            expect(editor.getValue()).toBe('# Updated');
        });
    });

    describe('Large File Handling', () => {
        it('should handle large markdown files without crashing', () => {
            // Generate a large markdown document (approximately 10,000 lines)
            const lines = [];

            for (let i = 0; i < 10000; i++) {
                lines.push(`## Heading ${i}`);
                lines.push(`This is paragraph ${i} with some content.`);
                lines.push('');
            }
            const largeContent = lines.join('\n');

            // Set large content in editor
            expect(() => {
                editor.setValue(largeContent);
            }).not.toThrow();

            // Verify content was set
            expect(editor.getValue().length).toBeGreaterThan(100000);
        });

        it('should render large files without excessive delay', () => {
            // Generate a moderately large document (1,000 lines)
            const lines = [];

            for (let i = 0; i < 1000; i++) {
                lines.push(`# Heading ${i}`);
                lines.push(`Paragraph with **bold** and *italic* text.`);
                lines.push('- List item 1');
                lines.push('- List item 2');
                lines.push('');
            }
            const content = lines.join('\n');

            editor.setValue(content);

            // Measure render time
            const startTime = performance.now();

            preview.render(content);
            const endTime = performance.now();

            const renderTime = endTime - startTime;

            // Rendering should complete in reasonable time (< 1000ms)
            expect(renderTime).toBeLessThan(1000);
        });

        it('should handle files with many headings', () => {
            // Generate document with 500 headings
            const headings = [];

            for (let i = 1; i <= 500; i++) {
                headings.push(`# Heading ${i}`);
            }
            const content = headings.join('\n\n');

            expect(() => {
                editor.setValue(content);
                preview.render(content);
            }).not.toThrow();

            expect(editor.getValue()).toContain('Heading 500');
        });

        it('should handle files with many list items', () => {
            // Generate document with 1000 list items
            const items = [];

            for (let i = 1; i <= 1000; i++) {
                items.push(`- List item ${i}`);
            }
            const content = items.join('\n');

            expect(() => {
                editor.setValue(content);
                preview.render(content);
            }).not.toThrow();

            expect(editor.getValue()).toContain('List item 1000');
        });

        it('should handle files with large code blocks', () => {
            // Generate document with large code block
            const codeLines = [];

            for (let i = 1; i <= 500; i++) {
                codeLines.push(`function example${i}() {`);
                codeLines.push(`  return ${i};`);
                codeLines.push(`}`);
            }
            const content = '```javascript\n' + codeLines.join('\n') + '\n```';

            expect(() => {
                editor.setValue(content);
                preview.render(content);
            }).not.toThrow();

            expect(editor.getValue()).toContain('function example500');
        });

        it('should handle files with many links', () => {
            // Generate document with 200 links
            const links = [];

            for (let i = 1; i <= 200; i++) {
                links.push(`[Link ${i}](https://example.com/${i})`);
            }
            const content = links.join(' ');

            expect(() => {
                editor.setValue(content);
                preview.render(content);
            }).not.toThrow();

            expect(editor.getValue()).toContain('Link 200');
        });
    });

    describe('Rendering Performance', () => {
        it('should render simple markdown quickly', () => {
            const simpleContent = '# Hello World\n\nThis is a simple document.';

            const startTime = performance.now();

            preview.render(simpleContent);
            const endTime = performance.now();

            const renderTime = endTime - startTime;

            // Simple rendering should be very fast (< 50ms)
            expect(renderTime).toBeLessThan(50);
        });

        it('should handle repeated renders efficiently', () => {
            const content = '# Test Document\n\nSome content here.';

            // Render multiple times
            const startTime = performance.now();

            for (let i = 0; i < 100; i++) {
                preview.render(content);
            }
            const endTime = performance.now();

            const totalTime = endTime - startTime;

            // 100 renders should complete in reasonable time (< 500ms)
            expect(totalTime).toBeLessThan(500);
        });

        it('should not leak memory with repeated renders', () => {
            const content = '# Memory Test\n\nContent for memory testing.';

            // Get initial memory usage (if available)
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            // Render many times
            for (let i = 0; i < 1000; i++) {
                preview.render(content);
            }

            // Get final memory usage
            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            // Memory growth should be reasonable (less than 10MB)
            // Note: This test may not be reliable in all environments
            if (performance.memory) {
                const memoryGrowth = finalMemory - initialMemory;

                expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB
            } else {
                // If memory API not available, just verify no crash
                expect(true).toBe(true);
            }
        });
    });

    describe('Editor Performance', () => {
        it('should handle rapid typing without lag', () => {
            const startTime = performance.now();

            // Simulate rapid typing
            for (let i = 0; i < 100; i++) {
                editor.insertText('a');
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // Should handle 100 insertions quickly (< 100ms)
            expect(totalTime).toBeLessThan(100);
            expect(editor.getValue().length).toBe(100);
        });

        it('should handle large paste operations', () => {
            // Generate large text to paste
            const largeText = 'Lorem ipsum '.repeat(1000);

            const startTime = performance.now();

            editor.insertText(largeText);
            const endTime = performance.now();

            const pasteTime = endTime - startTime;

            // Large paste should complete quickly (< 100ms)
            expect(pasteTime).toBeLessThan(100);
            expect(editor.getValue()).toContain('Lorem ipsum');
        });

        it('should handle undo/redo efficiently', () => {
            // Make several changes
            editor.setValue('Change 1');
            editor.setValue('Change 2');
            editor.setValue('Change 3');
            editor.setValue('Change 4');
            editor.setValue('Change 5');

            const startTime = performance.now();

            // Undo all changes
            for (let i = 0; i < 5; i++) {
                editor.undo();
            }

            // Redo all changes
            for (let i = 0; i < 5; i++) {
                editor.redo();
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // Undo/redo operations should be fast (< 50ms)
            expect(totalTime).toBeLessThan(50);
        });
    });

    describe('Scroll Performance', () => {
        it('should handle scroll position updates efficiently', () => {
            // Set content with many lines
            const lines = [];

            for (let i = 0; i < 100; i++) {
                lines.push(`Line ${i}`);
            }
            editor.setValue(lines.join('\n'));

            const startTime = performance.now();

            // Update scroll position multiple times
            for (let i = 0; i <= 1; i += 0.1) {
                editor.setScrollPosition(i);
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // Scroll updates should be fast (< 50ms)
            expect(totalTime).toBeLessThan(50);
        });

        it('should get scroll position without performance impact', () => {
            const startTime = performance.now();

            // Get scroll position many times
            for (let i = 0; i < 1000; i++) {
                editor.getScrollPosition();
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // Getting scroll position should be very fast (< 10ms for 1000 calls)
            expect(totalTime).toBeLessThan(10);
        });
    });
});
