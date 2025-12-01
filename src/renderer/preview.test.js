/**
 * Preview Component Tests
 * Tests the preview rendering with post-processor integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Preview from './preview.js';

describe('Preview Component', () => {
    let preview;
    let container;
    let mockPostProcessor;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '<div id="preview-container"></div>';
        container = document.getElementById('preview-container');

        // Create mock post-processor
        mockPostProcessor = {
            processHTML: vi.fn().mockResolvedValue(undefined),
            updateTheme: vi.fn()
        };
    });

    afterEach(() => {
        if (preview) {
            preview.destroy();
        }
        document.body.innerHTML = '';
    });

    describe('Constructor and Initialization', () => {
        it('should create preview without post-processor', () => {
            preview = new Preview();
            expect(preview).toBeDefined();
            expect(preview.postProcessor).toBeNull();
        });

        it('should create preview with post-processor', () => {
            preview = new Preview(mockPostProcessor);
            expect(preview).toBeDefined();
            expect(preview.postProcessor).toBe(mockPostProcessor);
        });

        it('should initialize with container element', () => {
            preview = new Preview();
            preview.initialize(container);
            expect(preview.container).toBe(container);
        });
    });

    describe('Post-Processor Integration', () => {
        it('should call post-processor after rendering', async () => {
            preview = new Preview(mockPostProcessor);
            preview.initialize(container);

            const markdown = '# Test\n\nSome content';

            await preview.render(markdown, true);

            // Wait for async rendering to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockPostProcessor.processHTML).toHaveBeenCalledWith(container);
        });

        it('should render without post-processor when not provided', async () => {
            preview = new Preview();
            preview.initialize(container);

            const markdown = '# Test\n\nSome content';

            await preview.render(markdown, true);

            // Should render HTML without errors
            expect(container.innerHTML).toContain('<h1>Test</h1>');
        });

        it('should handle post-processor errors gracefully', async () => {
            const errorPostProcessor = {
                processHTML: vi.fn().mockRejectedValue(new Error('Processing failed')),
                updateTheme: vi.fn()
            };

            preview = new Preview(errorPostProcessor);
            preview.initialize(container);

            const markdown = '# Test';

            await preview.render(markdown, true);

            // Wait for async rendering
            await new Promise(resolve => setTimeout(resolve, 10));

            // Should display error message
            expect(container.innerHTML).toContain('Preview Error');
        });
    });

    describe('Theme Updates', () => {
        it('should delegate theme updates to post-processor', () => {
            preview = new Preview(mockPostProcessor);
            preview.initialize(container);

            preview.updateTheme('dark');

            expect(mockPostProcessor.updateTheme).toHaveBeenCalledWith('dark');
        });

        it('should handle theme updates without post-processor', () => {
            preview = new Preview();
            preview.initialize(container);

            // Should not throw error
            expect(() => preview.updateTheme('dark')).not.toThrow();
        });

        it('should handle post-processor theme errors gracefully', () => {
            const errorPostProcessor = {
                processHTML: vi.fn().mockResolvedValue(undefined),
                updateTheme: vi.fn().mockImplementation(() => {
                    throw new Error('Theme update failed');
                })
            };

            preview = new Preview(errorPostProcessor);
            preview.initialize(container);

            // Should not throw error
            expect(() => preview.updateTheme('dark')).not.toThrow();
        });
    });

    describe('Backward Compatibility', () => {
        it('should maintain existing render behavior', async () => {
            preview = new Preview();
            preview.initialize(container);

            const markdown = '# Heading\n\n**Bold** and *italic*';

            await preview.render(markdown, true);

            const html = container.innerHTML;

            expect(html).toContain('<h1>Heading</h1>');
            expect(html).toContain('<strong>Bold</strong>');
            expect(html).toContain('<em>italic</em>');
        });

        it('should maintain scroll position methods', () => {
            preview = new Preview();
            preview.initialize(container);

            // Set scroll position
            preview.setScrollPosition(0.5);
            expect(preview.getScrollPosition()).toBeGreaterThanOrEqual(0);

            // Sync scroll
            expect(() => preview.syncScroll(0.75)).not.toThrow();
        });

        it('should maintain debouncing behavior', async () => {
            preview = new Preview(mockPostProcessor);
            preview.initialize(container);

            const markdown = '# Test';

            // Render with debouncing (not immediate)
            preview.render(markdown, false);

            // Post-processor should not be called immediately
            expect(mockPostProcessor.processHTML).not.toHaveBeenCalled();

            // Wait for debounce delay
            await new Promise(resolve => setTimeout(resolve, 350));

            // Now it should be called
            expect(mockPostProcessor.processHTML).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle post-processor errors and display error message', async () => {
            const errorPostProcessor = {
                processHTML: vi.fn().mockRejectedValue(new Error('Post-processing failed')),
                updateTheme: vi.fn()
            };

            preview = new Preview(errorPostProcessor);
            preview.initialize(container);

            const markdown = '# Test';

            await preview.render(markdown, true);

            // Wait for async rendering
            await new Promise(resolve => setTimeout(resolve, 10));

            // Should display error message when post-processing fails
            expect(container.innerHTML).toContain('Preview Error');
            expect(container.innerHTML).toContain('Post-processing failed');
        });

        it('should not re-render same content', async () => {
            preview = new Preview(mockPostProcessor);
            preview.initialize(container);

            const markdown = '# Test';

            // First render
            await preview.render(markdown, true);
            await new Promise(resolve => setTimeout(resolve, 10));

            const callCount = mockPostProcessor.processHTML.mock.calls.length;

            // Second render with same content
            await preview.render(markdown, true);
            await new Promise(resolve => setTimeout(resolve, 10));

            // Should not call post-processor again
            expect(mockPostProcessor.processHTML.mock.calls.length).toBe(callCount);
        });
    });
});
