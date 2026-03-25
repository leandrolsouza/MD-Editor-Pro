/**
 * Update Notification Manager
 * Handles UI for app updates
 */

const i18n = require('./i18n/index.js');

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
                    <strong>${i18n.t('updates.available')}</strong>
                    <p>${i18n.t('updates.newVersion', { version: info.version })}</p>
                </div>
                <div class="update-notification-actions">
                    <button class="update-btn-download">${i18n.t('updates.download')}</button>
                    <button class="update-btn-later">${i18n.t('updates.later')}</button>
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
                        <strong>${i18n.t('updates.downloading')}</strong>
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
                    <strong>${i18n.t('updates.ready')}</strong>
                    <p>${i18n.t('updates.readyMessage')}</p>
                </div>
                <div class="update-notification-actions">
                    <button class="update-btn-install">${i18n.t('updates.restartNow')}</button>
                    <button class="update-btn-later">${i18n.t('updates.later')}</button>
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

        // Determinar a mensagem apropriada baseada no tipo de erro
        let errorMessage;
        switch (error.type) {
            case 'not_found':
                errorMessage = i18n.t('updates.errorNotFound');
                break;
            case 'network':
                errorMessage = i18n.t('updates.errorNetwork');
                break;
            case 'server':
                errorMessage = i18n.t('updates.errorServer');
                break;
            default:
                errorMessage = error.message || i18n.t('updates.errorMessage');
        }

        const notification = document.createElement('div');

        notification.className = 'update-notification update-notification-error';
        notification.innerHTML = `
            <div class="update-notification-content">
                <div class="update-notification-icon">⚠️</div>
                <div class="update-notification-text">
                    <strong>${i18n.t('updates.error')}</strong>
                    <p>${errorMessage}</p>
                </div>
                <div class="update-notification-actions">
                    <button class="update-btn-close">${i18n.t('dialogs.close')}</button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        this.notificationElement = notification;

        notification.querySelector('.update-btn-close').addEventListener('click', () => {
            this.hideNotification();
        });

        // Auto-hide after 8 seconds (mais tempo para ler)
        setTimeout(() => {
            if (this.notificationElement === notification) {
                this.hideNotification();
            }
        }, 8000);
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
                    <strong>${i18n.t('updates.upToDate')}</strong>
                    <p>${i18n.t('updates.upToDateMessage')}</p>
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
