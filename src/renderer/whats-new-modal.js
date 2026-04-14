/**
 * What's New Modal
 * Displays changelog/release notes in an accessible modal dialog
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 7.1, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5
 */

const i18n = require('./i18n/index.js');

class WhatsNewModal {
    /**
     * @param {import('./markdown-parser.js').MarkdownParser} markdownParser - Parser for rendering markdown content
     */
    constructor(markdownParser) {
        this.markdownParser = markdownParser;
        this.overlay = null;
        this.data = null;
        this.currentVersion = null;
        this.previouslyFocusedElement = null;

        // Bound handlers for cleanup
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleOverlayClick = this._handleOverlayClick.bind(this);
        this._handleVersionChange = this._handleVersionChange.bind(this);
    }

    /**
     * Initialize the component — checks if modal should auto-show
     * Requirement 1.1, 1.2, 1.3, 1.4
     */
    async initialize() {
        try {
            const data = await window.electronAPI.getWhatsNewData();

            if (data && data.shouldShow) {
                await this.show(data);
            }
        } catch (error) {
            console.error('WhatsNewModal: Failed to initialize:', error);
        }
    }

    /**
     * Show the modal with changelog data
     * @param {Object} [data] - Optional pre-fetched data. If not provided, fetches from preload.
     * Requirement 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.3, 8.1, 8.2, 8.3, 8.5
     */
    async show(data) {
        // Remove existing modal if open
        if (this.overlay) {
            this._removeModal();
        }

        try {
            if (!data) {
                data = await window.electronAPI.getWhatsNewData();
            }

            if (!data || !data.entries || data.entries.length === 0) {
                return;
            }

            this.data = data;
            this.currentVersion = data.currentVersion;

            // Save previously focused element for focus restoration (Req 8.4)
            this.previouslyFocusedElement = document.activeElement;

            this._createModal();
            this._attachEventListeners();

            // Move focus to first interactive element (Req 8.3)
            const firstFocusable = this._getFocusableElements()[0];
            if (firstFocusable) {
                firstFocusable.focus();
            }
        } catch (error) {
            console.error('WhatsNewModal: Failed to show:', error);
        }
    }

