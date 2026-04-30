/**
 * IPC Utilities — padroniza o wrapping de IPC handlers com error handling consistente
 */

const logger = require('./logger');
const { mapErrorToCode } = require('./ipc-error-codes');

/**
 * Cria um IPC handler padronizado com try-catch, structured logging, error codes e duration tracking
 * @param {Function} handlerFn - Função async que implementa a lógica do handler
 * @param {string} errorContext - Contexto para mensagem de erro (ex: 'opening file')
 * @returns {Function} Handler wrapped com error handling
 */
function createIPCHandler(handlerFn, errorContext) {
    const log = logger.child('IPC');

    return async (event, ...args) => {
        const start = Date.now();
        try {
            const result = await handlerFn(event, ...args);
            const duration = Date.now() - start;
            if (duration > 1000) {
                log.warn(`Slow IPC call: ${errorContext}`, { duration, errorContext });
            }
            return result;
        } catch (error) {
            const { errorCode, message } = mapErrorToCode(error);
            log.error(`Error ${errorContext}`, { error, errorCode });
            const enrichedError = new Error(message);
            enrichedError.errorCode = errorCode;
            throw enrichedError;
        }
    };
}

module.exports = { createIPCHandler };
