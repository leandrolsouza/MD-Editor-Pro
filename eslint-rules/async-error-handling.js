/**
 * Custom ESLint Rule: async-error-handling
 * Validates: Requirements 4.1 - Verify all async operations have try-catch blocks
 * 
 * This rule checks that async functions contain try-catch blocks for error handling.
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require try-catch blocks in async functions',
            category: 'Error Handling',
            recommended: true
        },
        messages: {
            missingTryCatch: 'Async function "{{name}}" must have a try-catch block for error handling',
            missingTryCatchAnonymous: 'Async function must have a try-catch block for error handling'
        },
        schema: []
    },

    create(context) {
        /**
         * Check if a node contains a try-catch statement
         */
        function hasTryCatch(node) {
            if (!node || !node.body) {
                return false;
            }

            const body = node.body.body || [];

            return body.some(statement => statement.type === 'TryStatement');
        }

        /**
         * Check if function body is simple enough to not require try-catch
         * (e.g., single return statement, no await calls)
         */
        function isSimpleFunction(node) {
            if (!node || !node.body || !node.body.body) {
                return true;
            }

            const body = node.body.body;

            // Empty function
            if (body.length === 0) {
                return true;
            }

            // Check if function contains await expressions
            let hasAwait = false;
            const visited = new WeakSet();

            function checkForAwait(n) {
                if (!n || typeof n !== 'object') return;

                // Prevent infinite recursion
                if (visited.has(n)) return;
                visited.add(n);

                if (n.type === 'AwaitExpression') {
                    hasAwait = true;
                    return;
                }

                // Don't traverse into nested functions
                if (n.type === 'FunctionDeclaration' ||
                    n.type === 'FunctionExpression' ||
                    n.type === 'ArrowFunctionExpression') {
                    return;
                }

                // Recursively check child nodes
                for (const key in n) {
                    if (key === 'parent') continue; // Skip parent references

                    if (n[key] && typeof n[key] === 'object') {
                        if (Array.isArray(n[key])) {
                            n[key].forEach(checkForAwait);
                        } else {
                            checkForAwait(n[key]);
                        }
                    }
                }
            }

            body.forEach(checkForAwait);

            // If no await, it's simple enough
            return !hasAwait;
        }

        return {
            'FunctionDeclaration[async=true]'(node) {
                if (!hasTryCatch(node) && !isSimpleFunction(node)) {
                    const name = node.id ? node.id.name : 'anonymous';

                    context.report({
                        node,
                        messageId: node.id ? 'missingTryCatch' : 'missingTryCatchAnonymous',
                        data: { name }
                    });
                }
            },

            'FunctionExpression[async=true]'(node) {
                if (!hasTryCatch(node) && !isSimpleFunction(node)) {
                    context.report({
                        node,
                        messageId: 'missingTryCatchAnonymous'
                    });
                }
            },

            'ArrowFunctionExpression[async=true]'(node) {
                if (!hasTryCatch(node) && !isSimpleFunction(node)) {
                    context.report({
                        node,
                        messageId: 'missingTryCatchAnonymous'
                    });
                }
            }
        };
    }
};
