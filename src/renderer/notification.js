/**
 * Custom notification system to replace browser alerts
 * Provides beautiful, non-blocking toast notifications
 */

class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.nextId = 1;
        this.initialize();
    }

    initialize() {
        // Create notification container
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    /**
     * Show a notification
     * @param {string} message - The message to display
     * @param {string} type - Type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in ms (0 = persistent)
     * @returns {number} Notification ID
     */
    show(message, type = 'info', duration = 4000) {
        const id = this.nextId++;
        const notification = this.createNotification(id, message, type, duration);

        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification });

        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(id), duration);
        }

        return id;
    }

    createNotification(id, message, type, duration) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.dataset.id = id;

        const icon = this.getIcon(type);
        const hasAction = duration === 0;

        notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        <div class="notification-message">${this.escapeHtml(message)}</div>
      </div>
      ${hasAction ? '<button class="notification-close" aria-label="Close">×</button>' : ''}
    `;

        // Close button handler
        if (hasAction) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => this.dismiss(id));
        }

        return notification;
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    dismiss(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;

        const { element } = this.notifications[index];
        element.classList.remove('show');
        element.classList.add('hide');

        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.splice(index, 1);
        }, 300);
    }

    dismissAll() {
        this.notifications.forEach(({ id }) => this.dismiss(id));
    }

    // Convenience methods
    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 6000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }

    /**
     * Show a confirmation dialog (replaces window.confirm)
     * @param {string} message - The message to display
     * @param {Object} options - Configuration options
     * @returns {Promise<boolean>} User's choice
     */
    async confirm(message, options = {}) {
        return new Promise((resolve) => {
            const {
                confirmText = 'OK',
                cancelText = 'Cancel',
                type = 'warning'
            } = options;

            const modal = document.createElement('div');
            modal.className = 'notification-modal';

            const dialog = document.createElement('div');
            dialog.className = `notification-dialog notification-${type}`;

            dialog.innerHTML = `
        <div class="notification-dialog-icon">${this.getIcon(type)}</div>
        <div class="notification-dialog-message">${this.escapeHtml(message)}</div>
        <div class="notification-dialog-actions">
          <button class="notification-btn notification-btn-cancel">${this.escapeHtml(cancelText)}</button>
          <button class="notification-btn notification-btn-confirm">${this.escapeHtml(confirmText)}</button>
        </div>
      `;

            modal.appendChild(dialog);
            document.body.appendChild(modal);

            // Trigger animation
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });

            const cleanup = (result) => {
                modal.classList.remove('show');
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 200);
                resolve(result);
            };

            dialog.querySelector('.notification-btn-confirm').addEventListener('click', () => cleanup(true));
            dialog.querySelector('.notification-btn-cancel').addEventListener('click', () => cleanup(false));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) cleanup(false);
            });

            // ESC key to cancel
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escHandler);
                    cleanup(false);
                }
            };
            document.addEventListener('keydown', escHandler);
        });
    }

    /**
     * Show a prompt dialog (replaces window.prompt)
     * @param {string} message - The message to display
     * @param {string} defaultValue - Default input value
     * @param {Object} options - Configuration options
     * @returns {Promise<string|null>} User's input or null if cancelled
     */
    async prompt(message, defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            const {
                confirmText = 'OK',
                cancelText = 'Cancel',
                placeholder = '',
                type = 'info'
            } = options;

            const modal = document.createElement('div');
            modal.className = 'notification-modal';

            const dialog = document.createElement('div');
            dialog.className = `notification-dialog notification-${type}`;

            dialog.innerHTML = `
        <div class="notification-dialog-icon">${this.getIcon(type)}</div>
        <div class="notification-dialog-message">${this.escapeHtml(message)}</div>
        <input type="text" class="notification-input" value="${this.escapeHtml(defaultValue)}" placeholder="${this.escapeHtml(placeholder)}">
        <div class="notification-dialog-actions">
          <button class="notification-btn notification-btn-cancel">${this.escapeHtml(cancelText)}</button>
          <button class="notification-btn notification-btn-confirm">${this.escapeHtml(confirmText)}</button>
        </div>
      `;

            modal.appendChild(dialog);
            document.body.appendChild(modal);

            const input = dialog.querySelector('.notification-input');

            // Trigger animation and focus input
            requestAnimationFrame(() => {
                modal.classList.add('show');
                input.focus();
                input.select();
            });

            const cleanup = (result) => {
                modal.classList.remove('show');
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 200);
                resolve(result);
            };

            dialog.querySelector('.notification-btn-confirm').addEventListener('click', () => cleanup(input.value));
            dialog.querySelector('.notification-btn-cancel').addEventListener('click', () => cleanup(null));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) cleanup(null);
            });

            // Enter to confirm, ESC to cancel
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    cleanup(input.value);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cleanup(null);
                }
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    cleanup() {
        this.dismissAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Create singleton instance
const notificationManager = new NotificationManager();

module.exports = notificationManager;
