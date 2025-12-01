/**
 * Custom ESLint Rule: file-handle-cleanup
 * Validates: Requirements 6.4 - Verify file handles are properly closed
 * 
 * This rule checks that file operations that open handles (streams, file descriptors)
 * are properly closed.
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require proper cleanup for file handles to prevent resource leaks',
            category: 'Resource Management',
            recommended: true
        },
        messages: {
            streamNotClosed: 'File stream created with {{method}} should be closed. Call .close() or .end() on the stream, or use .pipe() to auto-close.',
            fileDescriptorNotClosed: 'File descriptor opened with {{method}} should be closed. Call fs.close() or fs.closeSync() with the file descriptor.',
            storeFileHandle: 'File handle created but not stored. Store the handle in a variable to enable proper cleanup.'
        },
        schema: []
    },

    create(context) {
        const fileHandles = new Map();
        const closedHandles = new Set();

        /**
         * File operations that create handles
         */
        const streamMethods = [
            'createReadStream',
            'createWriteStream'
        ];

        const fdMethods = [
            'open',
            'openSync'
        ];

        /**
         * Check if a call expression creates a file handle
         */
        function isFileHandleCreation(node) {
            if (node.type !== 'CallExpression') return null;

            const callee = node.callee;

            // Check for fs.createReadStream, fs.createWriteStream
            if (callee.type === 'MemberExpression' &&
                callee.property.type === 'Identifier') {
                const method = callee.property.name;

                if (streamMethods.includes(method)) {
                    return { type: 'stream', method };
                }

                if (fdMethods.includes(method)) {
                    return { type: 'fd', method };
                }
            }

            return null;
        }

        /**
         * Check if a call expression closes a file handle
         */
        function isFileHandleClosing(node) {
            if (node.type !== 'CallExpression') return false;

            const callee = node.callee;

            // Check for .close(), .end()
            if (callee.type === 'MemberExpression' &&
                callee.property.type === 'Identifier' &&
                (callee.property.name === 'close' || callee.property.name === 'end')) {
                return true;
            }

            // Check for fs.close(), fs.closeSync()
            if (callee.type === 'MemberExpression' &&
                callee.property.type === 'Identifier' &&
                (callee.property.name === 'close' || callee.property.name === 'closeSync')) {
                return true;
            }

            return false;
        }

        /**
         * Check if stream is piped (auto-closes)
         */
        function isStreamPiped(node) {
            const parent = node.parent;

            // Check if .pipe() is called on the stream
            if (parent.type === 'MemberExpression' &&
                parent.parent.type === 'CallExpression' &&
                parent.property.name === 'pipe') {
                return true;
            }

            return false;
        }

        /**
         * Check if handle is stored in a variable
         */
        function isHandleStored(node) {
            const parent = node.parent;

            // Check if assigned to a variable
            if (parent.type === 'VariableDeclarator') {
                return parent.id.name;
            }

            // Check if assigned to a property
            if (parent.type === 'AssignmentExpression') {
                if (parent.left.type === 'Identifier') {
                    return parent.left.name;
                }
                if (parent.left.type === 'MemberExpression') {
                    return parent.left.property.name;
                }
            }

            // Check if returned (caller responsible for cleanup)
            if (parent.type === 'ReturnStatement') {
                return '__returned__';
            }

            // Check if passed to a function (function responsible)
            if (parent.type === 'CallExpression') {
                return '__passed__';
            }

            return null;
        }

        /**
         * Check if in try-finally block (cleanup in finally)
         */
        function isInTryFinally(node) {
            let current = node;

            while (current) {
                if (current.type === 'TryStatement' && current.finalizer) {
                    return true;
                }
                current = current.parent;
            }

            return false;
        }

        return {
            CallExpression(node) {
                const handleInfo = isFileHandleCreation(node);

                if (handleInfo) {
                    const handleVar = isHandleStored(node);
                    const key = `${handleInfo.method}-${node.loc.start.line}`;

                    // Skip if stream is piped (auto-closes)
                    if (handleInfo.type === 'stream' && isStreamPiped(node)) {
                        return;
                    }

                    // Skip if in try-finally (cleanup in finally)
                    if (isInTryFinally(node)) {
                        return;
                    }

                    fileHandles.set(key, {
                        node,
                        handleType: handleInfo.type,
                        method: handleInfo.method,
                        handleVar
                    });
                }

                if (isFileHandleClosing(node)) {
                    // Track which handle variable is being closed
                    const callee = node.callee;

                    if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
                        closedHandles.add(callee.object.name);
                    }

                    if (callee.type === 'MemberExpression' &&
                        callee.object.type === 'MemberExpression' &&
                        callee.object.property.type === 'Identifier') {
                        closedHandles.add(callee.object.property.name);
                    }

                    // Track fs.close(fd) calls
                    const arg = node.arguments[0];
                    if (arg && arg.type === 'Identifier') {
                        closedHandles.add(arg.name);
                    }
                }
            },

            'Program:exit'() {
                for (const [key, handle] of fileHandles) {
                    const { node, handleType, method, handleVar } = handle;

                    // If handle is not stored, report it
                    if (!handleVar) {
                        context.report({
                            node,
                            messageId: 'storeFileHandle'
                        });
                        continue;
                    }

                    // If handle is returned or passed, caller is responsible
                    if (handleVar === '__returned__' || handleVar === '__passed__') {
                        continue;
                    }

                    // Check if handle is closed
                    if (!closedHandles.has(handleVar)) {
                        const messageId = handleType === 'stream' ? 'streamNotClosed' : 'fileDescriptorNotClosed';
                        context.report({
                            node,
                            messageId,
                            data: { method }
                        });
                    }
                }
            }
        };
    }
};
