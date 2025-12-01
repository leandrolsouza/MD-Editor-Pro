/**
 * Custom ESLint Rule: event-listener-cleanup
 * Validates: Requirements 6.1 - Verify event listeners have corresponding cleanup functions
 * 
 * This rule checks that event listeners registered with addEventListener or on() methods
 * have corresponding removeEventListener or off() calls, or are properly cleaned up.
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require cleanup for event listeners to prevent memory leaks',
            category: 'Resource Management',
            recommended: true
        },
        messages: {
            missingCleanup: 'Event listener registered on "{{event}}" should have corresponding cleanup. Consider storing the listener reference and removing it in a cleanup function.',
            missingRemoveListener: 'Event listener added but no corresponding removeEventListener found. Store the listener reference and call removeEventListener in cleanup.'
        },
        schema: []
    },

    create(context) {
        const eventListeners = new Map();
        const removedListeners = new Set();

        /**
         * Check if a call expression is addEventListener or on()
         */
        function isAddEventListener(node) {
            if (node.type !== 'CallExpression') return false;

            const callee = node.callee;

            // addEventListener
            if (callee.type === 'MemberExpression' &&
                callee.property.name === 'addEventListener') {
                return true;
            }

            // .on() method (common in Node.js EventEmitter)
            if (callee.type === 'MemberExpression' &&
                callee.property.name === 'on') {
                return true;
            }

            return false;
        }

        /**
         * Check if a call expression is removeEventListener or off()
         */
        function isRemoveEventListener(node) {
            if (node.type !== 'CallExpression') return false;

            const callee = node.callee;

            // removeEventListener
            if (callee.type === 'MemberExpression' &&
                callee.property.name === 'removeEventListener') {
                return true;
            }

            // .off() method
            if (callee.type === 'MemberExpression' &&
                callee.property.name === 'off') {
                return true;
            }

            // .removeListener() method
            if (callee.type === 'MemberExpression' &&
                callee.property.name === 'removeListener') {
                return true;
            }

            return false;
        }

        /**
         * Get event name from listener call
         */
        function getEventName(node) {
            const eventArg = node.arguments[0];
            if (eventArg && eventArg.type === 'Literal') {
                return eventArg.value;
            }
            return 'unknown';
        }

        /**
         * Check if listener is in a component with cleanup method
         */
        function hasCleanupMethod(node) {
            let current = node;

            // Traverse up to find class or object with cleanup/destroy/dispose method
            while (current) {
                if (current.type === 'ClassDeclaration' || current.type === 'ClassExpression') {
                    // Check if class has cleanup, destroy, or dispose method
                    const body = current.body.body || [];
                    return body.some(member =>
                        member.type === 'MethodDefinition' &&
                        (member.key.name === 'cleanup' ||
                            member.key.name === 'destroy' ||
                            member.key.name === 'dispose' ||
                            member.key.name === 'componentWillUnmount')
                    );
                }

                current = current.parent;
            }

            return false;
        }

        /**
         * Check if listener is stored in a variable for later cleanup
         */
        function isListenerStored(node) {
            const parent = node.parent;

            // Check if assigned to a variable
            if (parent.type === 'VariableDeclarator') {
                return true;
            }

            // Check if assigned to a property
            if (parent.type === 'AssignmentExpression') {
                return true;
            }

            // Check if returned (caller responsible for cleanup)
            if (parent.type === 'ReturnStatement') {
                return true;
            }

            return false;
        }

        return {
            CallExpression(node) {
                if (isAddEventListener(node)) {
                    const eventName = getEventName(node);
                    const key = `${eventName}-${node.loc.start.line}`;

                    // Store listener registration
                    eventListeners.set(key, {
                        node,
                        eventName,
                        hasCleanup: hasCleanupMethod(node),
                        isStored: isListenerStored(node)
                    });
                }

                if (isRemoveEventListener(node)) {
                    const eventName = getEventName(node);
                    removedListeners.add(eventName);
                }
            },

            'Program:exit'() {
                // Check all registered listeners
                for (const [key, listener] of eventListeners) {
                    const { node, eventName, hasCleanup, isStored } = listener;

                    // Skip if listener is stored or has cleanup method
                    if (isStored || hasCleanup) {
                        continue;
                    }

                    // Skip if corresponding remove was found
                    if (removedListeners.has(eventName)) {
                        continue;
                    }

                    // Report missing cleanup
                    context.report({
                        node,
                        messageId: 'missingCleanup',
                        data: { event: eventName }
                    });
                }
            }
        };
    }
};
