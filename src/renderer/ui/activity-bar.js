/**
 * Activity Bar - VS Code Style Sidebar Manager
 * Manages the activity bar and sidebar panels
 */

const i18n = require('../i18n/index.js');
const { getIcon } = require('./icons.js');

class ActivityBar {
    constructor() {
        this.container = null;
        this.sidebarPanel = null;
        this.activeView = null;
        this.views = new Map();
        this.removeLocaleListener = null;
    }

    /**
     * Initialize the activity bar
     */
    initialize() {
        this.createActivityBar();
        this.createSidebarPanel();
        this.setupEventListeners();
        this.setupLocaleListener();
    }

    /**
     * Setup locale change listener
     */
    setupLocaleListener() {
        this.removeLocaleListener = i18n.onLocaleChange(() => {
            this.updateTranslations();
        });
    }

    /**
     * Update translations when locale changes
     */
    updateTranslations() {
        // Update activity bar tooltips
        const items = this.container.querySelectorAll('.activity-bar__item');
        items.forEach(item => {
            const view = item.dataset.view;
            switch (view) {
                case 'files':
                    item.title = `${i18n.t('activityBar.explorer')} (Ctrl+Shift+E)`;
                    break;
                case 'search':
                    item.title = `${i18n.t('activityBar.search')} (Ctrl+Shift+F)`;
                    break;
                case 'outline':
                    item.title = `${i18n.t('activityBar.outline')} (Ctrl+Shift+O)`;
                    break;
                case 'templates':
                    item.title = i18n.t('activityBar.templates');
                    break;
                case 'snippets':
                    item.title = i18n.t('activityBar.snippets');
                    break;
                case 'settings':
                    item.title = i18n.t('activityBar.settings');
                    break;
                case 'ai-chat':
                    item.title = i18n.t('activityBar.aiAssistant');
                    break;
                case 'connection-graph':
                    item.title = i18n.t('activityBar.connectionGraph');
                    break;
            }
        });


        // Update sidebar title if a view is active
        if (this.activeView) {
            const view = this.views.get(this.activeView);
            if (view) {
                const titleEl = this.sidebarPanel.querySelector('.sidebar-panel__title');
                if (titleEl) {
                    titleEl.textContent = view.title;
                }
            }
        }
    }

    /**
     * Create the activity bar HTML structure
     */
    createActivityBar() {
        this.container = document.createElement('div');
        this.container.className = 'activity-bar';
        this.container.innerHTML = `
            <button class="activity-bar__item" data-view="files" title="${i18n.t('activityBar.explorer')} (Ctrl+Shift+E)">
                <span class="activity-bar__icon">${getIcon('folder')}</span>
            </button>
            <button class="activity-bar__item" data-view="search" title="${i18n.t('activityBar.search')} (Ctrl+Shift+F)">
                <span class="activity-bar__icon">${getIcon('search')}</span>
            </button>
            <button class="activity-bar__item" data-view="outline" title="${i18n.t('activityBar.outline')} (Ctrl+Shift+O)">
                <span class="activity-bar__icon">${getIcon('outline')}</span>
            </button>
            <button class="activity-bar__item" data-view="templates" title="${i18n.t('activityBar.templates')}">
                <span class="activity-bar__icon">${getIcon('template')}</span>
            </button>
            <button class="activity-bar__item" data-view="snippets" title="${i18n.t('activityBar.snippets')}">
                <span class="activity-bar__icon">${getIcon('snippet')}</span>
            </button>
            <button class="activity-bar__item" data-view="settings" title="${i18n.t('activityBar.settings')}">
                <span class="activity-bar__icon">${getIcon('settings')}</span>
            </button>
            <button class="activity-bar__item" data-view="ai-chat" title="${i18n.t('activityBar.aiAssistant')}">
                <span class="activity-bar__icon">${getIcon('ai')}</span>
            </button>
            <button class="activity-bar__item" data-view="connection-graph" title="${i18n.t('activityBar.connectionGraph')}">
                <span class="activity-bar__icon">${getIcon('graph')}</span>
            </button>
            <button class="activity-bar__item" data-view="backlinks" title="${i18n.t('activityBar.backlinks')}">
                <span class="activity-bar__icon">${getIcon('backlinks')}</span>
            </button>
        `;
        document.body.appendChild(this.container);
    }

