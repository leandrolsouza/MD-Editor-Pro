/**
 * Global Search UI
 * Provides user interface for searching across all workspace files
 */

class GlobalSearchUI {
    constructor() {
        this.isVisible = false;
        this.container = null;
        this.searchInput = null;
        this.resultsContainer = null;
        this.currentResults = null;
        this.onFileClickCallback = null;
    }

    /**
     * Initialize the global search UI
     */
    initialize() {
        this.createUI();
        this.attachEventListeners();
    }

    /**
     * Create the UI elements
     */
    createUI() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'global-search-panel';
        this.container.className = 'global-search-panel hidden';

        this.container.innerHTML = `
            <div class="global-search-header">
                <h3>Search in Files</h3>
            </div>
            <div class="global-search-controls">
                <div class="search-input-group">
                    <input 
                        type="text" 
                        id="global-search-input" 
                        placeholder="Search text..."
                        autocomplete="off"
                    />
                    <button id="global-search-btn" class="primary-button">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                        </svg>
                        Search
                    </button>
                </div>
                <div class="search-options">
                    <label>
                        <input type="checkbox" id="global-search-case-sensitive" />
                        Aa (Match case)
                    </label>
                    <label>
                        <input type="checkbox" id="global-search-whole-word" />
                        Whole word
                    </label>
                    <label>
                        <input type="checkbox" id="global-search-regex" />
                        Use regex
                    </label>
                </div>
            </div>
            <div class="global-search-status">
                <span id="global-search-status-text"></span>
            </div>
            <div class="global-search-results" id="global-search-results">
                <div class="no-results">Enter a search term to find in workspace files</div>
            </div>
        `;

        // Don't append to body - Activity Bar will manage it
        // Get references using querySelector on the container
        this.searchInput = this.container.querySelector('#global-search-input');
        this.resultsContainer = this.container.querySelector('#global-search-results');
        this.statusText = this.container.querySelector('#global-search-status-text');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Search button
        const searchBtn = this.container.querySelector('#global-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        // Enter key in search input
        if (this.searchInput) {
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });
        }
    }

    /**
     * Perform search
     */
    async performSearch() {
        const searchText = this.searchInput.value.trim();

        if (!searchText) {
            this.showStatus('Enter a search term', 'warning');
            return;
        }

        const options = {
            caseSensitive: this.container.querySelector('#global-search-case-sensitive')?.checked || false,
            wholeWord: this.container.querySelector('#global-search-whole-word')?.checked || false,
            useRegex: this.container.querySelector('#global-search-regex')?.checked || false
        };

        this.showStatus('Searching...', 'info');
        this.resultsContainer.innerHTML = '<div class="searching">Searching in files...</div>';

        try {
            const result = await window.electronAPI.globalSearch(searchText, options);

            if (result.success) {
                this.currentResults = result;
                this.displayResults(result);
            } else {
                this.showStatus(result.error || 'Search error', 'error');
                this.resultsContainer.innerHTML = `<div class="error-message">${result.error || 'Search error'}</div>`;
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showStatus('Search error: ' + error.message, 'error');
            this.resultsContainer.innerHTML = `<div class="error-message">Search error: ${error.message}</div>`;
        }
    }

    /**
     * Display search results
     * @param {Object} result - Search result
     */
    displayResults(result) {
        if (result.totalMatches === 0) {
            this.showStatus('No results found', 'warning');
            this.resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }

        this.showStatus(
            `${result.totalMatches} result${result.totalMatches > 1 ? 's' : ''} in ${result.totalFiles} file${result.totalFiles > 1 ? 's' : ''}`,
            'success'
        );

        let html = '';

        result.results.forEach(fileResult => {
            const fileName = fileResult.relativePath;
            const matchCount = fileResult.matches.length;

            html += `
                <div class="search-result-file">
                    <div class="file-header">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0H4zm0 1h5v3a1 1 0 0 0 1 1h3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                        </svg>
                        <span class="file-name">${this.escapeHtml(fileName)}</span>
                        <span class="match-count">${matchCount} result${matchCount > 1 ? 's' : ''}</span>
                    </div>
                    <div class="file-matches">
            `;

            fileResult.matches.forEach(match => {
                const highlightedLine = this.highlightMatches(match.lineText, match.matches);

                html += `
                    <div class="match-line" data-file="${this.escapeHtml(fileResult.filePath)}" data-line="${match.line}">
                        <span class="line-number">${match.line}</span>
                        <span class="line-content">${highlightedLine}</span>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        this.resultsContainer.innerHTML = html;

        // Attach click handlers to match lines
        this.resultsContainer.querySelectorAll('.match-line').forEach(element => {
            element.addEventListener('click', () => {
                const filePath = element.getAttribute('data-file');
                const line = parseInt(element.getAttribute('data-line'), 10);

                if (this.onFileClickCallback) {
                    this.onFileClickCallback(filePath, line);
                }
            });
        });
    }

    /**
     * Highlight matches in a line
     * @param {string} lineText - Line text
     * @param {Array} matches - Array of match positions
     * @returns {string} HTML with highlighted matches
     */
    highlightMatches(lineText, matches) {
        let result = '';
        let lastIndex = 0;

        matches.forEach(match => {
            // Add text before match
            result += this.escapeHtml(lineText.substring(lastIndex, match.start));
            // Add highlighted match
            result += `<mark>${this.escapeHtml(lineText.substring(match.start, match.end))}</mark>`;
            lastIndex = match.end;
        });

        // Add remaining text
        result += this.escapeHtml(lineText.substring(lastIndex));

        return result;
    }

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');

        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show status message
     * @param {string} message - Status message
     * @param {string} type - Message type (info, success, warning, error)
     */
    showStatus(message, type = 'info') {
        this.statusText.textContent = message;
        this.statusText.className = `status-${type}`;
    }

    /**
     * Show the global search panel
     */
    show() {
        this.isVisible = true;
        this.container.classList.remove('hidden');
        this.searchInput.focus();
    }

    /**
     * Hide the global search panel
     */
    hide() {
        this.isVisible = false;
        this.container.classList.add('hidden');
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Set callback for file click
     * @param {Function} callback - Callback function (filePath, line)
     */
    onFileClick(callback) {
        this.onFileClickCallback = callback;
    }
}

module.exports = GlobalSearchUI;
