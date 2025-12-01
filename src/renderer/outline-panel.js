/**
 * OutlinePanel - Document outline/table of contents component
 * Displays hierarchical structure of markdown headings for navigation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

const { syntaxTree } = require('@codemirror/language');

class OutlinePanel {
    constructor(editor) {
        if (!editor) {
            throw new Error('Editor instance is required');
        }

        this.editor = editor;
        this.container = null;
        this.treeContainer = null;
        this.isVisible = false;
        this.headings = [];
        this.activeHeadingId = null;
        this.updateDebounceTimer = null;
        this.cursorChangeListener = null;
    }

    /**
     * Initialize the outline panel
     * @param {HTMLElement} containerElement - The DOM element to attach the panel to
     */
    initialize(containerElement) {
        if (!containerElement) {
            throw new Error('Container element is required');
        }

        this.container = containerElement;
        this.treeContainer = containerElement.querySelector('.outline-panel__tree');

        if (!this.treeContainer) {
            throw new Error('Tree container not found in outline panel');
        }

        // Add ARIA attributes to tree container
        this.treeContainer.setAttribute('role', 'tree');
        this.treeContainer.setAttribute('aria-label', 'Document Outline');

        // Setup event listeners
        this.setupEventListeners();

        // Initial update
        this.update();
    }

    /**
     * Setup event listeners for editor changes and cursor movements
     */
    setupEventListeners() {
        // Listen to editor content changes (Requirements: 1.4, 5.5)
        this.editor.onContentChange(() => {
            this.debouncedUpdate();
        });

        // Listen to cursor position changes for active section highlighting (Requirement: 1.5)
        if (this.editor.view) {
            this.cursorChangeListener = this.editor.view.dom.addEventListener('click', () => {
                this.updateActiveHeading();
            });

            // Also listen to keyboard navigation
            this.editor.view.dom.addEventListener('keyup', (e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
                    this.updateActiveHeading();
                }
            });
        }
    }

    /**
     * Debounced update to avoid excessive re-rendering (Requirement: 5.5)
     */
    debouncedUpdate() {
        if (this.updateDebounceTimer) {
            clearTimeout(this.updateDebounceTimer);
        }

        this.updateDebounceTimer = setTimeout(() => {
            this.update();
        }, 300); // 300ms debounce
    }

    /**
     * Extract headings from markdown document (Requirements: 1.1, 5.2)
     * @returns {Array<{level: number, text: string, position: number, line: number, id: string}>}
     */
    extractHeadings() {
        if (!this.editor.view) {
            return [];
        }

        const headings = [];
        const state = this.editor.view.state;
        const tree = syntaxTree(state);

        // Iterate through syntax tree to find ATXHeading nodes
        tree.iterate({
            enter: (node) => {
                if (node.name.startsWith('ATXHeading')) {
                    // Extract heading level from node name (ATXHeading1, ATXHeading2, etc.)
                    const levelMatch = node.name.match(/ATXHeading(\d)/);
                    if (!levelMatch) return;

                    const level = parseInt(levelMatch[1], 10);
                    const line = state.doc.lineAt(node.from);
                    const lineText = line.text;

                    // Extract heading text (remove # markers)
                    const text = lineText.replace(/^#{1,6}\s*/, '').trim();

                    if (text) {
                        headings.push({
                            level,
                            text,
                            position: node.from,
                            line: line.number,
                            id: `heading-${node.from}-${level}`
                        });
                    }
                }
            }
        });

        return headings;
    }

    /**
     * Update the outline panel (extract and render headings)
     */
    update() {
        this.headings = this.extractHeadings();
        this.render();
        this.updateActiveHeading();
    }

    /**
     * Render the outline tree (Requirements: 1.2, 1.6)
     */
    render() {
        if (!this.treeContainer) {
            return;
        }

        // Clear existing content
        this.treeContainer.innerHTML = '';

        // Handle empty documents (Requirement: 1.6)
        if (this.headings.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Build hierarchical tree structure
        const treeRoot = this.buildHierarchicalTree(this.headings);

        // Render tree nodes
        this.renderTreeNodes(treeRoot, this.treeContainer, 0);
    }

    /**
     * Render empty state message (Requirement: 1.6)
     */
    renderEmptyState() {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'outline-panel__empty';
        emptyDiv.textContent = 'No headings found';
        this.treeContainer.appendChild(emptyDiv);
    }

    /**
     * Build hierarchical tree structure from flat heading list (Requirement: 1.2)
     * @param {Array} headings - Flat list of headings
     * @returns {Array} Hierarchical tree structure
     */
    buildHierarchicalTree(headings) {
        const root = [];
        const stack = [{ level: 0, children: root }];

        for (const heading of headings) {
            const node = { ...heading, children: [] };

            // Find parent level
            while (stack.length > 1 && stack[stack.length - 1].level >= heading.level) {
                stack.pop();
            }

            // Add to parent's children
            stack[stack.length - 1].children.push(node);

            // Push to stack for potential children
            stack.push(node);
        }

        return root;
    }

    /**
     * Render tree nodes recursively (Requirement: 1.2)
     * @param {Array} nodes - Tree nodes to render
     * @param {HTMLElement} parentElement - Parent DOM element
     * @param {number} depth - Current depth level
     */
    renderTreeNodes(nodes, parentElement, depth) {
        for (const node of nodes) {
            const nodeElement = document.createElement('div');
            nodeElement.className = 'outline-panel__node';
            nodeElement.setAttribute('data-depth', depth);
            nodeElement.setAttribute('data-heading-id', node.id);
            nodeElement.setAttribute('data-position', node.position);
            nodeElement.setAttribute('role', 'treeitem');
            nodeElement.setAttribute('tabindex', '0');

            // Add expand/collapse icon if node has children
            if (node.children && node.children.length > 0) {
                const expandIcon = document.createElement('span');
                expandIcon.className = 'outline-panel__expand-icon';
                expandIcon.textContent = '▶';
                nodeElement.appendChild(expandIcon);

                nodeElement.classList.add('outline-panel__node--expandable');
                nodeElement.setAttribute('aria-expanded', 'true');
            } else {
                // Empty space for alignment
                const emptyIcon = document.createElement('span');
                emptyIcon.className = 'outline-panel__expand-icon outline-panel__expand-icon--empty';
                nodeElement.appendChild(emptyIcon);
            }

            // Add heading text
            const textSpan = document.createElement('span');
            textSpan.className = 'outline-panel__text';
            textSpan.textContent = node.text;
            textSpan.setAttribute('data-level', node.level);
            nodeElement.appendChild(textSpan);

            // Add click handler for navigation (Requirement: 1.3)
            nodeElement.addEventListener('click', (e) => {
                e.stopPropagation();

                // Handle expand/collapse if clicking on expandable node
                if (node.children && node.children.length > 0 && e.target.classList.contains('outline-panel__expand-icon')) {
                    this.toggleNodeExpansion(nodeElement);
                } else {
                    this.navigateToHeading(node.position);
                }
            });

            // Add keyboard navigation
            nodeElement.addEventListener('keydown', (e) => {
                this.handleKeyboardNavigation(e, nodeElement, node);
            });

            parentElement.appendChild(nodeElement);

            // Render children if present
            if (node.children && node.children.length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'outline-panel__children';
                this.renderTreeNodes(node.children, childrenContainer, depth + 1);
                parentElement.appendChild(childrenContainer);
            }
        }
    }

    /**
     * Toggle node expansion/collapse
     * @param {HTMLElement} nodeElement - Node element to toggle
     */
    toggleNodeExpansion(nodeElement) {
        const isExpanded = nodeElement.getAttribute('aria-expanded') === 'true';
        const childrenContainer = nodeElement.nextElementSibling;

        if (childrenContainer && childrenContainer.classList.contains('outline-panel__children')) {
            if (isExpanded) {
                nodeElement.setAttribute('aria-expanded', 'false');
                nodeElement.classList.add('outline-panel__node--collapsed');
                childrenContainer.classList.add('outline-panel__children--collapsed');
            } else {
                nodeElement.setAttribute('aria-expanded', 'true');
                nodeElement.classList.remove('outline-panel__node--collapsed');
                childrenContainer.classList.remove('outline-panel__children--collapsed');
            }
        }
    }

    /**
     * Navigate to heading position in editor (Requirement: 1.3)
     * @param {number} position - Position to navigate to
     */
    navigateToHeading(position) {
        if (!this.editor.view) {
            return;
        }

        // Scroll to position and set cursor
        this.editor.setCursorPosition(position);

        // Focus the editor
        this.editor.view.focus();
    }

    /**
     * Update active section highlighting (Requirement: 1.5)
     */
    updateActiveHeading() {
        if (!this.editor.view || !this.treeContainer) {
            return;
        }

        const cursorPosition = this.editor.getCursorPosition();

        // Find the heading that contains the cursor position
        let activeHeading = null;
        for (let i = this.headings.length - 1; i >= 0; i--) {
            if (this.headings[i].position <= cursorPosition) {
                activeHeading = this.headings[i];
                break;
            }
        }

        // Remove previous active highlighting
        const previousActive = this.treeContainer.querySelector('.outline-panel__node--active');
        if (previousActive) {
            previousActive.classList.remove('outline-panel__node--active');
        }

        // Add active highlighting to current heading
        if (activeHeading) {
            const activeNode = this.treeContainer.querySelector(`[data-heading-id="${activeHeading.id}"]`);
            if (activeNode) {
                activeNode.classList.add('outline-panel__node--active');
                this.activeHeadingId = activeHeading.id;

                // Scroll into view if needed
                activeNode.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }

    /**
     * Show the outline panel (Requirement: 1.7)
     */
    show() {
        if (!this.container) {
            return;
        }

        this.container.classList.remove('outline-panel--hidden');
        this.container.classList.add('outline-panel--visible');
        this.isVisible = true;

        // Add body class for layout adjustment
        document.body.classList.add('outline-visible');

        // Update to ensure content is current
        this.update();

        // Announce to screen readers
        this.announceToScreenReader('Outline panel shown');
    }

    /**
     * Hide the outline panel (Requirement: 1.7)
     */
    hide() {
        if (!this.container) {
            return;
        }

        this.container.classList.add('outline-panel--hidden');
        this.container.classList.remove('outline-panel--visible');
        this.isVisible = false;

        // Remove body class
        document.body.classList.remove('outline-visible');

        // Announce to screen readers
        this.announceToScreenReader('Outline panel hidden');
    }

    /**
     * Toggle outline panel visibility (Requirement: 1.7)
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Check if outline panel is visible
     * @returns {boolean}
     */
    isVisible() {
        return this.isVisible;
    }

    /**
     * Handle keyboard navigation for accessibility
     * @param {KeyboardEvent} e - Keyboard event
     * @param {HTMLElement} nodeElement - Current node element
     * @param {Object} node - Node data
     */
    handleKeyboardNavigation(e, nodeElement, node) {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.navigateToHeading(node.position);
                this.announceToScreenReader(`Navigated to ${node.text}`);
                break;

            case 'ArrowDown':
                e.preventDefault();
                this.focusNextNode(nodeElement);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.focusPreviousNode(nodeElement);
                break;

            case 'ArrowRight':
                e.preventDefault();
                if (node.children && node.children.length > 0) {
                    const isExpanded = nodeElement.getAttribute('aria-expanded') === 'true';
                    if (!isExpanded) {
                        this.toggleNodeExpansion(nodeElement);
                        this.announceToScreenReader(`Expanded ${node.text}`);
                    } else {
                        // Move to first child
                        this.focusNextNode(nodeElement);
                    }
                }
                break;

            case 'ArrowLeft':
                e.preventDefault();
                if (node.children && node.children.length > 0) {
                    const isExpanded = nodeElement.getAttribute('aria-expanded') === 'true';
                    if (isExpanded) {
                        this.toggleNodeExpansion(nodeElement);
                        this.announceToScreenReader(`Collapsed ${node.text}`);
                    } else {
                        // Move to parent
                        this.focusParentNode(nodeElement);
                    }
                } else {
                    // Move to parent
                    this.focusParentNode(nodeElement);
                }
                break;

            case 'Home':
                e.preventDefault();
                this.focusFirstNode();
                break;

            case 'End':
                e.preventDefault();
                this.focusLastNode();
                break;
        }
    }

    /**
     * Focus the next node in the tree
     * @param {HTMLElement} currentNode - Current node element
     */
    focusNextNode(currentNode) {
        const allNodes = Array.from(this.treeContainer.querySelectorAll('.outline-panel__node'));
        const currentIndex = allNodes.indexOf(currentNode);

        if (currentIndex < allNodes.length - 1) {
            const nextNode = allNodes[currentIndex + 1];
            // Check if next node is visible (not in collapsed section)
            if (this.isNodeVisible(nextNode)) {
                nextNode.focus();
            } else {
                // Find next visible node
                for (let i = currentIndex + 2; i < allNodes.length; i++) {
                    if (this.isNodeVisible(allNodes[i])) {
                        allNodes[i].focus();
                        break;
                    }
                }
            }
        }
    }

    /**
     * Focus the previous node in the tree
     * @param {HTMLElement} currentNode - Current node element
     */
    focusPreviousNode(currentNode) {
        const allNodes = Array.from(this.treeContainer.querySelectorAll('.outline-panel__node'));
        const currentIndex = allNodes.indexOf(currentNode);

        if (currentIndex > 0) {
            const prevNode = allNodes[currentIndex - 1];
            // Check if previous node is visible (not in collapsed section)
            if (this.isNodeVisible(prevNode)) {
                prevNode.focus();
            } else {
                // Find previous visible node
                for (let i = currentIndex - 2; i >= 0; i--) {
                    if (this.isNodeVisible(allNodes[i])) {
                        allNodes[i].focus();
                        break;
                    }
                }
            }
        }
    }

    /**
     * Focus the parent node
     * @param {HTMLElement} currentNode - Current node element
     */
    focusParentNode(currentNode) {
        const parentContainer = currentNode.parentElement;
        if (parentContainer && parentContainer.classList.contains('outline-panel__children')) {
            const parentNode = parentContainer.previousElementSibling;
            if (parentNode && parentNode.classList.contains('outline-panel__node')) {
                parentNode.focus();
            }
        }
    }

    /**
     * Focus the first node in the tree
     */
    focusFirstNode() {
        const firstNode = this.treeContainer.querySelector('.outline-panel__node');
        if (firstNode) {
            firstNode.focus();
        }
    }

    /**
     * Focus the last visible node in the tree
     */
    focusLastNode() {
        const allNodes = Array.from(this.treeContainer.querySelectorAll('.outline-panel__node'));
        for (let i = allNodes.length - 1; i >= 0; i--) {
            if (this.isNodeVisible(allNodes[i])) {
                allNodes[i].focus();
                break;
            }
        }
    }

    /**
     * Check if a node is visible (not in a collapsed section)
     * @param {HTMLElement} node - Node element to check
     * @returns {boolean}
     */
    isNodeVisible(node) {
        let current = node.parentElement;
        while (current && current !== this.treeContainer) {
            if (current.classList.contains('outline-panel__children--collapsed')) {
                return false;
            }
            current = current.parentElement;
        }
        return true;
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     */
    announceToScreenReader(message) {
        // Create or get the live region for announcements
        let liveRegion = document.getElementById('outline-panel-announcer');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'outline-panel-announcer';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }

        // Clear and set new message
        liveRegion.textContent = '';
        setTimeout(() => {
            liveRegion.textContent = message;
        }, 100);
    }

    /**
     * Destroy the outline panel and cleanup
     */
    destroy() {
        if (this.updateDebounceTimer) {
            clearTimeout(this.updateDebounceTimer);
        }

        if (this.container) {
            this.container.innerHTML = '';
        }

        // Remove live region
        const liveRegion = document.getElementById('outline-panel-announcer');
        if (liveRegion) {
            liveRegion.remove();
        }

        this.editor = null;
        this.container = null;
        this.treeContainer = null;
        this.headings = [];
    }
}

module.exports = OutlinePanel;
