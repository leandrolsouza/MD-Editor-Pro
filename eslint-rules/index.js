/**
 * Custom ESLint Rules for MD Editor Pro
 * Error Handling Verification Rules: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 * Electron Security Rules: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 * Resource Leak Detection Rules: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

module.exports = {
    rules: {
        // Error Handling Rules
        'async-error-handling': require('./async-error-handling'),
        'ipc-error-format': require('./ipc-error-format'),
        'error-logging': require('./error-logging'),
        'promise-rejection-handler': require('./promise-rejection-handler'),

        // Electron Security Rules
        'ipc-handler-pattern': require('./ipc-handler-pattern'),
        'contextbridge-usage': require('./contextbridge-usage'),
        'renderer-node-api': require('./renderer-node-api'),
        'electronapi-interface': require('./electronapi-interface'),

        // Resource Leak Detection Rules
        'event-listener-cleanup': require('./event-listener-cleanup'),
        'component-resource-cleanup': require('./component-resource-cleanup'),
        'timer-cleanup': require('./timer-cleanup'),
        'file-handle-cleanup': require('./file-handle-cleanup')
    }
};
