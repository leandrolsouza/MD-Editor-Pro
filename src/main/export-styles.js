/**
 * Export Styles - CSS generation for HTML/PDF export
 * Extracted from exporter.js to eliminate CSS duplication between themes.
 * Uses parameterized theme colors so light/dark share a single CSS template.
 * Requirements: 6.4
 */

/**
 * Theme color palettes for light and dark themes
 * @type {Object.<string, Object>}
 */
const THEME_COLORS = {
    light: {
        bg: '#ffffff',
        text: '#333333',
        heading: '#1a1a1a',
        border: '#e0e0e0',
        muted: '#6a737d',
        link: '#0366d6',
        codeBg: '#f6f8fa',
        codeText: '#e83e8c',
        preCodeText: '#333333',
        blockquoteBorder: '#dfe2e5',
        tableBorder: '#d0d7de',
        tableHeaderBg: '#f6f8fa',
        tableHeaderText: '#1f2328',
        tableRowBg: '#ffffff',
        tableRowAltBg: '#f6f8fa',
        hr: '#e1e4e8',
        hljsBg: '#f6f8fa',
        hljsComment: '#6a737d',
        hljsKeyword: '#d73a49',
        hljsNumber: '#005cc5',
        hljsString: '#032f62',
        hljsTitle: '#6f42c1',
        hljsType: '#6f42c1',
        hljsTag: '#22863a',
        hljsRegexp: '#032f62',
        hljsSymbol: '#005cc5',
        hljsBuiltin: '#d73a49',
        hljsMeta: '#6a737d',
        hljsDeletionBg: '#ffeef0',
        hljsAdditionBg: '#e6ffed',
        mermaidErrorBg: '#ffebe9',
        callout: {
            note: { border: '#0969da', bg: '#ddf4ff', title: '#0969da' },
            warning: { border: '#9a6700', bg: '#fff8c5', title: '#9a6700' },
            tip: { border: '#1a7f37', bg: '#dafbe1', title: '#1a7f37' },
            important: { border: '#8250df', bg: '#fbefff', title: '#8250df' },
            caution: { border: '#cf222e', bg: '#ffebe9', title: '#cf222e' }
        }
    },
    dark: {
        bg: '#1e1e1e',
        text: '#d4d4d4',
        heading: '#e0e0e0',
        border: '#404040',
        muted: '#999999',
        link: '#4a9eff',
        codeBg: '#2d2d2d',
        codeText: '#e06c75',
        preCodeText: '#d4d4d4',
        blockquoteBorder: '#404040',
        tableBorder: '#404040',
        tableHeaderBg: '#2d2d2d',
        tableHeaderText: '#e0e0e0',
        tableRowBg: '#1e1e1e',
        tableRowAltBg: '#252525',
        hr: '#404040',
        hljsBg: '#2d2d2d',
        hljsComment: '#5c6370',
        hljsKeyword: '#c678dd',
        hljsNumber: '#d19a66',
        hljsString: '#98c379',
        hljsTitle: '#e06c75',
        hljsType: '#e5c07b',
        hljsTag: '#61afef',
        hljsRegexp: '#56b6c2',
        hljsSymbol: '#61afef',
        hljsBuiltin: '#e06c75',
        hljsMeta: '#abb2bf',
        hljsDeletionBg: '#5c2626',
        hljsAdditionBg: '#2c5a2c',
        mermaidErrorBg: '#4a1a1f',
        callout: {
            note: { border: '#58a6ff', bg: '#1c2d41', title: '#58a6ff' },
            warning: { border: '#d29922', bg: '#3d3000', title: '#d29922' },
            tip: { border: '#3fb950', bg: '#0f3d1a', title: '#3fb950' },
            important: { border: '#a371f7', bg: '#2b1f3d', title: '#a371f7' },
            caution: { border: '#f85149', bg: '#4a1a1f', title: '#f85149' }
        }
    }
};

/**
 * Returns the color palette for a given theme
 * @param {string} theme - 'light' or 'dark'
 * @returns {Object} Color palette
 */
function getThemeColors(theme) {
    return THEME_COLORS[theme] || THEME_COLORS.light;
}

/**
 * Generates the main CSS styles for HTML/PDF export
 * @param {string} theme - Theme to use ('light' or 'dark')
 * @returns {string} CSS styles
 */
