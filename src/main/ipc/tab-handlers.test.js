/**
 * Tests for tab-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./tab-handlers');

describe('tab-handlers', () => {
    let tabManager;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        tabManager = {
            createTab: vi.fn(),
            closeTab: vi.fn(),
            switchTab: vi.fn(),
            getTab: vi.fn(),
            getAllTabs: vi.fn(),
            getModifiedTabs: vi.fn(),
            getActiveTab: vi.fn(),
            getActiveTabId: vi.fn(),
            markTabModified: vi.fn(),
            updateTabContent: vi.fn(),
            updateTabScrollPosition: vi.fn(),
            updateTabCursorPosition: vi.fn(),
            updateTabFilePath: vi.fn(),
            saveTabs: vi.fn(),
            restoreTabs: vi.fn(),
            getNextTabId: vi.fn(),
            getPreviousTabId: vi.fn()
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ tabManager, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 16 tab IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(16);
        expect(handlers['tab:create']).toBeDefined();
        expect(handlers['tab:close']).toBeDefined();
        expect(handlers['tab:switch']).toBeDefined();
        expect(handlers['tab:get']).toBeDefined();
        expect(handlers['tab:get-all']).toBeDefined();
        expect(handlers['tab:get-modified']).toBeDefined();
        expect(handlers['tab:get-active']).toBeDefined();
        expect(handlers['tab:mark-modified']).toBeDefined();
        expect(handlers['tab:update-content']).toBeDefined();
        expect(handlers['tab:update-scroll']).toBeDefined();
        expect(handlers['tab:update-cursor']).toBeDefined();
        expect(handlers['tab:update-filepath']).toBeDefined();
        expect(handlers['tab:save']).toBeDefined();
        expect(handlers['tab:restore']).toBeDefined();
        expect(handlers['tab:get-next']).toBeDefined();
        expect(handlers['tab:get-previous']).toBeDefined();
    });

    describe('tab:create', () => {
        it('calls tabManager.createTab and returns success with tab', async () => {
            const mockTab = { id: 'tab-1', filePath: '/test.md', content: '# Hello' };
            tabManager.createTab.mockReturnValue(mockTab);

            const result = await handlers['tab:create']({}, '/test.md', '# Hello');

            expect(tabManager.createTab).toHaveBeenCalledWith('/test.md', '# Hello');
            expect(result).toEqual({ success: true, tab: mockTab });
        });

        it('throws when tabManager.createTab throws', async () => {
            tabManager.createTab.mockImplementation(() => { throw new Error('create failed'); });

            await expect(handlers['tab:create']({}, '/test.md', '')).rejects.toThrow('create failed');
        });
    });

    describe('tab:close', () => {
        it('calls tabManager.closeTab and returns success status', async () => {
            tabManager.closeTab.mockReturnValue(true);

            const result = await handlers['tab:close']({}, 'tab-1');

            expect(tabManager.closeTab).toHaveBeenCalledWith('tab-1');
            expect(result).toEqual({ success: true });
        });

        it('returns success false when tab not found', async () => {
            tabManager.closeTab.mockReturnValue(false);

            const result = await handlers['tab:close']({}, 'nonexistent');

            expect(result).toEqual({ success: false });
        });

        it('throws when tabManager.closeTab throws', async () => {
            tabManager.closeTab.mockImplementation(() => { throw new Error('close failed'); });

            await expect(handlers['tab:close']({}, 'tab-1')).rejects.toThrow('close failed');
        });
    });

    describe('tab:switch', () => {
        it('calls tabManager.switchTab and returns tab data', async () => {
            const mockTab = { id: 'tab-1', filePath: '/test.md' };
            tabManager.switchTab.mockReturnValue(mockTab);

            const result = await handlers['tab:switch']({}, 'tab-1');

            expect(tabManager.switchTab).toHaveBeenCalledWith('tab-1');
            expect(result).toEqual({ success: true, tab: mockTab });
        });

        it('returns success false when tab not found', async () => {
            tabManager.switchTab.mockReturnValue(null);

            const result = await handlers['tab:switch']({}, 'nonexistent');

            expect(result).toEqual({ success: false, tab: null });
        });
    });

    describe('tab:get', () => {
        it('calls tabManager.getTab and returns tab data', async () => {
            const mockTab = { id: 'tab-1', filePath: '/test.md' };
            tabManager.getTab.mockReturnValue(mockTab);

            const result = await handlers['tab:get']({}, 'tab-1');

            expect(tabManager.getTab).toHaveBeenCalledWith('tab-1');
            expect(result).toEqual({ success: true, tab: mockTab });
        });

        it('returns success false when tab not found', async () => {
            tabManager.getTab.mockReturnValue(null);

            const result = await handlers['tab:get']({}, 'nonexistent');

            expect(result).toEqual({ success: false, tab: null });
        });
    });

    describe('tab:get-all', () => {
        it('calls tabManager.getAllTabs and returns tabs array', async () => {
            const mockTabs = [{ id: 'tab-1' }, { id: 'tab-2' }];
            tabManager.getAllTabs.mockReturnValue(mockTabs);

            const result = await handlers['tab:get-all']({});

            expect(tabManager.getAllTabs).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, tabs: mockTabs });
        });
    });

    describe('tab:get-modified', () => {
        it('calls tabManager.getModifiedTabs and returns modified tabs', async () => {
            const mockTabs = [{ id: 'tab-1', isModified: true }];
            tabManager.getModifiedTabs.mockReturnValue(mockTabs);

            const result = await handlers['tab:get-modified']({});

            expect(tabManager.getModifiedTabs).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, tabs: mockTabs });
        });
    });

    describe('tab:get-active', () => {
        it('calls tabManager.getActiveTab and getActiveTabId', async () => {
            const mockTab = { id: 'tab-1', filePath: '/test.md' };
            tabManager.getActiveTab.mockReturnValue(mockTab);
            tabManager.getActiveTabId.mockReturnValue('tab-1');

            const result = await handlers['tab:get-active']({});

            expect(tabManager.getActiveTab).toHaveBeenCalledOnce();
            expect(tabManager.getActiveTabId).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, tab: mockTab, tabId: 'tab-1' });
        });

        it('returns null tab and tabId when no active tab', async () => {
            tabManager.getActiveTab.mockReturnValue(null);
            tabManager.getActiveTabId.mockReturnValue(null);

            const result = await handlers['tab:get-active']({});

            expect(result).toEqual({ success: true, tab: null, tabId: null });
        });
    });

    describe('tab:mark-modified', () => {
        it('calls tabManager.markTabModified and returns success', async () => {
            tabManager.markTabModified.mockReturnValue(true);

            const result = await handlers['tab:mark-modified']({}, 'tab-1', true);

            expect(tabManager.markTabModified).toHaveBeenCalledWith('tab-1', true);
            expect(result).toEqual({ success: true });
        });

        it('returns success false when tab not found', async () => {
            tabManager.markTabModified.mockReturnValue(false);

            const result = await handlers['tab:mark-modified']({}, 'nonexistent', true);

            expect(result).toEqual({ success: false });
        });
    });

    describe('tab:update-content', () => {
        it('calls tabManager.updateTabContent and returns success', async () => {
            tabManager.updateTabContent.mockReturnValue(true);

            const result = await handlers['tab:update-content']({}, 'tab-1', '# Updated');

            expect(tabManager.updateTabContent).toHaveBeenCalledWith('tab-1', '# Updated');
            expect(result).toEqual({ success: true });
        });

        it('returns success false when tab not found', async () => {
            tabManager.updateTabContent.mockReturnValue(false);

            const result = await handlers['tab:update-content']({}, 'nonexistent', 'content');

            expect(result).toEqual({ success: false });
        });
    });

    describe('tab:update-scroll', () => {
        it('calls tabManager.updateTabScrollPosition and returns success', async () => {
            tabManager.updateTabScrollPosition.mockReturnValue(true);

            const result = await handlers['tab:update-scroll']({}, 'tab-1', 0.5);

            expect(tabManager.updateTabScrollPosition).toHaveBeenCalledWith('tab-1', 0.5);
            expect(result).toEqual({ success: true });
        });

        it('returns success false when tab not found', async () => {
            tabManager.updateTabScrollPosition.mockReturnValue(false);

            const result = await handlers['tab:update-scroll']({}, 'nonexistent', 0);

            expect(result).toEqual({ success: false });
        });
    });

    describe('tab:update-cursor', () => {
        it('calls tabManager.updateTabCursorPosition and returns success', async () => {
            tabManager.updateTabCursorPosition.mockReturnValue(true);

            const result = await handlers['tab:update-cursor']({}, 'tab-1', 42);

            expect(tabManager.updateTabCursorPosition).toHaveBeenCalledWith('tab-1', 42);
            expect(result).toEqual({ success: true });
        });

        it('returns success false when tab not found', async () => {
            tabManager.updateTabCursorPosition.mockReturnValue(false);

            const result = await handlers['tab:update-cursor']({}, 'nonexistent', 0);

            expect(result).toEqual({ success: false });
        });
    });

    describe('tab:save', () => {
        it('calls tabManager.saveTabs and returns success', async () => {
            const result = await handlers['tab:save']({});

            expect(tabManager.saveTabs).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true });
        });

        it('throws when tabManager.saveTabs throws', async () => {
            tabManager.saveTabs.mockImplementation(() => { throw new Error('save failed'); });

            await expect(handlers['tab:save']({})).rejects.toThrow('save failed');
        });
    });

    describe('tab:restore', () => {
        it('calls tabManager.restoreTabs and returns result', async () => {
            tabManager.restoreTabs.mockReturnValue(true);

            const result = await handlers['tab:restore']({});

            expect(tabManager.restoreTabs).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true });
        });

        it('returns success false when no tabs to restore', async () => {
            tabManager.restoreTabs.mockReturnValue(false);

            const result = await handlers['tab:restore']({});

            expect(result).toEqual({ success: false });
        });
    });

    describe('tab:get-next', () => {
        it('calls tabManager.getNextTabId and returns tabId', async () => {
            tabManager.getNextTabId.mockReturnValue('tab-2');

            const result = await handlers['tab:get-next']({});

            expect(tabManager.getNextTabId).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, tabId: 'tab-2' });
        });

        it('returns null tabId when no next tab', async () => {
            tabManager.getNextTabId.mockReturnValue(null);

            const result = await handlers['tab:get-next']({});

            expect(result).toEqual({ success: true, tabId: null });
        });
    });

    describe('tab:get-previous', () => {
        it('calls tabManager.getPreviousTabId and returns tabId', async () => {
            tabManager.getPreviousTabId.mockReturnValue('tab-0');

            const result = await handlers['tab:get-previous']({});

            expect(tabManager.getPreviousTabId).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, tabId: 'tab-0' });
        });

        it('returns null tabId when no previous tab', async () => {
            tabManager.getPreviousTabId.mockReturnValue(null);

            const result = await handlers['tab:get-previous']({});

            expect(result).toEqual({ success: true, tabId: null });
        });
    });

    describe('tab:update-filepath', () => {
        it('calls tabManager.updateTabFilePath and returns success', async () => {
            tabManager.updateTabFilePath.mockReturnValue(true);

            const result = await handlers['tab:update-filepath']({}, 'tab-1', '/new/path.md');

            expect(tabManager.updateTabFilePath).toHaveBeenCalledWith('tab-1', '/new/path.md');
            expect(result).toEqual({ success: true });
        });

        it('returns success false when tab not found', async () => {
            tabManager.updateTabFilePath.mockReturnValue(false);

            const result = await handlers['tab:update-filepath']({}, 'nonexistent', '/path.md');

            expect(result).toEqual({ success: false });
        });

        it('throws when tabManager.updateTabFilePath throws', async () => {
            tabManager.updateTabFilePath.mockImplementation(() => { throw new Error('update failed'); });

            await expect(handlers['tab:update-filepath']({}, 'tab-1', '/path.md')).rejects.toThrow('update failed');
        });
    });
});
