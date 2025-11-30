/**
 * Markdown Parser Module
 * Configures markdown-it with CommonMark and GFM support
 */

const markdownit = require('markdown-it');
const markdownitTaskLists = require('markdown-it-task-lists');
const hljs = require('highlight.js');

/**
 * Creates and configures a markdown-it instance with:
 * - CommonMark preset
 * - GFM extensions (tables, strikethrough)
 * - Task lists
 * - Syntax highlighting
 * - Security (HTML disabled)
 * 
 * @returns {Object} Configured markdown-it instance
 */
function createMarkdownParser() {
    const md = markdownit({
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
    md.enable(['table', 'strikethrough']);

    // Add task lists plugin
    md.use(markdownitTaskLists, {
        enabled: true,
        label: true,
        labelAfter: true
    });

    return md;
}

/**
 * Singleton instance of the markdown parser
 */
let parserInstance = null;

/**
 * Gets the markdown parser instance (creates if doesn't exist)
 * @returns {Object} Configured markdown-it instance
 */
function getMarkdownParser() {
    if (!parserInstance) {
        parserInstance = createMarkdownParser();
    }
    return parserInstance;
}

/**
 * Renders markdown to HTML
 * @param {string} markdown - The markdown content to render
 * @returns {string} Rendered HTML
 */
function renderMarkdown(markdown) {
    const parser = getMarkdownParser();
    return parser.render(markdown);
}

module.exports = {
    createMarkdownParser,
    getMarkdownParser,
    renderMarkdown
};
