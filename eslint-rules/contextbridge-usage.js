/**
 * Custom ESLint Rule: contextbridge-usage
 * Validates: Requirements 5.2 - Verify contextBridge is used for API exposure in preload scripts
 * 
 * This rule checks that preload scripts use contextBridge.exposeInMainWorld instead of
 * directly assigning to window object when contextIsolation is enabled.
 * 
 * Note: This project currently has contextIsolation disabled and uses direct window assignment.
 * This rule will flag direct window assignments as warnings to encourage migration to contextBridge.
 */

module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Encourage contextBridge usage for API exposure in preload scripts',
            category: 'Electron Security',
            recommended: true
        },
        messages: {
            useContextBridge: 'Consider using contextBridge.exposeInMainWorld instead of direct window assignment for better security',
            noDirectIpcRenderer: 'Do not expose ipcRenderer directly to renderer process. Use contextBridge to expose safe API methods'
        },
        schema: []
    },

    create(context) {
        const filename = context.getFilename();

        // Only apply this rule to preload scripts
        if (!filename.includes('preload')) {
            return {};
        }

        /**
         * Check if assignment is to window object
         */
        function isWindowAssignment(node) {
            return (
                node.type === 'AssignmentExpression' &&
                node.left.type === 'MemberExpression' &&
                node.left.object.name === 'window'
            );
        }

        /**
         * Check if value being assigned is ipcRenderer
         */
        function isIpcRendererExposure(node) {
            if (!node.right) return false;

            // Direct assignment: window.ipcRenderer = ipcRenderer
            if (node.right.name === 'ipcRenderer') {
                return true;
            }

            // Object containing ipcRenderer: window.api = { ipcRenderer }
            if (node.right.type === 'ObjectExpression') {
                return node.right.properties.some(prop => {
                    if (prop.type === 'Property') {
                        return prop.key.name === 'ipcRenderer' ||
                            (prop.value && prop.value.name === 'ipcRenderer');
                    }
                    return false;
                });
            }

            return false;
        }

        return {
            AssignmentExpression(node) {
                if (isWindowAssignment(node)) {
                    // Check if exposing ipcRenderer directly
                    if (isIpcRendererExposure(node)) {
                        context.report({
                            node,
                            messageId: 'noDirectIpcRenderer'
                        });
                    } else {
                        // General window assignment - suggest contextBridge
                        context.report({
                            node,
                            messageId: 'useContextBridge'
                        });
                    }
                }
            }
        };
    }
};
