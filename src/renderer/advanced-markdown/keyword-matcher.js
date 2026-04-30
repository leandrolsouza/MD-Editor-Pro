/**
 * Generic keyword matching utility for CodeMirror StreamLanguage tokenizers.
 * Extracted from mermaid-codemirror-lang.js to eliminate duplicated keyword
 * matching logic across multiple diagram type handlers.
 */

/**
 * Verifica se o stream atual corresponde a alguma keyword do conjunto.
 * Consome a keyword do stream se encontrada, respeitando limites de palavra
 * (o próximo caractere deve ser whitespace, delimitador ou fim de linha).
 *
 * @param {Object} stream - CodeMirror stream object
 * @param {string[]} keywords - Lista de keywords para verificar
 * @param {string} tokenType - Tipo de token a retornar (default: 'keyword')
 * @returns {string|null} Tipo do token ou null se não corresponder
 */
function matchKeywordSet(stream, keywords, tokenType = 'keyword') {
    for (const keyword of keywords) {
        if (stream.match(keyword, false)) {
            const next = stream.string.charAt(stream.pos + keyword.length);
            if (!next || /\s/.test(next) || /[:\[\]]/.test(next)) {
                stream.match(keyword);
                return tokenType;
            }
        }
    }
    return null;
}

module.exports = { matchKeywordSet };
