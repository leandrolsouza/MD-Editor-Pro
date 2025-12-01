/**
 * Markdown Parser Module
 * Configures markdown-it with CommonMark, GFM support, and advanced features
 * Requirements: 4.1, 4.2, 6.2, 6.3
 */

const markdownit = require('markdown-it');
const markdownitTaskLists = require('markdown-it-task-lists');
const hljs = require('highlight.js');
const markdownItMermaid = require('./advanced-markdown/markdown-it-mermaid-plugin');
const markdownItKatex = require('./advanced-markdown/markdown-it-katex-plugin');
const markdownItCallouts = require('./advanced-markdown/markdown-it-callout-plugin');

/**
 * MarkdownParser class
 * Manages markdown-it instance with support for advanced features
 */
class MarkdownParser {
    /**
     * Create a MarkdownParser
     * @param {Object} advancedMarkdownManager - Optional AdvancedMarkdownManager instance
     * @param {Object} postProcessor - Optional post-processor for advanced features
     */
    constructor(advancedMarkdownManager = null, postProcessor = null) {
        this.advancedMarkdownManager = advancedMarkdownManager;
        this.postProcessor = postProcessor;
        this.md = null;

        this.initialize();
    }

    /**
     * Initialize the markdown-it instance with base configuration
     */
    initialize() {
        this.md = markdownit({
            html: false,          // Disable HTML tags for security
            linkify: true,        // Auto-convert URLs to links
            typographer: true,    // Enable smart quotes
            breaks: false,        // Don't convert \n to <br>
            highlight: (str, lang) => {
                // Use highlight.js for syntax highlighting
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(str, { language: lang }).value;
                    } catch (err) {
                        console.error('Syntax highlighting error:', err);
                    }
                }
                return ''; // Use default escaping
            }
        });

        // Enable GFM extensions
        this.md.enable(['table', 'strikethrough']);

        // Add task lists plugin
        this.md.use(markdownitTaskLists, {
            enabled: true,
            label: true,
            labelAfter: true
        });

        // Initialize advanced plugins if manager is available
        this.initializeAdvancedPlugins();
    }

    /**
     * Initialize advanced markdown plugins based on enabled features
     * Requirements: 6.2, 6.3 - Conditionally load plugins based on configuration
     */
    initializeAdvancedPlugins() {
        if (!this.advancedMarkdownManager) {
            // No manager provided, don't load advanced plugins
            return;
        }

        try {
            // Load Mermaid plugin if enabled
            // Requirement: 6.2 - When disabled, treat as regular markdown
            // Requirement: 6.3 - When enabled, parse and render syntax
            if (this.advancedMarkdownManager.isFeatureEnabled('mermaid')) {
                this.md.use(markdownItMermaid);
            }

            // Load KaTeX plugin if enabled
            if (this.advancedMarkdownManager.isFeatureEnabled('katex')) {
                this.md.use(markdownItKatex);
            }

            // Load Callouts plugin if enabled
            if (this.advancedMarkdownManager.isFeatureEnabled('callouts')) {
                this.md.use(markdownItCallouts);
            }
        } catch (error) {
            console.error('Error initializing advanced plugins:', error);
        }
    }

    /**
     * Reinitialize the parser when configuration changes
     * Requirements: 6.2, 6.3 - Update parser when features are toggled
     */
    reinitialize() {
        this.initialize();
    }

    /**
     * Parse markdown to HTML
     * @param {string} markdown - The markdown content to render
     * @returns {string} Rendered HTML
     * Requirements: 4.1, 4.2 - Support both basic and advanced markdown
     */
    parse(markdown) {
        if (!markdown) {
            return '';
        }

        try {
            const html = this.md.render(markdown);
            return html;
        } catch (error) {
            console.error('Markdown parsing error:', error);
            return '<div class="markdown-error">Error parsing markdown</div>';
        }
    }

    /**
     * Parse markdown to HTML with post-processing
     * This method is async to support post-processing
     * @param {string} markdown - The markdown content to render
     * @param {HTMLElement} container - Optional container for post-processing
     * @returns {Promise<string>} Rendered HTML
     */
    async parseAsync(markdown, container = null) {
        const html = this.parse(markdown);

        // If post-processor and container are provided, process the HTML
        if (this.postProcessor && container) {
            container.innerHTML = html;
            await this.postProcessor.processHTML(container);
            return container.innerHTML;
        }

        return html;
    }
}

/**
 * Singleton instance of the markdown parser (for backward compatibility)
 */
let parserInstance = null;

/**
 * Creates and configures a markdown-it instance (legacy function for backward compatibility)
 * @returns {Object} Configured markdown-it instance
 */
function createMarkdownParser() {
    const parser = new MarkdownParser();
    return parser.md;
}

/**
 * Gets the markdown parser instance (creates if doesn't exist)
 * Legacy function for backward compatibility
 * @returns {Object} Configured markdown-it instance
 */
function getMarkdownParser() {
    if (!parserInstance) {
        parserInstance = createMarkdownParser();
    }
    return parserInstance;
}

/**
 * Renders markdown to HTML (legacy function for backward compatibility)
 * @param {string} markdown - The markdown content to render
 * @returns {string} Rendered HTML
 */
function renderMarkdown(markdown) {
    const parser = getMarkdownParser();
    return parser.render(markdown);
}

module.exports = {
    MarkdownParser,
    createMarkdownParser,
    getMarkdownParser,
    renderMarkdown
};
