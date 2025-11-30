/**
 * TabManager Tests
 * Tests for tab management functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import TabManager from './tab-manager.js';

// Mock ConfigStore
class MockConfigStore {
    constructor() {
        this.data = {
            'tabs.lastOpenTabs': [],
            'tabs.activeTabId': null,
            'tabs.data': {}
        };
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
    }

    getLastOpenTabs() {
        return this.data['tabs.lastOpenTabs'];
    }

    setLastOpenTabs(tabIds) {
        this.data['tabs.lastOpenTabs'] = tabIds;
    }

    getActiveTabId() {
        return this.data['tabs.activeTabId'];
    }

    setActiveTabId(tabId) {
        this.data['tabs.activeTabId'] = tabId;
    }
}

describe('TabManager', () => {
    let tabManager;
    let configStore;

    beforeEach(() => {
        configStore = new MockConfigStore();
        tabManager = new TabManager(configStore);
    });

    describe('Constructor', () => {
        it('should throw error if ConfigStore is not provided', () => {
            expect(() => new TabManager()).toThrow('ConfigStore is required');
        });

        it('should initialize with empty tabs', () => {
            expect(tabManager.getAllTabs()).toEqual([]);
            expect(tabManager.getActiveTabId()).toBeNull();
        });
    });

    describe('createTab', () => {
        it('should create a new tab with file path', () => {
            const tab = tabManager.createTab('/path/to/file.md', 'content');

            expect(tab).toBeDefined();
            expect(tab.id).toBeDefined();
            expect(tab.filePath).toBe('/path/to/file.md');
            expect(tab.content).toBe('content');
            expect(tab.isModified).toBe(false);
            expect(tab.title).toBe('file.md');
        });

        it('should create a new tab without file path', () => {
            const tab = tabManager.createTab(null, 'content');

            expect(tab).toBeDefined();
            expect(tab.filePath).toBeNull();
            expect(tab.title).toBe('Untitled');
        });

        it('should set first tab as active', () => {
            const tab = tabManager.createTab(null, 'content');
            expect(tabManager.getActiveTabId()).toBe(tab.id);
        });

        it('should not change active tab when creating second tab', () => {
            const tab1 = tabManager.createTab(null, 'content1');
            const tab2 = tabManager.createTab(null, 'content2');

            expect(tabManager.getActiveTabId()).toBe(tab1.id);
        });
    });

    describe('closeTab', () => {
        it('should close an existing tab', () => {
            const tab = tabManager.createTab(null, 'content');
            const result = tabManager.closeTab(tab.id);

            expect(result).toBe(true);
            expect(tabManager.getAllTabs()).toHaveLength(0);
        });

        it('should return false for non-existent tab', () => {
            const result = tabManager.closeTab('non-existent-id');
            expect(result).toBe(false);
        });

        it('should switch to another tab when closing active tab', () => {
            const tab1 = tabManager.createTab(null, 'content1');
            const tab2 = tabManager.createTab(null, 'content2');

            tabManager.closeTab(tab1.id);
            expect(tabManager.getActiveTabId()).toBe(tab2.id);
        });

        it('should set active tab to null when closing last tab', () => {
            const tab = tabManager.createTab(null, 'content');
            tabManager.closeTab(tab.id);

            expect(tabManager.getActiveTabId()).toBeNull();
        });
    });

    describe('switchTab', () => {
        it('should switch to an existing tab', () => {
            const tab1 = tabManager.createTab(null, 'content1');
            const tab2 = tabManager.createTab(null, 'content2');

            const result = tabManager.switchTab(tab2.id);

            expect(result).toBeDefined();
            expect(result.id).toBe(tab2.id);
            expect(tabManager.getActiveTabId()).toBe(tab2.id);
        });

        it('should return null for non-existent tab', () => {
            const result = tabManager.switchTab('non-existent-id');
            expect(result).toBeNull();
        });
    });

    describe('getTab', () => {
        it('should get an existing tab', () => {
            const tab = tabManager.createTab('/path/to/file.md', 'content');
            const retrieved = tabManager.getTab(tab.id);

            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(tab.id);
        });

        it('should return null for non-existent tab', () => {
            const result = tabManager.getTab('non-existent-id');
            expect(result).toBeNull();
        });
    });

    describe('getAllTabs', () => {
        it('should return all tabs', () => {
            tabManager.createTab(null, 'content1');
            tabManager.createTab(null, 'content2');
            tabManager.createTab(null, 'content3');

            const tabs = tabManager.getAllTabs();
            expect(tabs).toHaveLength(3);
        });

        it('should return empty array when no tabs', () => {
            const tabs = tabManager.getAllTabs();
            expect(tabs).toEqual([]);
        });
    });

    describe('markTabModified', () => {
        it('should mark tab as modified', () => {
            const tab = tabManager.createTab(null, 'content');
            const result = tabManager.markTabModified(tab.id, true);

            expect(result).toBe(true);
            expect(tabManager.isTabModified(tab.id)).toBe(true);
        });

        it('should mark tab as unmodified', () => {
            const tab = tabManager.createTab(null, 'content');
            tabManager.markTabModified(tab.id, true);
            tabManager.markTabModified(tab.id, false);

            expect(tabManager.isTabModified(tab.id)).toBe(false);
        });

        it('should return false for non-existent tab', () => {
            const result = tabManager.markTabModified('non-existent-id', true);
            expect(result).toBe(false);
        });
    });

    describe('updateTabContent', () => {
        it('should update tab content', () => {
            const tab = tabManager.createTab(null, 'old content');
            const result = tabManager.updateTabContent(tab.id, 'new content');

            expect(result).toBe(true);
            const updated = tabManager.getTab(tab.id);
            expect(updated.content).toBe('new content');
        });

        it('should return false for non-existent tab', () => {
            const result = tabManager.updateTabContent('non-existent-id', 'content');
            expect(result).toBe(false);
        });
    });

    describe('updateTabFilePath', () => {
        it('should update tab file path and title', () => {
            const tab = tabManager.createTab(null, 'content');
            const result = tabManager.updateTabFilePath(tab.id, '/path/to/newfile.md');

            expect(result).toBe(true);
            const updated = tabManager.getTab(tab.id);
            expect(updated.filePath).toBe('/path/to/newfile.md');
            expect(updated.title).toBe('newfile.md');
        });

        it('should return false for non-existent tab', () => {
            const result = tabManager.updateTabFilePath('non-existent-id', '/path/to/file.md');
            expect(result).toBe(false);
        });
    });

    describe('getNextTabId', () => {
        it('should get next tab ID', () => {
            const tab1 = tabManager.createTab(null, 'content1');
            const tab2 = tabManager.createTab(null, 'content2');

            const nextId = tabManager.getNextTabId();
            expect(nextId).toBe(tab2.id);
        });

        it('should wrap around to first tab', () => {
            const tab1 = tabManager.createTab(null, 'content1');
            const tab2 = tabManager.createTab(null, 'content2');

            tabManager.switchTab(tab2.id);
            const nextId = tabManager.getNextTabId();
            expect(nextId).toBe(tab1.id);
        });

        it('should return null when no tabs', () => {
            const nextId = tabManager.getNextTabId();
            expect(nextId).toBeNull();
        });
    });

    describe('getPreviousTabId', () => {
        it('should get previous tab ID', () => {
            const tab1 = tabManager.createTab(null, 'content1');
            const tab2 = tabManager.createTab(null, 'content2');

            tabManager.switchTab(tab2.id);
            const prevId = tabManager.getPreviousTabId();
            expect(prevId).toBe(tab1.id);
        });

        it('should wrap around to last tab', () => {
            const tab1 = tabManager.createTab(null, 'content1');
            const tab2 = tabManager.createTab(null, 'content2');

            const prevId = tabManager.getPreviousTabId();
            expect(prevId).toBe(tab2.id);
        });

        it('should return null when no tabs', () => {
            const prevId = tabManager.getPreviousTabId();
            expect(prevId).toBeNull();
        });
    });

    describe('saveTabs and restoreTabs', () => {
        it('should save and restore tabs', () => {
            const tab1 = tabManager.createTab('/path/to/file1.md', 'content1');
            const tab2 = tabManager.createTab('/path/to/file2.md', 'content2');
            tabManager.markTabModified(tab2.id, true);

            tabManager.saveTabs();

            // Create new tab manager with same config store
            const newTabManager = new TabManager(configStore);
            const restored = newTabManager.restoreTabs();

            expect(restored).toBe(true);
            expect(newTabManager.getAllTabs()).toHaveLength(2);
            expect(newTabManager.getActiveTabId()).toBe(tab1.id);
        });

        it('should return false when no tabs to restore', () => {
            const result = tabManager.restoreTabs();
            expect(result).toBe(false);
        });
    });
});
