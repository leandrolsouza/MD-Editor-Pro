/**
 * Issue Reporter Manager - Handles issue reporting to GitHub
 * Opens a child window for users to submit bug reports or feature requests
 */

const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');

class IssueReporterManager {
    constructor(windowManager) {
        this.windowManager = windowManager;
        this.issueWindow = null;
    }

    /**
     * Opens the issue reporter window
     */
    openIssueReporter() {
        if (this.issueWindow && !this.issueWindow.isDestroyed()) {
            this.issueWindow.focus();
            return;
        }

        const parentWindow = this.windowManager.getMainWindow();

        this.issueWindow = new BrowserWindow({
            width: 600,
            height: 520,
            minWidth: 480,
            minHeight: 420,
            resizable: true,
            parent: parentWindow || undefined,
            modal: false,
            show: false,
            title: 'Issue Reporter',
            webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                contextIsolation: false,
                nodeIntegration: true,
                sandbox: false,
                webSecurity: true
            }
        });

        this.issueWindow.setMenuBarVisibility(false);
        this.issueWindow.loadFile(path.join(__dirname, '../renderer/issue-reporter.html'));

        this.issueWindow.once('ready-to-show', () => {
            this.issueWindow.show();
        });

        this.issueWindow.on('closed', () => {
            this.issueWindow = null;
        });
    }

    /**
     * Collects system information for the issue report
     * @returns {object} System info
     */
    getSystemInfo() {
        let electronVersion = 'N/A';
        try {
            electronVersion = process.versions.electron || 'N/A';
        } catch (e) { /* ignore */ }

        return {
            os: `${os.type()} ${os.release()} (${os.arch()})`,
            electron: electronVersion,
            node: process.versions.node || 'N/A',
            chrome: process.versions.chrome || 'N/A'
        };
    }

    /**
     * Builds a GitHub issue URL with pre-filled data
     * @param {string} type - 'bug' or 'feature'
     * @param {string} title - Issue title
     * @param {string} description - Issue description
     * @returns {string} GitHub new issue URL
     */
    buildGitHubIssueUrl(type, title, description) {
        const repoUrl = 'https://github.com/leandrolsouza/MD-Editor-Pro';
        const sysInfo = this.getSystemInfo();

        const labels = type === 'bug' ? 'bug' : 'enhancement';

        let body;
        if (type === 'bug') {
            body = `## Bug Report\n\n${description}\n\n## System Information\n\n- **OS:** ${sysInfo.os}\n- **Electron:** ${sysInfo.electron}\n- **Node:** ${sysInfo.node}\n- **Chrome:** ${sysInfo.chrome}`;
        } else {
            body = `## Feature Request\n\n${description}`;
        }

        const params = new URLSearchParams({
            title,
            body,
            labels
        });

        return `${repoUrl}/issues/new?${params.toString()}`;
    }

    /**
     * Registers IPC handlers for issue reporter
     */
    registerHandlers() {
        ipcMain.handle('issue-reporter:open', async () => {
            try {
                this.openIssueReporter();
                return { success: true };
            } catch (error) {
                console.error('Error opening issue reporter:', error);
                throw error;
            }
        });

        ipcMain.handle('issue-reporter:get-system-info', async () => {
            try {
                const info = this.getSystemInfo();
                return { success: true, info };
            } catch (error) {
                console.error('Error getting system info:', error);
                throw error;
            }
        });

        ipcMain.handle('issue-reporter:submit', async (event, type, title, description) => {
            try {
                const { shell } = require('electron');
                const url = this.buildGitHubIssueUrl(type, title, description);
                await shell.openExternal(url);

                // Close the issue reporter window after opening the browser
                if (this.issueWindow && !this.issueWindow.isDestroyed()) {
                    this.issueWindow.close();
                }

                return { success: true };
            } catch (error) {
                console.error('Error submitting issue:', error);
                throw error;
            }
        });
    }
}

module.exports = IssueReporterManager;
