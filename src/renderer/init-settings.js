/**
 * Settings initialization module
 * Initializes settings UI components: SettingsPanel, ThemeSelector, KeyboardShortcutsUI,
 * AutoSaveSettingsUI, AdvancedMarkdownSettingsUI, ImagePasteSettingsUI
 *
 * @module init-settings
 * Requirements: 3.3, 3.4
 */

const SettingsPanel = require('./settings/settings-panel.js');
const ThemeSelector = require('./settings/theme-selector.js');
const KeyboardShortcutsUI = require('./settings/keyboard-shortcuts-ui.js');
const AutoSaveSettingsUI = require('./settings/auto-save-settings-ui.js');
const AdvancedMarkdownSettingsUI = require('./settings/advanced-markdown-settings-ui.js');
const ImagePasteSettingsUI = require('./settings/image-paste-settings-ui.js');

/**
 * Initializes settings components and registers them in the ComponentRegistry.
 * Depends on managers (themeManager) being registered first.
 *
 * @param {ComponentRegistry} registry - The component registry to register instances in
 * @param {EventBus} eventBus - The event bus for inter-component communication
 */
async function initialize(registry, eventBus) {
    const themeManager = registry.get('themeManager');

    // Initialize Settings Panel
    const settingsPanel = new SettingsPanel();
    registry.register('settingsPanel', settingsPanel);
    console.log('SettingsPanel created');

    // Initialize Theme Selector
    const themeSelector = new ThemeSelector(themeManager);
    registry.register('themeSelector', themeSelector);
    console.log('ThemeSelector created');

    // Initialize Keyboard Shortcuts UI
    const keyboardShortcutsUI = new KeyboardShortcutsUI();
    registry.register('keyboardShortcutsUI', keyboardShortcutsUI);
    console.log('KeyboardShortcutsUI created');

    // Initialize Auto-Save Settings UI
    const autoSaveSettingsUI = new AutoSaveSettingsUI();
    registry.register('autoSaveSettingsUI', autoSaveSettingsUI);
    console.log('AutoSaveSettingsUI created');

    // Initialize Advanced Markdown Settings UI
    const advancedMarkdownSettingsUI = new AdvancedMarkdownSettingsUI();
    registry.register('advancedMarkdownSettingsUI', advancedMarkdownSettingsUI);
    console.log('AdvancedMarkdownSettingsUI created');

    // Initialize Image Paste Settings UI
    const imagePasteSettingsUI = new ImagePasteSettingsUI();
    registry.register('imagePasteSettingsUI', imagePasteSettingsUI);
    console.log('ImagePasteSettingsUI created');
}

module.exports = { initialize };
