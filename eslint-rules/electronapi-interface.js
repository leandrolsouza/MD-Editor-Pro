/**
 * Custom ESLint Rule: electronapi-interface
 * Validates: Requirements 5.4 - Verify all IPC calls use the exposed electronAPI interface
 * 
 * This rule checks that renderer process code uses window.electronAPI for IPC
 * instead of directly accessing ipcRenderer.
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require electronAPI interface for IPC calls in renderer',
            category: 'Electron Security',
            recommended: true
        },
        messages: {
            useElectronAPI: 'Use window.electronAPI instead of direct ipcRenderer access',
            noDirectIpcRenderer: 'Do not access ipcRenderer directly in renderer process. Use window.electronAPI interface'
        },
        schema: []
    },

    create(context) {
        const filename = context.getFilename();

        // Only apply this rule to renderer scripts (not main or preload)
        if (!filename.includes('renderer') || filename.includes('.test.')) {
            return {};
        }

        /**
         * Check if identifier is ipcRenderer
         */
        function isIpcRendererUsage(node) {
            // Direct usage: ipcRenderer.send()
            if (node.name === 'ipcRenderer') {
                return true;
            }

            // Member expression: something.ipcRenderer
            if (node.type === 'MemberExpression' &&
                node.property.name === 'ipcRenderer') {
                return true;
            }

            return false;
        }

        return {
            MemberExpression(node) {
                // Check for ipcRenderer.invoke, ipcRenderer.send, etc.
                if (node.object.name === 'ipcRenderer') {
                    context.report({
                        node,
                        messageId: 'noDirectIpcRenderer'
                    });
                }

                // Check for window.ipcRenderer or any other ipcRenderer access
                if (node.property.name === 'ipcRenderer') {
                    context.report({
                        node,
                        messageId: 'noDirectIpcRenderer'
                    });
                }
            },

            Identifier(node) {
                // Check for standalone ipcRenderer usage
                if (node.name === 'ipcRenderer') {
                    const parent = node.parent;

                    // Skip if it's part of a require statement (allowed in preload)
                    if (parent.type === 'VariableDeclarator') {
                        return;
                    }

                    // Skip if it's a property name
                    if (parent.type === 'MemberExpression' && parent.property === node) {
                        return;
                    }

                    // Skip if already handled by MemberExpression
                    if (parent.type === 'MemberExpression' && parent.object === node) {
                        return;
                    }

                    context.report({
                        node,
                        messageId: 'useElectronAPI'
                    });
                }
            }
        };
    }
};
