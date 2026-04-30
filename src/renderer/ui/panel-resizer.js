/**
 * Panel Resizer - Handles resizable panels (editor/preview and sidebar)
 * Provides drag-to-resize functionality for split views
 */

class PanelResizer {
    constructor() {
        this.editorPane = null;
        this.previewPane = null;
        this.divider = null;
        this.sidebarPanel = null;
        this.sidebarResizer = null;

        this.isDraggingDivider = false;
        this.isDraggingSidebar = false;
        this.startX = 0;
        this.startEditorWidth = 0;
        this.startSidebarWidth = 0;

        // Constraints
        this.minPaneWidth = 200;
        this.minSidebarWidth = 150;
        this.maxSidebarWidth = 600;
        this.defaultSidebarWidth = 300;

        // Bound handlers for cleanup
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundMouseUp = this.handleMouseUp.bind(this);
    }

    /**
     * Initialize the panel resizer
     */
    initialize() {
        this.editorPane = document.getElementById('editor-pane');
        this.previewPane = document.getElementById('preview-pane');
        this.divider = document.getElementById('divider');
        this.sidebarPanel = document.querySelector('.sidebar-panel');

        if (this.divider) {
            this.setupDividerResize();
        }

        if (this.sidebarPanel) {
            this.createSidebarResizer();
            this.setupSidebarResize();
        }

        // Restore saved sizes
        this.restoreSizes();

        console.log('PanelResizer initialized');
    }

    /**
     * Setup divider (editor/preview) resize functionality
     */
    setupDividerResize() {
        this.divider.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isDraggingDivider = true;
            this.startX = e.clientX;
            this.startEditorWidth = this.editorPane.offsetWidth;

            document.body.classList.add('resizing');
            this.divider.classList.add('dragging');

            document.addEventListener('mousemove', this.boundMouseMove);
            document.addEventListener('mouseup', this.boundMouseUp);
        });
    }

    /**
     * Create sidebar resizer element
     */
    createSidebarResizer() {
        this.sidebarResizer = document.createElement('div');
        this.sidebarResizer.className = 'sidebar-resizer';
        this.sidebarPanel.appendChild(this.sidebarResizer);
    }

    /**
     * Setup sidebar resize functionality
     */
    setupSidebarResize() {
        this.sidebarResizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isDraggingSidebar = true;
            this.startX = e.clientX;
            this.startSidebarWidth = this.sidebarPanel.offsetWidth;

            document.body.classList.add('resizing');
            this.sidebarResizer.classList.add('dragging');

            document.addEventListener('mousemove', this.boundMouseMove);
            document.addEventListener('mouseup', this.boundMouseUp);
        });
    }

    /**
     * Handle mouse move during resize
     * @param {MouseEvent} e
     */
    handleMouseMove(e) {
        if (this.isDraggingDivider) {
            this.resizeDivider(e);
        } else if (this.isDraggingSidebar) {
            this.resizeSidebar(e);
        }
    }

    /**
     * Resize editor/preview divider
     * @param {MouseEvent} e
     */
    resizeDivider(e) {
        const deltaX = e.clientX - this.startX;
        const containerWidth = this.editorPane.parentElement.offsetWidth - this.divider.offsetWidth;

        let newEditorWidth = this.startEditorWidth + deltaX;

        // Apply constraints
        newEditorWidth = Math.max(this.minPaneWidth, newEditorWidth);
        newEditorWidth = Math.min(containerWidth - this.minPaneWidth, newEditorWidth);

        // Calculate percentage
        const editorPercent = (newEditorWidth / containerWidth) * 100;
        const previewPercent = 100 - editorPercent;

        // Apply sizes
        this.editorPane.style.flex = `0 0 ${editorPercent}%`;
        this.previewPane.style.flex = `0 0 ${previewPercent}%`;
    }

    /**
     * Resize sidebar
     * @param {MouseEvent} e
     */
    resizeSidebar(e) {
        const deltaX = e.clientX - this.startX;
        let newWidth = this.startSidebarWidth + deltaX;

        // Apply constraints
        newWidth = Math.max(this.minSidebarWidth, newWidth);
        newWidth = Math.min(this.maxSidebarWidth, newWidth);

        // Apply width and CSS variable
        this.sidebarPanel.style.width = `${newWidth}px`;
        document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);

        // Update app container margin
        const appContainer = document.getElementById('app-container');

        if (appContainer && appContainer.classList.contains('sidebar-visible')) {
            appContainer.style.marginLeft = `${newWidth}px`;
        }
    }

    /**
     * Handle mouse up - end resize
     */
    handleMouseUp() {
        if (this.isDraggingDivider) {
            this.isDraggingDivider = false;
            this.divider.classList.remove('dragging');
            this.saveDividerSize();
        }

        if (this.isDraggingSidebar) {
            this.isDraggingSidebar = false;
            this.sidebarResizer.classList.remove('dragging');
            this.saveSidebarSize();
        }

        document.body.classList.remove('resizing');
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
    }

    /**
     * Save divider position to config
     */
    async saveDividerSize() {
        try {
            const containerWidth = this.editorPane.parentElement.offsetWidth - this.divider.offsetWidth;
            const editorPercent = (this.editorPane.offsetWidth / containerWidth) * 100;

            await window.electronAPI.setConfig('panelResizer.editorPercent', editorPercent);
        } catch (error) {
            console.error('Failed to save divider size:', error);
        }
    }

    /**
     * Save sidebar width to config
     */
    async saveSidebarSize() {
        try {
            const width = this.sidebarPanel.offsetWidth;

            await window.electronAPI.setConfig('panelResizer.sidebarWidth', width);
        } catch (error) {
            console.error('Failed to save sidebar size:', error);
        }
    }

    /**
     * Restore saved sizes from config
     */
    async restoreSizes() {
        try {
            // Restore editor/preview split
            const editorPercentResult = await window.electronAPI.getConfig('panelResizer.editorPercent');

            if (editorPercentResult?.value) {
                const editorPercent = editorPercentResult.value;
                const previewPercent = 100 - editorPercent;

                this.editorPane.style.flex = `0 0 ${editorPercent}%`;
                this.previewPane.style.flex = `0 0 ${previewPercent}%`;
            }

            // Restore sidebar width
            const sidebarWidthResult = await window.electronAPI.getConfig('panelResizer.sidebarWidth');

            if (sidebarWidthResult?.value) {
                const width = sidebarWidthResult.value;

                this.sidebarPanel.style.width = `${width}px`;
                document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
            }
        } catch (error) {
            console.error('Failed to restore panel sizes:', error);
        }
    }

    /**
     * Reset panels to default sizes
     */
    async resetToDefaults() {
        // Reset editor/preview to 50/50
        this.editorPane.style.flex = '1';
        this.previewPane.style.flex = '1';

        // Reset sidebar to default width
        this.sidebarPanel.style.width = `${this.defaultSidebarWidth}px`;

        // Clear saved config
        try {
            await window.electronAPI.setConfig('panelResizer.editorPercent', null);
            await window.electronAPI.setConfig('panelResizer.sidebarWidth', null);
        } catch (error) {
            console.error('Error resetting panel sizes:', error);
        }
    }

    /**
     * Cleanup event listeners
     */
    cleanup() {
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
    }
}

module.exports = PanelResizer;
