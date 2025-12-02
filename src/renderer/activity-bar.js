/**
 * Activity Bar - VS Code Style Sidebar Manager
 * Manages the activity bar and sidebar panels
 */

class ActivityBar {
    constructor() {
        this.container = null;
        this.sidebarPanel = null;
        this.activeView = null;
        this.views = new Map();
    }

    /**
     * Initialize the activity bar
     */
    initialize() {
        this.createActivityBar();
        this.createSidebarPanel();
        this.setupEventListeners();
    }

    /**
     * Create the activity bar HTML structure
     */
    createActivityBar() {
        this.container = document.createElement('div');
        this.container.className = 'activity-bar';
        this.container.innerHTML = `
            <button class="activity-bar__item" data-view="files" title="Explorer (Ctrl+Shift+E)">
                <span class="activity-bar__icon">📁</span>
            </button>
            <button class="activity-bar__item" data-view="search" title="Search (Ctrl+Shift+F)">
                <span class="activity-bar__icon">🔍</span>
            </button>
            <button class="activity-bar__item" data-view="outline" title="Outline (Ctrl+Shift+O)">
                <span class="activity-bar__icon">≡</span>
            </button>
            <button class="activity-bar__item" data-view="templates" title="Templates">
                <span class="activity-bar__icon">📄</span>
            </button>
            <button class="activity-bar__item" data-view="snippets" title="Snippets">
                <span class="activity-bar__icon">✂️</span>
            </button>
            <button class="activity-bar__item" data-view="settings" title="Settings">
                <span class="activity-bar__icon">⚙️</span>
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
                    <button class="sidebar-panel__action-btn" id="sidebar-close-btn" title="Close Sidebar">✕</button>
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
     */
    registerView(viewId, title, content) {
        this.views.set(viewId, { title, content });
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

        titleEl.textContent = view.title;
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
