/**
 * IPC Handlers — Issue Reporter Operations
 * Handles: issue-reporter:open, issue-reporter:get-system-info, issue-reporter:submit
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações do issue reporter
 * @param {Object} deps - Dependências
 * @param {import('../issue-reporter-manager')} deps.issueReporterManager - Instância do IssueReporterManager
 * @param {Function} deps.openExternal - Função para abrir URLs externas (shell.openExternal)
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ issueReporterManager, openExternal, ipcMain }) {
    ipcMain.handle('issue-reporter:open', createIPCHandler(async () => {
        issueReporterManager.openIssueReporter();
        return { success: true };
    }, 'opening issue reporter'));

    ipcMain.handle('issue-reporter:get-system-info', createIPCHandler(async () => {
        const info = issueReporterManager.getSystemInfo();
        return { success: true, info };
    }, 'getting system info'));

    ipcMain.handle('issue-reporter:submit', createIPCHandler(async (event, type, title, description) => {
        const url = issueReporterManager.buildGitHubIssueUrl(type, title, description);
        await openExternal(url);

        // Close the issue reporter window after opening the browser
        if (issueReporterManager.issueWindow && !issueReporterManager.issueWindow.isDestroyed()) {
            issueReporterManager.issueWindow.close();
        }

        return { success: true };
    }, 'submitting issue'));
}

module.exports = { register };
