/**
 * Tests for link-analyzer-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./link-analyzer-handlers');

describe('link-analyzer-handlers', () => {
    let linkAnalyzerManager;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        linkAnalyzerManager = {
            analyzeWorkspace: vi.fn()
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ linkAnalyzerManager, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers 1 link-analyzer IPC handler', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(1);
        expect(handlers['graph:get-data']).toBeDefined();
    });

    describe('graph:get-data', () => {
        it('calls analyzeWorkspace and returns result', async () => {
            const mockGraph = {
                success: true,
                graph: {
                    nodes: [{ id: 'readme.md', label: 'readme' }],
                    edges: []
                }
            };
            linkAnalyzerManager.analyzeWorkspace.mockResolvedValue(mockGraph);

            const result = await handlers['graph:get-data']({});

            expect(linkAnalyzerManager.analyzeWorkspace).toHaveBeenCalledOnce();
            expect(result).toEqual(mockGraph);
        });

        it('returns error result when no workspace is open', async () => {
            const mockError = { success: false, error: 'No workspace open' };
            linkAnalyzerManager.analyzeWorkspace.mockResolvedValue(mockError);

            const result = await handlers['graph:get-data']({});

            expect(result).toEqual(mockError);
        });

        it('throws when analyzeWorkspace throws', async () => {
            linkAnalyzerManager.analyzeWorkspace.mockRejectedValue(new Error('fs error'));

            await expect(handlers['graph:get-data']({})).rejects.toThrow('fs error');
        });
    });
});
