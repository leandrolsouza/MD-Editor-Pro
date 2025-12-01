/**
 * Custom ESLint Rule: renderer-node-api
 * Validates: Requirements 5.3 - Verify no direct Node.js API usage in renderer code
 * 
 * This rule checks that renderer process code does not directly use Node.js APIs.
 * All Node.js functionality should be accessed through the electronAPI interface.
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Prevent direct Node.js API usage in renderer process',
            category: 'Electron Security',
            recommended: true
        },
        messages: {
            noNodeGlobal: 'Do not use Node.js global "{{global}}" in renderer process. Use electronAPI interface instead',
            noNodeModule: 'Do not use Node.js built-in module "{{module}}" in renderer process. Use electronAPI interface instead'
        },
        schema: []
    },

    create(context) {
        const filename = context.getFilename();

        // Only apply this rule to renderer scripts (not main or preload)
        if (!filename.includes('renderer') || filename.includes('.test.')) {
            return {};
        }

        // Common Node.js globals that should not be used in renderer
        const nodeGlobals = [
            'process',
            '__dirname',
            '__filename',
            'Buffer',
            'global',
            'setImmediate',
            'clearImmediate'
        ];

        // Common Node.js modules that should not be required in renderer
        const nodeModules = [
            'fs',
            'path',
            'os',
            'child_process',
            'crypto',
            'net',
            'http',
            'https',
            'stream',
            'util',
            'events',
            'electron'
        ];

        return {
            CallExpression(node) {
                // Check for require() calls
                if (node.callee.name === 'require') {
                    const arg = node.arguments[0];

                    if (arg && arg.type === 'Literal') {
                        const moduleName = arg.value;

                        // Check if it's a Node.js built-in module
                        if (nodeModules.includes(moduleName)) {
                            context.report({
                                node,
                                messageId: 'noNodeModule',
                                data: { module: moduleName }
                            });
                            return;
                        }

                        // Check for electron module
                        if (moduleName === 'electron') {
                            context.report({
                                node,
                                messageId: 'noNodeModule',
                                data: { module: moduleName }
                            });
                            return;
                        }
                    }

                    // Allow require() for local modules and npm packages
                    // Only flag Node.js built-ins and electron (handled above)
                }
            },

            Identifier(node) {
                // Check for Node.js global usage
                if (nodeGlobals.includes(node.name)) {
                    // Make sure it's not a declaration or property access
                    const parent = node.parent;

                    // Skip if it's being declared
                    if (parent.type === 'VariableDeclarator' && parent.id === node) {
                        return;
                    }

                    // Skip if it's a property name
                    if (parent.type === 'MemberExpression' && parent.property === node) {
                        return;
                    }

                    // Skip if it's a function parameter
                    if (parent.type === 'FunctionDeclaration' ||
                        parent.type === 'FunctionExpression' ||
                        parent.type === 'ArrowFunctionExpression') {
                        return;
                    }

                    context.report({
                        node,
                        messageId: 'noNodeGlobal',
                        data: { global: node.name }
                    });
                }
            }
        };
    }
};
