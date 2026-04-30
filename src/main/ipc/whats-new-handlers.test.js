/**
 * Tests for whats-new-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./whats-new-handlers');

describe('whats-new-handlers', () => {
    let whatsNewManager;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        whatsNewManager = {
            getChangelogData: vi.fn(),
            markVersionSeen: vi.fn()
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ whatsNewManager, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 2 whats-new IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(2);
        expect(handlers['whats-new:get-changelog']).toBeDefined();
        expect(handlers['whats-new:mark-seen']).toBeDefined();
    });

    describe('whats-new:get-changelog', () => {
        it('calls getChangelogData and returns result', async () => {
            const mockData = {
                entries: [{ version: '1.0.0', changes: ['fix'] }],
                currentVersion: '1.0.0',
                shouldShow: true
            };
            whatsNewManager.getChangelogData.mockResolvedValue(mockData);

            const result = await handlers['whats-new:get-changelog']({});

            expect(whatsNewManager.getChangelogData).toHaveBeenCalledOnce();
            expect(result).toEqual(mockData);
        });

        it('throws when getChangelogData throws', async () => {
            whatsNewManager.getChangelogData.mockRejectedValue(new Error('read error'));

            await expect(handlers['whats-new:get-changelog']({})).rejects.toThrow('read error');
        });
    });

    describe('whats-new:mark-seen', () => {
        it('calls markVersionSeen and returns success', async () => {
            const result = await handlers['whats-new:mark-seen']({}, '2.0.0');

            expect(whatsNewManager.markVersionSeen).toHaveBeenCalledWith('2.0.0');
            expect(result).toEqual({ success: true });
        });

        it('throws when markVersionSeen throws', async () => {
            whatsNewManager.markVersionSeen.mockImplementation(() => {
                throw new Error('config error');
            });

            await expect(handlers['whats-new:mark-seen']({}, '2.0.0')).rejects.toThrow('config error');
        });
    });
});
