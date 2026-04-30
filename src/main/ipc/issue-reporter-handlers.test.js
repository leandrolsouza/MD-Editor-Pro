/**
 * Tests for issue-reporter-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./issue-reporter-handlers');

describe('issue-reporter-handlers', () => {
    let issueReporterManager;
    let openExternal;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        issueReporterManager = {
            openIssueReporter: vi.fn(),
            getSystemInfo: vi.fn(),
            buildGitHubIssueUrl: vi.fn(),
            issueWindow: null
        };
        openExternal = vi.fn().mockResolvedValue(undefined);
        ipcMain = {
            handle: vi.fn()
        };

        register({ issueReporterManager, openExternal, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 3 issue-reporter IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(3);
        expect(handlers['issue-reporter:open']).toBeDefined();
        expect(handlers['issue-reporter:get-system-info']).toBeDefined();
        expect(handlers['issue-reporter:submit']).toBeDefined();
    });

    describe('issue-reporter:open', () => {
        it('calls openIssueReporter and returns success', async () => {
            const result = await handlers['issue-reporter:open']({});

            expect(issueReporterManager.openIssueReporter).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true });
        });

        it('throws when openIssueReporter throws', async () => {
            issueReporterManager.openIssueReporter.mockImplementation(() => {
                throw new Error('window error');
            });

            await expect(handlers['issue-reporter:open']({})).rejects.toThrow('window error');
        });
    });

    describe('issue-reporter:get-system-info', () => {
        it('calls getSystemInfo and returns success with info', async () => {
            const mockInfo = {
                os: 'Linux 5.15 (x64)',
                electron: '39.2.4',
                node: '24.0.0',
                chrome: '130.0.0'
            };
            issueReporterManager.getSystemInfo.mockReturnValue(mockInfo);

            const result = await handlers['issue-reporter:get-system-info']({});

            expect(issueReporterManager.getSystemInfo).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, info: mockInfo });
        });

        it('throws when getSystemInfo throws', async () => {
            issueReporterManager.getSystemInfo.mockImplementation(() => {
                throw new Error('system error');
            });

            await expect(handlers['issue-reporter:get-system-info']({})).rejects.toThrow('system error');
        });
    });

    describe('issue-reporter:submit', () => {
        it('builds URL, opens external, and returns success', async () => {
            const mockUrl = 'https://github.com/repo/issues/new?title=Bug';
            issueReporterManager.buildGitHubIssueUrl.mockReturnValue(mockUrl);

            const result = await handlers['issue-reporter:submit']({}, 'bug', 'Test Bug', 'Description');

            expect(issueReporterManager.buildGitHubIssueUrl).toHaveBeenCalledWith('bug', 'Test Bug', 'Description');
            expect(openExternal).toHaveBeenCalledWith(mockUrl);
            expect(result).toEqual({ success: true });
        });

        it('closes issue window after submitting if window exists', async () => {
            const mockClose = vi.fn();
            issueReporterManager.issueWindow = {
                isDestroyed: vi.fn().mockReturnValue(false),
                close: mockClose
            };
            issueReporterManager.buildGitHubIssueUrl.mockReturnValue('https://example.com');

            await handlers['issue-reporter:submit']({}, 'feature', 'Title', 'Desc');

            expect(mockClose).toHaveBeenCalledOnce();
        });

        it('does not close window if already destroyed', async () => {
            const mockClose = vi.fn();
            issueReporterManager.issueWindow = {
                isDestroyed: vi.fn().mockReturnValue(true),
                close: mockClose
            };
            issueReporterManager.buildGitHubIssueUrl.mockReturnValue('https://example.com');

            await handlers['issue-reporter:submit']({}, 'bug', 'Title', 'Desc');

            expect(mockClose).not.toHaveBeenCalled();
        });

        it('does not close window if issueWindow is null', async () => {
            issueReporterManager.issueWindow = null;
            issueReporterManager.buildGitHubIssueUrl.mockReturnValue('https://example.com');

            // Should not throw
            const result = await handlers['issue-reporter:submit']({}, 'bug', 'Title', 'Desc');
            expect(result).toEqual({ success: true });
        });

        it('throws when openExternal throws', async () => {
            issueReporterManager.buildGitHubIssueUrl.mockReturnValue('https://example.com');
            openExternal.mockRejectedValue(new Error('shell error'));

            await expect(
                handlers['issue-reporter:submit']({}, 'bug', 'Title', 'Desc')
            ).rejects.toThrow('shell error');
        });
    });
});
