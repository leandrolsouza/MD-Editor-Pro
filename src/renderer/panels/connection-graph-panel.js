/**
 * ConnectionGraphPanel — Panel component for the document connection graph.
 *
 * Creates the DOM structure, wires mouse interactions (click, hover, zoom, pan),
 * loads graph data via IPC, and delegates rendering to GraphRenderer and layout
 * to ForceDirectedLayout.
 *
 * CommonJS module following the project component pattern.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5,
 *               5.3, 5.4, 9.1, 9.2, 10.1, 10.2, 10.3
 */

const GraphRenderer = require('../ui/graph-renderer.js');
const ForceDirectedLayout = require('../ui/force-directed-layout.js');

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 5;

class ConnectionGraphPanel {
    constructor() {
        /** @type {HTMLElement|null} */
        this.container = null;
        /** @type {HTMLCanvasElement|null} */
        this.canvas = null;
        /** @type {GraphRenderer|null} */
        this.renderer = null;
        /** @type {ForceDirectedLayout} */
        this.layout = new ForceDirectedLayout();

        /** @type {Array} current layout nodes */
        this._nodes = [];
        /** @type {Array} current edges */
        this._edges = [];
        /** @type {number} current zoom level */
        this._zoom = 1;
        /** @type {number} pan offset X */
        this._panX = 0;
        /** @type {number} pan offset Y */
        this._panY = 0;

        // Pan drag state
        this._isPanning = false;
        this._panStartX = 0;
        this._panStartY = 0;
        this._panBaseX = 0;
        this._panBaseY = 0;

        /** @type {Function|null} node click callback */
        this._onNodeClickCb = null;

        // DOM references
        this._headerEl = null;
        this._canvasContainer = null;
        this._loadingEl = null;
        this._noWorkspaceEl = null;
        this._errorEl = null;
        this._tooltipEl = null;

        // Bound event handlers (for cleanup)
        this._handleWheel = this._onWheel.bind(this);
        this._handleMouseDown = this._onMouseDown.bind(this);
        this._handleMouseMove = this._onMouseMove.bind(this);
        this._handleMouseUp = this._onMouseUp.bind(this);
        this._handleClick = this._onClick.bind(this);
        this._handleResize = this._onResize.bind(this);
    }

    // ── Public API ──────────────────────────────────────────────────────

    /**
     * Creates the panel DOM structure and returns the root element.
     * @returns {HTMLElement}
     */
    initialize() {
        const t = this._t.bind(this);

        this.container = document.createElement('div');
        this.container.className = 'connection-graph-panel';
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', t('connectionGraph.title'));

        // Header
        this._headerEl = document.createElement('div');
        this._headerEl.className = 'connection-graph-header';

        const title = document.createElement('span');
        title.className = 'connection-graph-title';
        title.textContent = t('connectionGraph.title');

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'connection-graph-refresh-btn';
        refreshBtn.textContent = '↻';
        refreshBtn.title = t('connectionGraph.refresh');
        refreshBtn.setAttribute('role', 'button');
        refreshBtn.setAttribute('aria-label', t('connectionGraph.refresh'));
        refreshBtn.tabIndex = 0;
        refreshBtn.addEventListener('click', () => this.refresh());

        this._headerEl.appendChild(title);
        this._headerEl.appendChild(refreshBtn);

        // Canvas container
        this._canvasContainer = document.createElement('div');
        this._canvasContainer.className = 'connection-graph-canvas-container';

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'connection-graph-canvas';
        this.canvas.setAttribute('role', 'img');
        this.canvas.setAttribute('aria-label', t('connectionGraph.title'));
        this._canvasContainer.appendChild(this.canvas);

        // Tooltip (hidden by default)
        this._tooltipEl = document.createElement('div');
        this._tooltipEl.className = 'connection-graph-tooltip';
        this._tooltipEl.style.display = 'none';
        this._canvasContainer.appendChild(this._tooltipEl);

        // Loading indicator
        this._loadingEl = document.createElement('div');
        this._loadingEl.className = 'connection-graph-loading';
        this._loadingEl.textContent = t('connectionGraph.loading');
        this._loadingEl.style.display = 'none';
        this._loadingEl.setAttribute('role', 'status');
        this._loadingEl.setAttribute('aria-label', t('connectionGraph.loading'));

        // No-workspace message
        this._noWorkspaceEl = document.createElement('div');
        this._noWorkspaceEl.className = 'connection-graph-no-workspace';
        this._noWorkspaceEl.textContent = t('connectionGraph.noWorkspace');
        this._noWorkspaceEl.style.display = 'none';

        // Error message
        this._errorEl = document.createElement('div');
        this._errorEl.className = 'connection-graph-error';
        this._errorEl.textContent = t('connectionGraph.errorLoading');
        this._errorEl.style.display = 'none';

        // Assemble
        this.container.appendChild(this._headerEl);
        this.container.appendChild(this._canvasContainer);
        this.container.appendChild(this._loadingEl);
        this.container.appendChild(this._noWorkspaceEl);
        this.container.appendChild(this._errorEl);

        // Initialize renderer
        this.renderer = new GraphRenderer(this.canvas);

        // Wire events
        this._attachEvents();

        return this.container;
    }

