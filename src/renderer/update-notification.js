/**
 * Update Notification Manager
 * Handles UI for app updates
 */

class UpdateNotification {
    constructor() {
        this.notificationElement = null;
        this.updateInfo = null;
        this.isDownloading = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for update available
        window.electronAPI.onUpdateAvailable((info) => {
            console.log('Update available:', info);
            this.updateInfo = info;
            this.showUpdateAvailable(info);
        });

        // Listen for update downloaded
        window.electronAPI.onUpdateDownloaded((info) => {
            console.log('Update downloaded:', info);
            this.isDownloading = false;
            this.showUpdateDownloaded(info);
        });

        // Listen for download progress
        window.electronAPI.onDownloadProgress((progress) => {
            this.updateDownloadProgress(progress);
        });

        // Listen for update errors
        window.electronAPI.onUpdateError((error) => {
            console.error('Update error:', error);
            this.isDownloading = false;
            this.showUpdateError(error);
        });
    }

    showUpdateAvailable(info) {
        this.hideNotification();

        const notification = document.createElement('div');

        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-notification-content">
                <div class="update-notification-icon">🎉</div>
                <div class="update-notification-text">
                    <strong>Nova versão disponível!</strong>
                    <p>Versão ${info.version} está pronta para download.</p>
                </div>
                <div class="update-notification-actions">
                    <button class="update-btn-download">Baixar</button>
                    <button class="update-btn-later">Depois</button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        this.notificationElement = notification;

        // Add event listeners
        notification.querySelector('.update-btn-download').addEventListener('click', () => {
            this.downloadUpdate();
        });

        notification.querySelector('.update-btn-later').addEventListener('click', () => {
            this.hideNotification();
        });

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (this.notificationElement === notification && !this.isDownloading) {
                this.hideNotification();
            }
        }, 10000);
    }

    async downloadUpdate() {
        try {
            this.isDownloading = true;

            // Update UI to show downloading state
            if (this.notificationElement) {
                const content = this.notificationElement.querySelector('.update-notification-content');

                content.innerHTML = `
                    <div class="update-notification-icon">⬇️</div>
                    <div class="update-notification-text">
                        <strong>Baixando atualização...</strong>
                        <div class="update-progress-bar">
                            <div class="update-progress-fill" style="width: 0%"></div>
                        </div>
                        <p class="update-progress-text">0%</p>
                    </div>
                `;
            }

            const result = await window.electronAPI.downloadUpdate();

            if (!result.success) {
                this.showUpdateError({ message: result.error });
            }
        } catch (error) {
            console.error('Error downloading update:', error);
            this.showUpdateError({ message: error.message });
        }
    }

    updateDownloadProgress(progress) {
        if (!this.notificationElement) return;

        const progressFill = this.notificationElement.querySelector('.update-progress-fill');
        const progressText = this.notificationElement.querySelector('.update-progress-text');

        if (progressFill && progressText) {
            const percent = Math.round(progress.percent);

            progressFill.style.width = `${percent}%`;
            progressText.textContent = `${percent}%`;
        }
    }

    showUpdateDownloaded(info) {
        this.hideNotification();

        const notification = document.createElement('div');

        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-notification-content">
                <div class="update-notification-icon">✅</div>
                <div class="update-notification-text">
                    <strong>Atualização pronta!</strong>
                    <p>Versão ${info.version} foi baixada. Reinicie para instalar.</p>
                </div>
                <div class="update-notification-actions">
                    <button class="update-btn-install">Reiniciar Agora</button>
                    <button class="update-btn-later">Depois</button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        this.notificationElement = notification;

        // Add event listeners
        notification.querySelector('.update-btn-install').addEventListener('click', () => {
            this.installUpdate();
        });

        notification.querySelector('.update-btn-later').addEventListener('click', () => {
            this.hideNotification();
        });
    }

    async installUpdate() {
        try {
            await window.electronAPI.quitAndInstall();
        } catch (error) {
            console.error('Error installing update:', error);
        }
    }

    showUpdateError(error) {
        this.hideNotification();

        const notification = document.createElement('div');

        notification.className = 'update-notification update-notification-error';
        notification.innerHTML = `
            <div class="update-notification-content">
                <div class="update-notification-icon">⚠️</div>
                <div class="update-notification-text">
                    <strong>Erro ao atualizar</strong>
                    <p>${error.message || 'Não foi possível verificar atualizações.'}</p>
                </div>
                <div class="update-notification-actions">
                    <button class="update-btn-close">Fechar</button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        this.notificationElement = notification;

        notification.querySelector('.update-btn-close').addEventListener('click', () => {
            this.hideNotification();
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (this.notificationElement === notification) {
                this.hideNotification();
            }
        }, 5000);
    }

    hideNotification() {
        if (this.notificationElement) {
            this.notificationElement.remove();
            this.notificationElement = null;
        }
    }

    // Manual check for updates (can be called from menu)
    async checkForUpdates() {
        try {
            const result = await window.electronAPI.checkForUpdates();

            if (result.success && !result.updateInfo) {
                // No updates available - show a brief message
                this.showNoUpdatesAvailable();
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }

    showNoUpdatesAvailable() {
        this.hideNotification();

        const notification = document.createElement('div');

        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-notification-content">
                <div class="update-notification-icon">✓</div>
                <div class="update-notification-text">
                    <strong>Você está atualizado!</strong>
                    <p>Nenhuma atualização disponível no momento.</p>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        this.notificationElement = notification;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (this.notificationElement === notification) {
                this.hideNotification();
            }
        }, 3000);
    }
}

module.exports = UpdateNotification;
