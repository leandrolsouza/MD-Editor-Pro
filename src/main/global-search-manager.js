/**
 * Global Search Manager
 * Handles searching text across all files in the workspace
 * Requirements: Global search functionality
 */

const fs = require('fs').promises;
const path = require('path');

class GlobalSearchManager {
    constructor(workspaceManager) {
        this.workspaceManager = workspaceManager;
    }

    /**
     * Search for text in all markdown files in the workspace
     * @param {string} searchText - Text to search for
     * @param {Object} options - Search options
     * @param {boolean} options.caseSensitive - Whether search is case sensitive
     * @param {boolean} options.wholeWord - Whether to match whole words only
     * @param {boolean} options.useRegex - Whether to use regex search
     * @returns {Promise<Object>} Search results
     */
    async searchInWorkspace(searchText, options = {}) {
        try {
            const workspacePath = this.workspaceManager.getWorkspacePath();

            if (!workspacePath) {
                return {
                    success: false,
                    error: 'No workspace is currently open'
                };
            }

            if (!searchText || searchText.trim() === '') {
                return {
                    success: false,
                    error: 'Search text cannot be empty'
                };
            }

            const results = [];
            const files = await this.getAllMarkdownFiles(workspacePath);

            for (const filePath of files) {
                const fileResults = await this.searchInFile(filePath, searchText, options);

                if (fileResults.length > 0) {
                    results.push({
                        filePath,
                        relativePath: path.relative(workspacePath, filePath),
                        matches: fileResults
                    });
                }
            }

            return {
                success: true,
                results,
                totalMatches: results.reduce((sum, file) => sum + file.matches.length, 0),
                totalFiles: results.length,
                searchText,
                options
            };
        } catch (error) {
            console.error('Error searching in workspace:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all markdown files in a directory recursively
     * @param {string} dirPath - Directory path
     * @returns {Promise<string[]>} Array of file paths
     */
    async getAllMarkdownFiles(dirPath) {
        const files = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                // Skip hidden files and node_modules
                if (entry.name.startsWith('.') || entry.name === 'node_modules') {
                    continue;
                }

                if (entry.isDirectory()) {
                    const subFiles = await this.getAllMarkdownFiles(fullPath);

                    files.push(...subFiles);
                } else if (entry.isFile() && this.isMarkdownFile(entry.name)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            console.error('Error reading directory:', dirPath, error);
        }

        return files;
    }

    /**
     * Check if a file is a markdown file
     * @param {string} fileName - File name
     * @returns {boolean} True if markdown file
     */
    isMarkdownFile(fileName) {
        const ext = path.extname(fileName).toLowerCase();

        return ext === '.md' || ext === '.markdown';
    }

    /**
     * Search for text in a single file
     * @param {string} filePath - File path
     * @param {string} searchText - Text to search for
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Array of matches
     */
    async searchInFile(filePath, searchText, options = {}) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            const matches = [];

            let pattern;

            if (options.useRegex) {
                try {
                    pattern = new RegExp(searchText, options.caseSensitive ? 'g' : 'gi');
                } catch (error) {
                    // Invalid regex, treat as literal text
                    pattern = this.createSearchPattern(searchText, options);
                }
            } else {
                pattern = this.createSearchPattern(searchText, options);
            }

            lines.forEach((line, lineIndex) => {
                const lineMatches = [];
                let match;

                // Reset regex lastIndex for global search
                pattern.lastIndex = 0;

                while ((match = pattern.exec(line)) !== null) {
                    lineMatches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[0]
                    });

                    // Prevent infinite loop for zero-width matches
                    if (match.index === pattern.lastIndex) {
                        pattern.lastIndex++;
                    }
                }

                if (lineMatches.length > 0) {
                    matches.push({
                        line: lineIndex + 1,
                        lineText: line,
                        matches: lineMatches
                    });
                }
            });

            return matches;
        } catch (error) {
            console.error('Error searching in file:', filePath, error);
            return [];
        }
    }

    /**
     * Create search pattern from text and options
     * @param {string} searchText - Text to search for
     * @param {Object} options - Search options
     * @returns {RegExp} Search pattern
     */
    createSearchPattern(searchText, options) {
        let pattern = searchText;

        // Escape special regex characters if not using regex
        if (!options.useRegex) {
            pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        // Add word boundaries for whole word search
        if (options.wholeWord) {
            pattern = `\\b${pattern}\\b`;
        }

        const flags = options.caseSensitive ? 'g' : 'gi';

        return new RegExp(pattern, flags);
    }
}

module.exports = GlobalSearchManager;
