/**
 * KaTeX Renderer - Shared rendering logic for inline and block KaTeX elements
 *
 * Extracted from post-processor.js to eliminate duplication between
 * inline and block KaTeX rendering paths.
 */

/**
 * Renderiza um elemento KaTeX (compartilhado entre inline e block)
 * @param {HTMLElement} element - Elemento DOM com data-katex
 * @param {Object} katex - Instância do KaTeX
 * @param {Object} options - Opções de renderização
 * @param {boolean} options.displayMode - true para block, false para inline
 */
function renderKatexElement(element, katex, options = {}) {
    if (element.classList.contains('katex-rendered') ||
        element.classList.contains('katex-error')) {
        return;
    }

    const latex = element.getAttribute('data-katex');
    if (!latex) return;

    try {
        katex.render(latex, element, {
            throwOnError: false,
            displayMode: options.displayMode || false
        });
        element.classList.add('katex-rendered');
    } catch (error) {
        element.classList.add('katex-error');
        element.textContent = latex;
        console.error('KaTeX render error:', error);
    }
}

module.exports = { renderKatexElement };
