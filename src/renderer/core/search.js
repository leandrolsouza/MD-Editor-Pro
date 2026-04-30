/**
 * SearchManager class - Manages find and replace functionality
 * Integrates with CodeMirror 6 search functionality
 */

const { searchKeymap, highlightSelectionMatches, SearchQuery, setSearchQuery, findNext, findPrevious, replaceNext, replaceAll } = require('@codemirror/search');
const i18n = require('../i18n/index.js');

class SearchManager {
    constructor(editor) {
        if (!editor) {
            throw new Error('Editor instance is required');
        }
        this.editor = editor;
        this.searchPanel = null;
        this.searchInput = null;
        this.replaceInput = null;
        this.searchResults = null;
        this.replaceControls = null;
        this.currentMatchIndex = 0;
        this.totalMatches = 0;
    }

    /**
     * Initialize the search manager with DOM elements
     */
    initialize() {
        this.searchPanel = document.getElementById('search-panel');
        this.searchInput = document.getElementById('search-input');
        this.replaceInput = document.getElementById('replace-input');
        this.searchResults = document.getElementById('search-results');

        if (!this.searchPanel || !this.searchInput || !this.replaceInput || !this.searchResults) {
            throw new Error('Required search UI elements not found');
        }

        this.replaceControls = this.searchPanel.querySelector('.replace-controls');

        this._setupEventListeners();
    }

