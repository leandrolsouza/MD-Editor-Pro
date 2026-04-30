/**
 * ComponentRegistry — gerencia instâncias de componentes do renderer
 * Substitui as 40+ variáveis globais de módulo do index.js
 */
class ComponentRegistry {
    constructor() {
        this.components = new Map();
    }

    /**
     * Registra uma instância de componente
     * @param {string} name - Nome do componente (ex: 'editor', 'preview')
     * @param {Object} instance - Instância do componente
     */
    register(name, instance) {
        if (this.components.has(name)) {
            console.warn(`Component '${name}' already registered, overwriting`);
        }
        this.components.set(name, instance);
    }

    /**
     * Obtém uma instância de componente
     * @param {string} name - Nome do componente
     * @returns {Object|null} Instância ou null se não encontrado
     */
    get(name) {
        return this.components.get(name) || null;
    }

    /**
     * Retorna todas as instâncias registradas
     * @returns {Map<string, Object>}
     */
    getAll() {
        return new Map(this.components);
    }

    /**
     * Remove todos os componentes (cleanup)
     */
    clear() {
        this.components.clear();
    }
}

module.exports = ComponentRegistry;
