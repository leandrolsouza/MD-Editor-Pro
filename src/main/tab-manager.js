/**
 * TabManager - Manages multiple open documents with tab-based navigation
 * Handles tab creation, switching, closing, and persistence
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

const { v4: uuidv4 } = require('uuid');

class TabManager {
    constructor(configStore) {
        if (!configStore) {
            throw new Error('ConfigStore is required');
        }
        this.configStore = configStore;
        this.tabs = new Map(); // Map<tabId, tabData>
        this.activeTabId = null;
    }

    /**
     * Create a new tab
     * @param {string|null} filePath - File path or null for unsaved
     * @param {string} content - Document content
     * @returns {Object} The created tab data
     */
    createTab(filePath = null, content = '') {
        const tabId = uuidv4();
        const now = Date.now();

        const tab = {
            id: tabId,
            filePath: filePath,
            content: content,
            isModified: false,
            title: filePath ? this._extractFileName(filePath) : 'Untitled',
            scrollPosition: 0,
            cursorPosition: 0,
            createdAt: now,
            lastModified: now
        };

        this.tabs.set(tabId, tab);

        // Set as active if it's the first tab
        if (this.tabs.size === 1) {
            this.activeTabId = tabId;
        }

        return tab;
    }

    /**
     * Close a tab
     * @param {string} tabId - Tab ID to close
     * @returns {boolean} True if tab was closed, false if not found
     */
    closeTab(tabId) {
        if (!this.tabs.has(tabId)) {
            return false;
        }

        this.tabs.delete(tabId);

        // If closing the active tab, switch to another tab
        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.keys());
            this.activeTabId = remainingTabs.length > 0 ? remainingTabs[0] : null;
        }

        return true;
    }

    /**
     * Switch to a different tab
     * @param {string} tabId - Tab ID to switch to
     * @returns {Object|null} The tab data or null if not found
     */
    switchTab(tabId) {
        if (!this.tabs.has(tabId)) {
            return null;
        }

        this.activeTabId = tabId;
        return this.tabs.get(tabId);
    }

    /**
     * Get a specific tab
     * @param {string} tabId - Tab ID
     * @returns {Object|null} The tab data or null if not found
     */
    getTab(tabId) {
        return this.tabs.get(tabId) || null;
    }

    /**
     * Get all tabs
     * @returns {Array} Array of all tab data
     */
    getAllTabs() {
        return Array.from(this.tabs.values());
    }

    /**
     * Get the active tab
     * @returns {Object|null} The active tab data or null
     */
    getActiveTab() {
        if (!this.activeTabId) {
            return null;
        }
        return this.tabs.get(this.activeTabId) || null;
    }

    /**
     * Get the active tab ID
     * @returns {string|null} The active tab ID or null
     */
    getActiveTabId() {
        return this.activeTabId;
    }

    /**
     * Mark a tab as modified or unmodified
     * @param {string} tabId - Tab ID
     * @param {boolean} isModified - Whether the tab is modified
     * @returns {boolean} True if successful, false if tab not found
     */
    markTabModified(tabId, isModified) {
        const tab = this.tabs.get(tabId);
        if (!tab) {
            return false;
        }

        tab.isModified = isModified;
        tab.lastModified = Date.now();
        return true;
    }

    /**
     * Check if a tab is modified
     * @param {string} tabId - Tab ID
     * @returns {boolean} True if modified, false otherwise
     */
    isTabModified(tabId) {
        const tab = this.tabs.get(tabId);
        return tab ? tab.isModified : false;
    }

    /**
     * Update tab content
     * @param {string} tabId - Tab ID
     * @param {string} content - New content
     * @returns {boolean} True if successful, false if tab not found
     */
    updateTabContent(tabId, content) {
        const tab = this.tabs.get(tabId);
        if (!tab) {
            return false;
        }

        tab.content = content;
        tab.lastModified = Date.now();
        return true;
    }

    /**
     * Update tab scroll position
     * @param {string} tabId - Tab ID
     * @param {number} position - Scroll position (0-1)
     * @returns {boolean} True if successful, false if tab not found
     */
    updateTabScrollPosition(tabId, position) {
        const tab = this.tabs.get(tabId);
        if (!tab) {
            return false;
        }

        tab.scrollPosition = position;
        return true;
    }

    /**
     * Update tab cursor position
     * @param {string} tabId - Tab ID
     * @param {number} position - Cursor position
     * @returns {boolean} True if successful, false if tab not found
     */
    updateTabCursorPosition(tabId, position) {
        const tab = this.tabs.get(tabId);
        if (!tab) {
            return false;
        }

        tab.cursorPosition = position;
        return true;
    }

    /**
     * Update tab file path (after save as)
     * @param {string} tabId - Tab ID
     * @param {string} filePath - New file path
     * @returns {boolean} True if successful, false if tab not found
     */
    updateTabFilePath(tabId, filePath) {
        const tab = this.tabs.get(tabId);
        if (!tab) {
            return false;
        }

        tab.filePath = filePath;
        tab.title = this._extractFileName(filePath);
        return true;
    }

    /**
     * Save tabs to persistent storage
     */
    saveTabs() {
        const tabIds = Array.from(this.tabs.keys());
        this.configStore.setLastOpenTabs(tabIds);
        this.configStore.setActiveTabId(this.activeTabId);

        // Store tab data in config
        const tabsData = {};
        for (const [tabId, tab] of this.tabs.entries()) {
            tabsData[tabId] = {
                filePath: tab.filePath,
                content: tab.content,
                isModified: tab.isModified,
                title: tab.title,
                scrollPosition: tab.scrollPosition,
                cursorPosition: tab.cursorPosition,
                createdAt: tab.createdAt,
                lastModified: tab.lastModified
            };
        }
        this.configStore.set('tabs.data', tabsData);
    }

    /**
     * Restore tabs from persistent storage
     */
    restoreTabs() {
        try {
            const tabIds = this.configStore.getLastOpenTabs();
            const activeTabId = this.configStore.getActiveTabId();
            const tabsData = this.configStore.get('tabs.data') || {};

            // Clear current tabs
            this.tabs.clear();
            this.activeTabId = null;

            // Restore tabs
            for (const tabId of tabIds) {
                const tabData = tabsData[tabId];
                if (tabData) {
                    this.tabs.set(tabId, {
                        id: tabId,
                        ...tabData
                    });
                }
            }

            // Restore active tab
            if (activeTabId && this.tabs.has(activeTabId)) {
                this.activeTabId = activeTabId;
            } else if (this.tabs.size > 0) {
                // If active tab not found, set first tab as active
                this.activeTabId = Array.from(this.tabs.keys())[0];
            }

            return this.tabs.size > 0;
        } catch (error) {
            console.error('Error restoring tabs:', error);
            return false;
        }
    }

    /**
     * Get the next tab ID in sequence (for keyboard navigation)
     * @returns {string|null} Next tab ID or null
     */
    getNextTabId() {
        if (!this.activeTabId || this.tabs.size === 0) {
            return null;
        }

        const tabIds = Array.from(this.tabs.keys());
        const currentIndex = tabIds.indexOf(this.activeTabId);

        if (currentIndex === -1) {
            return tabIds[0];
        }

        // Wrap around to first tab if at the end
        const nextIndex = (currentIndex + 1) % tabIds.length;
        return tabIds[nextIndex];
    }

    /**
     * Get the previous tab ID in sequence (for keyboard navigation)
     * @returns {string|null} Previous tab ID or null
     */
    getPreviousTabId() {
        if (!this.activeTabId || this.tabs.size === 0) {
            return null;
        }

        const tabIds = Array.from(this.tabs.keys());
        const currentIndex = tabIds.indexOf(this.activeTabId);

        if (currentIndex === -1) {
            return tabIds[tabIds.length - 1];
        }

        // Wrap around to last tab if at the beginning
        const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
        return tabIds[prevIndex];
    }

    /**
     * Extract file name from file path
     * @param {string} filePath - Full file path
     * @returns {string} File name
     * @private
     */
    _extractFileName(filePath) {
        if (!filePath) {
            return 'Untitled';
        }
        const parts = filePath.replace(/\\/g, '/').split('/');
        return parts[parts.length - 1] || 'Untitled';
    }
}

module.exports = TabManager;