    /**
     * Setup event listeners for search UI
     * @private
     */
    _setupEventListeners() {
        // Search input - trigger search on input
        this.searchInput.addEventListener('input', () => {
            this.search(this.searchInput.value);
        });

        // Search input - handle Enter key
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    this.navigatePrevious();
                } else {
                    this.navigateNext();
                }
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });

        // Replace input - handle Enter key
        this.replaceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.replace(this.replaceInput.value);
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });

        // Navigation buttons
        document.getElementById('search-prev').addEventListener('click', () => {
            this.navigatePrevious();
        });

        document.getElementById('search-next').addEventListener('click', () => {
            this.navigateNext();
        });

        // Close button
        document.getElementById('search-close').addEventListener('click', () => {
            this.hide();
        });

        // Replace buttons
        document.getElementById('replace-current').addEventListener('click', () => {
            this.replace(this.replaceInput.value);
        });

        document.getElementById('replace-all').addEventListener('click', () => {
            this.replaceAll(this.replaceInput.value);
        });

        // Toggle replace controls
        document.getElementById('toggle-replace').addEventListener('click', () => {
            this._toggleReplaceControls();
        });

        // Focus trap for keyboard navigation
        this.searchPanel.addEventListener('keydown', (e) => {
            this._handleFocusTrap(e);
        });
    }

    /**
     * Handle focus trap to keep keyboard navigation within search panel
     * @param {KeyboardEvent} e - The keyboard event
     * @private
     */
    _handleFocusTrap(e) {
        if (e.key !== 'Tab') {
            return;
        }

        // Get all focusable elements within the search panel
        const focusableElements = this.searchPanel.querySelectorAll(
            'input:not([disabled]), button:not([disabled])'
        );

        // Filter out hidden elements (like replace controls when hidden)
        const visibleFocusableElements = Array.from(focusableElements).filter(el => {
            return el.offsetParent !== null && !el.closest('.hidden');
        });

        if (visibleFocusableElements.length === 0) {
            return;
        }

        const firstElement = visibleFocusableElements[0];
        const lastElement = visibleFocusableElements[visibleFocusableElements.length - 1];

        // If shift+tab on first element, focus last element
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        }
        // If tab on last element, focus first element
        else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    /**
     * Show the search panel
     */
    show() {
        if (!this.searchPanel) {
            throw new Error('SearchManager not initialized');
        }

        this.searchPanel.classList.remove('hidden');
        this.searchInput.focus();
        this.searchInput.select();
    }

    /**
     * Hide the search panel
     */
    hide() {
        if (!this.searchPanel) {
            throw new Error('SearchManager not initialized');
        }

        this.searchPanel.classList.add('hidden');

        // Clear search highlighting by setting empty query
        if (this.editor.view) {
            const transaction = this.editor.view.state.update({
                effects: setSearchQuery.of(new SearchQuery({
                    search: '',
                    caseSensitive: false,
                    regexp: false
                }))
            });

            this.editor.view.dispatch(transaction);
        }

        // Return focus to editor
        if (this.editor.view) {
            this.editor.view.focus();
        }
    }

    /**
     * Toggle replace controls visibility
     * @private
     */
    _toggleReplaceControls() {
        if (!this.replaceControls) {
            return;
        }

        const isHidden = this.replaceControls.classList.contains('hidden');
        const toggleButton = document.getElementById('toggle-replace');

        if (isHidden) {
            this.replaceControls.classList.remove('hidden');
            toggleButton.textContent = '▲';
            toggleButton.setAttribute('aria-expanded', 'true');
        } else {
            this.replaceControls.classList.add('hidden');
            toggleButton.textContent = '▼';
            toggleButton.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Search for a query string and highlight all occurrences
     * @param {string} query - The search query
     * @returns {Array} Array of search results
     */
    search(query) {
        if (!this.editor.view) {
            throw new Error('Editor not initialized');
        }

        if (!query) {
            this._updateResultsDisplay(0, 0);
            return [];
        }

        // Create search query
        const searchQuery = new SearchQuery({
            search: query,
            caseSensitive: false,
            regexp: false,
            wholeWord: false
        });

        // Apply search query to editor
        const transaction = this.editor.view.state.update({
            effects: setSearchQuery.of(searchQuery)
        });

        this.editor.view.dispatch(transaction);

        // Count matches
        const results = this._findAllMatches(query);

        this.totalMatches = results.length;

        // Find current match index based on cursor position
        const cursorPos = this.editor.view.state.selection.main.head;

        this.currentMatchIndex = this._findCurrentMatchIndex(results, cursorPos);

        this._updateResultsDisplay(this.currentMatchIndex, this.totalMatches);

        return results;
    }

    /**
     * Find all matches in the document
     * @param {string} query - The search query
     * @returns {Array} Array of match positions
     * @private
     */
    _findAllMatches(query) {
        const content = this.editor.getValue();
        const results = [];
        const lowerQuery = query.toLowerCase();
        const lowerContent = content.toLowerCase();

        let index = 0;

        while ((index = lowerContent.indexOf(lowerQuery, index)) !== -1) {
            results.push({
                from: index,
                to: index + query.length,
                text: content.substring(index, index + query.length)
            });
            index += query.length;
        }

        return results;
    }

    /**
     * Find the index of the current match based on cursor position
     * @param {Array} results - Array of match positions
     * @param {number} cursorPos - Current cursor position
     * @returns {number} Index of current match (1-based)
     * @private
     */
    _findCurrentMatchIndex(results, cursorPos) {
        if (results.length === 0) {
            return 0;
        }

        for (let i = 0; i < results.length; i++) {
            if (results[i].from >= cursorPos) {
                return i + 1;
            }
        }

        return 1; // Default to first match
    }

    /**
     * Update the results display
     * @param {number} current - Current match index (1-based)
     * @param {number} total - Total number of matches
     * @private
     */
    _updateResultsDisplay(current, total) {
        if (!this.searchResults) {
            return;
        }

        if (total === 0) {
            this.searchResults.textContent = i18n.t('search.noResults');
        } else {
            this.searchResults.textContent = i18n.t('search.resultsCount', { current, total });
        }
    }

    /**
     * Navigate using a CodeMirror find command and update match display
     * @param {Function} cmFindCommand - CodeMirror command (findNext or findPrevious)
     * @private
     */
    _navigateFind(cmFindCommand) {
        if (!this.editor.view) {
            throw new Error('Editor not initialized');
        }

        const query = this.searchInput.value;

        if (!query) {
            return;
        }

        // Execute the CodeMirror find command
        cmFindCommand(this.editor.view);

        // Update current match index
        const results = this._findAllMatches(query);
        const cursorPos = this.editor.view.state.selection.main.head;

        this.currentMatchIndex = this._findCurrentMatchIndex(results, cursorPos);
        this._updateResultsDisplay(this.currentMatchIndex, this.totalMatches);
    }

    /**
     * Execute a replace operation using a CodeMirror replace command
     * @param {string} replacement - The replacement text
     * @param {Function} cmReplaceCommand - CodeMirror command (replaceNext or replaceAll)
     * @private
     */
    _executeReplace(replacement, cmReplaceCommand) {
        if (!this.editor.view) {
            throw new Error('Editor not initialized');
        }

        const query = this.searchInput.value;

        if (!query) {
            return;
        }

        // Set search query with replacement text
        const searchQuery = new SearchQuery({
            search: query,
            replace: replacement,
            caseSensitive: false,
            regexp: false
        });

        const transaction = this.editor.view.state.update({
            effects: setSearchQuery.of(searchQuery)
        });

        this.editor.view.dispatch(transaction);

        // Execute the CodeMirror replace command
        cmReplaceCommand(this.editor.view);

        // Update search results after replacement
        setTimeout(() => {
            if (this.editor.view) {
                this.search(query);
            }
        }, 10);
    }

    /**
     * Navigate to the next search result
     */
    navigateNext() {
        this._navigateFind(findNext);
    }

    /**
     * Navigate to the previous search result
     */
    navigatePrevious() {
        this._navigateFind(findPrevious);
    }

    /**
     * Replace the current occurrence with replacement text
     * @param {string} replacement - The replacement text
     */
    replace(replacement) {
        this._executeReplace(replacement, replaceNext);
    }

    /**
     * Replace all occurrences with replacement text
     * @param {string} replacement - The replacement text
     */
    replaceAll(replacement) {
        this._executeReplace(replacement, replaceAll);
    }

    /**
     * Check if search panel is visible
     * @returns {boolean} True if visible
     */
    isVisible() {
        if (!this.searchPanel) {
            return false;
        }
        return !this.searchPanel.classList.contains('hidden');
    }

    /**
     * Get the current match index (0-based for testing compatibility)
     * @returns {number} Current match index (0-based)
     */
    get currentIndex() {
        // Convert from 1-based to 0-based for test compatibility
        return this.currentMatchIndex > 0 ? this.currentMatchIndex - 1 : 0;
    }
}

module.exports = SearchManager;
