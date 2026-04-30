/**
 * Tests for updater-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./updater-handlers');

describe('updater-handlers', () => {
    let autoUpdater;
    let getAppVersion;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        autoUpdater = {
            checkForUpdates: vi.fn(),
            downloadUpdate: vi.fn(),
            quitAndInstall: vi.fn(),
            getCurrentVersion: vi.fn()
        };
        getAppVersion = vi.fn().mockReturnValue('1.5.0');
        ipcMain = {
            handle: vi.fn()
        };

        register({ autoUpdater, getAppVersion, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 5 updater/app IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(5);
        expect(handlers['updater:check-for-updates']).toBeDefined();
        expect(handlers['updater:download-update']).toBeDefined();
        expect(handlers['updater:quit-and-install']).toBeDefined();
        expect(handlers['updater:get-current-version']).toBeDefined();
        expect(handlers['app:get-version']).toBeDefined();
    });

    describe('updater:check-for-updates', () => {
        it('calls checkForUpdates and returns success with updateInfo', async () => {
            const mockUpdateInfo = { version: '2.0.0' };
            autoUpdater.checkForUpdates.mockResolvedValue(mockUpdateInfo);

            const result = await handlers['updater:check-for-updates']({});

            expect(autoUpdater.checkForUpdates).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, updateInfo: mockUpdateInfo });
        });

        it('returns error when autoUpdater is null', async () => {
            // Re-register with null autoUpdater
            ipcMain.handle.mockClear();
            register({ autoUpdater: null, getAppVersion, ipcMain });
            const nullHandlers = {};
            for (const call of ipcMain.handle.mock.calls) {
                nullHandlers[call[0]] = call[1];
            }

            const result = await nullHandlers['updater:check-for-updates']({});

            expect(result).toEqual({ success: false, error: 'Auto-updater not initialized' });
        });

        it('throws when checkForUpdates throws', async () => {
            autoUpdater.checkForUpdates.mockRejectedValue(new Error('network error'));

            await expect(handlers['updater:check-for-updates']({})).rejects.toThrow('network error');
        });
    });

    describe('updater:download-update', () => {
        it('calls downloadUpdate and returns result', async () => {
            const mockResult = { success: true };
            autoUpdater.downloadUpdate.mockResolvedValue(mockResult);

            const result = await handlers['updater:download-update']({});

            expect(autoUpdater.downloadUpdate).toHaveBeenCalledOnce();
            expect(result).toEqual(mockResult);
        });

        it('returns error when autoUpdater is null', async () => {
            ipcMain.handle.mockClear();
            register({ autoUpdater: null, getAppVersion, ipcMain });
            const nullHandlers = {};
            for (const call of ipcMain.handle.mock.calls) {
                nullHandlers[call[0]] = call[1];
            }

            const result = await nullHandlers['updater:download-update']({});

            expect(result).toEqual({ success: false, error: 'Auto-updater not initialized' });
        });

        it('throws when downloadUpdate throws', async () => {
            autoUpdater.downloadUpdate.mockRejectedValue(new Error('download error'));

            await expect(handlers['updater:download-update']({})).rejects.toThrow('download error');
        });
    });

    describe('updater:quit-and-install', () => {
        it('calls quitAndInstall and returns success', async () => {
            const result = await handlers['updater:quit-and-install']({});

            expect(autoUpdater.quitAndInstall).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true });
        });

        it('returns error when autoUpdater is null', async () => {
            ipcMain.handle.mockClear();
            register({ autoUpdater: null, getAppVersion, ipcMain });
            const nullHandlers = {};
            for (const call of ipcMain.handle.mock.calls) {
                nullHandlers[call[0]] = call[1];
            }

            const result = await nullHandlers['updater:quit-and-install']({});

            expect(result).toEqual({ success: false, error: 'Auto-updater not initialized' });
        });
    });

    describe('updater:get-current-version', () => {
        it('calls getCurrentVersion and returns success with version', async () => {
            autoUpdater.getCurrentVersion.mockReturnValue('1.5.0');

            const result = await handlers['updater:get-current-version']({});

            expect(autoUpdater.getCurrentVersion).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, version: '1.5.0' });
        });

        it('returns error when autoUpdater is null', async () => {
            ipcMain.handle.mockClear();
            register({ autoUpdater: null, getAppVersion, ipcMain });
            const nullHandlers = {};
            for (const call of ipcMain.handle.mock.calls) {
                nullHandlers[call[0]] = call[1];
            }

            const result = await nullHandlers['updater:get-current-version']({});

            expect(result).toEqual({ success: false, error: 'Auto-updater not initialized' });
        });
    });

    describe('app:get-version', () => {
        it('calls getAppVersion and returns success with version', async () => {
            const result = await handlers['app:get-version']({});

            expect(getAppVersion).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, version: '1.5.0' });
        });

        it('returns correct version from getAppVersion', async () => {
            getAppVersion.mockReturnValue('3.0.0-beta');

            const result = await handlers['app:get-version']({});

            expect(result).toEqual({ success: true, version: '3.0.0-beta' });
        });
    });
});
