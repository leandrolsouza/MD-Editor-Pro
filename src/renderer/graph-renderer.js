/**
 * GraphRenderer — Renders the document connection graph on a Canvas element.
 *
 * Draws nodes (documents) as circles with type-based visual styles, edges as
 * directed lines with arrowheads, and labels. Supports zoom, pan, hit-testing,
 * node highlighting, and active-node marking.
 *
 * CommonJS module, Canvas 2D API only, no external dependencies.
 */

// Visual style constants per node type
const NODE_STYLES = {
    normal: { color: '#4a9eff', radius: 8, border: null },
    active: { color: '#ff6b35', radius: 12, border: { width: 2, color: '#ffffff' } },
    orphan: { color: '#888888', radius: 6, border: { width: 1, color: '#888888', dash: [4, 3] } },
    missing: { color: '#ff4444', radius: 6, border: { width: 1, color: '#ff4444', dash: [4, 3] } }
};

const EDGE_COLOR = '#555555';
const EDGE_HIGHLIGHT_COLOR = '#4a9eff';
const EDGE_WIDTH = 1;
const EDGE_HIGHLIGHT_WIDTH = 2;
const ARROWHEAD_SIZE = 8;
const LABEL_FONT = '11px sans-serif';
const LABEL_COLOR = '#cccccc';
const HIGHLIGHT_GLOW_COLOR = 'rgba(74, 158, 255, 0.4)';
const HIGHLIGHT_GLOW_RADIUS = 8;

class GraphRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        /** @type {Array} LayoutNode[] with x, y, radius, etc. */
        this._nodes = [];
        /** @type {Array} edges with source/target ids */
        this._edges = [];

        this._state = {
            zoom: 1.0,
            panX: 0,
            panY: 0,
            activeNodeId: null,
            highlightedNodeId: null,
            isDragging: false,
            dragStartX: 0,
            dragStartY: 0
        };
    }

    // ── Public API ──────────────────────────────────────────────────────

    /**
     * Renders the full graph (nodes + edges + labels) on the canvas.
     * @param {{ nodes: Array, edges: Array }} graphData
     * @param {Object} [options]
     */
    render(graphData, options = {}) {
        this._nodes = graphData.nodes || [];
        this._edges = graphData.edges || [];

        this._draw();
    }

    /**
     * Sets the zoom level and re-renders.
     * @param {number} level
     */
    setZoom(level) {
        this._state.zoom = Math.max(0.1, Math.min(level, 5));
        this._draw();
    }

    /**
     * Sets the pan offset and re-renders.
     * @param {number} x
     * @param {number} y
     */
    setPan(x, y) {
        this._state.panX = x;
        this._state.panY = y;
        this._draw();
    }

    /**
     * Returns the node at the given canvas coordinates (accounting for
     * zoom/pan), or null if no node is hit.
     * @param {number} x - canvas-space X
     * @param {number} y - canvas-space Y
     * @returns {Object|null}
     */
    hitTest(x, y) {
        // Convert canvas coords → world coords
        const worldX = (x - this.canvas.width / 2 - this._state.panX) / this._state.zoom;
        const worldY = (y - this.canvas.height / 2 - this._state.panY) / this._state.zoom;

        // Iterate in reverse so top-drawn nodes are tested first
        for (let i = this._nodes.length - 1; i >= 0; i--) {
            const node = this._nodes[i];
            const r = this._getNodeRadius(node);
            const dx = worldX - node.x;
            const dy = worldY - node.y;
            if (dx * dx + dy * dy <= r * r) {
                return node;
            }
        }
        return null;
    }

    /**
     * Highlights a node and all directly connected edges, then re-renders.
     * @param {string} nodeId
     */
    highlightNode(nodeId) {
        this._state.highlightedNodeId = nodeId;
        this._draw();
    }

    /**
     * Removes any node/edge highlight and re-renders.
     */
    clearHighlight() {
        this._state.highlightedNodeId = null;
        this._draw();
    }

    /**
     * Marks a node as the active document with a distinct visual style.
     * @param {string} nodeId
     */
    setActiveNode(nodeId) {
        this._state.activeNodeId = nodeId;
        this._draw();
    }

    /**
     * Updates the canvas dimensions and re-renders.
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this._draw();
    }

    // ── Internal helpers ────────────────────────────────────────────────

    /**
     * Returns the set of highlighted edge indices (edges connected to the
     * highlighted node).
     * @returns {Set<number>}
     */
    _getHighlightedEdgeIndices() {
        const id = this._state.highlightedNodeId;
        if (!id) return new Set();

        const indices = new Set();
        for (let i = 0; i < this._edges.length; i++) {
            const e = this._edges[i];
            if (e.source === id || e.target === id) {
                indices.add(i);
            }
        }
        return indices;
    }

    /**
     * Determines the visual type of a node.
     * @param {Object} node
     * @returns {'active'|'missing'|'orphan'|'normal'}
     */
    _getNodeType(node) {
        if (node.id === this._state.activeNodeId) return 'active';
        if (node.exists === false) return 'missing';
        if (node.inDegree === 0 && node.outDegree === 0) return 'orphan';
        return 'normal';
    }

    /**
     * Returns the effective radius for a node, accounting for highlight.
     * @param {Object} node
     * @returns {number}
     */
    _getNodeRadius(node) {
        const type = this._getNodeType(node);
        const style = NODE_STYLES[type];
        const base = style.radius;
        if (node.id === this._state.highlightedNodeId) return base + 2;
        return base;
    }

    /**
     * Builds a lookup map from node id → node object.
     * @returns {Map<string, Object>}
     */
    _buildNodeMap() {
        const map = new Map();
        for (const n of this._nodes) {
            map.set(n.id, n);
        }
        return map;
    }

    // ── Drawing pipeline ────────────────────────────────────────────────

    /**
     * Full redraw: clears canvas, applies transform, draws edges then nodes
     * then labels.
     */
    _draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.save();

        // Move origin to center, then apply pan and zoom
        ctx.translate(w / 2 + this._state.panX, h / 2 + this._state.panY);
        ctx.scale(this._state.zoom, this._state.zoom);

        const nodeMap = this._buildNodeMap();
        const highlightedEdges = this._getHighlightedEdgeIndices();

        // Draw edges (non-highlighted first, highlighted on top)
        this._drawEdges(ctx, nodeMap, highlightedEdges, false);
        this._drawEdges(ctx, nodeMap, highlightedEdges, true);

        // Draw nodes
        for (const node of this._nodes) {
            this._drawNode(ctx, node);
        }

        // Draw labels
        for (const node of this._nodes) {
            this._drawLabel(ctx, node);
        }

        ctx.restore();
    }

    /**
     * Draws edges. When `highlighted` is false, draws only non-highlighted
     * edges; when true, draws only highlighted edges (so they render on top).
     */
    _drawEdges(ctx, nodeMap, highlightedEdges, highlighted) {
        for (let i = 0; i < this._edges.length; i++) {
            const isHL = highlightedEdges.has(i);
            if (highlighted !== isHL) continue;

            const edge = this._edges[i];
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) continue;

            const color = isHL ? EDGE_HIGHLIGHT_COLOR : EDGE_COLOR;
            const width = isHL ? EDGE_HIGHLIGHT_WIDTH : EDGE_WIDTH;

            this._drawEdgeLine(ctx, src, tgt, color, width);
        }
    }

    /**
     * Draws a single directed edge with an arrowhead.
     */
    _drawEdgeLine(ctx, src, tgt, color, width) {
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;

        const ux = dx / dist;
        const uy = dy / dist;

        // Shorten line so it stops at the target node's edge
        const tgtRadius = this._getNodeRadius(tgt);
        const endX = tgt.x - ux * tgtRadius;
        const endY = tgt.y - uy * tgtRadius;

        // Line
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.setLineDash([]);
        ctx.stroke();

        // Arrowhead
        const arrowSize = ARROWHEAD_SIZE;
        const ax = endX - ux * arrowSize;
        const ay = endY - uy * arrowSize;
        const perpX = -uy;
        const perpY = ux;
        const halfW = arrowSize * 0.4;

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(ax + perpX * halfW, ay + perpY * halfW);
        ctx.lineTo(ax - perpX * halfW, ay - perpY * halfW);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    /**
     * Draws a single node circle with type-based styling.
     */
    _drawNode(ctx, node) {
        const type = this._getNodeType(node);
        const style = NODE_STYLES[type];
        const radius = this._getNodeRadius(node);
        const isHighlighted = node.id === this._state.highlightedNodeId;

        // Glow effect for highlighted node
        if (isHighlighted) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + HIGHLIGHT_GLOW_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = HIGHLIGHT_GLOW_COLOR;
            ctx.fill();
            ctx.restore();
        }

        // Node fill
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = style.color;
        ctx.fill();

        // Border
        if (style.border) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = style.border.color;
            ctx.lineWidth = style.border.width;
            if (style.border.dash) {
                ctx.setLineDash(style.border.dash);
            } else {
                ctx.setLineDash([]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Highlight border
        if (isHighlighted && !style.border) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = EDGE_HIGHLIGHT_COLOR;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.stroke();
        }
    }

    /**
     * Draws the label below a node.
     */
    _drawLabel(ctx, node) {
        const radius = this._getNodeRadius(node);
        ctx.font = LABEL_FONT;
        ctx.fillStyle = LABEL_COLOR;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label || node.id, node.x, node.y + radius + 4);
    }
}

module.exports = GraphRenderer;
