/**
 * Preview class - Manages the markdown preview rendering
 * Provides methods for rendering markdown and scroll synchronization
 */

const i18n = require('../i18n/index.js');

class Preview {
    constructor(postProcessor = null, markdownParser = null) {
        this.container = null;
        this.postProcessor = postProcessor;
        this.markdownParser = markdownParser;
        this.debounceTimer = null;
        this.debounceDelay = 300; // 300ms as specified in requirements
        this.lastRenderedContent = '';
    }

    /**
     * Initialize the preview container
     * @param {HTMLElement} element - The DOM element to use as preview container
     * @param {Object} options - Configuration options
     * @param {Function} options.onLinkClick - Callback for internal markdown link clicks (receives resolved file path)
     */
    initialize(element, options = {}) {
        if (!element) {
            throw new Error('Preview element is required');
        }

        this.container = element;
        this.container.innerHTML = '';
        this.onLinkClick = options.onLinkClick || null;

        // Intercept link clicks in the preview
        this.container.addEventListener('click', (e) => {
            this._handleLinkClick(e);
        });
    }

    /**
     * Handle link clicks in the preview
     * - Internal .md links: open in editor via callback
     * - External http(s) links: open in system browser
     * - Anchor links (#): scroll within preview
     * - Other links: prevent navigation
     * @param {MouseEvent} e - Click event
     * @private
     */
    _handleLinkClick(e) {
        const link = e.target.closest('a');

        if (!link) {
            return;
        }

        const href = link.getAttribute('href');

        if (!href) {
            return;
        }

        // Anchor links - allow default scroll behavior
        if (href.startsWith('#')) {
            return;
        }

        // Prevent default navigation for all other links
        e.preventDefault();

        // External links - open in system browser
        if (href.startsWith('http://') || href.startsWith('https://')) {
            if (window.electronAPI && window.electronAPI.openExternal) {
                window.electronAPI.openExternal(href);
            }
            return;
        }

        // Internal markdown links - notify callback to open in editor
        if (href.endsWith('.md') || href.endsWith('.markdown')) {
            if (this.onLinkClick) {
                this.onLinkClick(href);
            }
            return;
        }

        // All other links (relative paths, etc.) - do nothing to prevent white screen
        console.warn('Preview: unhandled link type:', href);
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
    async _renderImmediate(markdown) {
        if (!this.container) {
            throw new Error('Preview not initialized');
        }

        // Only re-render if content has changed
        if (markdown === this.lastRenderedContent) {
            return;
        }

        this.lastRenderedContent = markdown;

        try {
            // Render the markdown to HTML
            let html;

            if (this.markdownParser) {
                html = this.markdownParser.parse(markdown);
            } else {
                // Fallback to basic rendering if no parser provided
                const { renderMarkdown } = require('./markdown-parser.js');

                html = renderMarkdown(markdown);
            }

            this.container.innerHTML = html;

            // Post-process for advanced markdown features (Mermaid, KaTeX)
            if (this.postProcessor) {
                await this.postProcessor.processHTML(this.container);
            }
        } catch (error) {
            console.error('Error rendering preview:', error);
            // Display error message in preview
            this.container.innerHTML = `<div class="preview-error">
                <strong>${i18n.t('preview.error')}:</strong>
                <pre>${error.message || i18n.t('preview.unknownError')}</pre>
            </div>`;
        }
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
     * Update theme for advanced markdown features
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    updateTheme(theme) {
        if (this.postProcessor) {
            try {
                this.postProcessor.updateTheme(theme);
            } catch (error) {
                console.error('Error updating theme:', error);
            }
        }
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

module.exports = Preview;
