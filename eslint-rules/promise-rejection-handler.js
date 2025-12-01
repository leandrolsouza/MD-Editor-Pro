/**
 * Custom ESLint Rule: promise-rejection-handler
 * Validates: Requirements 4.4 - Verify all promises have rejection handlers
 * 
 * This rule checks that promise chains have .catch() handlers
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require rejection handlers for promise chains',
            category: 'Error Handling',
            recommended: true
        },
        messages: {
            missingCatch: 'Promise chain must have a .catch() handler for rejections'
        },
        schema: []
    },

    create(context) {
        /**
         * Check if a call expression is a promise method
         */
        function isPromiseMethod(node, methodName) {
            return (
                node.type === 'CallExpression' &&
                node.callee.type === 'MemberExpression' &&
                node.callee.property.name === methodName
            );
        }

        /**
         * Check if a promise chain has a catch handler
         */
        function hasCatchHandler(node) {
            let current = node;

            // Traverse up the chain to find .catch()
            while (current) {
                if (isPromiseMethod(current, 'catch')) {
                    return true;
                }

                // Move to parent if it's part of a chain
                if (current.parent && current.parent.type === 'MemberExpression') {
                    current = current.parent.parent;
                } else {
                    break;
                }
            }

            return false;
        }

        /**
         * Check if promise is in a try-catch block or returned
         */
        function isInTryCatchOrReturned(node) {
            let current = node;

            while (current) {
                // If in a try statement, it's handled
                if (current.type === 'TryStatement') {
                    return true;
                }

                // If it's a return statement, caller is responsible
                if (current.type === 'ReturnStatement') {
                    return true;
                }

                // If it's awaited, error handling is at await level
                if (current.type === 'AwaitExpression') {
                    return true;
                }

                current = current.parent;
            }

            return false;
        }

        return {
            CallExpression(node) {
                // Check for .then() calls without .catch()
                if (isPromiseMethod(node, 'then')) {
                    if (!hasCatchHandler(node) && !isInTryCatchOrReturned(node)) {
                        context.report({
                            node,
                            messageId: 'missingCatch'
                        });
                    }
                }

                // Check for Promise constructor usage
                if (node.callee.name === 'Promise' && node.arguments.length > 0) {
                    // If Promise is created but not handled
                    if (!hasCatchHandler(node) && !isInTryCatchOrReturned(node)) {
                        // Only report if it's not immediately returned or assigned
                        const parent = node.parent;

                        if (parent.type !== 'ReturnStatement' &&
                            parent.type !== 'VariableDeclarator' &&
                            parent.type !== 'AssignmentExpression') {
                            context.report({
                                node,
                                messageId: 'missingCatch'
                            });
                        }
                    }
                }
            }
        };
    }
};
