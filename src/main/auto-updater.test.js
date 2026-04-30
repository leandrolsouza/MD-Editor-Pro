/**
 * AutoUpdater Tests
 *
 * A classe AutoUpdater aceita um `electronUpdater` como segundo argumento,
 * permitindo injeção de dependência completa sem precisar do ambiente Electron.
 *
 * @vitest-environment node
 */

const AutoUpdater = require('./auto-updater');

describe('AutoUpdater', () => {
    let mockWindowManager;
    let mockElectronUpdater;
    let eventHandlers;

    beforeEach(() => {
        eventHandlers = {};

        mockElectronUpdater = {
            autoDownload: false,
            autoInstallOnAppQuit: false,
            currentVersion: { version: '1.0.0' },
            on: vi.fn((event, handler) => {
                eventHandlers[event] = handler;
            }),
            checkForUpdates: vi.fn(),
            downloadUpdate: vi.fn(),
            quitAndInstall: vi.fn()
        };

        mockWindowManager = {
            getMainWindow: vi.fn(() => ({
                webContents: {
                    send: vi.fn()
                }
            }))
        };
    });

    // ── Inicialização ──────────────────────────────────────────────────────────

    describe('initialization', () => {
        it('sets autoDownload to false', () => {
            new AutoUpdater(mockWindowManager, mockElectronUpdater);
            expect(mockElectronUpdater.autoDownload).toBe(false);
        });

        it('sets autoInstallOnAppQuit to true', () => {
            new AutoUpdater(mockWindowManager, mockElectronUpdater);
            expect(mockElectronUpdater.autoInstallOnAppQuit).toBe(true);
        });

        it('starts with updateAvailable = false', () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            expect(updater.updateAvailable).toBe(false);
        });

        it('starts with updateDownloaded = false', () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            expect(updater.updateDownloaded).toBe(false);
        });

        it('registers all 5 event listeners', () => {
            new AutoUpdater(mockWindowManager, mockElectronUpdater);
            expect(mockElectronUpdater.on).toHaveBeenCalledWith('update-available', expect.any(Function));
            expect(mockElectronUpdater.on).toHaveBeenCalledWith('update-not-available', expect.any(Function));
            expect(mockElectronUpdater.on).toHaveBeenCalledWith('download-progress', expect.any(Function));
            expect(mockElectronUpdater.on).toHaveBeenCalledWith('update-downloaded', expect.any(Function));
            expect(mockElectronUpdater.on).toHaveBeenCalledWith('error', expect.any(Function));
        });
    });

    // ── Eventos do electron-updater ────────────────────────────────────────────

    describe('event: update-available', () => {
        it('sets updateAvailable to true', () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            eventHandlers['update-available']({ version: '2.0.0', releaseDate: '2026-01-01', releaseNotes: '' });
            expect(updater.updateAvailable).toBe(true);
        });

        it('sends update-available event to renderer with correct payload', () => {
            const mockSend = vi.fn();
            mockWindowManager.getMainWindow.mockReturnValue({ webContents: { send: mockSend } });

            new AutoUpdater(mockWindowManager, mockElectronUpdater);
            eventHandlers['update-available']({ version: '2.0.0', releaseDate: '2026-01-01', releaseNotes: 'New stuff' });

            expect(mockSend).toHaveBeenCalledWith('update-available', {
                version: '2.0.0',
                releaseDate: '2026-01-01',
                releaseNotes: 'New stuff'
            });
        });

        it('does not throw when main window is null', () => {
            mockWindowManager.getMainWindow.mockReturnValue(null);
            new AutoUpdater(mockWindowManager, mockElectronUpdater);
            expect(() => {
                eventHandlers['update-available']({ version: '2.0.0', releaseDate: '', releaseNotes: '' });
            }).not.toThrow();
        });
    });

    describe('event: update-not-available', () => {
        it('sets updateAvailable to false', () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            updater.updateAvailable = true;
            eventHandlers['update-not-available']({ version: '1.0.0' });
            expect(updater.updateAvailable).toBe(false);
        });
    });

    describe('event: download-progress', () => {
        it('sends download-progress event to renderer', () => {
            const mockSend = vi.fn();
            mockWindowManager.getMainWindow.mockReturnValue({ webContents: { send: mockSend } });

            new AutoUpdater(mockWindowManager, mockElectronUpdater);
            const progress = { percent: 42, bytesPerSecond: 1000, transferred: 420, total: 1000 };
            eventHandlers['download-progress'](progress);

            expect(mockSend).toHaveBeenCalledWith('download-progress', progress);
        });
    });

    describe('event: update-downloaded', () => {
        it('sets updateDownloaded to true', () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            eventHandlers['update-downloaded']({ version: '2.0.0' });
            expect(updater.updateDownloaded).toBe(true);
        });

        it('sends update-downloaded event to renderer with version', () => {
            const mockSend = vi.fn();
            mockWindowManager.getMainWindow.mockReturnValue({ webContents: { send: mockSend } });

            new AutoUpdater(mockWindowManager, mockElectronUpdater);
            eventHandlers['update-downloaded']({ version: '2.0.0' });

            expect(mockSend).toHaveBeenCalledWith('update-downloaded', { version: '2.0.0' });
        });

        it('does not throw when main window is null', () => {
            mockWindowManager.getMainWindow.mockReturnValue(null);
            new AutoUpdater(mockWindowManager, mockElectronUpdater);
            expect(() => {
                eventHandlers['update-downloaded']({ version: '2.0.0' });
            }).not.toThrow();
        });
    });

    describe('event: error', () => {
        it('sends update-error event to renderer with categorized error', () => {
            const mockSend = vi.fn();
            mockWindowManager.getMainWindow.mockReturnValue({ webContents: { send: mockSend } });

            new AutoUpdater(mockWindowManager, mockElectronUpdater);
            eventHandlers['error'](new Error('net::ERR_INTERNET_DISCONNECTED'));

            expect(mockSend).toHaveBeenCalledWith('update-error', {
                type: 'network',
                message: expect.stringContaining('net::ERR_')
            });
        });
    });

    // ── categorizeError ────────────────────────────────────────────────────────

    describe('categorizeError', () => {
        let updater;

        beforeEach(() => {
            updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
        });

        it('categorizes 404 errors as not_found', () => {
            const result = updater.categorizeError(new Error('404 Not Found'));
            expect(result.type).toBe('not_found');
        });

        it('categorizes "Cannot find latest.yml" as not_found', () => {
            const result = updater.categorizeError(new Error('Cannot find latest.yml'));
            expect(result.type).toBe('not_found');
        });

        it('categorizes ERR_FILE_NOT_FOUND as not_found', () => {
            const result = updater.categorizeError(new Error('net::ERR_FILE_NOT_FOUND'));
            expect(result.type).toBe('not_found');
        });

        it('categorizes net::ERR_ errors as network', () => {
            const result = updater.categorizeError(new Error('net::ERR_INTERNET_DISCONNECTED'));
            expect(result.type).toBe('network');
        });

        it('categorizes ENOTFOUND as network', () => {
            const result = updater.categorizeError(new Error('getaddrinfo ENOTFOUND github.com'));
            expect(result.type).toBe('network');
        });

        it('categorizes ECONNREFUSED as network', () => {
            const result = updater.categorizeError(new Error('connect ECONNREFUSED 127.0.0.1'));
            expect(result.type).toBe('network');
        });

        it('categorizes ETIMEDOUT as network', () => {
            const result = updater.categorizeError(new Error('connect ETIMEDOUT'));
            expect(result.type).toBe('network');
        });

        it('categorizes 500 as server', () => {
            const result = updater.categorizeError(new Error('500 Internal Server Error'));
            expect(result.type).toBe('server');
        });

        it('categorizes 502 as server', () => {
            const result = updater.categorizeError(new Error('502 Bad Gateway'));
            expect(result.type).toBe('server');
        });

        it('categorizes 503 as server', () => {
            const result = updater.categorizeError(new Error('503 Service Unavailable'));
            expect(result.type).toBe('server');
        });

        it('categorizes 504 as server', () => {
            const result = updater.categorizeError(new Error('504 Gateway Timeout'));
            expect(result.type).toBe('server');
        });

        it('categorizes unknown errors as generic', () => {
            const result = updater.categorizeError(new Error('Something unexpected happened'));
            expect(result.type).toBe('generic');
        });

        it('preserves the original error message', () => {
            const msg = 'net::ERR_INTERNET_DISCONNECTED';
            const result = updater.categorizeError(new Error(msg));
            expect(result.message).toBe(msg);
        });

        it('handles error with empty message', () => {
            const result = updater.categorizeError(new Error(''));
            expect(result.type).toBe('generic');
            expect(result.message).toBe('');
        });
    });

    // ── checkForUpdates ────────────────────────────────────────────────────────

    describe('checkForUpdates', () => {
        it('calls _updater.checkForUpdates and returns result', async () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            const mockResult = { updateInfo: { version: '2.0.0' } };
            mockElectronUpdater.checkForUpdates.mockResolvedValue(mockResult);

            const result = await updater.checkForUpdates();

            expect(mockElectronUpdater.checkForUpdates).toHaveBeenCalledOnce();
            expect(result).toBe(mockResult);
        });

        it('returns null when _updater.checkForUpdates throws', async () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            mockElectronUpdater.checkForUpdates.mockRejectedValue(new Error('network error'));

            const result = await updater.checkForUpdates();

            expect(result).toBeNull();
        });
    });

    // ── downloadUpdate ─────────────────────────────────────────────────────────

    describe('downloadUpdate', () => {
        it('returns { success: true } on success', async () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            mockElectronUpdater.downloadUpdate.mockResolvedValue();

            const result = await updater.downloadUpdate();

            expect(result).toEqual({ success: true });
        });

        it('returns { success: false, error } when download throws', async () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            mockElectronUpdater.downloadUpdate.mockRejectedValue(new Error('disk full'));

            const result = await updater.downloadUpdate();

            expect(result).toEqual({ success: false, error: 'disk full' });
        });
    });

    // ── quitAndInstall ─────────────────────────────────────────────────────────

    describe('quitAndInstall', () => {
        it('calls _updater.quitAndInstall when updateDownloaded is true', () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            updater.updateDownloaded = true;

            updater.quitAndInstall();

            expect(mockElectronUpdater.quitAndInstall).toHaveBeenCalledWith(false, true);
        });

        it('does NOT call _updater.quitAndInstall when updateDownloaded is false', () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);

            updater.quitAndInstall();

            expect(mockElectronUpdater.quitAndInstall).not.toHaveBeenCalled();
        });
    });

    // ── getCurrentVersion ──────────────────────────────────────────────────────

    describe('getCurrentVersion', () => {
        it('returns the version from _updater.currentVersion', () => {
            mockElectronUpdater.currentVersion = { version: '1.2.3' };
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            expect(updater.getCurrentVersion()).toBe('1.2.3');
        });
    });

    // ── isUpdateAvailable / isUpdateDownloaded ─────────────────────────────────

    describe('status helpers', () => {
        it('isUpdateAvailable reflects updateAvailable state', () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            expect(updater.isUpdateAvailable()).toBe(false);
            updater.updateAvailable = true;
            expect(updater.isUpdateAvailable()).toBe(true);
        });

        it('isUpdateDownloaded reflects updateDownloaded state', () => {
            const updater = new AutoUpdater(mockWindowManager, mockElectronUpdater);
            expect(updater.isUpdateDownloaded()).toBe(false);
            updater.updateDownloaded = true;
            expect(updater.isUpdateDownloaded()).toBe(true);
        });
    });
});
