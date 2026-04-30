/**
 * Tests for workspace-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./workspace-handlers');

describe('workspace-handlers', () => {
    let workspaceManager;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        workspaceManager = {
            openWorkspace: vi.fn(),
            closeWorkspace: vi.fn(),
            getWorkspacePath: vi.fn(),
            getWorkspaceTree: vi.fn(),
            restoreWorkspace: vi.fn(),
            toggleFolder: vi.fn()
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ workspaceManager, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 6 workspace IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(6);
        expect(handlers['workspace:open']).toBeDefined();
        expect(handlers['workspace:close']).toBeDefined();
        expect(handlers['workspace:get-path']).toBeDefined();
        expect(handlers['workspace:get-tree']).toBeDefined();
        expect(handlers['workspace:restore']).toBeDefined();
        expect(handlers['workspace:toggle-folder']).toBeDefined();
    });

    describe('workspace:open', () => {
        it('calls workspaceManager.openWorkspace and returns result', async () => {
            const mockResult = { success: true, path: '/my/workspace' };
            workspaceManager.openWorkspace.mockResolvedValue(mockResult);

            const result = await handlers['workspace:open']({});

            expect(workspaceManager.openWorkspace).toHaveBeenCalledOnce();
            expect(result).toEqual(mockResult);
        });

        it('throws when workspaceManager.openWorkspace throws', async () => {
            workspaceManager.openWorkspace.mockRejectedValue(new Error('dialog cancelled'));

            await expect(handlers['workspace:open']({})).rejects.toThrow('dialog cancelled');
        });
    });

    describe('workspace:close', () => {
        it('calls workspaceManager.closeWorkspace and returns result', async () => {
            const mockResult = { success: true };
            workspaceManager.closeWorkspace.mockReturnValue(mockResult);

            const result = await handlers['workspace:close']({});

            expect(workspaceManager.closeWorkspace).toHaveBeenCalledOnce();
            expect(result).toEqual(mockResult);
        });

        it('throws when workspaceManager.closeWorkspace throws', async () => {
            workspaceManager.closeWorkspace.mockImplementation(() => {
                throw new Error('close failed');
            });

            await expect(handlers['workspace:close']({})).rejects.toThrow('close failed');
        });
    });

    describe('workspace:get-path', () => {
        it('calls workspaceManager.getWorkspacePath and returns wrapped result', async () => {
            workspaceManager.getWorkspacePath.mockReturnValue('/my/workspace');

            const result = await handlers['workspace:get-path']({});

            expect(workspaceManager.getWorkspacePath).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, workspacePath: '/my/workspace' });
        });

        it('returns null workspacePath when no workspace is open', async () => {
            workspaceManager.getWorkspacePath.mockReturnValue(null);

            const result = await handlers['workspace:get-path']({});

            expect(result).toEqual({ success: true, workspacePath: null });
        });

        it('throws when workspaceManager.getWorkspacePath throws', async () => {
            workspaceManager.getWorkspacePath.mockImplementation(() => {
                throw new Error('path error');
            });

            await expect(handlers['workspace:get-path']({})).rejects.toThrow('path error');
        });
    });

    describe('workspace:get-tree', () => {
        it('calls workspaceManager.getWorkspaceTree and returns wrapped result', async () => {
            const mockTree = [{ name: 'file.md', type: 'file' }];
            workspaceManager.getWorkspaceTree.mockResolvedValue(mockTree);

            const result = await handlers['workspace:get-tree']({});

            expect(workspaceManager.getWorkspaceTree).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, tree: mockTree });
        });

        it('throws when workspaceManager.getWorkspaceTree throws', async () => {
            workspaceManager.getWorkspaceTree.mockRejectedValue(new Error('tree error'));

            await expect(handlers['workspace:get-tree']({})).rejects.toThrow('tree error');
        });
    });

    describe('workspace:restore', () => {
        it('calls workspaceManager.restoreWorkspace and returns result', async () => {
            const mockResult = { success: true, path: '/restored/workspace' };
            workspaceManager.restoreWorkspace.mockResolvedValue(mockResult);

            const result = await handlers['workspace:restore']({});

            expect(workspaceManager.restoreWorkspace).toHaveBeenCalledOnce();
            expect(result).toEqual(mockResult);
        });

        it('throws when workspaceManager.restoreWorkspace throws', async () => {
            workspaceManager.restoreWorkspace.mockRejectedValue(new Error('restore failed'));

            await expect(handlers['workspace:restore']({})).rejects.toThrow('restore failed');
        });
    });

    describe('workspace:toggle-folder', () => {
        it('calls workspaceManager.toggleFolder with folderPath and isExpanded', async () => {
            const mockResult = { success: true, children: [] };
            workspaceManager.toggleFolder.mockResolvedValue(mockResult);

            const result = await handlers['workspace:toggle-folder']({}, '/my/folder', true);

            expect(workspaceManager.toggleFolder).toHaveBeenCalledWith('/my/folder', true);
            expect(result).toEqual(mockResult);
        });

        it('passes isExpanded=false correctly', async () => {
            const mockResult = { success: true };
            workspaceManager.toggleFolder.mockResolvedValue(mockResult);

            await handlers['workspace:toggle-folder']({}, '/my/folder', false);

            expect(workspaceManager.toggleFolder).toHaveBeenCalledWith('/my/folder', false);
        });

        it('throws when workspaceManager.toggleFolder throws', async () => {
            workspaceManager.toggleFolder.mockRejectedValue(new Error('toggle failed'));

            await expect(handlers['workspace:toggle-folder']({}, '/bad/path', true)).rejects.toThrow('toggle failed');
        });
    });
});