    /**
     * Close the modal and persist the seen version
     * Requirement 5.1, 5.2, 5.3, 8.4
     */
    async close() {
        if (!this.overlay) {
            return;
        }

        const versionToMark = this.currentVersion;

        this._removeModal();

        // Mark version as seen via preload (Req 5.1, 5.2, 5.3)
        try {
            if (versionToMark) {
                await window.electronAPI.markWhatsNewSeen(versionToMark);
            }
        } catch (error) {
            console.error('WhatsNewModal: Failed to mark version as seen:', error);
        }

        // Restore focus to previously focused element (Req 8.4)
        if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
            this.previouslyFocusedElement.focus();
        }
        this.previouslyFocusedElement = null;
    }

    /**
     * Update interface texts when locale changes
     * Requirement 7.1, 7.3
     */
    updateTranslations() {
        if (!this.overlay) {
            return;
        }

        const title = this.overlay.querySelector('#whats-new-title');
        if (title) {
            title.textContent = i18n.t('whatsNew.title');
        }

        const versionLabel = this.overlay.querySelector('.whats-new-version-selector label');
        if (versionLabel) {
            versionLabel.textContent = i18n.t('whatsNew.version');
        }

        const closeBtn = this.overlay.querySelector('.whats-new-close-btn');
        if (closeBtn) {
            closeBtn.textContent = i18n.t('whatsNew.close');
        }

        const closeX = this.overlay.querySelector('.whats-new-close');
        if (closeX) {
            closeX.setAttribute('aria-label', i18n.t('whatsNew.close'));
        }

        const select = this.overlay.querySelector('#whats-new-version-select');
        if (select) {
            select.setAttribute('aria-label', i18n.t('whatsNew.version'));
        }

        // Update dropdown option labels with translated format
        if (select && this.data && this.data.entries) {
            const options = select.querySelectorAll('option');
            options.forEach((option, index) => {
                const entry = this.data.entries[index];
                if (entry) {
                    option.textContent = i18n.t('whatsNew.versionDate', {
                        version: entry.version,
                        date: entry.date
                    });
                }
            });
        }
    }

    /**
     * Remove modal from DOM and clean up event listeners
     */
    destroy() {
        this._removeModal();
        this.data = null;
        this.currentVersion = null;
        this.previouslyFocusedElement = null;
    }

    // --- Private methods ---

    /**
     * Create the modal DOM structure
     * Requirement 3.1, 3.2, 3.3, 3.5, 4.1, 4.3, 8.1, 8.2
     */
    _createModal() {
        // Overlay (Req 8.1, 8.2)
        this.overlay = document.createElement('div');
        this.overlay.className = 'whats-new-overlay';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        this.overlay.setAttribute('aria-labelledby', 'whats-new-title');

        // Modal container
        const modal = document.createElement('div');
        modal.className = 'whats-new-modal';

        // Header
        const header = document.createElement('div');
        header.className = 'whats-new-header';

        const title = document.createElement('h2');
        title.id = 'whats-new-title';
        title.textContent = i18n.t('whatsNew.title');

        const versionSelector = document.createElement('div');
        versionSelector.className = 'whats-new-version-selector';

        const label = document.createElement('label');
        label.setAttribute('for', 'whats-new-version-select');
        label.textContent = i18n.t('whatsNew.version');

        const select = document.createElement('select');
        select.id = 'whats-new-version-select';
        select.setAttribute('aria-label', i18n.t('whatsNew.version'));

        // Populate dropdown with all versions (Req 4.1)
        this.data.entries.forEach(entry => {
            const option = document.createElement('option');
            option.value = entry.version;
            option.textContent = i18n.t('whatsNew.versionDate', {
                version: entry.version,
                date: entry.date
            });
            select.appendChild(option);
        });

        // Pre-select current version (Req 4.3)
        const currentEntry = this.data.entries.find(e => e.version === this.currentVersion);
        if (currentEntry) {
            select.value = this.currentVersion;
        }

        versionSelector.appendChild(label);
        versionSelector.appendChild(select);

        const closeX = document.createElement('button');
        closeX.className = 'whats-new-close';
        closeX.setAttribute('aria-label', i18n.t('whatsNew.close'));
        closeX.textContent = '✕';

        header.appendChild(title);
        header.appendChild(versionSelector);
        header.appendChild(closeX);

        // Body — render markdown content (Req 3.1, 3.4)
        const body = document.createElement('div');
        body.className = 'whats-new-body';
        this._renderContent(body, select.value);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'whats-new-footer';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'whats-new-close-btn';
        closeBtn.textContent = i18n.t('whatsNew.close');

        footer.appendChild(closeBtn);

        // Assemble
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        this.overlay.appendChild(modal);

        document.body.appendChild(this.overlay);
    }

    /**
     * Render markdown content for the selected version into the body element
     * Requirement 3.1, 3.4, 4.2
     */
    _renderContent(body, version) {
        const entry = this.data.entries.find(e => e.version === version);

        if (!entry) {
            body.innerHTML = '';
            return;
        }

        try {
            body.innerHTML = this.markdownParser.parse(entry.content);
        } catch (error) {
            console.error('WhatsNewModal: Failed to render markdown:', error);
            // Fallback: show as plain text in <pre>
            const pre = document.createElement('pre');
            pre.textContent = entry.content;
            body.innerHTML = '';
            body.appendChild(pre);
        }
    }

    /**
     * Attach event listeners for close, escape, overlay click, and dropdown change
     * Requirement 5.1, 5.2, 5.3, 4.2, 8.5
     */
    _attachEventListeners() {
        if (!this.overlay) {
            return;
        }

        // Close button (X)
        const closeX = this.overlay.querySelector('.whats-new-close');
        if (closeX) {
            closeX.addEventListener('click', () => this.close());
        }

        // Footer close button
        const closeBtn = this.overlay.querySelector('.whats-new-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Overlay click (Req 5.3)
        this.overlay.addEventListener('click', this._handleOverlayClick);

        // Escape key (Req 5.2) + Focus trap (Req 8.5)
        document.addEventListener('keydown', this._handleKeyDown);

        // Version dropdown change (Req 4.2)
        const select = this.overlay.querySelector('#whats-new-version-select');
        if (select) {
            select.addEventListener('change', this._handleVersionChange);
        }
    }

    /**
     * Remove event listeners
     */
    _detachEventListeners() {
        document.removeEventListener('keydown', this._handleKeyDown);

        // Other listeners are removed when the overlay is removed from DOM
    }

    /**
     * Handle overlay click — close only if clicking the overlay itself
     */
    _handleOverlayClick(event) {
        if (event.target === this.overlay) {
            this.close();
        }
    }

    /**
     * Handle keydown — Escape to close, Tab for focus trap
     * Requirement 5.2, 8.5
     */
    _handleKeyDown(event) {
        if (!this.overlay) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
            return;
        }

        // Focus trap (Req 8.5)
        if (event.key === 'Tab') {
            const focusableElements = this._getFocusableElements();

            if (focusableElements.length === 0) {
                event.preventDefault();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                // Shift+Tab: wrap from first to last
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab: wrap from last to first
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }

    /**
     * Handle version dropdown change
     * Requirement 4.2
     */
    _handleVersionChange(event) {
        const body = this.overlay.querySelector('.whats-new-body');
        if (body) {
            this._renderContent(body, event.target.value);
        }
    }

    /**
     * Get all focusable elements within the modal
     * Requirement 8.5
     */
    _getFocusableElements() {
        if (!this.overlay) {
            return [];
        }

        return Array.from(
            this.overlay.querySelectorAll(
                'button, select, input, textarea, a[href], [tabindex]:not([tabindex="-1"])'
            )
        ).filter(el => !el.disabled && el.offsetParent !== null);
    }

    /**
     * Remove modal from DOM and detach listeners
     */
    _removeModal() {
        this._detachEventListeners();

        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
    }
}

module.exports = WhatsNewModal;
