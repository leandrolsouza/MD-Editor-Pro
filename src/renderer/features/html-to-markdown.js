/**
 * HTML to Markdown Converter
 * Converts HTML content (from clipboard) to Markdown format
 */

const TurndownService = require('turndown');

class HtmlToMarkdownConverter {
    constructor() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            hr: '---',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced',
            fence: '```',
            emDelimiter: '*',
            strongDelimiter: '**',
            linkStyle: 'inlined',
            linkReferenceStyle: 'full'
        });

        // Add custom rules for better conversion
        this.addCustomRules();
    }

    /**
     * Add custom conversion rules for better Markdown output
     */
    addCustomRules() {
        // Handle strikethrough
        this.turndownService.addRule('strikethrough', {
            filter: ['del', 's', 'strike'],
            replacement: (content) => `~~${content}~~`
        });

        // Handle task lists
        this.turndownService.addRule('taskList', {
            filter: (node) => {
                return node.nodeName === 'INPUT' &&
                    node.getAttribute('type') === 'checkbox';
            },
            replacement: (content, node) => {
                return node.checked ? '[x] ' : '[ ] ';
            }
        });

        // Handle tables better
        this.turndownService.addRule('table', {
            filter: 'table',
            replacement: (content) => {
                // Let turndown handle tables, but ensure proper spacing
                return '\n' + content + '\n';
            }
        });

        // Handle code blocks with language
        this.turndownService.addRule('codeBlock', {
            filter: (node) => {
                return node.nodeName === 'PRE' &&
                    node.firstChild &&
                    node.firstChild.nodeName === 'CODE';
            },
            replacement: (content, node) => {
                const code = node.firstChild;
                const language = code.className.match(/language-(\w+)/);
                const lang = language ? language[1] : '';
                const codeContent = code.textContent;

                return '\n```' + lang + '\n' + codeContent + '\n```\n';
            }
        });
    }

    /**
     * Convert HTML to Markdown
     * @param {string} html - HTML content to convert
     * @returns {string} Markdown content
     */
    convert(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        try {
            // Clean up the HTML before conversion
            const cleanedHtml = this.cleanHtml(html);

            // Convert to Markdown
            const markdown = this.turndownService.turndown(cleanedHtml);

            // Post-process the Markdown
            return this.postProcess(markdown);
        } catch (error) {
            console.error('Error converting HTML to Markdown:', error);
            return html; // Return original HTML if conversion fails
        }
    }

    /**
     * Clean HTML before conversion
     * @param {string} html - HTML content
     * @returns {string} Cleaned HTML
     */
    cleanHtml(html) {
        // Remove script and style tags
        let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

        // Remove comments
        cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

        // Remove data attributes and other noise
        cleaned = cleaned.replace(/\s+data-[a-z-]+="[^"]*"/gi, '');

        return cleaned;
    }

    /**
     * Post-process Markdown for better formatting
     * @param {string} markdown - Markdown content
     * @returns {string} Post-processed Markdown
     */
    postProcess(markdown) {
        // Remove excessive blank lines (more than 2 consecutive)
        let processed = markdown.replace(/\n{3,}/g, '\n\n');

        // Trim leading and trailing whitespace
        processed = processed.trim();

        // Ensure proper spacing around headings
        processed = processed.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');

        // Ensure proper spacing after headings
        processed = processed.replace(/(#{1,6}\s[^\n]+)\n([^\n#])/g, '$1\n\n$2');

        return processed;
    }

    /**
     * Check if content is HTML
     * @param {string} content - Content to check
     * @returns {boolean} True if content appears to be HTML
     */
    isHtml(content) {
        if (!content || typeof content !== 'string') {
            return false;
        }

        // Check for common HTML patterns
        const htmlPatterns = [
            /<[a-z][\s\S]*>/i,           // Any HTML tag
            /&[a-z]+;/i,                  // HTML entities
            /<\/[a-z]+>/i                 // Closing tags
        ];

        return htmlPatterns.some(pattern => pattern.test(content));
    }

    /**
     * Check if content should be converted
     * Determines if the content is HTML and worth converting
     * @param {string} content - Content to check
     * @returns {boolean} True if content should be converted
     */
    shouldConvert(content) {
        if (!this.isHtml(content)) {
            return false;
        }

        // Don't convert if it's just a simple HTML fragment with no structure
        const simpleFragmentPattern = /^<[a-z]+>[^<]*<\/[a-z]+>$/i;
        if (simpleFragmentPattern.test(content.trim()) &&
            !content.includes('\n') &&
            content.length < 50) {
            return false;
        }

        return true;
    }
}

module.exports = HtmlToMarkdownConverter;
