/**
 * Custom ESLint Rule: timer-cleanup
 * Validates: Requirements 6.3 - Verify all setInterval and setTimeout calls are cleared
 * 
 * This rule checks that timers created with setInterval and setTimeout are properly
 * cleared with clearInterval and clearTimeout.
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require cleanup for timers to prevent memory leaks',
            category: 'Resource Management',
            recommended: true
        },
        messages: {
            intervalNotCleared: 'setInterval timer should be stored and cleared with clearInterval. Store the timer ID and call clearInterval in cleanup.',
            timeoutNotCleared: 'setTimeout timer should be stored and cleared with clearTimeout if component unmounts. Store the timer ID and call clearTimeout in cleanup.',
            storeTimerId: 'Timer created but not stored. Store the timer ID in a variable to enable cleanup with clear{{timerType}}.'
        },
        schema: []
    },

    create(context) {
        const timers = new Map();
        const clearedTimers = new Set();

        /**
         * Check if a call expression is setInterval or setTimeout
         */
        function isTimerCreation(node) {
            if (node.type !== 'CallExpression') return false;

            const callee = node.callee;

            if (callee.type === 'Identifier' &&
                (callee.name === 'setInterval' || callee.name === 'setTimeout')) {
                return callee.name;
            }

            return null;
        }

        /**
         * Check if a call expression is clearInterval or clearTimeout
         */
        function isTimerClearing(node) {
            if (node.type !== 'CallExpression') return false;

            const callee = node.callee;

            if (callee.type === 'Identifier' &&
                (callee.name === 'clearInterval' || callee.name === 'clearTimeout')) {
                return callee.name;
            }

            return null;
        }

        /**
         * Check if timer is stored in a variable
         */
        function isTimerStored(node) {
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

            return null;
        }

        /**
         * Check if timer is in a component with cleanup method
         */
        function hasCleanupMethod(node) {
            let current = node;

            while (current) {
                if (current.type === 'ClassDeclaration' || current.type === 'ClassExpression') {
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
         * Check if timer variable is cleared in scope
         */
        function isTimerCleared(timerVar) {
            return clearedTimers.has(timerVar);
        }

        return {
            CallExpression(node) {
                const timerType = isTimerCreation(node);

                if (timerType) {
                    const timerVar = isTimerStored(node);
                    const key = `${timerType}-${node.loc.start.line}`;

                    timers.set(key, {
                        node,
                        timerType,
                        timerVar,
                        hasCleanup: hasCleanupMethod(node)
                    });
                }

                const clearType = isTimerClearing(node);
                if (clearType) {
                    // Track which timer variable is being cleared
                    const arg = node.arguments[0];
                    if (arg && arg.type === 'Identifier') {
                        clearedTimers.add(arg.name);
                    }
                    if (arg && arg.type === 'MemberExpression' && arg.property.type === 'Identifier') {
                        clearedTimers.add(arg.property.name);
                    }
                }
            },

            'Program:exit'() {
                for (const [key, timer] of timers) {
                    const { node, timerType, timerVar, hasCleanup } = timer;

                    // If timer is not stored, report it
                    if (!timerVar) {
                        context.report({
                            node,
                            messageId: 'storeTimerId',
                            data: { timerType: timerType === 'setInterval' ? 'Interval' : 'Timeout' }
                        });
                        continue;
                    }

                    // If timer is returned, caller is responsible
                    if (timerVar === '__returned__') {
                        continue;
                    }

                    // Check if timer is cleared
                    if (!isTimerCleared(timerVar) && !hasCleanup) {
                        const messageId = timerType === 'setInterval' ? 'intervalNotCleared' : 'timeoutNotCleared';
                        context.report({
                            node,
                            messageId
                        });
                    }
                }
            }
        };
    }
};
