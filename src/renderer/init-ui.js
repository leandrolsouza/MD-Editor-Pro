/**
 * UI initialization module
 * Initializes generic UI components: ActivityBar, FormattingToolbar, ContextMenu,
 * TooltipManager, PanelResizer, StatusBarInfo, UpdateNotification, WhatsNewModal,
 * CommandPalette
 *
 * @module init-ui
 * Requirements: 3.3, 3.4
 */

const ActivityBar = require('./ui/activity-bar.js');
const FormattingToolbar = require('./ui/formatting-toolbar.js');
const { ContextMenu } = require('./ui/context-menu.js');
const TooltipManager = require('./ui/tooltip.js');
const PanelResizer = require('./ui/panel-resizer.js');
const StatusBarInfo = require('./ui/status-bar-info.js');
const UpdateNotification = require('./ui/update-notification.js');
const WhatsNewModal = require('./ui/whats-new-modal.js');
const CommandPalette = require('./ui/command-palette.js');

/**
 * Initializes UI components and registers them in the ComponentRegistry.
 * Depends on core components (editor, markdownParser) being registered first.
 *
 * @param {ComponentRegistry} registry - The component registry to register instances in
 * @param {EventBus} eventBus - The event bus for inter-component communication
 */
async function initialize(registry, eventBus) {
    const editor = registry.get('editor');
    const markdownParser = registry.get('markdownParser');

    // Initialize Activity Bar
    const activityBar = new ActivityBar();
    registry.register('activityBar', activityBar);
    console.log('ActivityBar created');

    // Initialize Formatting Toolbar
    const formattingToolbar = new FormattingToolbar(editor);
    registry.register('formattingToolbar', formattingToolbar);
    console.log('FormattingToolbar created');

    // Initialize Context Menu
    const contextMenu = new ContextMenu(editor);
    registry.register('contextMenu', contextMenu);
    console.log('ContextMenu created');

    // Initialize Tooltip Manager
    const tooltipManager = new TooltipManager();
    registry.register('tooltipManager', tooltipManager);
    console.log('TooltipManager created');

    // Initialize Panel Resizer
    const panelResizer = new PanelResizer();
    registry.register('panelResizer', panelResizer);
    console.log('PanelResizer created');

    // Initialize Status Bar Info
    const statusBarInfo = new StatusBarInfo(editor);
    registry.register('statusBarInfo', statusBarInfo);
    console.log('StatusBarInfo created');

    // Initialize Update Notification
    const updateNotification = new UpdateNotification();
    registry.register('updateNotification', updateNotification);
    console.log('UpdateNotification created');

    // Initialize What's New Modal
    const whatsNewModal = new WhatsNewModal(markdownParser);
    registry.register('whatsNewModal', whatsNewModal);
    console.log('WhatsNewModal created');

    // Initialize Command Palette
    const commandPalette = new CommandPalette();
    registry.register('commandPalette', commandPalette);
    console.log('CommandPalette created');
}

module.exports = { initialize };
