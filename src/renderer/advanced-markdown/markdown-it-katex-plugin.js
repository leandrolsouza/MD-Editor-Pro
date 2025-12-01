/**
 * markdown-it plugin for KaTeX mathematical formulas
 *
 * This plugin detects inline math ($...$) and display math ($$...$$) delimiters
 * and generates placeholder elements that will be processed by the KaTeX library
 * in the post-processing step.
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

/**
 * Checks if a character is escaped (preceded by backslash)
 * @param {string} str - The string
 * @param {number} pos - Position to check
 * @returns {boolean} True if the character is escaped
 */
function isEscaped(str, pos) {
    if (pos === 0) return false;

    let backslashCount = 0;
    let i = pos - 1;

    while (i >= 0 && str[i] === '\\') {
        backslashCount++;
        i--;
    }

    // If odd number of backslashes, the character is escaped
    return backslashCount % 2 === 1;
}

/**
 * Inline math rule for $...$ syntax
 */
function mathInline(state, silent) {
    const start = state.pos;
    const max = state.posMax;

    // Check if we're at a $ character
    if (state.src.charCodeAt(start) !== 0x24 /* $ */) {
        return false;
    }

    // Check if this $ is escaped
    if (isEscaped(state.src, start)) {
        return false;
    }

    // Check for $$ (display math) - we don't handle that here
    if (start + 1 < max && state.src.charCodeAt(start + 1) === 0x24) {
        return false;
    }

    // Find the closing $
    let pos = start + 1;
    let foundClosing = false;

    while (pos < max) {
        if (state.src.charCodeAt(pos) === 0x24 /* $ */) {
            // Check if this $ is escaped
            if (!isEscaped(state.src, pos)) {
                foundClosing = true;
                break;
            }
        }
        pos++;
    }

    // No closing delimiter found
    if (!foundClosing) {
        return false;
    }

    // Extract the math content
    const content = state.src.slice(start + 1, pos);

    // Empty content is not valid
    if (!content.trim()) {
        return false;
    }

    if (!silent) {
        const token = state.push('math_inline', 'math', 0);

        token.content = content;
        token.markup = '$';
    }

    state.pos = pos + 1;
    return true;
}

/**
 * Block math rule for $$...$$ syntax
 */
function mathBlock(state, startLine, endLine, silent) {
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    // Check if line starts with $$
    if (pos + 2 > max) {
        return false;
    }

    if (state.src.charCodeAt(pos) !== 0x24 /* $ */ ||
        state.src.charCodeAt(pos + 1) !== 0x24 /* $ */) {
        return false;
    }

    pos += 2;

    // Check if there's content on the same line after $$
    const firstLineContent = state.src.slice(pos, max).trim();

    // Find the closing $$
    let nextLine = startLine;
    let foundClosing = false;
    let closingLine = -1;
    let closingPos = -1;

    // If there's content on the first line, check if it ends with $$
    if (firstLineContent) {
        const closingIndex = state.src.indexOf('$$', pos);

        if (closingIndex !== -1 && closingIndex < max) {
            foundClosing = true;
            closingLine = startLine;
            closingPos = closingIndex;
        }
    }

    // Search for closing $$ on subsequent lines
    if (!foundClosing) {
        for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
            pos = state.bMarks[nextLine] + state.tShift[nextLine];
            max = state.eMarks[nextLine];

            const lineContent = state.src.slice(pos, max);
            const closingIndex = lineContent.indexOf('$$');

            if (closingIndex !== -1) {
                foundClosing = true;
                closingLine = nextLine;
                closingPos = pos + closingIndex;
                break;
            }
        }
    }

    if (!foundClosing) {
        return false;
    }

    // Extract content between opening and closing $$
    const startPos = state.bMarks[startLine] + state.tShift[startLine] + 2;
    const endPos = closingPos;
    const content = state.src.slice(startPos, endPos).trim();

    if (!silent) {
        const token = state.push('math_block', 'math', 0);

        token.content = content;
        token.markup = '$$';
        token.block = true;
        token.map = [startLine, closingLine + 1];
    }

    state.line = closingLine + 1;
    return true;
}

/**
 * markdown-it plugin for KaTeX math support
 * @param {object} md - markdown-it instance
 */
function markdownItKatex(md) {
    // Register inline math rule before 'escape' rule
    md.inline.ruler.before('escape', 'math_inline', mathInline);

    // Register block math rule before 'fence' rule
    md.block.ruler.before('fence', 'math_block', mathBlock, {
        alt: ['paragraph', 'reference', 'blockquote', 'list']
    });

    // Renderer for inline math
    md.renderer.rules.math_inline = function (tokens, idx) {
        const content = tokens[idx].content;

        return '<span class="katex-inline" data-katex="' + escapeHtml(content) + '"></span>';
    };

    // Renderer for block math
    md.renderer.rules.math_block = function (tokens, idx) {
        const content = tokens[idx].content;

        return '<div class="katex-block" data-katex="' + escapeHtml(content) + '" data-display="true"></div>\n';
    };
}

module.exports = markdownItKatex;
