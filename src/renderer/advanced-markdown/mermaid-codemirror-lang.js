/**
 * Mermaid language support for CodeMirror 6
 * Provides syntax highlighting for Mermaid diagram syntax
 */

const { StreamLanguage } = require('@codemirror/language');

/**
 * Mermaid diagram keywords and identifiers
 */
const DIAGRAM_TYPES = [
    'graph',
    'flowchart',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'stateDiagram-v2',
    'erDiagram',
    'journey',
    'gantt',
    'pie',
    'quadrantChart',
    'gitGraph',
    'mindmap',
    'timeline',
    'zenuml',
    'sankey-beta'
];

const GRAPH_DIRECTIONS = ['TB', 'TD', 'BT', 'RL', 'LR'];

const SEQUENCE_KEYWORDS = [
    'participant',
    'actor',
    'activate',
    'deactivate',
    'note',
    'over',
    'loop',
    'alt',
    'else',
    'opt',
    'par',
    'and',
    'rect',
    'end',
    'autonumber',
    'left of',
    'right of',
    'links',
    'link',
    'properties'
];

const CLASS_KEYWORDS = [
    'class',
    'namespace',
    'direction',
    'note',
    'link',
    'callback',
    'click',
    'cssClass',
    '<<interface>>',
    '<<abstract>>',
    '<<service>>',
    '<<enumeration>>'
];

const STATE_KEYWORDS = [
    'state', 'note', 'direction', 'fork', 'join', 'choice', 'concurrent'
];

const ER_KEYWORDS = [
    'one or more', 'one or zero', 'zero or more', 'only one', 'zero or one'
];

const GANTT_KEYWORDS = [
    'title',
    'dateFormat',
    'axisFormat',
    'excludes',
    'todayMarker',
    'section',
    'done',
    'active',
    'crit',
    'milestone',
    'after'
];

const JOURNEY_KEYWORDS = ['title', 'section'];

const PIE_KEYWORDS = ['title', 'showData'];

const GIT_KEYWORDS = [
    'commit',
    'branch',
    'checkout',
    'merge',
    'cherry-pick',
    'reset',
    'revert',
    'tag',
    'push',
    'pull',
    'fetch'
];

// Connection operators for flowcharts and graphs
const CONNECTION_OPERATORS = [
    '--->',
    '-->',
    '-.->',  // Arrows
    '===>',
    '==>',
    '==>',   // Thick arrows
    '-.->',
    '..->',         // Dotted arrows
    '---',
    '--',
    '-.-',     // Lines
    '===',
    '==',            // Thick lines
    '...',
    '..',            // Dotted lines
    '-.-',
    '-.',
    '.-'       // Mixed
];

/**
 * Mermaid language tokenizer
 */
const mermaidLanguage = StreamLanguage.define({
    name: 'mermaid',

    startState() {
        return {
            inString: false,
            inComment: false,
            diagramType: null,
            stringDelimiter: null
        };
    },

    token(stream, state) {
        // Handle comments
        if (stream.match(/%%.*$/)) {
            return 'comment';
        }

        // Handle strings
        if (state.inString) {
            if (stream.match(state.stringDelimiter)) {
                state.inString = false;
                state.stringDelimiter = null;
                return 'string';
            }
            stream.next();
            return 'string';
        }

        // Check for string start
        if (stream.match(/["'`]/)) {
            state.inString = true;
            state.stringDelimiter = stream.current();
            return 'string';
        }

        // Skip whitespace
        if (stream.eatSpace()) {
            return null;
        }

        // Check for diagram type keywords (at start of line or after whitespace)
        for (const diagramType of DIAGRAM_TYPES) {
            if (stream.match(diagramType, false)) {
                stream.match(diagramType);
                state.diagramType = diagramType;
                return 'keyword';
            }
        }

        // Check for graph directions
        for (const direction of GRAPH_DIRECTIONS) {
            if (stream.match(direction, false)) {
                stream.match(direction);
                return 'keyword';
            }
        }

        // Check for connection operators (must check before other operators)
        for (const op of CONNECTION_OPERATORS) {
            if (stream.match(op, false)) {
                stream.match(op);
                return 'operator';
            }
        }

        // Check for sequence diagram keywords
        for (const keyword of SEQUENCE_KEYWORDS) {
            if (stream.match(keyword, false)) {
                const next = stream.string.charAt(stream.pos + keyword.length);

                if (!next || /\s/.test(next) || /[:[\]]/.test(next)) {
                    stream.match(keyword);
                    return 'keyword';
                }
            }
        }

        // Check for class diagram keywords
        for (const keyword of CLASS_KEYWORDS) {
            if (stream.match(keyword, false)) {
                const next = stream.string.charAt(stream.pos + keyword.length);

                if (!next || /\s/.test(next) || /[:[\]]/.test(next)) {
                    stream.match(keyword);
                    return 'keyword';
                }
            }
        }

        // Check for state diagram keywords
        for (const keyword of STATE_KEYWORDS) {
            if (stream.match(keyword, false)) {
                const next = stream.string.charAt(stream.pos + keyword.length);

                if (!next || /\s/.test(next) || /[:[\]]/.test(next)) {
                    stream.match(keyword);
                    return 'keyword';
                }
            }
        }

        // Check for ER diagram keywords
        for (const keyword of ER_KEYWORDS) {
            if (stream.match(keyword, false)) {
                stream.match(keyword);
                return 'keyword';
            }
        }

        // Check for Gantt keywords
        for (const keyword of GANTT_KEYWORDS) {
            if (stream.match(keyword, false)) {
                const next = stream.string.charAt(stream.pos + keyword.length);

                if (!next || /\s/.test(next) || /[:[\]]/.test(next)) {
                    stream.match(keyword);
                    return 'keyword';
                }
            }
        }

        // Check for journey keywords
        for (const keyword of JOURNEY_KEYWORDS) {
            if (stream.match(keyword, false)) {
                const next = stream.string.charAt(stream.pos + keyword.length);

                if (!next || /\s/.test(next) || /[:[\]]/.test(next)) {
                    stream.match(keyword);
                    return 'keyword';
                }
            }
        }

        // Check for pie keywords
        for (const keyword of PIE_KEYWORDS) {
            if (stream.match(keyword, false)) {
                const next = stream.string.charAt(stream.pos + keyword.length);

                if (!next || /\s/.test(next) || /[:[\]]/.test(next)) {
                    stream.match(keyword);
                    return 'keyword';
                }
            }
        }

        // Check for git keywords
        for (const keyword of GIT_KEYWORDS) {
            if (stream.match(keyword, false)) {
                const next = stream.string.charAt(stream.pos + keyword.length);

                if (!next || /\s/.test(next) || /[:[\]]/.test(next)) {
                    stream.match(keyword);
                    return 'keyword';
                }
            }
        }

        // Check for special characters and operators
        if (stream.match(/[|{}()[\]<>]/)) {
            return 'bracket';
        }

        if (stream.match(/[:;,]/)) {
            return 'punctuation';
        }

        // Check for node identifiers (alphanumeric with underscores and hyphens)
        if (stream.match(/[A-Za-z_][A-Za-z0-9_-]*/)) {
            return 'variableName';
        }

        // Check for numbers
        if (stream.match(/\d+/)) {
            return 'number';
        }

        // Default: consume one character
        stream.next();
        return null;
    },

    languageData: {
        commentTokens: { line: '%%' }
    }
});

/**
 * Create Mermaid language support for CodeMirror
 * @returns {LanguageSupport} Language support extension
 */
function mermaid() {
    return mermaidLanguage;
}

module.exports = { mermaid, mermaidLanguage };
