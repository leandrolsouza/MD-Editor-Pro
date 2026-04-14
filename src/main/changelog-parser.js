/**
 * @typedef {Object} ChangelogEntry
 * @property {string} version - Número da versão (ex: "1.6.0")
 * @property {string} date - Data no formato YYYY-MM-DD (ex: "2026-04-14")
 * @property {string} content - Conteúdo markdown bruto da entrada (tudo entre headers de versão)
 */

/**
 * Regex para identificar headers de versão no formato: ## [X.Y.Z] - YYYY-MM-DD
 * Captura: version (semver) e date (YYYY-MM-DD)
 */
const VERSION_HEADER_REGEX = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})\s*$/;

/**
 * Faz o parsing do conteúdo textual de um CHANGELOG.md
 * @param {string} changelogContent - Conteúdo completo do arquivo CHANGELOG.md
 * @returns {ChangelogEntry[]} Lista de entradas ordenadas por posição no arquivo (mais recente primeiro)
 */
function parseChangelog(changelogContent) {
    if (!changelogContent || typeof changelogContent !== 'string') {
        return [];
    }

    const lines = changelogContent.split('\n');
    const entries = [];
    let currentEntry = null;
    let contentLines = [];

    for (const line of lines) {
        const match = line.match(VERSION_HEADER_REGEX);

        if (match) {
            // Flush previous entry
            if (currentEntry) {
                currentEntry.content = contentLines.join('\n').trim();
                if (currentEntry.content) {
                    entries.push(currentEntry);
                }
            }

            currentEntry = {
                version: match[1],
                date: match[2],
                content: ''
            };
            contentLines = [];
        } else if (currentEntry) {
            contentLines.push(line);
        }
        // Lines before the first valid header are ignored
    }

    // Flush last entry
    if (currentEntry) {
        currentEntry.content = contentLines.join('\n').trim();
        if (currentEntry.content) {
            entries.push(currentEntry);
        }
    }

    return entries;
}

module.exports = { parseChangelog };
