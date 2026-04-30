/**
 * Exporter - HTML and PDF Export Manager
 * Handles exporting markdown documents to HTML and PDF formats
 * Requirements: 5.1, 5.2, 5.3, 1.5, 1.6, 2.6, 2.7, 3.8, 3.9
 */

const { dialog, BrowserWindow } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const markdownit = require('markdown-it');
const markdownitTaskLists = require('markdown-it-task-lists');
const hljs = require('highlight.js');

// Advanced markdown plugins
const markdownItMermaid = require('../renderer/advanced-markdown/markdown-it-mermaid-plugin');
const markdownItKatex = require('../renderer/advanced-markdown/markdown-it-katex-plugin');
const markdownItCallouts = require('../renderer/advanced-markdown/markdown-it-callout-plugin');

// Export styles (extracted CSS generation)
const { generateCSS, generateCalloutCSS } = require('./export-styles');

/**
 * Exporter class manages document export operations
 * Provides methods for exporting to HTML and PDF formats
 */
class Exporter {
    constructor(windowManager, advancedMarkdownManager) {
        this.windowManager = windowManager;
        this.advancedMarkdownManager = advancedMarkdownManager;

        // Initialize markdown-it with CommonMark preset and GFM extensions
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
        })
            .enable(['table', 'strikethrough'])  // Enable GFM extensions
            .use(markdownitTaskLists);           // Enable task lists

        // Initialize advanced markdown plugins if manager is provided
        this._initializeAdvancedPlugins();
    }

    /**
     * Pre-process markdown content to fix common formatting issues
     * that break table rendering (blank lines inside tables, escaped separators)
     * @param {string} content - Raw markdown content
     * @returns {string} Cleaned markdown content
     * @private
     */
    _preprocessMarkdown(content) {
        if (!content) return content;

        const lines = content.split('\n');
        const result = [];
        let i = 0;

        while (i < lines.length) {
            const trimmed = lines[i].trim();

            // Detect potential table start: line with pipes
            if (/^\|.*\|$/.test(trimmed)) {
                // Collect all table-related lines, skipping blank lines between them
                const tableLines = [lines[i]];
                let j = i + 1;

                while (j < lines.length) {
                    const next = lines[j].trim();

                    // Skip blank/whitespace-only lines between table rows
                    if (next === '') {
                        j++;
                        continue;
                    }

                    // If next non-blank line is a table row, include it
                    if (/^\|.*\|$/.test(next)) {
                        tableLines.push(lines[j]);
                        j++;
                    } else {
                        break;
                    }
                }

                // Only treat as table if we have at least 2 lines (header + separator)
                if (tableLines.length >= 2) {
                    result.push(...tableLines);
                } else {
                    result.push(lines[i]);
                }

                i = j;
            } else {
                result.push(lines[i]);
                i++;
            }
        }

        return result.join('\n');
    }

    /**
     * Initialize advanced markdown plugins based on enabled features
     * @private
     */
    _initializeAdvancedPlugins() {
        if (!this.advancedMarkdownManager) {
            return;
        }

        // Load plugins based on enabled features
        if (this.advancedMarkdownManager.isFeatureEnabled('mermaid')) {
            // Use custom Mermaid plugin for export that generates CDN-compatible HTML
            this.md.use(this._createMermaidExportPlugin());
        }

        if (this.advancedMarkdownManager.isFeatureEnabled('katex')) {
            this.md.use(markdownItKatex);
        }

        if (this.advancedMarkdownManager.isFeatureEnabled('callouts')) {
            this.md.use(markdownItCallouts);
        }
    }

    /**
     * Create a Mermaid plugin optimized for export (HTML/PDF)
     * Generates HTML compatible with Mermaid CDN auto-initialization
     * @returns {Function} markdown-it plugin function
     * @private
     */
    _createMermaidExportPlugin() {
        return function (md) {
            const defaultRenderer = md.renderer.rules.fence || function (tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options);
            };

            md.renderer.rules.fence = function (tokens, idx, options, env, self) {
                const token = tokens[idx];
                const code = token.content.trim();
                const info = token.info ? token.info.trim() : '';

                if (info === 'mermaid') {
                    if (!code) {
                        return '<div class="mermaid-error">Empty Mermaid diagram</div>\n';
                    }

                    // Generate HTML compatible with Mermaid CDN
                    // The 'mermaid' class triggers auto-rendering
                    return '<div class="mermaid">\n' + code + '\n</div>\n';
                }

                return defaultRenderer(tokens, idx, options, env, self);
            };
        };
    }

    /**
     * Get KaTeX CSS content
     * @returns {Promise<string>} KaTeX CSS content
     * @private
     */
    async _getKatexCSS() {
        try {
            const katexCssPath = path.join(__dirname, '../../node_modules/katex/dist/katex.min.css');

            return await fs.readFile(katexCssPath, 'utf-8');
        } catch (error) {
            console.error('Failed to load KaTeX CSS:', error);
            return '';
        }
    }

    /**
     * Generate callout CSS styles
     * Delegates to export-styles module
     * @param {string} theme - Theme to use ('light' or 'dark')
     * @returns {string} Callout CSS styles
     * @private
     */
    _generateCalloutCSS(theme = 'light') {
        return generateCalloutCSS(theme);
    }

    /**
     * Generates CSS styles for HTML export
     * Delegates to export-styles module
     * @param {string} theme - Theme to use ('light' or 'dark')
     * @returns {string} CSS styles
     */
    _generateCSS(theme = 'light') {
        return generateCSS(theme);
    }

    /**
     * Get Mermaid initialization script for export
     * @returns {string} Mermaid initialization script
     * @private
     */
    _getMermaidScript() {
        if (!this.advancedMarkdownManager || !this.advancedMarkdownManager.isFeatureEnabled('mermaid')) {
            return '';
        }

        return `
            <script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>
            <script>
                mermaid.initialize({ 
                    startOnLoad: true,
                    theme: 'default',
                    securityLevel: 'loose'
                });
            </script>
        `;
    }

    /**
     * Exports markdown content to a standalone HTML file
     * @param {string} content - Markdown content to export
     * @param {string} theme - Theme to use ('light' or 'dark')
     * @returns {Promise<string>} Path to the exported HTML file
     * @throws {Error} If export fails
     */
    async exportToHTML(content, theme = 'light') {
        const window = this.windowManager.getMainWindow();

        if (!window) {
            throw new Error('No window available for dialog');
        }

        try {
            // Pre-process markdown to fix table formatting issues
            const cleanedContent = this._preprocessMarkdown(content);

            // Render markdown to HTML
            const htmlContent = this.md.render(cleanedContent);

            // Get KaTeX CSS if KaTeX is enabled
            let katexCSS = '';

            if (this.advancedMarkdownManager && this.advancedMarkdownManager.isFeatureEnabled('katex')) {
                katexCSS = await this._getKatexCSS();
            }

            // Get callout CSS if callouts are enabled
            let calloutCSS = '';

            if (this.advancedMarkdownManager && this.advancedMarkdownManager.isFeatureEnabled('callouts')) {
                calloutCSS = this._generateCalloutCSS(theme);
            }

            // Generate complete HTML document with CSS
            const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Markdown</title>
    <style>
        ${this._generateCSS(theme)}
        ${calloutCSS}
    </style>
    ${katexCSS ? `<style>${katexCSS}</style>` : ''}
    ${this._getMermaidScript()}
    ${this.advancedMarkdownManager && this.advancedMarkdownManager.isFeatureEnabled('katex') ? '<script src="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.js"></script>' : ''}
    ${this.advancedMarkdownManager && this.advancedMarkdownManager.isFeatureEnabled('katex') ? `<script>
        document.addEventListener('DOMContentLoaded', function() {
            // Render inline math
            document.querySelectorAll('.katex-inline').forEach(function(element) {
                const latex = element.getAttribute('data-katex');
                if (latex) {
                    try {
                        katex.render(latex, element, { throwOnError: false, displayMode: false });
                    } catch (e) {
                        element.textContent = '$' + latex + '$';
                    }
                }
            });
            
            // Render block math
            document.querySelectorAll('.katex-block').forEach(function(element) {
                const latex = element.getAttribute('data-katex');
                if (latex) {
                    try {
                        katex.render(latex, element, { throwOnError: false, displayMode: true });
                    } catch (e) {
                        element.textContent = '$$' + latex + '$$';
                    }
                }
            });
        });
    </script>` : ''}
</head>
<body>
    ${htmlContent}
</body>
</html>`;

            // Show save dialog
            const result = await dialog.showSaveDialog(window, {
                title: 'Export to HTML',
                defaultPath: 'document.html',
                filters: [
                    { name: 'HTML Files', extensions: ['html', 'htm'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            // User cancelled the dialog
            if (result.canceled || !result.filePath) {
                return null;
            }

            const filePath = result.filePath;

            // Write HTML file
            await fs.writeFile(filePath, fullHTML, 'utf-8');

            return filePath;
        } catch (error) {
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                throw new Error(`Permission denied: Cannot write to file`);
            } else if (error.code === 'ENOSPC') {
                throw new Error(`Disk full: Cannot export file`);
            } else {
                throw new Error(`Failed to export HTML: ${error.message}`);
            }
        }
    }

    /**
     * Exports markdown content to PDF using Electron's printToPDF API
     * @param {string} content - Markdown content to export
     * @param {string} theme - Theme to use ('light' or 'dark')
     * @returns {Promise<string>} Path to the exported PDF file
     * @throws {Error} If export fails
     */
    async exportToPDF(content, theme = 'light') {
        const window = this.windowManager.getMainWindow();

        if (!window) {
            throw new Error('No window available for dialog');
        }

        try {
            // Pre-process markdown to fix table formatting issues
            const cleanedContent = this._preprocessMarkdown(content);

            // Render markdown to HTML
            const htmlContent = this.md.render(cleanedContent);

            // Get KaTeX CSS if KaTeX is enabled
            let katexCSS = '';

            if (this.advancedMarkdownManager && this.advancedMarkdownManager.isFeatureEnabled('katex')) {
                katexCSS = await this._getKatexCSS();
            }

            // Get callout CSS if callouts are enabled
            let calloutCSS = '';

            if (this.advancedMarkdownManager && this.advancedMarkdownManager.isFeatureEnabled('callouts')) {
                calloutCSS = this._generateCalloutCSS(theme);
            }

            // Generate complete HTML document with CSS
            const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Markdown</title>
    <style>
        ${this._generateCSS(theme)}
        ${calloutCSS}
    </style>
    ${katexCSS ? `<style>${katexCSS}</style>` : ''}
    ${this._getMermaidScript()}
    ${this.advancedMarkdownManager && this.advancedMarkdownManager.isFeatureEnabled('katex') ? '<script src="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.js"></script>' : ''}
    ${this.advancedMarkdownManager && this.advancedMarkdownManager.isFeatureEnabled('katex') ? `<script>
        document.addEventListener('DOMContentLoaded', function() {
            // Render inline math
            document.querySelectorAll('.katex-inline').forEach(function(element) {
                const latex = element.getAttribute('data-katex');
                if (latex) {
                    try {
                        katex.render(latex, element, { throwOnError: false, displayMode: false });
                    } catch (e) {
                        element.textContent = '$' + latex + '$';
                    }
                }
            });
            
            // Render block math
            document.querySelectorAll('.katex-block').forEach(function(element) {
                const latex = element.getAttribute('data-katex');
                if (latex) {
                    try {
                        katex.render(latex, element, { throwOnError: false, displayMode: true });
                    } catch (e) {
                        element.textContent = '$$' + latex + '$$';
                    }
                }
            });
        });
    </script>` : ''}
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('table').forEach(function(table) {
                var wrapper = document.createElement('div');
                wrapper.className = 'table-wrapper';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
                var cols = table.querySelectorAll('thead th, thead td');
                if (cols.length >= 6) {
                    table.style.fontSize = '0.75em';
                } else if (cols.length >= 4) {
                    table.style.fontSize = '0.85em';
                }
            });
        });
    </script>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

            // Show save dialog
            const result = await dialog.showSaveDialog(window, {
                title: 'Export to PDF',
                defaultPath: 'document.pdf',
                filters: [
                    { name: 'PDF Files', extensions: ['pdf'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            // User cancelled the dialog
            if (result.canceled || !result.filePath) {
                return null;
            }

            const filePath = result.filePath;

            // Create a hidden window for PDF generation
            const pdfWindow = new BrowserWindow({
                show: false,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    sandbox: false
                }
            });

            // Load HTML content
            await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHTML)}`);

            // Wait for content to be ready (longer wait for Mermaid and KaTeX rendering)
            const hasMermaid = this.advancedMarkdownManager && this.advancedMarkdownManager.isFeatureEnabled('mermaid');
            const hasKatex = this.advancedMarkdownManager && this.advancedMarkdownManager.isFeatureEnabled('katex');
            const waitTime = hasMermaid ? 3000 : (hasKatex ? 2000 : 500);

            await new Promise(resolve => {
                setTimeout(resolve, waitTime);
            });

            // Generate PDF
            const pdfData = await pdfWindow.webContents.printToPDF({
                printBackground: true,
                preferCSSPageSize: true,
                margins: {
                    top: 0.5,
                    bottom: 0.5,
                    left: 0.5,
                    right: 0.5
                },
                pageSize: 'A4'
            });

            // Close the hidden window
            pdfWindow.close();

            // Write PDF file
            await fs.writeFile(filePath, pdfData);

            return filePath;
        } catch (error) {
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                throw new Error(`Permission denied: Cannot write to file`);
            } else if (error.code === 'ENOSPC') {
                throw new Error(`Disk full: Cannot export file`);
            } else {
                throw new Error(`Failed to export PDF: ${error.message}`);
            }
        }
    }

    /**
     * Cleanup method to release resources
     * Exporter doesn't hold persistent resources (no timers, event listeners, or file handles).
     * The markdown-it instance and window manager reference don't require explicit cleanup.
     * This method is provided for consistency with the component pattern.
     */
    // eslint-disable-next-line custom/component-resource-cleanup
    cleanup() {
        // No persistent resources to clean up
        // - markdown-it instance is garbage collected
        // - windowManager reference is managed externally
        // - advancedMarkdownManager reference is managed externally
    }
}

module.exports = Exporter;
