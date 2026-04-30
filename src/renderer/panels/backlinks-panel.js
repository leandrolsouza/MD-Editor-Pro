/**
 * Backlinks Panel - Shows which documents link to the currently active document
 * Integrates with the existing LinkAnalyzerManager via the graph:get-data IPC
 */

const i18n = require('../i18n/index.js');
const { getIcon } = require('../ui/icons.js');

class BacklinksPanel {
    constructor() {
        this.container = null;
        this.listContainer = null;
        this.currentFilePath = null;
        this.graphData = null;
        this.onFileClick = null;
        this._fileClickCallback = null;
    }

    /**
     * Initialize and return the panel container element
     * @returns {HTMLElement}
     */
    initialize() {
        this.container = document.createElement('div');
        this.container.className = 'backlinks-panel';

        // Header info
        const info = document.createElement('div');
        info.className = 'backlinks-panel__info';
        info.id = 'backlinks-info';
        info.textContent = i18n.t('backlinks.noDocument');
        this.container.appendChild(info);

        // List container
        this.listContainer = document.createElement('div');
        this.listContainer.className = 'backlinks-panel__list';
        this.listContainer.setAttribute('role', 'list');
        this.container.appendChild(this.listContainer);

        return this.container;
    }

    /**
     * Set the callback for when a backlink file is clicked
     * @param {Function} callback - (filePath: string) => void
     */
    onFileClicked(callback) {
        this._fileClickCallback = callback;
    }

    /**
     * Update the panel for the given active document
     * @param {string|null} filePath - Absolute path of the active document
     * @param {string|null} workspacePath - Workspace root path
     */
    async setActiveDocument(filePath, workspacePath) {
        this.currentFilePath = filePath;

        if (!filePath || !workspacePath) {
            this._showNoDocument();
            return;
        }

        await this._loadAndRender(filePath, workspacePath);
    }

    /**
     * Refresh the backlinks data
     */
    async refresh() {
        if (!this.currentFilePath) {
            this._showNoDocument();
            return;
        }

        // Force re-fetch graph data
        this.graphData = null;
        try {
            const result = await window.electronAPI.getGraphData();
            if (result && result.success) {
                this.graphData = result.graph;
            }
        } catch (error) {
            console.error('Failed to refresh backlinks:', error);
        }

        if (this.currentFilePath) {
            this._renderBacklinks();
        }
    }

    /**
     * Load graph data and render backlinks
     * @param {string} filePath
     * @param {string} workspacePath
     * @private
     */
    async _loadAndRender(filePath, workspacePath) {
        const infoEl = this.container.querySelector('#backlinks-info');

        // Show loading
        if (infoEl) {
            infoEl.textContent = i18n.t('actions.loading');
        }

        try {
            // Fetch graph data if not cached
            if (!this.graphData) {
                const result = await window.electronAPI.getGraphData();
                if (result && result.success) {
                    this.graphData = result.graph;
                } else {
                    this._showError();
                    return;
                }
            }

            this._renderBacklinks();
        } catch (error) {
            console.error('Failed to load backlinks:', error);
            this._showError();
        }
    }

    /**
     * Render the backlinks list based on current graph data and active file
     * @private
     */
    _renderBacklinks() {
        if (!this.graphData || !this.currentFilePath) {
            this._showNoDocument();
            return;
        }

        const infoEl = this.container.querySelector('#backlinks-info');
        this.listContainer.innerHTML = '';

        // Find the node ID for the current file
        const currentNode = this.graphData.nodes.find(n => n.filePath === this.currentFilePath);
        if (!currentNode) {
            if (infoEl) infoEl.textContent = i18n.t('backlinks.noBacklinks');
            return;
        }

        const currentId = currentNode.id;

        // Find all edges pointing TO this document
        const incomingEdges = this.graphData.edges.filter(e => e.target === currentId);

        if (incomingEdges.length === 0) {
            if (infoEl) infoEl.textContent = i18n.t('backlinks.noBacklinks');
            return;
        }

        // Get unique source documents
        const sourceIds = [...new Set(incomingEdges.map(e => e.source))];
        const sourceNodes = sourceIds
            .map(id => this.graphData.nodes.find(n => n.id === id))
            .filter(Boolean);

        if (infoEl) {
            infoEl.textContent = i18n.t('backlinks.count', { count: sourceNodes.length });
        }

        // Render each backlink
        sourceNodes.forEach(node => {
            const linkCount = incomingEdges.filter(e => e.source === node.id).length;

            const item = document.createElement('div');
            item.className = 'backlinks-panel__item';
            item.setAttribute('role', 'listitem');
            item.setAttribute('tabindex', '0');

            const icon = document.createElement('span');
            icon.className = 'backlinks-panel__item-icon';
            icon.innerHTML = getIcon('fileText');

            const details = document.createElement('div');
            details.className = 'backlinks-panel__item-details';

            const name = document.createElement('span');
            name.className = 'backlinks-panel__item-name';
            name.textContent = node.label;

            const path = document.createElement('span');
            path.className = 'backlinks-panel__item-path';
            path.textContent = node.id;

            details.appendChild(name);
            details.appendChild(path);

            const badge = document.createElement('span');
            badge.className = 'backlinks-panel__item-badge';
            badge.textContent = linkCount > 1 ? `${linkCount} ${i18n.t('backlinks.links')}` : `1 ${i18n.t('backlinks.link')}`;

            item.appendChild(icon);
            item.appendChild(details);
            item.appendChild(badge);

            // Click handler
            const handleClick = () => {
                if (this._fileClickCallback && node.filePath) {
                    this._fileClickCallback(node.filePath);
                }
            };

            item.addEventListener('click', handleClick);
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            });

            this.listContainer.appendChild(item);
        });
    }

    /**
     * Show "no document" state
     * @private
     */
    _showNoDocument() {
        const infoEl = this.container.querySelector('#backlinks-info');
        if (infoEl) infoEl.textContent = i18n.t('backlinks.noDocument');
        if (this.listContainer) this.listContainer.innerHTML = '';
    }

    /**
     * Show error state
     * @private
     */
    _showError() {
        const infoEl = this.container.querySelector('#backlinks-info');
        if (infoEl) infoEl.textContent = i18n.t('backlinks.error');
        if (this.listContainer) this.listContainer.innerHTML = '';
    }

    /**
     * Invalidate cached graph data (call when workspace changes)
     */
    invalidateCache() {
        this.graphData = null;
    }

    /**
     * Update translations
     */
    updateTranslations() {
        // Re-render if we have data
        if (this.currentFilePath && this.graphData) {
            this._renderBacklinks();
        } else {
            this._showNoDocument();
        }
    }

    /**
     * Destroy and clean up
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

module.exports = BacklinksPanel;