function generateCSS(theme = 'light') {
    const c = getThemeColors(theme);

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
                background-color: ${c.bg};
                color: ${c.text};
            }
            
            h1, h2, h3, h4, h5, h6 {
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                font-weight: 600;
                line-height: 1.25;
                color: ${c.heading};
            }
            
            h1 { font-size: 2em; border-bottom: 1px solid ${c.border}; padding-bottom: 0.3em; }
            h2 { font-size: 1.5em; border-bottom: 1px solid ${c.border}; padding-bottom: 0.3em; }
            h3 { font-size: 1.25em; }
            h4 { font-size: 1em; }
            h5 { font-size: 0.875em; }
            h6 { font-size: 0.85em; color: ${c.muted}; }
            
            p {
                margin-top: 0;
                margin-bottom: 1em;
            }
            
            a {
                color: ${c.link};
                text-decoration: none;
            }
            
            a:hover {
                text-decoration: underline;
            }
            
            code {
                background-color: ${c.codeBg};
                color: ${c.codeText};
                padding: 0.2em 0.4em;
                border-radius: 3px;
                font-family: 'Courier New', Courier, monospace;
                font-size: 0.9em;
            }
            
            pre {
                background-color: ${c.codeBg};
                border-radius: 6px;
                padding: 1em;
                overflow-x: auto;
                line-height: 1.45;
            }
            
            pre code {
                background-color: transparent;
                color: ${c.preCodeText};
                padding: 0;
                font-size: 0.875em;
            }
            
            blockquote {
                margin: 0;
                padding: 0 1em;
                color: ${c.muted};
                border-left: 0.25em solid ${c.blockquoteBorder};
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
                border-spacing: 0;
                width: 100%;
                margin: 1em 0;
                overflow: hidden;
                border-radius: 6px;
                border: 1px solid ${c.tableBorder};
                font-size: 0.875em;
                line-height: 1.5;
                display: table;
            }
            
            table thead {
                background-color: ${c.tableHeaderBg};
            }
            
            table th,
            table td {
                padding: 8px 16px;
                border: 1px solid ${c.tableBorder};
                text-align: left;
                vertical-align: top;
                word-wrap: break-word;
            }
            
            table th {
                font-weight: 600;
                background-color: ${c.tableHeaderBg};
                color: ${c.tableHeaderText};
                white-space: nowrap;
            }
            
            table tr {
                background-color: ${c.tableRowBg};
                border-top: 1px solid ${c.tableBorder};
            }
            
            table tr:nth-child(2n) {
                background-color: ${c.tableRowAltBg};
            }
            
            table td:first-child,
            table th:first-child {
                border-left: none;
            }
            
            table td:last-child,
            table th:last-child {
                border-right: none;
            }
            
            table thead tr:first-child th {
                border-top: none;
            }
            
            /* Ensure tables don't break across pages in PDF */
            @media print {
                table {
                    page-break-inside: auto;
                }
                table tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                table thead {
                    display: table-header-group;
                }
            }
            
            /* Responsive table wrapper for overflow */
            .table-wrapper {
                width: 100%;
                overflow-x: auto;
                margin: 1em 0;
            }
            
            .table-wrapper table {
                margin: 0;
            }
            
            img {
                max-width: 100%;
                height: auto;
            }
            
            hr {
                height: 0.25em;
                padding: 0;
                margin: 1.5em 0;
                background-color: ${c.hr};
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
                background: ${c.hljsBg};
            }
            
            .hljs-comment,
            .hljs-quote {
                color: ${c.hljsComment};
                font-style: italic;
            }
            
            .hljs-keyword,
            .hljs-selector-tag,
            .hljs-subst {
                color: ${c.hljsKeyword};
            }
            
            .hljs-number,
            .hljs-literal,
            .hljs-variable,
            .hljs-template-variable,
            .hljs-tag .hljs-attr {
                color: ${c.hljsNumber};
            }
            
            .hljs-string,
            .hljs-doctag {
                color: ${c.hljsString};
            }
            
            .hljs-title,
            .hljs-section,
            .hljs-selector-id {
                color: ${c.hljsTitle};
                font-weight: bold;
            }
            
            .hljs-type,
            .hljs-class .hljs-title {
                color: ${c.hljsType};
            }
            
            .hljs-tag,
            .hljs-name,
            .hljs-attribute {
                color: ${c.hljsTag};
            }
            
            .hljs-regexp,
            .hljs-link {
                color: ${c.hljsRegexp};
            }
            
            .hljs-symbol,
            .hljs-bullet {
                color: ${c.hljsSymbol};
            }
            
            .hljs-built_in,
            .hljs-builtin-name {
                color: ${c.hljsBuiltin};
            }
            
            .hljs-meta {
                color: ${c.hljsMeta};
            }
            
            .hljs-deletion {
                background: ${c.hljsDeletionBg};
            }
            
            .hljs-addition {
                background: ${c.hljsAdditionBg};
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
 * Generates callout CSS styles for HTML/PDF export
 * @param {string} theme - Theme to use ('light' or 'dark')
 * @returns {string} Callout CSS styles
 */
function generateCalloutCSS(theme = 'light') {
    const c = getThemeColors(theme);
    const colors = c.callout;

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
                background-color: ${c.mermaidErrorBg};
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

module.exports = { generateCSS, generateCalloutCSS, getThemeColors, THEME_COLORS };
