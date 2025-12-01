/**
 * Custom ESLint Rule: ipc-handler-pattern
 * Validates: Requirements 5.1 - Verify all IPC handlers use ipcMain.handle for async operations
 * 
 * This rule checks that IPC handlers use ipcMain.handle instead of ipcMain.on for async operations.
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require ipcMain.handle for async IPC operations',
            category: 'Electron Security',
            recommended: true
        },
        messages: {
            useHandleForAsync: 'Use ipcMain.handle instead of ipcMain.on for async operations on channel "{{channel}}"',
            handlerShouldBeAsync: 'IPC handler for channel "{{channel}}" should be async or return a Promise'
        },
        schema: []
    },

    create(context) {
        /**
         * Check if a call expression is ipcMain.on
         */
        function isIpcMainOn(node) {
            return (
                node.type === 'CallExpression' &&
                node.callee.type === 'MemberExpression' &&
                node.callee.object.name === 'ipcMain' &&
                node.callee.property.name === 'on'
            );
        }

        /**
         * Check if handler function is async or returns a promise
         */
        function isAsyncHandler(handlerFunction) {
            if (!handlerFunction) {
                return false;
            }

            // Check if function is marked as async
            if (handlerFunction.async) {
                return true;
            }

            // Check if function body contains await or returns a promise
            if (!handlerFunction.body) {
                return false;
            }

            const body = handlerFunction.body.body || [];
            const visited = new WeakSet();

            function hasAsyncOperation(n) {
                if (!n || typeof n !== 'object') return false;

                // Prevent infinite recursion
                if (visited.has(n)) return false;
                visited.add(n);

                // Check for await expressions
                if (n.type === 'AwaitExpression') {
                    return true;
                }

                // Check for Promise usage
                if (n.type === 'NewExpression' && n.callee.name === 'Promise') {
                    return true;
                }

                // Check for .then() calls
                if (n.type === 'CallExpression' &&
                    n.callee.type === 'MemberExpression' &&
                    n.callee.property.name === 'then') {
                    return true;
                }

                // Don't traverse into nested functions
                if (n.type === 'FunctionDeclaration' ||
                    n.type === 'FunctionExpression' ||
                    n.type === 'ArrowFunctionExpression') {
                    return false;
                }

                // Recursively check child nodes
                for (const key in n) {
                    if (key === 'parent') continue;

                    if (n[key] && typeof n[key] === 'object') {
                        if (Array.isArray(n[key])) {
                            if (n[key].some(hasAsyncOperation)) return true;
                        } else {
                            if (hasAsyncOperation(n[key])) return true;
                        }
                    }
                }

                return false;
            }

            return body.some(hasAsyncOperation);
        }

        return {
            CallExpression(node) {
                if (!isIpcMainOn(node)) {
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

                // Check if handler is async
                if (isAsyncHandler(handlerFunction)) {
                    context.report({
                        node,
                        messageId: 'useHandleForAsync',
                        data: { channel }
                    });
                }
            }
        };
    }
};
