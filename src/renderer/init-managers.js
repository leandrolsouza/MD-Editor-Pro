/**
 * Managers initialization module
 * Initializes client-side managers: ThemeManager, ViewModeManager
 * Must run BEFORE init-settings since ThemeSelector depends on themeManager.
 *
 * @module init-managers
 * Requirements: 3.3, 3.4
 */

const ThemeManager = require('./managers/theme.js');
const ViewModeManager = require('./managers/view-mode.js');

/**
 * Initializes manager components and registers them in the ComponentRegistry.
 * Must run after init-core (needs preview for theme change callback).
 *
 * @param {ComponentRegistry} registry - The component registry to register instances in
 * @param {EventBus} eventBus - The event bus for inter-component communication
 */
async function initialize(registry, eventBus) {
    // Initialize ThemeManager
    const themeManager = new ThemeManager();
    await themeManager.initialize();
    registry.register('themeManager', themeManager);

    // Connect theme manager to preview for advanced markdown theme updates
    const preview = registry.get('preview');
    themeManager.onThemeChange((theme) => {
        if (preview) {
            preview.updateTheme(theme);
        }
    });

    console.log('ThemeManager initialized');

    // Initialize ViewModeManager
    const viewModeManager = new ViewModeManager();
    await viewModeManager.initialize();
    registry.register('viewModeManager', viewModeManager);
    console.log('ViewModeManager initialized');
}

module.exports = { initialize };