    /**
     * Create the sidebar panel structure
     */
    createSidebarPanel() {
        this.sidebarPanel = document.createElement('div');
        this.sidebarPanel.className = 'sidebar-panel';
        this.sidebarPanel.innerHTML = `
            <div class="sidebar-panel__header">
                <span class="sidebar-panel__title"></span>
                <div class="sidebar-panel__actions">
                    <button class="sidebar-panel__action-btn" id="sidebar-close-btn" title="${i18n.t('activityBar.closeSidebar')}">${getIcon('close')}</button>
                </div>
            </div>
            <div class="sidebar-panel__content"></div>
        `;
        document.body.appendChild(this.sidebarPanel);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Activity bar item clicks
        const items = this.container.querySelectorAll('.activity-bar__item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.toggleView(view);
            });
        });

        // Close button
        const closeBtn = this.sidebarPanel.querySelector('#sidebar-close-btn');
        closeBtn.addEventListener('click', () => {
            this.hide();
        });
    }

    /**
     * Register a view with the activity bar
     * @param {string} viewId - Unique view identifier
     * @param {string} title - View title
     * @param {HTMLElement|Function} content - View content element or function that returns content
     * @param {Array<{icon: string, title: string, onClick: Function}>} [actions] - Optional header action buttons
     */
    registerView(viewId, title, content, actions = []) {
        this.views.set(viewId, { title, content, actions });
    }

    /**
     * Toggle a view (show if hidden, hide if already showing)
     * @param {string} viewId - View identifier
     */
    toggleView(viewId) {
        if (this.activeView === viewId) {
            this.hide();
        } else {
            this.showView(viewId);
        }
    }

    /**
     * Show a specific view
     * @param {string} viewId - View identifier
     */
    showView(viewId) {
        const view = this.views.get(viewId);
        if (!view) {
            console.warn(`View '${viewId}' not registered`);
            return;
        }

        // Update active state
        this.activeView = viewId;

        // Update activity bar items
        const items = this.container.querySelectorAll('.activity-bar__item');
        items.forEach(item => {
            if (item.dataset.view === viewId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update sidebar panel
        const titleEl = this.sidebarPanel.querySelector('.sidebar-panel__title');
        const contentEl = this.sidebarPanel.querySelector('.sidebar-panel__content');
        const actionsEl = this.sidebarPanel.querySelector('.sidebar-panel__actions');

        titleEl.textContent = view.title;
        contentEl.innerHTML = '';

        // Rebuild action buttons: keep close button, add view-specific actions before it
        const closeBtn = actionsEl.querySelector('#sidebar-close-btn');
        actionsEl.innerHTML = '';

        // Add view-specific action buttons
        if (view.actions && view.actions.length > 0) {
            view.actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = 'sidebar-panel__action-btn';
                btn.title = action.title;
                btn.innerHTML = action.icon;
                btn.addEventListener('click', action.onClick);
                actionsEl.appendChild(btn);
            });
        }

        // Re-add close button
        if (closeBtn) {
            actionsEl.appendChild(closeBtn);
        } else {
            const newCloseBtn = document.createElement('button');
            newCloseBtn.className = 'sidebar-panel__action-btn';
            newCloseBtn.id = 'sidebar-close-btn';
            newCloseBtn.title = i18n.t('activityBar.closeSidebar');
            newCloseBtn.innerHTML = getIcon('close');
            newCloseBtn.addEventListener('click', () => this.hide());
            actionsEl.appendChild(newCloseBtn);
        }
        contentEl.innerHTML = '';

        // Support both element and function content
        const content = typeof view.content === 'function' ? view.content() : view.content;
        contentEl.appendChild(content);

        // Show sidebar
        this.sidebarPanel.classList.add('visible');
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.classList.add('sidebar-visible');
        }
    }

    /**
     * Hide the sidebar
     */
    hide() {
        this.activeView = null;

        // Remove active state from all items
        const items = this.container.querySelectorAll('.activity-bar__item');
        items.forEach(item => item.classList.remove('active'));

        // Hide sidebar
        this.sidebarPanel.classList.remove('visible');
        document.getElementById('app-container').classList.remove('sidebar-visible');
    }

    /**
     * Check if sidebar is visible
     * @returns {boolean}
     */
    isVisible() {
        return this.sidebarPanel.classList.contains('visible');
    }

    /**
     * Get the currently active view
     * @returns {string|null}
     */
    getActiveView() {
        return this.activeView;
    }
}

module.exports = ActivityBar;
