/**
 * IPC Utilities — padroniza o wrapping de IPC handlers com error handling consistente
 */

/**
 * Cria um IPC handler padronizado com try-catch e logging
 * @param {Function} handlerFn - Função async que implementa a lógica do handler
 * @param {string} errorContext - Contexto para mensagem de erro (ex: 'opening file')
 * @returns {Function} Handler wrapped com error handling
 */
function createIPCHandler(handlerFn, errorContext) {
    return async (event, ...args) => {
        try {
            return await handlerFn(event, ...args);
        } catch (error) {
            console.error(`Error ${errorContext}:`, error);
            throw error;
        }
    };
}

module.exports = { createIPCHandler };
