/**
 * TabBar - Manages the tab bar UI for multiple document tabs
 * Handles tab rendering, clicking, closing, and visual indicators
 * Requirements: 3.3, 3.5, 3.6
 */

class TabBar {
    constructor(container) {
        if (!container) {
            throw new Error('Container element is required');
        }
        this.container = container;
        this.tabs = new Map(); // Map<tabId, tabElement>
        this.activeTabId = null;
        this.tabClickCallbacks = [];
        this.tabCloseCallbacks = [];
    }

    /**
     * Initialize the tab bar
     */
    initialize() {
        this.container.className = 'tab-bar';
        this.container.setAttribute('role', 'tablist');
        this.container.setAttribute('aria-label', 'Document tabs');
        this.container.innerHTML = '';

        // Add scroll listener for fade indicators
        this.container.addEventListener('scroll', () => this._updateScrollIndicators());

        // Update indicators on resize
        window.addEventListener('resize', () => this._updateScrollIndicators());
    }

    /**
     * Add a new tab to the tab bar
     * @param {string} tabId - Tab ID
     * @param {string} title - Tab title
     * @param {boolean} isActive - Whether this tab is active
     * @param {boolean} isModified - Whether this tab has unsaved changes
     */
    addTab(tabId, title, isActive = false, isModified = false) {
        if (this.tabs.has(tabId)) {
            console.warn(`Tab ${tabId} already exists`);
            return;
        }

        const tabElement = document.createElement('div');

        tabElement.className = 'tab';
        tabElement.dataset.tabId = tabId;
        tabElement.setAttribute('role', 'tab');
        tabElement.setAttribute('aria-label', title);
        tabElement.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tabElement.setAttribute('tabindex', isActive ? '0' : '-1');

        if (isActive) {
            tabElement.classList.add('active');
            this.activeTabId = tabId;
        }

        // Tab title
        const titleElement = document.createElement('span');

        titleElement.className = 'tab-title';
        titleElement.textContent = title;
        tabElement.appendChild(titleElement);

        // Modified indicator
        const modifiedIndicator = document.createElement('span');

        modifiedIndicator.className = 'tab-modified-indicator';
        modifiedIndicator.setAttribute('aria-label', 'Modified');
        if (isModified) {
            modifiedIndicator.classList.add('visible');
        }
        tabElement.appendChild(modifiedIndicator);

        // Close button
        const closeButton = document.createElement('button');

        closeButton.className = 'tab-close-button';
        closeButton.textContent = '×';
        closeButton.title = 'Close tab';
        closeButton.setAttribute('aria-label', `Close ${title}`);
        closeButton.setAttribute('type', 'button');
        tabElement.appendChild(closeButton);

        // Event listeners
        tabElement.addEventListener('click', (e) => {
            // Don't trigger tab click if close button was clicked
            if (e.target === closeButton) {
                return;
            }
            this._handleTabClick(tabId);
        });

        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleTabClose(tabId);
        });

        this.tabs.set(tabId, tabElement);
        this.container.appendChild(tabElement);

        // Update scroll indicators after adding tab
        setTimeout(() => this._updateScrollIndicators(), 0);
    }

    /**
     * Remove a tab from the tab bar
     * @param {string} tabId - Tab ID
     */
    removeTab(tabId) {
        const tabElement = this.tabs.get(tabId);

        if (!tabElement) {
            return;
        }

        tabElement.remove();
        this.tabs.delete(tabId);

        if (this.activeTabId === tabId) {
            this.activeTabId = null;
        }

        // Update scroll indicators after removing tab
        setTimeout(() => this._updateScrollIndicators(), 0);
    }

    /**
     * Set the active tab
     * @param {string} tabId - Tab ID
     */
    setActiveTab(tabId) {
        // Remove active class from all tabs
        for (const [id, element] of this.tabs.entries()) {
            if (id === tabId) {
                element.classList.add('active');
                element.setAttribute('aria-selected', 'true');
                element.setAttribute('tabindex', '0');
            } else {
                element.classList.remove('active');
                element.setAttribute('aria-selected', 'false');
                element.setAttribute('tabindex', '-1');
            }
        }

        this.activeTabId = tabId;
    }

    /**
     * Update tab title
     * @param {string} tabId - Tab ID
     * @param {string} title - New title
     */
    updateTabTitle(tabId, title) {
        const tabElement = this.tabs.get(tabId);

        if (!tabElement) {
            return;
        }

        const titleElement = tabElement.querySelector('.tab-title');

        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    /**
     * Mark a tab as modified or unmodified
     * @param {string} tabId - Tab ID
     * @param {boolean} isModified - Whether the tab is modified
     */
    markTabModified(tabId, isModified) {
        const tabElement = this.tabs.get(tabId);

        if (!tabElement) {
            return;
        }

        const indicator = tabElement.querySelector('.tab-modified-indicator');

        if (indicator) {
            if (isModified) {
                indicator.classList.add('visible');
            } else {
                indicator.classList.remove('visible');
            }
        }
    }

    /**
     * Get all tab IDs in order
     * @returns {Array<string>} Array of tab IDs
     */
    getTabIds() {
        return Array.from(this.tabs.keys());
    }

    /**
     * Get the active tab ID
     * @returns {string|null} Active tab ID or null
     */
    getActiveTabId() {
        return this.activeTabId;
    }

    /**
     * Clear all tabs
     */
    clearTabs() {
        this.container.innerHTML = '';
        this.tabs.clear();
        this.activeTabId = null;
    }

    /**
     * Register a callback for tab clicks
     * @param {Function} callback - Callback function (tabId) => void
     */
    onTabClick(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.tabClickCallbacks.push(callback);
    }

    /**
     * Register a callback for tab close
     * @param {Function} callback - Callback function (tabId) => void
     */
    onTabClose(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.tabCloseCallbacks.push(callback);
    }

    /**
     * Switch to the next tab
     */
    nextTab() {
        if (this.tabs.size === 0) {
            return;
        }

        const tabIds = Array.from(this.tabs.keys());
        const currentIndex = tabIds.indexOf(this.activeTabId);

        if (currentIndex === -1) {
            this._handleTabClick(tabIds[0]);
            return;
        }

        const nextIndex = (currentIndex + 1) % tabIds.length;

        this._handleTabClick(tabIds[nextIndex]);
    }

    /**
     * Switch to the previous tab
     */
    previousTab() {
        if (this.tabs.size === 0) {
            return;
        }

        const tabIds = Array.from(this.tabs.keys());
        const currentIndex = tabIds.indexOf(this.activeTabId);

        if (currentIndex === -1) {
            this._handleTabClick(tabIds[tabIds.length - 1]);
            return;
        }

        const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;

        this._handleTabClick(tabIds[prevIndex]);
    }

    /**
     * Show a confirmation dialog for closing a modified tab
     * @param {string} title - Tab title
     * @returns {boolean} True if user confirms, false otherwise
     */
    async showCloseConfirmation(title) {
        return new Promise((resolve) => {
            const result = confirm(
                `"${title}" has unsaved changes.\n\nDo you want to close it anyway?`
            );

            resolve(result);
        });
    }

    /**
     * Update scroll indicators based on scroll position
     * @private
     */
    _updateScrollIndicators() {
        const { scrollLeft, scrollWidth, clientWidth } = this.container;

        // Check if content is scrollable
        const isScrollable = scrollWidth > clientWidth;

        if (!isScrollable) {
            this.container.classList.remove('scrollable-left', 'scrollable-right');
            return;
        }

        // Check if scrolled from left edge
        if (scrollLeft > 0) {
            this.container.classList.add('scrollable-left');
        } else {
            this.container.classList.remove('scrollable-left');
        }

        // Check if scrolled from right edge
        if (scrollLeft + clientWidth < scrollWidth - 1) {
            this.container.classList.add('scrollable-right');
        } else {
            this.container.classList.remove('scrollable-right');
        }
    }

    /**
     * Handle tab click
     * @param {string} tabId - Tab ID
     * @private
     */
    _handleTabClick(tabId) {
        this.tabClickCallbacks.forEach(callback => {
            try {
                callback(tabId);
            } catch (error) {
                console.error('Error in tab click callback:', error);
            }
        });
    }

    /**
     * Handle tab close
     * @param {string} tabId - Tab ID
     * @private
     */
    _handleTabClose(tabId) {
        this.tabCloseCallbacks.forEach(callback => {
            try {
                callback(tabId);
            } catch (error) {
                console.error('Error in tab close callback:', error);
            }
        });
    }

    /**
     * Destroy the tab bar
     */
    destroy() {
        this.clearTabs();
        this.tabClickCallbacks = [];
        this.tabCloseCallbacks = [];
    }
}

module.exports = TabBar;