    /**
     * Loads graph data via IPC, applies layout, and renders.
     * Shows loading indicator while working, error message on failure.
     */
    async loadGraphData() {
        this._showLoading(true);
        this._showError(false);
        this._showNoWorkspace(false);

        try {
            const result = await window.electronAPI.getGraphData();

            if (!result || !result.success) {
                const errMsg = (result && result.error) || '';
                // If no workspace is open, show the no-workspace message
                if (errMsg.toLowerCase().includes('workspace')) {
                    this._showLoading(false);
                    this.clear();
                    return;
                }
                throw new Error(errMsg || 'Unknown error');
            }

            const graph = result.graph;
            if (!graph || !graph.nodes || graph.nodes.length === 0) {
                this._nodes = [];
                this._edges = [];
                this._showLoading(false);
                this._showCanvas(true);
                this.renderer.render({ nodes: [], edges: [] });
                return;
            }

            // Apply force-directed layout
            this.layout.reset();
            const layoutNodes = this.layout.calculate(graph.nodes, graph.edges);

            this._nodes = layoutNodes;
            this._edges = graph.edges;

            // Render — use rAF to ensure the container has been laid out
            this._showLoading(false);
            this._showCanvas(true);

            await new Promise(resolve => requestAnimationFrame(resolve));
            this._sizeCanvas();
            this.renderer.render({ nodes: layoutNodes, edges: graph.edges });
        } catch (err) {
            console.error('ConnectionGraphPanel: failed to load graph data', err);
            this._showLoading(false);
            this._showError(true);
        }
    }

    /**
     * Updates the active document highlight in the graph.
     * @param {string} filePath — absolute or relative path of the active document
     */
    setActiveDocument(filePath) {
        if (!this.renderer) return;

        // Find the node whose filePath or id matches
        const node = this._nodes.find(
            n => n.filePath === filePath || n.id === filePath
        );
        this.renderer.setActiveNode(node ? node.id : null);
    }

    /**
     * Re-fetches graph data and re-renders.
     */
    async refresh() {
        await this.loadGraphData();
    }

    /**
     * Clears the graph and shows the no-workspace message.
     */
    clear() {
        this._nodes = [];
        this._edges = [];
        this._zoom = 1;
        this._panX = 0;
        this._panY = 0;

        if (this.renderer) {
            this.renderer.render({ nodes: [], edges: [] });
            this.renderer.setZoom(1);
            this.renderer.setPan(0, 0);
        }

        this._showCanvas(false);
        this._showError(false);
        this._showLoading(false);
        this._showNoWorkspace(true);
    }

    /**
     * Registers a callback for node click events.
     * @param {Function} callback — receives filePath string
     */
    onNodeClick(callback) {
        this._onNodeClickCb = callback;
    }

    /**
     * Cleans up event listeners and resources.
     */
    destroy() {
        this._detachEvents();

        if (this.renderer) {
            this.renderer = null;
        }
        this.layout.reset();
        this._nodes = [];
        this._edges = [];
        this._onNodeClickCb = null;

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }

    /**
     * Updates all user-visible text to the current locale.
     */
    updateTranslations() {
        if (!this.container) return;
        const t = this._t.bind(this);

        const title = this.container.querySelector('.connection-graph-title');
        if (title) title.textContent = t('connectionGraph.title');

        const refreshBtn = this.container.querySelector('.connection-graph-refresh-btn');
        if (refreshBtn) {
            refreshBtn.title = t('connectionGraph.refresh');
            refreshBtn.setAttribute('aria-label', t('connectionGraph.refresh'));
        }

        if (this._loadingEl) this._loadingEl.textContent = t('connectionGraph.loading');
        if (this._noWorkspaceEl) this._noWorkspaceEl.textContent = t('connectionGraph.noWorkspace');
        if (this._errorEl) this._errorEl.textContent = t('connectionGraph.errorLoading');

        this.container.setAttribute('aria-label', t('connectionGraph.title'));
        if (this.canvas) this.canvas.setAttribute('aria-label', t('connectionGraph.title'));
    }

    // ── Event wiring ────────────────────────────────────────────────────

