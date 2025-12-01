/**
 * Custom ESLint Rule: error-logging
 * Validates: Requirements 4.3 - Verify errors are logged appropriately
 * 
 * This rule checks that catch blocks contain console.error or appropriate logging
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require error logging in catch blocks',
            category: 'Error Handling',
            recommended: true
        },
        messages: {
            missingErrorLog: 'Catch block must log error using console.error or logger'
        },
        schema: []
    },

    create(context) {
        /**
         * Check if a catch block contains error logging
         */
        function hasErrorLogging(catchClause) {
            if (!catchClause || !catchClause.body) {
                return false;
            }

            const body = catchClause.body.body || [];

            // Check for console.error, console.log, or logger calls
            function hasLoggingCall(node) {
                if (!node) return false;

                if (node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression') {
                    const callee = node.expression.callee;

                    // Check for console.error, console.log
                    if (callee.type === 'MemberExpression') {
                        if (callee.object.name === 'console' &&
                            (callee.property.name === 'error' || callee.property.name === 'log')) {
                            return true;
                        }

                        // Check for logger.error, logger.warn, etc.
                        if (callee.object.name === 'logger' &&
                            (callee.property.name === 'error' || callee.property.name === 'warn')) {
                            return true;
                        }
                    }
                }

                return false;
            }

            return body.some(hasLoggingCall);
        }

        return {
            CatchClause(node) {
                if (!hasErrorLogging(node)) {
                    context.report({
                        node,
                        messageId: 'missingErrorLog'
                    });
                }
            }
        };
    }
};
