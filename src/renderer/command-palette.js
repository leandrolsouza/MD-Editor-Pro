/**
 * Command Palette - VS Code-style command palette with fuzzy search
 * Provides quick access to all application commands via Ctrl+Shift+P
 */

const i18n = require('./i18n/index.js');
const { getIcon } = require('./icons.js');

class CommandPalette {
    constructor() {
        this.overlay = null;
        this.container = null;
        this.input = null;
        this.resultsList = null;
        this.commands = [];
        this.filteredCommands = [];
        this.selectedIndex = 0;
        this.isVisible = false;
        this.onExecute = null;
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onOverlayClick = this._onOverlayClick.bind(this);
    }

    /**
     * Initialize the command palette UI
     */
    initialize() {
        this._createDOM();
        this._setupGlobalShortcut();
    }

    /**
     * Register all available commands
     * @param {Array<{id: string, label: string, category: string, shortcut?: string, icon?: string, execute: Function}>} commands
     */
    registerCommands(commands) {
        this.commands = commands;
    }

    /**
     * Open the command palette
     */
    show() {
        if (this.isVisible) return;
        this.isVisible = true;

        this.overlay.classList.add('visible');
        this.container.classList.add('visible');
        this.input.value = '';
        this.selectedIndex = 0;
        this.filteredCommands = [...this.commands];
        this._renderResults();
        this.input.focus();

        document.addEventListener('keydown', this._onKeyDown);
    }

    /**
     * Close the command palette
     */
    hide() {
        if (!this.isVisible) return;
        this.isVisible = false;

        this.overlay.classList.remove('visible');
        this.container.classList.remove('visible');
        this.input.value = '';

        document.removeEventListener('keydown', this._onKeyDown);
    }

