/**
 * Tests for file-handlers IPC module
 * Validates: Requirements 1.1, 1.2, 5.2, 5.5
 *
 * @vitest-environment node
 */

const { register } = require('./file-handlers');

describe('file-handlers', () => {
    let fileManager;
    let refreshMenu;
    let openExternal;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        fileManager = {
            openFile: vi.fn(),
            openRecentFile: vi.fn(),
            readFile: vi.fn(),
            saveFile: vi.fn(),
            saveFileAs: vi.fn()
        };
        refreshMenu = vi.fn();
        openExternal = vi.fn().mockResolvedValue(undefined);
        ipcMain = {
            handle: vi.fn()
        };

        register({ fileManager, refreshMenu, openExternal, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 6 file IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(6);
        expect(handlers['file:open']).toBeDefined();
        expect(handlers['file:open-recent']).toBeDefined();
        expect(handlers['file:read']).toBeDefined();
        expect(handlers['file:save']).toBeDefined();
        expect(handlers['file:save-as']).toBeDefined();
        expect(handlers['shell:open-external']).toBeDefined();
    });

    describe('file:open', () => {
        it('calls fileManager.openFile and returns result', async () => {
            const mockResult = { filePath: '/test.md', content: '# Hello' };
            fileManager.openFile.mockResolvedValue(mockResult);

            const result = await handlers['file:open']({});

            expect(fileManager.openFile).toHaveBeenCalledOnce();
            expect(result).toEqual(mockResult);
        });

        it('calls refreshMenu when file is opened successfully', async () => {
            fileManager.openFile.mockResolvedValue({ filePath: '/test.md' });

            await handlers['file:open']({});

            expect(refreshMenu).toHaveBeenCalledOnce();
        });

        it('does not call refreshMenu when openFile returns null', async () => {
            fileManager.openFile.mockResolvedValue(null);

            await handlers['file:open']({});

            expect(refreshMenu).not.toHaveBeenCalled();
        });

        it('throws when fileManager.openFile throws', async () => {
            fileManager.openFile.mockRejectedValue(new Error('dialog cancelled'));

            await expect(handlers['file:open']({})).rejects.toThrow('dialog cancelled');
        });
    });

    describe('file:open-recent', () => {
        it('calls fileManager.openRecentFile with filePath and returns result', async () => {
            const mockResult = { filePath: '/recent.md', content: '# Recent' };
            fileManager.openRecentFile.mockResolvedValue(mockResult);

            const result = await handlers['file:open-recent']({}, '/recent.md');

            expect(fileManager.openRecentFile).toHaveBeenCalledWith('/recent.md');
            expect(result).toEqual(mockResult);
        });

        it('always calls refreshMenu after opening recent file', async () => {
            fileManager.openRecentFile.mockResolvedValue({ filePath: '/recent.md' });

            await handlers['file:open-recent']({}, '/recent.md');

            expect(refreshMenu).toHaveBeenCalledOnce();
        });

        it('throws when fileManager.openRecentFile throws', async () => {
            fileManager.openRecentFile.mockRejectedValue(new Error('file not found'));

            await expect(handlers['file:open-recent']({}, '/missing.md')).rejects.toThrow('file not found');
        });
    });

    describe('file:read', () => {
        it('calls fileManager.readFile with filePath and returns result', async () => {
            const mockResult = { content: '# Content' };
            fileManager.readFile.mockResolvedValue(mockResult);

            const result = await handlers['file:read']({}, '/test.md');

            expect(fileManager.readFile).toHaveBeenCalledWith('/test.md');
            expect(result).toEqual(mockResult);
        });

        it('throws when fileManager.readFile throws', async () => {
            fileManager.readFile.mockRejectedValue(new Error('permission denied'));

            await expect(handlers['file:read']({}, '/secret.md')).rejects.toThrow('permission denied');
        });
    });

    describe('file:save', () => {
        it('calls fileManager.saveFile and returns success', async () => {
            fileManager.saveFile.mockResolvedValue(undefined);

            const result = await handlers['file:save']({}, '/test.md', '# Content');

            expect(fileManager.saveFile).toHaveBeenCalledWith('/test.md', '# Content');
            expect(result).toEqual({ success: true });
        });

        it('throws when fileManager.saveFile throws', async () => {
            fileManager.saveFile.mockRejectedValue(new Error('disk full'));

            await expect(handlers['file:save']({}, '/test.md', 'content')).rejects.toThrow('disk full');
        });
    });

    describe('file:save-as', () => {
        it('calls fileManager.saveFileAs and returns success with filePath', async () => {
            fileManager.saveFileAs.mockResolvedValue('/new-file.md');

            const result = await handlers['file:save-as']({}, '# New Content');

            expect(fileManager.saveFileAs).toHaveBeenCalledWith('# New Content');
            expect(result).toEqual({ success: true, filePath: '/new-file.md' });
        });

        it('throws when fileManager.saveFileAs throws', async () => {
            fileManager.saveFileAs.mockRejectedValue(new Error('save cancelled'));

            await expect(handlers['file:save-as']({}, 'content')).rejects.toThrow('save cancelled');
        });
    });

    describe('shell:open-external', () => {
        it('calls openExternal with URL and returns success', async () => {
            const result = await handlers['shell:open-external']({}, 'https://example.com');

            expect(openExternal).toHaveBeenCalledWith('https://example.com');
            expect(result).toEqual({ success: true });
        });

        it('throws when openExternal throws', async () => {
            openExternal.mockRejectedValue(new Error('failed to open'));

            await expect(handlers['shell:open-external']({}, 'https://bad.url')).rejects.toThrow('failed to open');
        });
    });
});
