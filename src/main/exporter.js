/**
 * Exporter - HTML and PDF Export Manager
 * Handles exporting markdown documents to HTML and PDF formats
 * Requirements: 5.1, 5.2, 5.3
 */

const { dialog, BrowserWindow } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const markdownit = require('markdown-it');
const markdownitTaskLists = require('markdown-it-task-lists');
const hljs = require('highlight.js');

/**
 * Exporter class manages document export operations
 * Provides methods for exporting to HTML and PDF formats
 */
class Exporter {
    constructor(windowManager) {
        this.windowManager = windowManager;

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

            // Generate complete HTML document with CSS
            const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Markdown</title>
    <style>
        ${this._generateCSS(theme)}
    </style>
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

            // Generate complete HTML document with CSS
            const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Markdown</title>
    <style>
        ${this._generateCSS(theme)}
    </style>
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
                    nodeIntegration: false,
                    contextIsolation: true,
                    sandbox: true
                }
            });

            // Load HTML content
            await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHTML)}`);

            // Wait for content to be ready
            await new Promise(resolve => setTimeout(resolve, 500));

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
}

module.exports = Exporter;
