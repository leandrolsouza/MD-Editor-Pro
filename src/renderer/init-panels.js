/**
 * Panels initialization module
 * Initializes sidebar panels: FileTreeSidebar, OutlinePanel, BacklinksPanel,
 * ConnectionGraphPanel, GlobalSearchUI
 *
 * @module init-panels
 * Requirements: 3.3, 3.4
 */

const FileTreeSidebar = require('./panels/file-tree-sidebar.js');
const OutlinePanel = require('./panels/outline-panel.js');
const BacklinksPanel = require('./panels/backlinks-panel.js');
const ConnectionGraphPanel = require('./panels/connection-graph-panel.js');
const GlobalSearchUI = require('./panels/global-search-ui.js');

/**
 * Initializes panel components and registers them in the ComponentRegistry.
 * Depends on core components (editor) being registered first.
 *
 * @param {ComponentRegistry} registry - The component registry to register instances in
 * @param {EventBus} eventBus - The event bus for inter-component communication
 */
async function initialize(registry, eventBus) {
    const editor = registry.get('editor');

    // Initialize File Tree Sidebar with its container
    const fileTreeContainer = document.createElement('div');
    fileTreeContainer.className = 'file-tree-sidebar';
    const fileTreeContent = document.createElement('div');
    fileTreeContent.className = 'file-tree-sidebar__tree';
    fileTreeContent.id = 'file-tree-container';
    fileTreeContainer.appendChild(fileTreeContent);

    const fileTreeSidebar = new FileTreeSidebar(fileTreeContainer);
    registry.register('fileTreeSidebar', fileTreeSidebar);
    registry.register('fileTreeContainer', fileTreeContainer);
    console.log('FileTreeSidebar created');

    // Initialize Outline Panel with its container
    const outlinePanelContainer = document.createElement('div');
    outlinePanelContainer.className = 'outline-panel';
    const outlineTreeContainer = document.createElement('div');
    outlineTreeContainer.className = 'outline-panel__tree';
    outlineTreeContainer.id = 'outline-tree-container';
    outlineTreeContainer.setAttribute('role', 'tree');
    outlinePanelContainer.appendChild(outlineTreeContainer);

    const outlinePanel = new OutlinePanel(editor);
    registry.register('outlinePanel', outlinePanel);
    registry.register('outlinePanelContainer', outlinePanelContainer);
    console.log('OutlinePanel created');

    // Initialize Backlinks Panel
    const backlinksPanel = new BacklinksPanel();
    registry.register('backlinksPanel', backlinksPanel);
    console.log('BacklinksPanel created');

    // Initialize Connection Graph Panel
    const connectionGraphPanel = new ConnectionGraphPanel();
    registry.register('connectionGraphPanel', connectionGraphPanel);
    console.log('ConnectionGraphPanel created');

    // Initialize Global Search UI
    const globalSearchUI = new GlobalSearchUI();
    registry.register('globalSearchUI', globalSearchUI);
    console.log('GlobalSearchUI created');
}

module.exports = { initialize };
