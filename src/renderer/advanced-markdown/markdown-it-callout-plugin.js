/**
 * markdown-it plugin for Callout blocks (admonitions)
 *
 * This plugin detects blockquotes with callout syntax (> [!TYPE])
 * and generates styled divs with appropriate classes and content.
 *
 * Supported callout types: NOTE, WARNING, TIP, IMPORTANT, CAUTION
 */

/**
 * Callout type configurations
 */
const CALLOUT_TYPES = {
    NOTE: {
        icon: 'ℹ️',
        title: 'Note',
        className: 'callout-note'
    },
    WARNING: {
        icon: '⚠️',
        title: 'Warning',
        className: 'callout-warning'
    },
    TIP: {
        icon: '💡',
        title: 'Tip',
        className: 'callout-tip'
    },
    IMPORTANT: {
        icon: '❗',
        title: 'Important',
        className: 'callout-important'
    },
    CAUTION: {
        icon: '🔥',
        title: 'Caution',
        className: 'callout-caution'
    }
};

/**
 * Checks if a line starts with a callout identifier
 * @param {string} line - The line to check
 * @returns {object|null} Object with type and title, or null if not a callout
 */
function parseCalloutIdentifier(line) {
    // Match pattern: [!TYPE] or [!TYPE](custom title)
    const match = line.match(/^\[!([A-Z]+)\](?:\s*\(([^)]+)\))?/);

    if (!match) {
        return null;
    }

    const type = match[1].toUpperCase();
    const customTitle = match[2];

    // Check if this is a valid callout type
    if (!CALLOUT_TYPES[type]) {
        // Unknown type, default to NOTE
        return {
            type: 'NOTE',
            title: customTitle || CALLOUT_TYPES.NOTE.title,
            config: CALLOUT_TYPES.NOTE
        };
    }

    return {
        type: type,
        title: customTitle || CALLOUT_TYPES[type].title,
        config: CALLOUT_TYPES[type]
    };
}

/**
 * Callout block rule
 */
function calloutBlock(state, startLine, endLine, silent) {
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    // Check if line starts with >
    if (state.src.charCodeAt(pos) !== 0x3E /* > */) {
        return false;
    }

    // Skip the >
    pos++;

    // Skip optional space after >
    if (state.src.charCodeAt(pos) === 0x20) {
        pos++;
    }

    // Get the rest of the line
    const firstLineContent = state.src.slice(pos, max).trim();

    // Check if this is a callout identifier
    const calloutInfo = parseCalloutIdentifier(firstLineContent);

    if (!calloutInfo) {
        // Not a callout, let the default blockquote handler deal with it
        return false;
    }

    // This is a callout block
    if (silent) {
        return true;
    }

    // Collect all lines that are part of this blockquote
    const oldLineMax = state.lineMax;
    let nextLine = startLine + 1;
    const contentLines = [];

    // Skip the first line (it contains the callout identifier)
    // Collect subsequent lines that are part of the blockquote
    while (nextLine < endLine) {
        pos = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];

        // Check if line starts with >
        if (pos < max && state.src.charCodeAt(pos) === 0x3E /* > */) {
            // Skip the >
            pos++;

            // Skip optional space after >
            if (pos < max && state.src.charCodeAt(pos) === 0x20) {
                pos++;
            }

            // Add the content of this line
            contentLines.push(state.src.slice(pos, max));
            nextLine++;
        } else {
            // Line doesn't start with >, end of blockquote
            break;
        }
    }

    // Parse the content as markdown
    const oldParent = state.parentType;
    const oldLineMax2 = state.lineMax;

    state.parentType = 'callout';

    // Create the callout token
    const token = state.push('callout_open', 'div', 1);

    token.markup = '>';
    token.map = [startLine, nextLine];
    token.info = calloutInfo;

    // Parse the content
    const content = contentLines.join('\n');

    if (content.trim()) {
        const oldSrc = state.src;

        state.src = content;
        state.md.block.parse(content, state.md, state.env, state.tokens);
        state.src = oldSrc;
    }

    // Close the callout
    const closeToken = state.push('callout_close', 'div', -1);

    closeToken.markup = '>';

    state.parentType = oldParent;
    state.lineMax = oldLineMax;
    state.line = nextLine;

    return true;
}

/**
 * markdown-it plugin for Callout blocks
 * @param {object} md - markdown-it instance
 */
function markdownItCallouts(md) {
    // Register callout rule before blockquote
    md.block.ruler.before('blockquote', 'callout', calloutBlock);

    // Renderer for callout open tag
    md.renderer.rules.callout_open = function (tokens, idx) {
        const token = tokens[idx];
        const calloutInfo = token.info;
        const config = calloutInfo.config;

        return '<div class="callout ' + config.className + '">\n' +
            '<div class="callout-title">' +
            '<span class="callout-icon">' + config.icon + '</span>' +
            '<span class="callout-title-text">' + calloutInfo.title + '</span>' +
            '</div>\n' +
            '<div class="callout-content">\n';
    };

    // Renderer for callout close tag
    md.renderer.rules.callout_close = function () {
        return '</div>\n</div>\n';
    };
}

module.exports = markdownItCallouts;
