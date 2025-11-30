/**
 * Preview class - Manages the markdown preview rendering
 * Provides methods for rendering markdown and scroll synchronization
 */

import { renderMarkdown } from './markdown-parser.js';

class Preview {
    constructor() {
        this.container = null;
        this.debounceTimer = null;
        this.debounceDelay = 300; // 300ms as specified in requirements
        this.lastRenderedContent = '';
    }

    /**
     * Initialize the preview container
     * @param {HTMLElement} element - The DOM element to use as preview container
     */
    initialize(element) {
        if (!element) {
            throw new Error('Preview element is required');
        }

        this.container = element;
        this.container.innerHTML = '';
    }

    /**
     * Render markdown content to HTML (with debouncing)
     * @param {string} markdown - The markdown content to render
     * @param {boolean} immediate - If true, render immediately without debouncing (for testing)
     */
    render(markdown, immediate = false) {
        if (!this.container) {
            throw new Error('Preview not initialized');
        }

        // Clear existing debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        if (immediate) {
            this._renderImmediate(markdown);
        } else {
            // Debounce the rendering to avoid excessive updates
            this.debounceTimer = setTimeout(() => {
                this._renderImmediate(markdown);
            }, this.debounceDelay);
        }
    }

    /**
     * Render markdown content immediately without debouncing
     * @param {string} markdown - The markdown content to render
     * @private
     */
    _renderImmediate(markdown) {
        if (!this.container) {
            throw new Error('Preview not initialized');
        }

        // Only re-render if content has changed
        if (markdown === this.lastRenderedContent) {
            return;
        }

        this.lastRenderedContent = markdown;

        // Render the markdown to HTML
        const html = renderMarkdown(markdown);
        this.container.innerHTML = html;
    }

    /**
     * Get the current scroll position as a percentage
     * @returns {number} Scroll position (0-1)
     */
    getScrollPosition() {
        if (!this.container) {
            throw new Error('Preview not initialized');
        }

        const scrollTop = this.container.scrollTop;
        const scrollHeight = this.container.scrollHeight - this.container.clientHeight;

        if (scrollHeight === 0) {
            return 0;
        }

        return scrollTop / scrollHeight;
    }

    /**
     * Set the scroll position as a percentage
     * @param {number} position - Scroll position (0-1)
     */
    setScrollPosition(position) {
        if (!this.container) {
            throw new Error('Preview not initialized');
        }

        if (position < 0 || position > 1) {
            throw new Error('Position must be between 0 and 1');
        }

        const scrollHeight = this.container.scrollHeight - this.container.clientHeight;
        this.container.scrollTop = scrollHeight * position;
    }

    /**
     * Synchronize scroll position with editor
     * @param {number} editorScrollPercent - The editor's scroll position as percentage (0-1)
     */
    syncScroll(editorScrollPercent) {
        if (!this.container) {
            throw new Error('Preview not initialized');
        }

        if (isNaN(editorScrollPercent) || editorScrollPercent < 0 || editorScrollPercent > 1) {
            throw new Error('Position must be between 0 and 1');
        }

        this.setScrollPosition(editorScrollPercent);
    }

    /**
     * Destroy the preview instance and clean up
     */
    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }

        this.lastRenderedContent = '';
    }
}

export default Preview;
