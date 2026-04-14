/**
 * ForceDirectedLayout — Positions graph nodes using a force-directed simulation.
 *
 * Uses Coulomb-like repulsion between all node pairs and spring-like attraction
 * along edges, with velocity damping each step. No external dependencies.
 *
 * CommonJS module following the project convention.
 */

const DEFAULT_OPTIONS = {
    repulsionForce: 500,
    attractionForce: 0.01,
    damping: 0.9,
    maxIterations: 300,
    stabilityThreshold: 0.1
};

class ForceDirectedLayout {
    /**
     * @param {Object} [options]
     * @param {number} [options.repulsionForce=500]
     * @param {number} [options.attractionForce=0.01]
     * @param {number} [options.damping=0.9]
     * @param {number} [options.maxIterations=300]
     * @param {number} [options.stabilityThreshold=0.1]
     */
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this._layoutNodes = [];
        this._edges = [];
        this._iteration = 0;
    }

    /**
     * Runs the full force simulation and returns positioned LayoutNode array.
     * @param {Array} nodes - GraphData nodes
     * @param {Array} edges - GraphData edges
     * @returns {Array} LayoutNode[] with x, y, vx, vy, radius, pinned
     */
    calculate(nodes, edges) {
        if (!nodes || nodes.length === 0) {
            return [];
        }

        this._initializeNodes(nodes);
        this._edges = edges || [];
        this._iteration = 0;

        // Single node — place at center
        if (this._layoutNodes.length === 1) {
            this._layoutNodes[0].x = 0;
            this._layoutNodes[0].y = 0;
            this._layoutNodes[0].vx = 0;
            this._layoutNodes[0].vy = 0;
            return this._layoutNodes.map(n => ({ ...n }));
        }

        // Run simulation until stable or max iterations reached
        let stable = false;
        while (!stable && this._iteration < this.options.maxIterations) {
            stable = !this.step();
        }

        return this._layoutNodes.map(n => ({ ...n }));
    }

    /**
     * Executes a single iteration of the force simulation.
     * Applies repulsion between all node pairs, attraction along edges,
     * and damping to velocities.
     * @returns {boolean} true if simulation should continue, false when stable
     */
    step() {
        if (this._layoutNodes.length <= 1) {
            return false;
        }

        this._iteration++;
        const nodes = this._layoutNodes;
        const { repulsionForce, attractionForce, damping } = this.options;

        // Reset forces
        for (const node of nodes) {
            node._fx = 0;
            node._fy = 0;
        }

        // Repulsion: Coulomb-like force between all node pairs
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];

                let dx = b.x - a.x;
                let dy = b.y - a.y;
                let distSq = dx * dx + dy * dy;

                // Prevent division by zero / overlapping nodes
                if (distSq < 1) {
                    dx = (Math.random() - 0.5) * 2;
                    dy = (Math.random() - 0.5) * 2;
                    distSq = dx * dx + dy * dy;
                    if (distSq < 1) distSq = 1;
                }

                const dist = Math.sqrt(distSq);
                const force = repulsionForce / distSq;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                a._fx -= fx;
                a._fy -= fy;
                b._fx += fx;
                b._fy += fy;
            }
        }

        // Attraction: spring-like force along edges
        const nodeIndex = new Map();
        for (let i = 0; i < nodes.length; i++) {
            nodeIndex.set(nodes[i].id, i);
        }

        for (const edge of this._edges) {
            const si = nodeIndex.get(edge.source);
            const ti = nodeIndex.get(edge.target);
            if (si === undefined || ti === undefined) continue;

            const a = nodes[si];
            const b = nodes[ti];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.01) continue;

            const force = attractionForce * dist;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            a._fx += fx;
            a._fy += fy;
            b._fx -= fx;
            b._fy -= fy;
        }

        // Apply forces, damping, and update positions
        let totalMovement = 0;

        for (const node of nodes) {
            if (node.pinned) continue;

            node.vx = (node.vx + node._fx) * damping;
            node.vy = (node.vy + node._fy) * damping;

            // Clamp velocity to prevent explosion
            const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
            const maxSpeed = 50;
            if (speed > maxSpeed) {
                node.vx = (node.vx / speed) * maxSpeed;
                node.vy = (node.vy / speed) * maxSpeed;
            }

            node.x += node.vx;
            node.y += node.vy;

            // Safety: clamp to prevent NaN/Infinity
            if (!isFinite(node.x)) node.x = 0;
            if (!isFinite(node.y)) node.y = 0;
            if (!isFinite(node.vx)) node.vx = 0;
            if (!isFinite(node.vy)) node.vy = 0;

            totalMovement += Math.abs(node.vx) + Math.abs(node.vy);
        }

        // Return true if still moving, false if stable
        return totalMovement > this.options.stabilityThreshold;
    }

    /**
     * Resets the simulation state, clearing all nodes and edges.
     */
    reset() {
        this._layoutNodes = [];
        this._edges = [];
        this._iteration = 0;
    }

    /**
     * Initializes layout nodes with random starting positions and zero velocity.
     * Spreads nodes in a circle to give the simulation a reasonable starting point.
     * @param {Array} nodes - GraphData nodes
     * @private
     */
    _initializeNodes(nodes) {
        const count = nodes.length;
        const radius = Math.max(50, count * 10);

        this._layoutNodes = nodes.map((node, i) => {
            const angle = (2 * Math.PI * i) / count;
            return {
                ...node,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                vx: 0,
                vy: 0,
                radius: 8,
                pinned: false,
                _fx: 0,
                _fy: 0
            };
        });
    }
}

module.exports = ForceDirectedLayout;
