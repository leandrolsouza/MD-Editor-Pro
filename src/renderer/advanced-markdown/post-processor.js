/**
 * Advanced Markdown Post-Processor
 *
 * Handles client-side rendering of Mermaid diagrams and KaTeX mathematical formulas
 * after the initial markdown-to-HTML conversion. This two-stage approach allows
 * markdown-it plugins to generate placeholders that are then processed by the
 * respective libraries.
 */

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

class AdvancedMarkdownPostProcessor {
    constructor() {
        this.mermaid = null;
        this.katex = null;
        this.mermaidInitialized = false;
        this.katexInitialized = false;
        this.currentTheme = 'default';

        this.initializeMermaid();
        this.initializeKatex();
    }

    /**
     * Initialize Mermaid library with secure configuration
     */
    initializeMermaid() {
        try {
            const mermaidModule = require('mermaid');

            // Handle both CommonJS and ES module exports
            this.mermaid = mermaidModule.default || mermaidModule;

            // Initialize with secure settings
            this.mermaid.initialize({
                startOnLoad: false,
                theme: this.currentTheme === 'dark' ? 'dark' : 'default',
                securityLevel: 'strict',
                logLevel: 'error'
            });

            this.mermaidInitialized = true;
        } catch (error) {
            console.error('Failed to initialize Mermaid:', error);
            this.mermaidInitialized = false;
        }
    }

    /**
     * Initialize KaTeX library
     */
    initializeKatex() {
        try {
            this.katex = require('katex');
            this.katexInitialized = true;
        } catch (error) {
            console.error('Failed to initialize KaTeX:', error);
            this.katexInitialized = false;
        }
    }

    /**
     * Process HTML container to render all advanced markdown features
     * @param {HTMLElement} container - Container element with placeholder elements
     * @returns {Promise<void>}
     */
    async processHTML(container) {
        if (!container) {
            console.warn('Post-processor: No container provided');
            return;
        }

        // Process Mermaid diagrams (async)
        if (this.mermaidInitialized) {
            await this.processMermaid(container);
        }

        // Process KaTeX formulas (sync)
        if (this.katexInitialized) {
            this.processKatex(container);
        }
    }

    /**
     * Process all Mermaid diagram placeholders in the container
     * @param {HTMLElement} container - Container element
     * @returns {Promise<void>}
     */
    async processMermaid(container) {
        const diagrams = container.querySelectorAll('.mermaid-diagram');

        for (const diagram of diagrams) {
            // Skip if already rendered
            if (diagram.classList.contains('mermaid-rendered') ||
                diagram.classList.contains('mermaid-error')) {
                continue;
            }

            const code = diagram.textContent.trim();
            const id = diagram.getAttribute('data-mermaid-id');

            // Handle empty diagrams
            if (!code) {
                diagram.innerHTML = '<div class="mermaid-error">' +
                    '<strong>Mermaid Error:</strong> Empty diagram' +
                    '</div>';
                diagram.classList.add('mermaid-error');
                continue;
            }

            try {
                // Render the diagram
                const { svg } = await this.mermaid.render(id, code);

                // Replace placeholder with rendered SVG
                diagram.innerHTML = svg;
                diagram.classList.add('mermaid-rendered');
            } catch (error) {
                // Display error message
                diagram.innerHTML = '<div class="mermaid-error">' +
                    '<strong>Mermaid Syntax Error:</strong>' +
                    '<pre>' + escapeHtml(error.message || 'Unknown error') + '</pre>' +
                    '</div>';
                diagram.classList.add('mermaid-error');

                console.error('Mermaid rendering error:', error);
            }
        }
    }

    /**
     * Process all KaTeX formula placeholders in the container
     * @param {HTMLElement} container - Container element
     */
    processKatex(container) {
        // Process inline math
        const inlineMath = container.querySelectorAll('.katex-inline');

        inlineMath.forEach(element => {
            // Skip if already rendered
            if (element.classList.contains('katex-rendered') ||
                element.classList.contains('katex-error')) {
                return;
            }

            const latex = element.getAttribute('data-katex');

            if (!latex) {
                return;
            }

            try {
                this.katex.render(latex, element, {
                    throwOnError: false,
                    displayMode: false
                });
                element.classList.add('katex-rendered');
            } catch (error) {
                // Fallback to displaying original text
                element.textContent = '$' + latex + '$';
                element.classList.add('katex-error');
                console.error('KaTeX inline rendering error:', error);
            }
        });

        // Process block math
        const blockMath = container.querySelectorAll('.katex-block');

        blockMath.forEach(element => {
            // Skip if already rendered
            if (element.classList.contains('katex-rendered') ||
                element.classList.contains('katex-error')) {
                return;
            }

            const latex = element.getAttribute('data-katex');

            if (!latex) {
                return;
            }

            try {
                this.katex.render(latex, element, {
                    throwOnError: false,
                    displayMode: true
                });
                element.classList.add('katex-rendered');
            } catch (error) {
                // Fallback to displaying original text
                element.textContent = '$' + latex + '$';
                element.classList.add('katex-error');
                console.error('KaTeX block rendering error:', error);
            }
        });
    }

    /**
     * Update theme for rendered content
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    updateTheme(theme) {
        this.currentTheme = theme;

        if (this.mermaidInitialized && this.mermaid) {
            try {
                this.mermaid.initialize({
                    startOnLoad: false,
                    theme: theme === 'dark' ? 'dark' : 'default',
                    securityLevel: 'strict',
                    logLevel: 'error'
                });
            } catch (error) {
                console.error('Failed to update Mermaid theme:', error);
            }
        }
    }
}

module.exports = AdvancedMarkdownPostProcessor;
