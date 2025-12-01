/**
 * FileTreeSidebar - Manages the file tree sidebar UI for workspace navigation
 * Handles tree rendering, user interactions, and file state indicators
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

class FileTreeSidebar {
    constructor(container) {
        if (!container) {
            throw new Error('Container element is required');
        }
        this.container = container;
        this.treeData = [];
        this.activeFilePath = null;
        this.modifiedFiles = new Set();
        this.fileClickCallbacks = [];
        this.folderToggleCallbacks = [];
        this.focusedNodePath = null;
        this.keyboardNavigationEnabled = false;

        // Performance optimizations
        this.folderToggleDebounceTimers = new Map();
        this.DEBOUNCE_DELAY = 150; // ms (can be set to 0 for testing)
        this.renderBatchSize = 50; // Nodes to render per batch
        this.useVirtualScrolling = false;
        this.virtualScrollOffset = 0;
        this.virtualScrollViewportHeight = 0;
        this.nodeHeight = 28; // Approximate height of a node in pixels
    }

    /**
     * Initialize the sidebar
     */
    initialize() {
        // Ensure the container has the correct class
        if (!this.container.classList.contains('file-tree-sidebar')) {
            this.container.className = 'file-tree-sidebar';
        }

        this.container.setAttribute('role', 'tree');
        this.container.setAttribute('aria-label', 'File tree');
        this.container.setAttribute('tabindex', '0');

        // Set up keyboard navigation
        this._setupKeyboardNavigation();

        // Set up toggle button
        this._setupToggleButton();
    }

    /**
     * Set up keyboard navigation for the sidebar
     * Requirements: 3.1, 3.2, 4.1
     * @private
     */
    _setupKeyboardNavigation() {
        this.container.addEventListener('keydown', (e) => {
            this._handleKeyDown(e);
        });

        this.container.addEventListener('focus', () => {
            this.keyboardNavigationEnabled = true;
            // If no node is focused, focus the first node
            if (!this.focusedNodePath) {
                const firstNode = this._getFirstVisibleNode();
                if (firstNode) {
                    this._setFocusedNode(firstNode.path);
                }
            }
        });

        this.container.addEventListener('blur', () => {
            this.keyboardNavigationEnabled = false;
        });
    }

    /**
     * Set up toggle button for sidebar visibility
     * Requirements: 5.1
     * @private
     */
    _setupToggleButton() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleVisibility();
            });
        }
    }

    /**
     * Handle keyboard events
     * Requirements: 3.1, 3.2, 4.1
     * @param {KeyboardEvent} e - Keyboard event
     * @private
     */
    _handleKeyDown(e) {
        if (!this.keyboardNavigationEnabled) {
            return;
        }

        const focusedNode = this._getFocusedNode();
        if (!focusedNode) {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this._focusNextNode();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this._focusPreviousNode();
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (focusedNode.type === 'folder') {
                    if (!focusedNode.isExpanded) {
                        // Expand folder
                        this._handleFolderToggle(focusedNode);
                    } else {
                        // Move to first child
                        this._focusNextNode();
                    }
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (focusedNode.type === 'folder' && focusedNode.isExpanded) {
                    // Collapse folder
                    this._handleFolderToggle(focusedNode);
                } else {
                    // Move to parent
                    this._focusParentNode();
                }
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this._handleNodeClick(focusedNode);
                break;
            case 'Home':
                e.preventDefault();
                this._focusFirstNode();
                break;
            case 'End':
                e.preventDefault();
                this._focusLastNode();
                break;
        }
    }

    /**
     * Load workspace tree
     * Performance optimization: Determines if virtual scrolling is needed
     * @param {Array<TreeNode>} treeData - Tree structure to render
     */
    async loadWorkspace(treeData) {
        try {
            if (!Array.isArray(treeData)) {
                throw new Error('Tree data must be an array');
            }

            // Validate tree data structure
            if (!this._validateTreeData(treeData)) {
                throw new Error('Invalid tree data structure');
            }

            this.treeData = treeData;

            // Performance optimization: Enable virtual scrolling for large trees
            const totalNodes = this._countTotalNodes(treeData);
            this.useVirtualScrolling = totalNodes > 500;

            if (this.useVirtualScrolling) {
                this._setupVirtualScrolling();
            }

            this.renderTree(treeData);
        } catch (error) {
            console.error('Error loading workspace:', error);
            // Clear any partial rendering
            this.clearWorkspace();
            throw error;
        }
    }

    /**
     * Clear workspace
     */
    clearWorkspace() {
        try {
            this.treeData = [];
            this.activeFilePath = null;
            this.modifiedFiles.clear();
            this.focusedNodePath = null;
            this.useVirtualScrolling = false;
            this.folderToggleDebounceTimers.clear();

            const treeContainer = document.getElementById('file-tree-container');
            if (treeContainer) {
                treeContainer.innerHTML = '';
            }
        } catch (error) {
            console.error('Error clearing workspace:', error);
            // Try to at least clear the data structures
            this.treeData = [];
            this.activeFilePath = null;
            this.modifiedFiles = new Set();
            this.focusedNodePath = null;
            this.useVirtualScrolling = false;
            this.folderToggleDebounceTimers = new Map();
        }
    }

    /**
     * Render tree structure
     * Performance optimization: Uses incremental rendering for large trees
     * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.2
     * @param {Array<TreeNode>} nodes - Tree nodes to render
     * @param {HTMLElement} parentElement - Parent DOM element (optional)
     * @param {number} depth - Current depth level for indentation
     */
    renderTree(nodes, parentElement = null, depth = 0) {
        try {
            if (!Array.isArray(nodes)) {
                throw new Error('Nodes must be an array');
            }

            // Use the tree container if no parent element is specified
            const treeContainer = document.getElementById('file-tree-container');
            const container = parentElement || treeContainer || this.container;

            if (!container) {
                throw new Error('Container element not found');
            }

            // Clear container only if this is the root level (depth === 0 and no parentElement)
            if (depth === 0 && !parentElement) {
                container.innerHTML = '';
            }

            // Sort nodes: folders first, then files, alphabetically within each group
            const sortedNodes = this._sortNodes(nodes);

            // Performance optimization: Use incremental rendering for large node lists
            if (sortedNodes.length > this.renderBatchSize && !parentElement) {
                this._renderIncremental(sortedNodes, container, depth);
            } else {
                // Standard rendering for smaller lists or child nodes
                sortedNodes.forEach(node => {
                    try {
                        const nodeElement = this._createNodeElement(node, depth);
                        container.appendChild(nodeElement);

                        // If node is a folder and is expanded, render its children
                        if (node.type === 'folder' && node.isExpanded && node.children && node.children.length > 0) {
                            const childContainer = document.createElement('div');
                            childContainer.className = 'file-tree-sidebar__children';
                            childContainer.setAttribute('role', 'group');
                            container.appendChild(childContainer);
                            this.renderTree(node.children, childContainer, depth + 1);
                        }
                    } catch (nodeError) {
                        console.error('Error rendering tree node:', nodeError);
                        // Continue rendering other nodes
                    }
                });
            }
        } catch (error) {
            console.error('Error rendering tree:', error);
            throw error;
        }
    }

    /**
     * Create a tree node element
     * Requirements: 2.2, 2.4, 2.5, 3.1, 3.2, 4.1
     * @param {TreeNode} node - Tree node data
     * @param {number} depth - Depth level for indentation
     * @returns {HTMLElement} Node element
     * @private
     */
    _createNodeElement(node, depth) {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'file-tree-sidebar__node';
        nodeElement.dataset.path = node.path;
        nodeElement.dataset.type = node.type;
        nodeElement.setAttribute('role', 'treeitem');
        nodeElement.setAttribute('aria-label', node.name);

        // Set tabindex for keyboard navigation
        if (node.path === this.focusedNodePath) {
            nodeElement.setAttribute('tabindex', '0');
            nodeElement.classList.add('file-tree-sidebar__node--focused');
        } else {
            nodeElement.setAttribute('tabindex', '-1');
        }

        // Apply indentation based on depth
        nodeElement.style.paddingLeft = `${depth * 16 + 8}px`;

        // Add active class if this is the active file
        if (node.type === 'file' && node.path === this.activeFilePath) {
            nodeElement.classList.add('file-tree-sidebar__node--active');
            nodeElement.setAttribute('aria-selected', 'true');
        } else {
            nodeElement.setAttribute('aria-selected', 'false');
        }

        // Folder expand/collapse indicator
        if (node.type === 'folder') {
            const expandIcon = document.createElement('span');
            expandIcon.className = 'file-tree-sidebar__expand-icon';
            expandIcon.textContent = node.isExpanded ? '▼' : '▶';
            expandIcon.setAttribute('aria-hidden', 'true');
            nodeElement.appendChild(expandIcon);

            nodeElement.setAttribute('aria-expanded', node.isExpanded ? 'true' : 'false');
        }

        // Icon (folder or file)
        const icon = document.createElement('span');
        icon.className = 'file-tree-sidebar__icon';
        icon.setAttribute('aria-hidden', 'true');
        if (node.type === 'folder') {
            icon.textContent = '📁';
        } else {
            icon.textContent = '📄';
        }
        nodeElement.appendChild(icon);

        // Name
        const nameElement = document.createElement('span');
        nameElement.className = 'file-tree-sidebar__name';
        nameElement.textContent = node.name;
        nodeElement.appendChild(nameElement);

        // Modified indicator for files
        if (node.type === 'file' && this.modifiedFiles.has(node.path)) {
            const modifiedIndicator = document.createElement('span');
            modifiedIndicator.className = 'file-tree-sidebar__modified-indicator';
            modifiedIndicator.textContent = '●';
            modifiedIndicator.setAttribute('aria-label', 'Modified');
            nodeElement.appendChild(modifiedIndicator);
        }

        // Event listeners
        nodeElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this._setFocusedNode(node.path);
            this._handleNodeClick(node);
        });

        return nodeElement;
    }

    /**
     * Sort nodes: folders first, then files, alphabetically within each group
     * Requirement: 2.3
     * @param {Array<TreeNode>} nodes - Nodes to sort
     * @returns {Array<TreeNode>} Sorted nodes
     * @private
     */
    _sortNodes(nodes) {
        return [...nodes].sort((a, b) => {
            // Folders before files
            if (a.type === 'folder' && b.type === 'file') {
                return -1;
            }
            if (a.type === 'file' && b.type === 'folder') {
                return 1;
            }
            // Alphabetical within same type
            return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });
    }

    /**
     * Handle node click
     * @param {TreeNode} node - Clicked node
     * @private
     */
    _handleNodeClick(node) {
        if (node.type === 'folder') {
            // Toggle folder expansion
            this._handleFolderToggle(node);
        } else if (node.type === 'file') {
            // Open file
            this._handleFileClick(node);
        }
    }

    /**
     * Handle folder toggle with animation and debouncing
     * Performance optimization: Debounces rapid folder toggles
     * Requirements: 3.1, 3.2, 8.2
     * @param {TreeNode} node - Folder node
     * @private
     */
    async _handleFolderToggle(node) {
        // Performance optimization: Debounce folder toggles (skip if delay is 0 for testing)
        if (this.DEBOUNCE_DELAY === 0) {
            await this._executeFolderToggle(node);
            return;
        }

        const existingTimer = this.folderToggleDebounceTimers.get(node.path);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(async () => {
            await this._executeFolderToggle(node);
            this.folderToggleDebounceTimers.delete(node.path);
        }, this.DEBOUNCE_DELAY);

        this.folderToggleDebounceTimers.set(node.path, timer);
    }

    /**
     * Execute folder toggle operation
     * @param {TreeNode} node - Folder node
     * @private
     */
    async _executeFolderToggle(node) {
        const wasExpanded = node.isExpanded;
        node.isExpanded = !node.isExpanded;

        // If expanding and children are empty, load them from backend
        if (node.isExpanded && (!node.children || node.children.length === 0)) {
            try {
                const result = await window.electronAPI.toggleFolder(node.path, true);
                if (result.success && result.children) {
                    node.children = result.children;
                }
            } catch (error) {
                console.error('Error loading folder contents:', error);
                node.isExpanded = false; // Revert expansion on error
                return;
            }
        }

        // Find the node element and its children container
        const escapedPath = this._escapePath(node.path);
        const nodeElement = this.container.querySelector(
            `.file-tree-sidebar__node[data-path="${escapedPath}"]`
        );

        if (nodeElement) {
            // Update expand icon
            const expandIcon = nodeElement.querySelector('.file-tree-sidebar__expand-icon');
            if (expandIcon) {
                expandIcon.textContent = node.isExpanded ? '▼' : '▶';
            }

            // Update aria-expanded
            nodeElement.setAttribute('aria-expanded', node.isExpanded ? 'true' : 'false');

            // Handle children container
            let childrenContainer = nodeElement.nextElementSibling;

            if (node.isExpanded) {
                // Expanding: create and animate children
                if (!childrenContainer || !childrenContainer.classList.contains('file-tree-sidebar__children')) {
                    childrenContainer = document.createElement('div');
                    childrenContainer.className = 'file-tree-sidebar__children';
                    childrenContainer.setAttribute('role', 'group');

                    // Get the depth of the current node
                    const depth = this._getNodeDepth(node.path);

                    // Render children
                    this.renderTree(node.children, childrenContainer, depth + 1);

                    // Insert after the node element
                    nodeElement.parentNode.insertBefore(childrenContainer, nodeElement.nextSibling);

                    // Animate expansion
                    childrenContainer.style.maxHeight = '0';
                    childrenContainer.style.overflow = 'hidden';
                    childrenContainer.style.transition = 'max-height 0.2s ease-out';

                    // Trigger reflow
                    childrenContainer.offsetHeight;

                    // Set to full height
                    childrenContainer.style.maxHeight = childrenContainer.scrollHeight + 'px';

                    // Remove inline styles after animation
                    setTimeout(() => {
                        childrenContainer.style.maxHeight = '';
                        childrenContainer.style.overflow = '';
                        childrenContainer.style.transition = '';
                    }, 200);
                }
            } else {
                // Collapsing: animate and remove children
                if (childrenContainer && childrenContainer.classList.contains('file-tree-sidebar__children')) {
                    // Animate collapse
                    childrenContainer.style.maxHeight = childrenContainer.scrollHeight + 'px';
                    childrenContainer.style.overflow = 'hidden';
                    childrenContainer.style.transition = 'max-height 0.2s ease-in';

                    // Trigger reflow
                    childrenContainer.offsetHeight;

                    // Collapse
                    childrenContainer.style.maxHeight = '0';

                    // Remove after animation
                    setTimeout(() => {
                        if (childrenContainer.parentNode) {
                            childrenContainer.parentNode.removeChild(childrenContainer);
                        }
                    }, 200);
                }
            }
        }

        // Notify callbacks
        this.folderToggleCallbacks.forEach(callback => {
            try {
                callback(node.path, node.isExpanded);
            } catch (error) {
                console.error('Error in folder toggle callback:', error);
            }
        });
    }

    /**
     * Get the depth of a node in the tree
     * @param {string} nodePath - Path of the node
     * @returns {number} Depth level
     * @private
     */
    _getNodeDepth(nodePath) {
        let depth = 0;

        const findDepth = (nodes, targetPath, currentDepth) => {
            for (const node of nodes) {
                if (node.path === targetPath) {
                    return currentDepth;
                }
                if (node.type === 'folder' && node.children) {
                    const found = findDepth(node.children, targetPath, currentDepth + 1);
                    if (found !== -1) {
                        return found;
                    }
                }
            }
            return -1;
        };

        depth = findDepth(this.treeData, nodePath, 0);
        return depth !== -1 ? depth : 0;
    }

    /**
     * Handle file click
     * @param {TreeNode} node - File node
     * @private
     */
    _handleFileClick(node) {
        // Notify callbacks
        this.fileClickCallbacks.forEach(callback => {
            try {
                callback(node.path);
            } catch (error) {
                console.error('Error in file click callback:', error);
            }
        });
    }

    /**
     * Highlight active file
     * @param {string} filePath - Path of the active file
     */
    setActiveFile(filePath) {
        try {
            if (filePath && typeof filePath !== 'string') {
                console.error('Invalid file path provided to setActiveFile:', filePath);
                return;
            }

            this.activeFilePath = filePath;

            // Update active class on all nodes
            const allNodes = this.container.querySelectorAll('.file-tree-sidebar__node');
            allNodes.forEach(nodeElement => {
                try {
                    if (nodeElement.dataset.type === 'file' && nodeElement.dataset.path === filePath) {
                        nodeElement.classList.add('file-tree-sidebar__node--active');
                        nodeElement.setAttribute('aria-selected', 'true');
                    } else {
                        nodeElement.classList.remove('file-tree-sidebar__node--active');
                        nodeElement.setAttribute('aria-selected', 'false');
                    }
                } catch (nodeError) {
                    console.error('Error updating node active state:', nodeError);
                }
            });
        } catch (error) {
            console.error('Error setting active file:', error);
        }
    }

    /**
     * Mark file as modified or unmodified
     * @param {string} filePath - Path of the file
     * @param {boolean} isModified - Whether the file is modified
     */
    markFileModified(filePath, isModified) {
        try {
            if (!filePath || typeof filePath !== 'string') {
                console.error('Invalid file path provided to markFileModified:', filePath);
                return;
            }

            if (typeof isModified !== 'boolean') {
                console.error('Invalid isModified value provided to markFileModified:', isModified);
                return;
            }

            if (isModified) {
                this.modifiedFiles.add(filePath);
            } else {
                this.modifiedFiles.delete(filePath);
            }

            // Update the node's modified indicator
            const escapedPath = this._escapePath(filePath);
            const nodeElement = this.container.querySelector(
                `.file-tree-sidebar__node[data-path="${escapedPath}"]`
            );

            if (nodeElement && nodeElement.dataset.type === 'file') {
                let indicator = nodeElement.querySelector('.file-tree-sidebar__modified-indicator');

                if (isModified && !indicator) {
                    // Add indicator
                    indicator = document.createElement('span');
                    indicator.className = 'file-tree-sidebar__modified-indicator';
                    indicator.textContent = '●';
                    indicator.setAttribute('aria-label', 'Modified');
                    nodeElement.appendChild(indicator);
                } else if (!isModified && indicator) {
                    // Remove indicator
                    indicator.remove();
                }
            }
        } catch (error) {
            console.error('Error marking file as modified:', error);
        }
    }

    /**
     * Toggle sidebar visibility
     * Requirements: 5.1, 5.2, 5.4, 5.5
     */
    async toggleVisibility() {
        try {
            const isCurrentlyHidden = this.container.classList.contains('file-tree-sidebar--hidden');
            await this.setVisibility(isCurrentlyHidden);
        } catch (error) {
            console.error('Error toggling sidebar visibility:', error);
            throw error;
        }
    }

    /**
     * Set sidebar visibility
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
     * @param {boolean} visible - Whether sidebar should be visible
     */
    async setVisibility(visible) {
        try {
            if (typeof visible !== 'boolean') {
                console.error('Invalid visibility value:', visible);
                return;
            }

            if (visible) {
                this.container.classList.remove('file-tree-sidebar--hidden');
                document.body.classList.add('sidebar-visible');
            } else {
                this.container.classList.add('file-tree-sidebar--hidden');
                document.body.classList.remove('sidebar-visible');
            }

            // Persist visibility state
            if (window.electronAPI && window.electronAPI.setConfig) {
                try {
                    await window.electronAPI.setConfig('workspace.sidebarVisible', visible);
                } catch (error) {
                    console.error('Failed to persist sidebar visibility:', error);
                    // Don't throw - this is not critical
                }
            }
        } catch (error) {
            console.error('Error setting sidebar visibility:', error);
            throw error;
        }
    }

    /**
     * Get current visibility state
     * @returns {boolean} Whether sidebar is visible
     */
    isVisible() {
        return !this.container.classList.contains('file-tree-sidebar--hidden');
    }

    /**
     * Register a callback for file clicks
     * @param {Function} callback - Callback function (filePath) => void
     */
    onFileClick(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.fileClickCallbacks.push(callback);
    }

    /**
     * Register a callback for folder toggle
     * @param {Function} callback - Callback function (folderPath, isExpanded) => void
     */
    onFolderToggle(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this.folderToggleCallbacks.push(callback);
    }

    /**
     * Get all visible nodes in tree order
     * @returns {Array<TreeNode>} Visible nodes
     * @private
     */
    _getAllVisibleNodes() {
        const visibleNodes = [];

        const traverse = (nodes) => {
            nodes.forEach(node => {
                visibleNodes.push(node);
                if (node.type === 'folder' && node.isExpanded && node.children) {
                    traverse(node.children);
                }
            });
        };

        traverse(this.treeData);
        return visibleNodes;
    }

    /**
     * Get the first visible node
     * @returns {TreeNode|null} First visible node
     * @private
     */
    _getFirstVisibleNode() {
        const visibleNodes = this._getAllVisibleNodes();
        return visibleNodes.length > 0 ? visibleNodes[0] : null;
    }

    /**
     * Get the last visible node
     * @returns {TreeNode|null} Last visible node
     * @private
     */
    _getLastVisibleNode() {
        const visibleNodes = this._getAllVisibleNodes();
        return visibleNodes.length > 0 ? visibleNodes[visibleNodes.length - 1] : null;
    }

    /**
     * Get the currently focused node
     * @returns {TreeNode|null} Focused node
     * @private
     */
    _getFocusedNode() {
        if (!this.focusedNodePath) {
            return null;
        }

        const visibleNodes = this._getAllVisibleNodes();
        return visibleNodes.find(node => node.path === this.focusedNodePath) || null;
    }

    /**
     * Set the focused node
     * @param {string} nodePath - Path of the node to focus
     * @private
     */
    _setFocusedNode(nodePath) {
        this.focusedNodePath = nodePath;

        // Update visual focus indicator
        const allNodes = this.container.querySelectorAll('.file-tree-sidebar__node');
        allNodes.forEach(nodeElement => {
            if (nodeElement.dataset.path === nodePath) {
                nodeElement.classList.add('file-tree-sidebar__node--focused');
                nodeElement.setAttribute('tabindex', '0');
                // Scroll into view if needed (check if method exists for test compatibility)
                if (typeof nodeElement.scrollIntoView === 'function') {
                    nodeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            } else {
                nodeElement.classList.remove('file-tree-sidebar__node--focused');
                nodeElement.setAttribute('tabindex', '-1');
            }
        });
    }

    /**
     * Focus the next visible node
     * @private
     */
    _focusNextNode() {
        const visibleNodes = this._getAllVisibleNodes();
        const currentIndex = visibleNodes.findIndex(node => node.path === this.focusedNodePath);

        if (currentIndex < visibleNodes.length - 1) {
            this._setFocusedNode(visibleNodes[currentIndex + 1].path);
        }
    }

    /**
     * Focus the previous visible node
     * @private
     */
    _focusPreviousNode() {
        const visibleNodes = this._getAllVisibleNodes();
        const currentIndex = visibleNodes.findIndex(node => node.path === this.focusedNodePath);

        if (currentIndex > 0) {
            this._setFocusedNode(visibleNodes[currentIndex - 1].path);
        }
    }

    /**
     * Focus the parent node
     * @private
     */
    _focusParentNode() {
        const focusedNode = this._getFocusedNode();
        if (!focusedNode) {
            return;
        }

        // Find parent by checking if any folder contains this node
        const findParent = (nodes, targetPath, parent = null) => {
            for (const node of nodes) {
                if (node.path === targetPath) {
                    return parent;
                }
                if (node.type === 'folder' && node.children) {
                    const found = findParent(node.children, targetPath, node);
                    if (found !== null) {
                        return found;
                    }
                }
            }
            return null;
        };

        const parent = findParent(this.treeData, focusedNode.path);
        if (parent) {
            this._setFocusedNode(parent.path);
        }
    }

    /**
     * Focus the first visible node
     * @private
     */
    _focusFirstNode() {
        const firstNode = this._getFirstVisibleNode();
        if (firstNode) {
            this._setFocusedNode(firstNode.path);
        }
    }

    /**
     * Focus the last visible node
     * @private
     */
    _focusLastNode() {
        const lastNode = this._getLastVisibleNode();
        if (lastNode) {
            this._setFocusedNode(lastNode.path);
        }
    }

    /**
     * Count total nodes in tree (including nested)
     * Performance optimization: Used to determine if virtual scrolling is needed
     * @param {Array<TreeNode>} nodes - Tree nodes
     * @returns {number} Total node count
     * @private
     */
    _countTotalNodes(nodes) {
        let count = 0;

        const countRecursive = (nodeList) => {
            for (const node of nodeList) {
                count++;
                if (node.type === 'folder' && node.children && node.children.length > 0) {
                    countRecursive(node.children);
                }
            }
        };

        countRecursive(nodes);
        return count;
    }

    /**
     * Setup virtual scrolling for large trees
     * Performance optimization: Requirement 8.5
     * @private
     */
    _setupVirtualScrolling() {
        if (!this.container) return;

        // Set up scroll listener
        this.container.addEventListener('scroll', () => {
            this._handleVirtualScroll();
        });

        // Get viewport height
        this.virtualScrollViewportHeight = this.container.clientHeight;
    }

    /**
     * Handle virtual scroll events
     * @private
     */
    _handleVirtualScroll() {
        if (!this.useVirtualScrolling) return;

        this.virtualScrollOffset = this.container.scrollTop;
        // In a full implementation, this would re-render only visible nodes
        // For now, we track the offset for future optimization
    }

    /**
     * Render nodes incrementally in batches
     * Performance optimization: Requirement 8.2
     * @param {Array<TreeNode>} nodes - Nodes to render
     * @param {HTMLElement} container - Container element
     * @param {number} depth - Current depth
     * @private
     */
    _renderIncremental(nodes, container, depth) {
        let currentIndex = 0;

        const renderBatch = () => {
            const endIndex = Math.min(currentIndex + this.renderBatchSize, nodes.length);
            const batch = nodes.slice(currentIndex, endIndex);

            batch.forEach(node => {
                try {
                    const nodeElement = this._createNodeElement(node, depth);
                    container.appendChild(nodeElement);

                    // If node is a folder and is expanded, render its children
                    if (node.type === 'folder' && node.isExpanded && node.children && node.children.length > 0) {
                        const childContainer = document.createElement('div');
                        childContainer.className = 'file-tree-sidebar__children';
                        childContainer.setAttribute('role', 'group');
                        container.appendChild(childContainer);
                        this.renderTree(node.children, childContainer, depth + 1);
                    }
                } catch (nodeError) {
                    console.error('Error rendering tree node:', nodeError);
                }
            });

            currentIndex = endIndex;

            // Schedule next batch if there are more nodes
            if (currentIndex < nodes.length) {
                requestAnimationFrame(renderBatch);
            }
        };

        // Start rendering
        renderBatch();
    }

    /**
     * Escape a path for use in CSS selectors
     * @param {string} path - Path to escape
     * @returns {string} Escaped path
     * @private
     */
    _escapePath(path) {
        // Use CSS.escape if available, otherwise do basic escaping
        if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
            return CSS.escape(path);
        }
        // Basic escaping for test environments
        return path.replace(/["\\]/g, '\\$&');
    }

    /**
     * Validate tree data structure
     * @param {Array} treeData - Tree data to validate
     * @returns {boolean} Whether the tree data is valid
     * @private
     */
    _validateTreeData(treeData) {
        if (!Array.isArray(treeData)) {
            return false;
        }

        const validateNode = (node) => {
            // Check required properties
            if (!node || typeof node !== 'object') {
                return false;
            }

            if (typeof node.name !== 'string' || !node.name) {
                console.error('Invalid node: missing or invalid name', node);
                return false;
            }

            if (typeof node.path !== 'string' || !node.path) {
                console.error('Invalid node: missing or invalid path', node);
                return false;
            }

            if (node.type !== 'file' && node.type !== 'folder') {
                console.error('Invalid node: invalid type', node);
                return false;
            }

            // Validate children if present
            if (node.children) {
                if (!Array.isArray(node.children)) {
                    console.error('Invalid node: children must be an array', node);
                    return false;
                }

                // Recursively validate children
                for (const child of node.children) {
                    if (!validateNode(child)) {
                        return false;
                    }
                }
            }

            return true;
        };

        // Validate all root nodes
        for (const node of treeData) {
            if (!validateNode(node)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Destroy the sidebar instance
     */
    destroy() {
        try {
            // Clear all debounce timers
            this.folderToggleDebounceTimers.forEach(timer => clearTimeout(timer));
            this.folderToggleDebounceTimers.clear();

            this.clearWorkspace();
            this.fileClickCallbacks = [];
            this.folderToggleCallbacks = [];
            this.focusedNodePath = null;
            this.keyboardNavigationEnabled = false;
        } catch (error) {
            console.error('Error destroying sidebar:', error);
        }
    }
}

module.exports = FileTreeSidebar;
