/**
 * Custom ESLint Rule: ipc-error-format
 * Validates: Requirements 4.2 - Verify all IPC handlers return consistent error response format
 * 
 * This rule checks that ipcMain.handle handlers have proper error handling
 * and return consistent response format with { success: boolean, ...data }
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require consistent error response format in IPC handlers',
            category: 'Error Handling',
            recommended: true
        },
        messages: {
            missingTryCatch: 'IPC handler "{{channel}}" must wrap logic in try-catch block',
            missingSuccessField: 'IPC handler "{{channel}}" must return object with "success" field',
            shouldThrowError: 'IPC handler "{{channel}}" should throw error in catch block, not return error object'
        },
        schema: []
    },

    create(context) {
        /**
         * Check if a call expression is ipcMain.handle
         */
        function isIpcMainHandle(node) {
            return (
                node.type === 'CallExpression' &&
                node.callee.type === 'MemberExpression' &&
                node.callee.object.name === 'ipcMain' &&
                node.callee.property.name === 'handle'
            );
        }

        /**
         * Check if handler function has try-catch
         */
        function hasTryCatch(handlerFunction) {
            if (!handlerFunction || !handlerFunction.body) {
                return false;
            }

            const body = handlerFunction.body.body || [];

            return body.some(statement => statement.type === 'TryStatement');
        }

        /**
         * Check if return statements include success field
         */
        function checkReturnStatements(node) {
            const issues = [];
            const visited = new WeakSet();

            function traverse(n) {
                if (!n || typeof n !== 'object') return;

                // Prevent infinite recursion
                if (visited.has(n)) return;
                visited.add(n);

                if (n.type === 'ReturnStatement' && n.argument) {
                    // Check if returning an object with success field
                    if (n.argument.type === 'ObjectExpression') {
                        const hasSuccess = n.argument.properties.some(prop =>
                            prop.key && prop.key.name === 'success'
                        );

                        if (!hasSuccess) {
                            issues.push(n);
                        }
                    }
                }

                // Recursively traverse child nodes
                for (const key in n) {
                    if (key === 'parent') continue; // Skip parent references

                    if (n[key] && typeof n[key] === 'object') {
                        if (Array.isArray(n[key])) {
                            n[key].forEach(traverse);
                        } else {
                            traverse(n[key]);
                        }
                    }
                }
            }

            traverse(node);
            return issues;
        }

        return {
            CallExpression(node) {
                if (!isIpcMainHandle(node)) {
                    return;
                }

                // Get channel name
                const channelArg = node.arguments[0];
                const channel = channelArg && channelArg.type === 'Literal' ? channelArg.value : 'unknown';

                // Get handler function (second argument)
                const handlerFunction = node.arguments[1];

                if (!handlerFunction) {
                    return;
                }

                // Check for try-catch
                if (!hasTryCatch(handlerFunction)) {
                    context.report({
                        node: handlerFunction,
                        messageId: 'missingTryCatch',
                        data: { channel }
                    });
                }

                // Check return statements for success field
                const invalidReturns = checkReturnStatements(handlerFunction);

                if (invalidReturns.length > 0) {
                    invalidReturns.forEach(returnNode => {
                        context.report({
                            node: returnNode,
                            messageId: 'missingSuccessField',
                            data: { channel }
                        });
                    });
                }
            }
        };
    }
};
