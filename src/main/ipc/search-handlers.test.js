/**
 * Tests for search-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./search-handlers');

describe('search-handlers', () => {
    let globalSearchManager;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        globalSearchManager = {
            searchInWorkspace: vi.fn()
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ globalSearchManager, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers the global-search:search IPC handler', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(1);
        expect(handlers['global-search:search']).toBeDefined();
    });

    describe('global-search:search', () => {
        it('calls globalSearchManager.searchInWorkspace with searchText and options', async () => {
            const mockResults = { success: true, results: [{ file: 'test.md', line: 1 }] };
            globalSearchManager.searchInWorkspace.mockResolvedValue(mockResults);

            const result = await handlers['global-search:search']({}, 'hello', { caseSensitive: true });

            expect(globalSearchManager.searchInWorkspace).toHaveBeenCalledWith('hello', { caseSensitive: true });
            expect(result).toEqual(mockResults);
        });

        it('passes searchText without options', async () => {
            const mockResults = { success: true, results: [] };
            globalSearchManager.searchInWorkspace.mockResolvedValue(mockResults);

            const result = await handlers['global-search:search']({}, 'query', undefined);

            expect(globalSearchManager.searchInWorkspace).toHaveBeenCalledWith('query', undefined);
            expect(result).toEqual(mockResults);
        });

        it('throws when globalSearchManager.searchInWorkspace throws', async () => {
            globalSearchManager.searchInWorkspace.mockRejectedValue(new Error('search failed'));

            await expect(handlers['global-search:search']({}, 'test', {})).rejects.toThrow('search failed');
        });
    });
});
