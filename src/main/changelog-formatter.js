/**
 * Formata uma lista de ChangelogEntry de volta para texto markdown
 * @param {import('./changelog-parser').ChangelogEntry[]} entries - Lista de entradas do changelog
 * @returns {string} Texto markdown formatado
 */
function formatChangelog(entries) {
    if (!entries || entries.length === 0) {
        return '';
    }

    return entries
        .map((entry) => `## [${entry.version}] - ${entry.date}\n\n${entry.content}`)
        .join('\n\n');
}

module.exports = { formatChangelog };