    /** @private */
    _attachEvents() {
        if (!this.canvas) return;
        this.canvas.addEventListener('wheel', this._handleWheel, { passive: false });
        this.canvas.addEventListener('mousedown', this._handleMouseDown);
        this.canvas.addEventListener('mousemove', this._handleMouseMove);
        this.canvas.addEventListener('mouseup', this._handleMouseUp);
        this.canvas.addEventListener('mouseleave', this._handleMouseUp);
        this.canvas.addEventListener('click', this._handleClick);

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', this._handleResize);
        }
    }

    /** @private */
    _detachEvents() {
        if (this.canvas) {
            this.canvas.removeEventListener('wheel', this._handleWheel);
            this.canvas.removeEventListener('mousedown', this._handleMouseDown);
            this.canvas.removeEventListener('mousemove', this._handleMouseMove);
            this.canvas.removeEventListener('mouseup', this._handleMouseUp);
            this.canvas.removeEventListener('mouseleave', this._handleMouseUp);
            this.canvas.removeEventListener('click', this._handleClick);
        }

        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', this._handleResize);
        }
    }

    // ── Mouse event handlers ────────────────────────────────────────────

    /** Zoom via mouse wheel. @private */
    _onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        this._zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this._zoom + delta));
        if (this.renderer) {
            this.renderer.setZoom(this._zoom);
        }
    }

    /** Start panning. @private */
    _onMouseDown(e) {
        this._isPanning = true;
        this._panStartX = e.clientX;
        this._panStartY = e.clientY;
        this._panBaseX = this._panX;
        this._panBaseY = this._panY;
        if (this.canvas) this.canvas.style.cursor = 'grabbing';
    }

    /** Handle mousemove — pan or hover tooltip. @private */
    _onMouseMove(e) {
        if (this._isPanning) {
            const dx = e.clientX - this._panStartX;
            const dy = e.clientY - this._panStartY;
            this._panX = this._panBaseX + dx;
            this._panY = this._panBaseY + dy;
            if (this.renderer) {
                this.renderer.setPan(this._panX, this._panY);
            }
            return;
        }

        // Hover: hit-test and show tooltip
        if (!this.renderer || !this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const node = this.renderer.hitTest(x, y);

        if (node) {
            this.renderer.highlightNode(node.id);
            this._showTooltip(node, e.clientX, e.clientY);
            this.canvas.style.cursor = 'pointer';
        } else {
            this.renderer.clearHighlight();
            this._hideTooltip();
            this.canvas.style.cursor = 'grab';
        }
    }

    /** End panning. @private */
    _onMouseUp() {
        if (this._isPanning) {
            this._isPanning = false;
            if (this.canvas) this.canvas.style.cursor = 'grab';
        }
    }

    /** Click — open document via callback. @private */
    _onClick(e) {
        // Ignore if we just finished a drag
        if (Math.abs(e.clientX - this._panStartX) > 3 ||
            Math.abs(e.clientY - this._panStartY) > 3) {
            return;
        }

        if (!this.renderer || !this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const node = this.renderer.hitTest(x, y);

        if (node && node.exists !== false && this._onNodeClickCb) {
            this._onNodeClickCb(node.filePath);
        }
    }

    /** Resize canvas to fit container. @private */
    _onResize() {
        this._sizeCanvas();
    }

    // ── Tooltip ─────────────────────────────────────────────────────────

    /** @private */
    _showTooltip(node, clientX, clientY) {
        if (!this._tooltipEl || !this._canvasContainer) return;
        const t = this._t.bind(this);

        let html = `<strong>${node.id}</strong>`;

        if (node.exists === false) {
            html += `<br>${t('connectionGraph.missingDocument')}`;
        } else if (node.inDegree === 0 && node.outDegree === 0) {
            html += `<br>${t('connectionGraph.orphanDocument')}`;
        } else {
            const inLabel = t('connectionGraph.inbound').replace('{count}', node.inDegree != null ? node.inDegree : 0);
            const outLabel = t('connectionGraph.outbound').replace('{count}', node.outDegree != null ? node.outDegree : 0);
            html += `<br>${inLabel}<br>${outLabel}`;
        }

        this._tooltipEl.innerHTML = html;
        this._tooltipEl.style.display = 'block';

        // Position relative to canvas container
        const containerRect = this._canvasContainer.getBoundingClientRect();
        this._tooltipEl.style.left = (clientX - containerRect.left + 12) + 'px';
        this._tooltipEl.style.top = (clientY - containerRect.top + 12) + 'px';
    }

    /** @private */
    _hideTooltip() {
        if (this._tooltipEl) {
            this._tooltipEl.style.display = 'none';
        }
    }

    // ── Visibility helpers ──────────────────────────────────────────────

    /** @private */
    _showLoading(show) {
        if (this._loadingEl) this._loadingEl.style.display = show ? 'flex' : 'none';
        if (show) this._showCanvas(false);
    }

    /** @private */
    _showNoWorkspace(show) {
        if (this._noWorkspaceEl) this._noWorkspaceEl.style.display = show ? 'flex' : 'none';
    }

    /** @private */
    _showError(show) {
        if (this._errorEl) this._errorEl.style.display = show ? 'flex' : 'none';
    }

    /** @private */
    _showCanvas(show) {
        if (this._canvasContainer) this._canvasContainer.style.display = show ? 'block' : 'none';
    }

    /** @private */
    _sizeCanvas() {
        if (!this.canvas || !this._canvasContainer) return;
        const rect = this._canvasContainer.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && this.renderer) {
            this.renderer.resize(rect.width, rect.height);
        }
    }

    // ── i18n helper ─────────────────────────────────────────────────────

    /**
     * Translates a key using the global i18n system.
     * Falls back to the key itself if i18n is unavailable.
     * @param {string} key
     * @returns {string}
     * @private
     */
    _t(key) {
        if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
            return window.i18n.t(key);
        }
        // Fallback: return the last segment of the key
        return key.split('.').pop() || key;
    }
}

module.exports = ConnectionGraphPanel;
