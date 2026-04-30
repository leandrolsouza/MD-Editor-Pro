/**
 * IPC Handlers — Workspace Operations
 * Handles: workspace:open, workspace:close, workspace:get-path, workspace:get-tree, workspace:restore, workspace:toggle-folder
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de workspace
 * @param {Object} deps - Dependências
 * @param {import('../workspace-manager')} deps.workspaceManager - Instância do WorkspaceManager
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ workspaceManager, ipcMain }) {
    ipcMain.handle('workspace:open', createIPCHandler(async () => {
        const result = await workspaceManager.openWorkspace();
        return result;
    }, 'opening workspace'));

    ipcMain.handle('workspace:close', createIPCHandler(async () => {
        const result = workspaceManager.closeWorkspace();
        return result;
    }, 'closing workspace'));

    ipcMain.handle('workspace:get-path', createIPCHandler(async () => {
        const workspacePath = workspaceManager.getWorkspacePath();
        return { success: true, workspacePath };
    }, 'getting workspace path'));

    ipcMain.handle('workspace:get-tree', createIPCHandler(async () => {
        const tree = await workspaceManager.getWorkspaceTree();
        return { success: true, tree };
    }, 'getting workspace tree'));

    ipcMain.handle('workspace:restore', createIPCHandler(async () => {
        const result = await workspaceManager.restoreWorkspace();
        return result;
    }, 'restoring workspace'));

    ipcMain.handle('workspace:toggle-folder', createIPCHandler(async (event, folderPath, isExpanded) => {
        const result = await workspaceManager.toggleFolder(folderPath, isExpanded);
        return result;
    }, 'toggling folder'));
}

module.exports = { register };
