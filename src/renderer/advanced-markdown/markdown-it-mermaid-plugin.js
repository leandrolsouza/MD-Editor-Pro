/**
 * markdown-it plugin for Mermaid diagrams
 * 
 * This plugin detects fenced code blocks with the 'mermaid' language identifier
 * and generates placeholder divs that will be processed by the Mermaid library
 * in the post-processing step.
 */

/**
 * Generates a unique ID for Mermaid diagrams
 * @returns {string} Unique identifier
 */
function generateMermaidId() {
    return `mermaid-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * markdown-it plugin for Mermaid diagram support
 * @param {object} md - markdown-it instance
 */
function markdownItMermaid(md) {
    // Store the default fence renderer
    const defaultRenderer = md.renderer.rules.fence || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    // Override the fence renderer to detect Mermaid code blocks
    md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        const code = token.content.trim();
        const info = token.info ? token.info.trim() : '';

        // Check if this is a Mermaid code block
        if (info === 'mermaid') {
            // Handle edge case: empty code blocks
            if (!code) {
                return '<div class="mermaid-diagram mermaid-empty">' +
                    '<div class="mermaid-error">Empty Mermaid diagram</div>' +
                    '</div>\n';
            }

            // Generate unique ID for this diagram
            const id = generateMermaidId();

            // Create placeholder div with data attributes
            // The actual rendering will be done by the post-processor
            return '<div class="mermaid-diagram" data-mermaid-id="' + id + '">' +
                escapeHtml(code) +
                '</div>\n';
        }

        // Not a Mermaid block, use default renderer
        return defaultRenderer(tokens, idx, options, env, self);
    };
}

module.exports = markdownItMermaid;
