const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

class AutoUpdater {
    constructor(windowManager) {
        this.windowManager = windowManager;
        this.updateAvailable = false;
        this.updateDownloaded = false;

        // Configurações
        autoUpdater.autoDownload = false; // Não baixar automaticamente
        autoUpdater.autoInstallOnAppQuit = true; // Instalar ao fechar o app

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Quando encontrar uma atualização disponível
        autoUpdater.on('update-available', (info) => {
            console.log('Update available:', info.version);
            this.updateAvailable = true;
            this.notifyUpdateAvailable(info);
        });

        // Quando não houver atualizações
        autoUpdater.on('update-not-available', (info) => {
            console.log('Update not available. Current version:', info.version);
            this.updateAvailable = false;
        });

        // Progresso do download
        autoUpdater.on('download-progress', (progressObj) => {
            const message = `Download: ${Math.round(progressObj.percent)}%`;
            console.log(message);
            this.sendStatusToWindow('download-progress', progressObj);
        });

        // Download concluído
        autoUpdater.on('update-downloaded', (info) => {
            console.log('Update downloaded:', info.version);
            this.updateDownloaded = true;
            this.notifyUpdateDownloaded(info);
        });

        // Erro durante atualização
        autoUpdater.on('error', (err) => {
            console.error('Error in auto-updater:', err);
            const errorInfo = this.categorizeError(err);
            this.sendStatusToWindow('update-error', errorInfo);
        });
    }

    // Categorizar erros para mensagens amigáveis
    categorizeError(err) {
        const message = err.message || '';

        // Erro 404 - arquivo não encontrado (release incompleta)
        if (message.includes('404') || message.includes('Cannot find latest.yml') || message.includes('net::ERR_FILE_NOT_FOUND')) {
            return {
                type: 'not_found',
                message: message
            };
        }

        // Erros de rede
        if (message.includes('net::ERR_') || message.includes('ENOTFOUND') || message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT')) {
            return {
                type: 'network',
                message: message
            };
        }

        // Erros de servidor (5xx)
        if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
            return {
                type: 'server',
                message: message
            };
        }

        // Erro genérico
        return {
            type: 'generic',
            message: message
        };
    }

    // Verificar atualizações
    async checkForUpdates() {
        try {
            console.log('Checking for updates...');
            const result = await autoUpdater.checkForUpdates();
            return result;
        } catch (error) {
            console.error('Error checking for updates:', error);
            return null;
        }
    }

    // Baixar atualização
    async downloadUpdate() {
        try {
            console.log('Downloading update...');
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (error) {
            console.error('Error downloading update:', error);
            return { success: false, error: error.message };
        }
    }

    // Instalar e reiniciar
    quitAndInstall() {
        if (this.updateDownloaded) {
            autoUpdater.quitAndInstall(false, true);
        }
    }

    // Notificar renderer sobre atualização disponível
    notifyUpdateAvailable(info) {
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.send('update-available', {
                version: info.version,
                releaseDate: info.releaseDate,
                releaseNotes: info.releaseNotes
            });
        }
    }

    // Notificar renderer sobre download concluído
    notifyUpdateDownloaded(info) {
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.send('update-downloaded', {
                version: info.version
            });
        }
    }

    // Enviar status para o renderer
    sendStatusToWindow(event, data) {
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
            mainWindow.webContents.send(event, data);
        }
    }

    // Obter informações da versão atual
    getCurrentVersion() {
        return autoUpdater.currentVersion.version;
    }

    // Verificar se há atualização disponível
    isUpdateAvailable() {
        return this.updateAvailable;
    }

    // Verificar se o download foi concluído
    isUpdateDownloaded() {
        return this.updateDownloaded;
    }
}

module.exports = AutoUpdater;
