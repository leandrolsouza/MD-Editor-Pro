/**
 * Custom ESLint Rules for MD Editor Pro
 * Error Handling Verification Rules
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

module.exports = {
    rules: {
        'async-error-handling': require('./async-error-handling'),
        'ipc-error-format': require('./ipc-error-format'),
        'error-logging': require('./error-logging'),
        'promise-rejection-handler': require('./promise-rejection-handler')
    }
};
