/**
 * EventBus — comunicação desacoplada entre componentes do renderer
 * Implementa publish/subscribe com suporte a cleanup functions
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Registra um listener para um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função callback
     * @returns {Function} Função de cleanup para remover o listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    /**
     * Registra um listener que executa apenas uma vez
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função callback
     * @returns {Function} Função de cleanup
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        return this.on(event, wrapper);
    }

    /**
     * Remove um listener específico
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função callback a remover
     */
    off(event, callback) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(callback);
            if (eventListeners.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Emite um evento para todos os listeners registrados
     * @param {string} event - Nome do evento
     * @param {...any} args - Dados do evento
     */
    emit(event, ...args) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            for (const callback of eventListeners) {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event listener for '${event}':`, error);
                }
            }
        }
    }

    /**
     * Remove todos os listeners (cleanup)
     */
    clear() {
        this.listeners.clear();
    }
}

// Singleton instance
const eventBus = new EventBus();
module.exports = eventBus;
