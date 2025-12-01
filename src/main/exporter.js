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
     * @param {string} theme - Theme to use ('light' or 'dark')
     * @returns {string} Callout CSS styles
     * @private
     */
    _generateCalloutCSS(theme = 'light') {
        const isDark = theme === 'dark';

        // Define colors based on theme
        const colors = isDark ? {
            note: { border: '#58a6ff', bg: '#1c2d41', title: '#58a6ff' },
            warning: { border: '#d29922', bg: '#3d3000', title: '#d29922' },
            tip: { border: '#3fb950', bg: '#0f3d1a', title: '#3fb950' },
            important: { border: '#a371f7', bg: '#2b1f3d', title: '#a371f7' },
            caution: { border: '#f85149', bg: '#4a1a1f', title: '#f85149' }
        } : {
            note: { border: '#0969da', bg: '#ddf4ff', title: '#0969da' },
            warning: { border: '#9a6700', bg: '#fff8c5', title: '#9a6700' },
            tip: { border: '#1a7f37', bg: '#dafbe1', title: '#1a7f37' },
            important: { border: '#8250df', bg: '#fbefff', title: '#8250df' },
            caution: { border: '#cf222e', bg: '#ffebe9', title: '#cf222e' }
        };

        return `
            /* Callout Blocks Styling */
            .callout {
                margin: 16px 0;
                padding: 16px;
                border-left: 4px solid;
                border-radius: 4px;
            }

            .callout-title {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .callout-icon {
                font-size: 16px;
            }

            .callout-content {
                font-size: 14px;
                line-height: 1.6;
            }

            .callout-content > *:first-child {
                margin-top: 0;
            }

            .callout-content > *:last-child {
                margin-bottom: 0;
            }

            /* NOTE callout */
            .callout-note {
                border-left-color: ${colors.note.border};
                background-color: ${colors.note.bg};
            }

            .callout-note .callout-title {
                color: ${colors.note.title};
            }

            /* WARNING callout */
            .callout-warning {
                border-left-color: ${colors.warning.border};
                background-color: ${colors.warning.bg};
            }

            .callout-warning .callout-title {
                color: ${colors.warning.title};
            }

            /* TIP callout */
            .callout-tip {
                border-left-color: ${colors.tip.border};
                background-color: ${colors.tip.bg};
            }

            .callout-tip .callout-title {
                color: ${colors.tip.title};
            }

            /* IMPORTANT callout */
            .callout-important {
                border-left-color: ${colors.important.border};
                background-color: ${colors.important.bg};
            }

            .callout-important .callout-title {
                color: ${colors.important.title};
            }

            /* CAUTION callout */
            .callout-caution {
                border-left-color: ${colors.caution.border};
                background-color: ${colors.caution.bg};
            }

            .callout-caution .callout-title {
                color: ${colors.caution.title};
            }

            /* Mermaid diagram styling */
            .mermaid-diagram {
                margin: 16px 0;
                text-align: center;
            }

            .mermaid-diagram svg {
                max-width: 100%;
                height: auto;
            }

            .mermaid-error {
                color: #cf222e;
                background-color: ${isDark ? '#4a1a1f' : '#ffebe9'};
                padding: 12px;
                border-radius: 4px;
                border-left: 4px solid #cf222e;
            }

            .mermaid-error strong {
                display: block;
                margin-bottom: 8px;
            }

            .mermaid-error pre {
                margin: 0;
                background-color: transparent;
                padding: 0;
                font-size: 12px;
            }
        `;
    }

    /**
     * Generates CSS styles for HTML export
     * @param {string} theme - Theme to use ('light' or 'dark')
     * @returns {string} CSS styles
     */
    _generateCSS(theme = 'light') {
        const isDark = theme === 'dark';

        return `
            * {
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 2rem;
                background-color: ${isDark ? '#1e1e1e' : '#ffffff'};
                color: ${isDark ? '#d4d4d4' : '#333333'};
            }
            
            h1, h2, h3, h4, h5, h6 {
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                font-weight: 600;
                line-height: 1.25;
                color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
            }
            
            h1 { font-size: 2em; border-bottom: 1px solid ${isDark ? '#404040' : '#e0e0e0'}; padding-bottom: 0.3em; }
            h2 { font-size: 1.5em; border-bottom: 1px solid ${isDark ? '#404040' : '#e0e0e0'}; padding-bottom: 0.3em; }
            h3 { font-size: 1.25em; }
            h4 { font-size: 1em; }
            h5 { font-size: 0.875em; }
            h6 { font-size: 0.85em; color: ${isDark ? '#999999' : '#6a737d'}; }
            
            p {
                margin-top: 0;
                margin-bottom: 1em;
            }
            
            a {
                color: ${isDark ? '#4a9eff' : '#0366d6'};
                text-decoration: none;
            }
            
            a:hover {
                text-decoration: underline;
            }
            
            code {
                background-color: ${isDark ? '#2d2d2d' : '#f6f8fa'};
                color: ${isDark ? '#e06c75' : '#e83e8c'};
                padding: 0.2em 0.4em;
                border-radius: 3px;
                font-family: 'Courier New', Courier, monospace;
                font-size: 0.9em;
            }
            
            pre {
                background-color: ${isDark ? '#2d2d2d' : '#f6f8fa'};
                border-radius: 6px;
                padding: 1em;
                overflow-x: auto;
                line-height: 1.45;
            }
            
            pre code {
                background-color: transparent;
                color: ${isDark ? '#d4d4d4' : '#333333'};
                padding: 0;
                font-size: 0.875em;
            }
            
            blockquote {
                margin: 0;
                padding: 0 1em;
                color: ${isDark ? '#999999' : '#6a737d'};
                border-left: 0.25em solid ${isDark ? '#404040' : '#dfe2e5'};
            }
            
            ul, ol {
                padding-left: 2em;
                margin-top: 0;
                margin-bottom: 1em;
            }
            
            li {
                margin-bottom: 0.25em;
            }
            
            table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 1em;
            }
            
            table th,
            table td {
                padding: 6px 13px;
                border: 1px solid ${isDark ? '#404040' : '#dfe2e5'};
            }
            
            table th {
                font-weight: 600;
                background-color: ${isDark ? '#2d2d2d' : '#f6f8fa'};
            }
            
            table tr {
                background-color: ${isDark ? '#1e1e1e' : '#ffffff'};
            }
            
            table tr:nth-child(2n) {
                background-color: ${isDark ? '#252525' : '#f6f8fa'};
            }
            
            img {
                max-width: 100%;
                height: auto;
            }
            
            hr {
                height: 0.25em;
                padding: 0;
                margin: 1.5em 0;
                background-color: ${isDark ? '#404040' : '#e1e4e8'};
                border: 0;
            }
            
            /* Task list styles */
            .task-list-item {
                list-style-type: none;
            }
            
            .task-list-item input[type="checkbox"] {
                margin-right: 0.5em;
            }
            
            /* Syntax highlighting */
            .hljs {
                display: block;
                overflow-x: auto;
                padding: 0.5em;
                background: ${isDark ? '#2d2d2d' : '#f6f8fa'};
            }
            
            .hljs-comment,
            .hljs-quote {
                color: ${isDark ? '#5c6370' : '#6a737d'};
                font-style: italic;
            }
            
            .hljs-keyword,
            .hljs-selector-tag,
            .hljs-subst {
                color: ${isDark ? '#c678dd' : '#d73a49'};
            }
            
            .hljs-number,
            .hljs-literal,
            .hljs-variable,
            .hljs-template-variable,
            .hljs-tag .hljs-attr {
                color: ${isDark ? '#d19a66' : '#005cc5'};
            }
            
            .hljs-string,
            .hljs-doctag {
                color: ${isDark ? '#98c379' : '#032f62'};
            }
            
            .hljs-title,
            .hljs-section,
            .hljs-selector-id {
                color: ${isDark ? '#e06c75' : '#6f42c1'};
                font-weight: bold;
            }
            
            .hljs-type,
            .hljs-class .hljs-title {
                color: ${isDark ? '#e5c07b' : '#6f42c1'};
            }
            
            .hljs-tag,
            .hljs-name,
            .hljs-attribute {
                color: ${isDark ? '#61afef' : '#22863a'};
            }
            
            .hljs-regexp,
            .hljs-link {
                color: ${isDark ? '#56b6c2' : '#032f62'};
            }
            
            .hljs-symbol,
            .hljs-bullet {
                color: ${isDark ? '#61afef' : '#005cc5'};
            }
            
            .hljs-built_in,
            .hljs-builtin-name {
                color: ${isDark ? '#e06c75' : '#d73a49'};
            }
            
            .hljs-meta {
                color: ${isDark ? '#abb2bf' : '#6a737d'};
            }
            
            .hljs-deletion {
                background: ${isDark ? '#5c2626' : '#ffeef0'};
            }
            
            .hljs-addition {
                background: ${isDark ? '#2c5a2c' : '#e6ffed'};
            }
            
            .hljs-emphasis {
                font-style: italic;
            }
            
            .hljs-strong {
                font-weight: bold;
            }
        `;
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
            // Render markdown to HTML
            const htmlContent = this.md.render(content);

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
            // Render markdown to HTML
            const htmlContent = this.md.render(content);

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
