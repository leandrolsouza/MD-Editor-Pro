const js = require('@eslint/js');
const customRules = require('./eslint-rules');

module.exports = [
    // Ignore patterns
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'build/**',
            'coverage/**',
            '**/*.min.js'
        ]
    },

    // Base configuration for all files
    {
        files: ['src/**/*.js'],
        plugins: {
            'custom': customRules
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                // Node.js globals
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                setImmediate: 'readonly',
                clearImmediate: 'readonly'
            }
        },
        rules: {
            ...js.configs.recommended.rules,

            // Error prevention
            'no-unused-vars': 'warn',
            'no-undef': 'error',
            'no-console': 'off', // Allowed for logging in Electron apps

            // Code quality rules (Requirement 1.2)
            'complexity': ['warn', 10],
            'max-depth': ['warn', 4],
            'max-lines-per-function': ['warn', 50],
            'max-params': ['warn', 4],
            'max-nested-callbacks': ['warn', 3],
            'max-statements': ['warn', 20],

            // Best practices rules (Requirement 1.2)
            'eqeqeq': ['error', 'always'],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-return-await': 'warn',
            'no-throw-literal': 'error',
            'prefer-promise-reject-errors': 'error',
            'no-var': 'warn',
            'prefer-const': 'warn',
            'no-shadow': 'warn',
            'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],

            // Async/await rules (Requirement 1.2)
            'require-await': 'warn',
            'no-async-promise-executor': 'error',
            'no-await-in-loop': 'warn',
            'no-promise-executor-return': 'error',
            'prefer-promise-reject-errors': 'error',

            // CommonJS-specific rules (Requirement 1.2)
            'no-undef': 'error',
            'global-require': 'warn',
            'no-mixed-requires': 'warn',
            'no-new-require': 'error',
            'no-path-concat': 'error',

            // Custom error handling rules (Requirements 4.1, 4.2, 4.3, 4.4, 4.5)
            'custom/async-error-handling': 'error',
            'custom/ipc-error-format': 'error',
            'custom/error-logging': 'warn',
            'custom/promise-rejection-handler': 'warn',

            // Code formatting rules (Requirements 2.1, 2.2, 2.3, 2.4, 2.5)
            // Indentation (Requirement 2.1)
            'indent': ['error', 4, {
                'SwitchCase': 1,
                'VariableDeclarator': 1,
                'outerIIFEBody': 1,
                'MemberExpression': 1,
                'FunctionDeclaration': { 'parameters': 1, 'body': 1 },
                'FunctionExpression': { 'parameters': 1, 'body': 1 },
                'CallExpression': { 'arguments': 1 },
                'ArrayExpression': 1,
                'ObjectExpression': 1,
                'ImportDeclaration': 1,
                'flatTernaryExpressions': false,
                'ignoreComments': false
            }],

            // Quote style (Requirement 2.2)
            'quotes': ['error', 'single', {
                'avoidEscape': true,
                'allowTemplateLiterals': true
            }],

            // Semicolons (Requirement 2.3)
            'semi': ['error', 'always'],
            'semi-spacing': ['error', { 'before': false, 'after': true }],
            'semi-style': ['error', 'last'],
            'no-extra-semi': 'error',
            'no-unexpected-multiline': 'error',

            // Line length (Requirement 2.4)
            'max-len': ['warn', {
                'code': 120,
                'tabWidth': 4,
                'ignoreUrls': true,
                'ignoreStrings': true,
                'ignoreTemplateLiterals': true,
                'ignoreRegExpLiterals': true,
                'ignoreComments': false
            }],

            // Additional formatting rules for consistency (Requirement 2.5 - auto-fixable)
            'comma-dangle': ['error', 'never'],
            'comma-spacing': ['error', { 'before': false, 'after': true }],
            'comma-style': ['error', 'last'],
            'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            'space-before-blocks': ['error', 'always'],
            'space-before-function-paren': ['error', {
                'anonymous': 'always',
                'named': 'never',
                'asyncArrow': 'always'
            }],
            'space-in-parens': ['error', 'never'],
            'space-infix-ops': 'error',
            'space-unary-ops': ['error', { 'words': true, 'nonwords': false }],
            'keyword-spacing': ['error', { 'before': true, 'after': true }],
            'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
            'arrow-spacing': ['error', { 'before': true, 'after': true }],
            'no-trailing-spaces': 'error',
            'no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 1, 'maxBOF': 0 }],
            'eol-last': ['error', 'always'],
            'linebreak-style': ['error', 'windows'], // Windows CRLF line endings
            'no-mixed-spaces-and-tabs': 'error',
            'block-spacing': ['error', 'always'],
            'computed-property-spacing': ['error', 'never'],
            'func-call-spacing': ['error', 'never'],
            'template-curly-spacing': ['error', 'never'],
            'template-tag-spacing': ['error', 'never'],
            'rest-spread-spacing': ['error', 'never'],
            'generator-star-spacing': ['error', { 'before': false, 'after': true }],
            'yield-star-spacing': ['error', { 'before': false, 'after': true }],
            'object-property-newline': ['error', { 'allowAllPropertiesOnSameLine': true }],
            'array-bracket-newline': ['error', 'consistent'],
            'array-element-newline': ['error', 'consistent'],
            'function-paren-newline': ['error', 'consistent'],
            'newline-per-chained-call': ['error', { 'ignoreChainWithDepth': 3 }],
            'padding-line-between-statements': [
                'error',
                { 'blankLine': 'always', 'prev': ['const', 'let', 'var'], 'next': '*' },
                { 'blankLine': 'any', 'prev': ['const', 'let', 'var'], 'next': ['const', 'let', 'var'] },
                { 'blankLine': 'always', 'prev': 'directive', 'next': '*' },
                { 'blankLine': 'any', 'prev': 'directive', 'next': 'directive' }
            ]
        }
    },

    // Main process - Node.js environment only
    {
        files: ['src/main/**/*.js'],
        languageOptions: {
            globals: {
                // Additional Node.js globals for main process
                global: 'readonly'
            }
        }
    },

    // Preload scripts - Node.js environment only
    {
        files: ['src/preload/**/*.js'],
        languageOptions: {
            globals: {
                // Preload has access to both Node and some browser APIs
                window: 'readonly',
                document: 'readonly'
            }
        }
    },

    // Renderer process - Browser environment with CommonJS
    {
        files: ['src/renderer/**/*.js'],
        languageOptions: {
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                HTMLElement: 'readonly',
                Element: 'readonly',
                Node: 'readonly',
                NodeList: 'readonly',
                Event: 'readonly',
                CustomEvent: 'readonly',
                MouseEvent: 'readonly',
                KeyboardEvent: 'readonly',
                DOMParser: 'readonly',
                MutationObserver: 'readonly',
                IntersectionObserver: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                FileReader: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                prompt: 'readonly',

                // Electron API exposed via preload
                electronAPI: 'readonly',

                // CommonJS is used in renderer for module bundling
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                process: 'readonly'
            }
        },
        rules: {
            // Renderer should not use Node.js APIs directly (but can use require for bundling)
            'no-undef': 'error'
        }
    },

    // Test files - Allow test globals and ES modules
    {
        files: ['**/*.test.js', '**/*.spec.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module', // Test files use ES modules
            globals: {
                // Vitest globals
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                vi: 'readonly',
                test: 'readonly',

                // Node.js globals for tests
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                global: 'readonly',

                // Browser globals for renderer tests
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                HTMLElement: 'readonly',
                Element: 'readonly',
                Node: 'readonly',
                NodeList: 'readonly',
                Event: 'readonly',
                CustomEvent: 'readonly',
                MouseEvent: 'readonly',
                KeyboardEvent: 'readonly',
                DOMParser: 'readonly',
                MutationObserver: 'readonly',
                IntersectionObserver: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                FileReader: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                prompt: 'readonly',

                // Electron API for tests
                electronAPI: 'readonly'
            }
        }
    }
];