    /**
     * Create the DOM structure
     * @private
     */
    _createDOM() {
        // Overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'command-palette-overlay';
        this.overlay.addEventListener('click', this._onOverlayClick);

        // Container
        this.container = document.createElement('div');
        this.container.className = 'command-palette';
        this.container.setAttribute('role', 'dialog');
        this.container.setAttribute('aria-label', i18n.t('commandPalette.title'));

        // Input wrapper
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'command-palette__input-wrapper';

        const searchIcon = document.createElement('span');
        searchIcon.className = 'command-palette__search-icon';
        searchIcon.innerHTML = getIcon('search');

        this.input = document.createElement('input');
        this.input.className = 'command-palette__input';
        this.input.type = 'text';
        this.input.placeholder = i18n.t('commandPalette.placeholder');
        this.input.setAttribute('aria-label', i18n.t('commandPalette.placeholder'));
        this.input.setAttribute('autocomplete', 'off');
        this.input.setAttribute('spellcheck', 'false');

        this.input.addEventListener('input', () => {
            this._filterCommands(this.input.value);
        });

        inputWrapper.appendChild(searchIcon);
        inputWrapper.appendChild(this.input);

        // Results list
        this.resultsList = document.createElement('div');
        this.resultsList.className = 'command-palette__results';
        this.resultsList.setAttribute('role', 'listbox');

        this.container.appendChild(inputWrapper);
        this.container.appendChild(this.resultsList);

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.container);
    }

    /**
     * Setup global keyboard shortcut (Ctrl+Shift+P)
     * @private
     */
    _setupGlobalShortcut() {
        document.addEventListener('keydown', (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifier = isMac ? e.metaKey : e.ctrlKey;

            if (modifier && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                if (this.isVisible) {
                    this.hide();
                } else {
                    this.show();
                }
            }
        });
    }

    /**
     * Filter commands based on query using fuzzy matching
     * @param {string} query
     * @private
     */
    _filterCommands(query) {
        if (!query.trim()) {
            this.filteredCommands = [...this.commands];
        } else {
            const lowerQuery = query.toLowerCase();
            this.filteredCommands = this.commands
                .map(cmd => {
                    const score = this._fuzzyScore(cmd, lowerQuery);
                    return { ...cmd, score };
                })
                .filter(cmd => cmd.score > 0)
                .sort((a, b) => b.score - a.score);
        }

        this.selectedIndex = 0;
        this._renderResults();
    }

    /**
     * Calculate fuzzy match score for a command
     * @param {Object} cmd - Command object
     * @param {string} query - Lowercase query string
     * @returns {number} Score (0 = no match)
     * @private
     */
    _fuzzyScore(cmd, query) {
        const label = cmd.label.toLowerCase();
        const category = cmd.category.toLowerCase();
        const combined = `${category}: ${label}`;

        // Exact substring match gets highest score
        if (label.includes(query)) return 100;
        if (category.includes(query)) return 80;
        if (combined.includes(query)) return 90;

        // Fuzzy character matching
        let score = 0;
        let queryIdx = 0;

        for (let i = 0; i < label.length && queryIdx < query.length; i++) {
            if (label[i] === query[queryIdx]) {
                score += 10;
                // Bonus for consecutive matches
                if (i > 0 && label[i - 1] === query[queryIdx - 1]) {
                    score += 5;
                }
                // Bonus for matching at word boundaries
                if (i === 0 || label[i - 1] === ' ' || label[i - 1] === '-') {
                    score += 8;
                }
                queryIdx++;
            }
        }

        // All query characters must be found
        return queryIdx === query.length ? score : 0;
    }

    /**
     * Render the filtered results list
     * @private
     */
    _renderResults() {
        this.resultsList.innerHTML = '';

        if (this.filteredCommands.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'command-palette__empty';
            empty.textContent = i18n.t('commandPalette.noResults');
            this.resultsList.appendChild(empty);
            return;
        }

        // Group by category
        let currentCategory = null;

        this.filteredCommands.forEach((cmd, index) => {
            // Category separator (only when not filtering)
            if (!this.input.value.trim() && cmd.category !== currentCategory) {
                currentCategory = cmd.category;
                const separator = document.createElement('div');
                separator.className = 'command-palette__category';
                separator.textContent = cmd.category;
                this.resultsList.appendChild(separator);
            }

            const item = document.createElement('div');
            item.className = 'command-palette__item';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', index === this.selectedIndex ? 'true' : 'false');

            if (index === this.selectedIndex) {
                item.classList.add('selected');
            }

            // Icon
            if (cmd.icon) {
                const iconEl = document.createElement('span');
                iconEl.className = 'command-palette__item-icon';
                iconEl.innerHTML = getIcon(cmd.icon);
                item.appendChild(iconEl);
            }

            // Label with category prefix when filtering
            const labelEl = document.createElement('span');
            labelEl.className = 'command-palette__item-label';

            if (this.input.value.trim()) {
                const categorySpan = document.createElement('span');
                categorySpan.className = 'command-palette__item-category';
                categorySpan.textContent = cmd.category + ': ';
                labelEl.appendChild(categorySpan);
            }

            const textSpan = document.createElement('span');
            textSpan.textContent = cmd.label;
            labelEl.appendChild(textSpan);
            item.appendChild(labelEl);

            // Shortcut badge
            if (cmd.shortcut) {
                const shortcutEl = document.createElement('span');
                shortcutEl.className = 'command-palette__item-shortcut';
                shortcutEl.textContent = cmd.shortcut;
                item.appendChild(shortcutEl);
            }

            item.addEventListener('click', () => {
                this._executeCommand(cmd);
            });

            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this._updateSelection();
            });

            this.resultsList.appendChild(item);
        });
    }

    /**
     * Update visual selection without re-rendering
     * @private
     */
    _updateSelection() {
        const items = this.resultsList.querySelectorAll('.command-palette__item');
        items.forEach((item, idx) => {
            if (idx === this.selectedIndex) {
                item.classList.add('selected');
                item.setAttribute('aria-selected', 'true');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
                item.setAttribute('aria-selected', 'false');
            }
        });
    }

    /**
     * Execute the selected command
     * @param {Object} cmd
     * @private
     */
    _executeCommand(cmd) {
        this.hide();
        if (cmd.execute) {
            cmd.execute();
        }
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e
     * @private
     */
    _onKeyDown(e) {
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                this.hide();
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (this.filteredCommands.length > 0) {
                    this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length;
                    this._updateSelection();
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (this.filteredCommands.length > 0) {
                    this.selectedIndex = (this.selectedIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length;
                    this._updateSelection();
                }
                break;

            case 'Enter':
                e.preventDefault();
                if (this.filteredCommands.length > 0 && this.selectedIndex < this.filteredCommands.length) {
                    this._executeCommand(this.filteredCommands[this.selectedIndex]);
                }
                break;
        }
    }

    /**
     * Handle overlay click to close
     * @private
     */
    _onOverlayClick() {
        this.hide();
    }

    /**
     * Update translations when locale changes
     */
    updateTranslations() {
        if (this.input) {
            this.input.placeholder = i18n.t('commandPalette.placeholder');
            this.input.setAttribute('aria-label', i18n.t('commandPalette.placeholder'));
        }
        if (this.container) {
            this.container.setAttribute('aria-label', i18n.t('commandPalette.title'));
        }
    }

    /**
     * Destroy the command palette and clean up
     */
    destroy() {
        document.removeEventListener('keydown', this._onKeyDown);
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

module.exports = CommandPalette;
