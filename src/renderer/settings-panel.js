/**
 * Settings Panel - Main settings UI for the application
 * Provides language selection and other app settings
 */

const i18n = require('./i18n/index.js');
const LanguageSelector = require('./language-selector.js');

class SettingsPanel {
    constructor() {
        this.container = null;
        this.languageSelector = null;
        this.removeLocaleListener = null;
    }

    /**
     * Initialize the settings panel
     * @param {HTMLElement} container - Container element to render into
     */
    initialize(container) {
        this.container = container;
        this.render();
        this.setupLocaleListener();
    }

    /**
     * Render the settings panel
     */
    render() {
        this.container.innerHTML = '';
        this.container.className = 'settings-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'settings-panel__header';
        header.innerHTML = `<h3>${i18n.t('settings.title')}</h3>`;
        this.container.appendChild(header);

        // Settings sections
        const sections = document.createElement('div');
        sections.className = 'settings-panel__sections';

        // Language section
        const languageSection = this.createSection(
            i18n.t('settings.language'),
            'language-section'
        );
        this.languageSelector = new LanguageSelector();
        this.languageSelector.initialize(languageSection.content);
        sections.appendChild(languageSection.element);

        // Auto-save section
        const autoSaveSection = this.createSection(
            i18n.t('settings.autoSave'),
            'autosave-section'
        );
        this.createAutoSaveButton(autoSaveSection.content);
        sections.appendChild(autoSaveSection.element);

        // Keyboard shortcuts section
        const shortcutsSection = this.createSection(
            i18n.t('shortcuts.title'),
            'shortcuts-section'
        );
        this.createShortcutsButton(shortcutsSection.content);
        sections.appendChild(shortcutsSection.element);

        // Advanced Markdown section
        const advancedSection = this.createSection(
            i18n.t('advancedMarkdown.title'),
            'advanced-section'
        );
        this.createAdvancedMarkdownButton(advancedSection.content);
        sections.appendChild(advancedSection.element);

        // Image Paste section
        const imagePasteSection = this.createSection(
            i18n.t('imagePasteSettings.title'),
            'image-paste-section'
        );
        this.createImagePasteButton(imagePasteSection.content);
        sections.appendChild(imagePasteSection.element);

        // AI Autocomplete section
        const aiAutocompleteSection = this.createSection(
            i18n.t('settings.aiAutocomplete.title') || 'Autocomplete com IA',
            'ai-autocomplete-section'
        );
        this.createAIAutocompleteButton(aiAutocompleteSection.content);
        sections.appendChild(aiAutocompleteSection.element);

        // Theme section
        const themeSection = this.createSection(
            i18n.t('settings.theme'),
            'theme-section'
        );
        this.createThemeButton(themeSection.content);
        sections.appendChild(themeSection.element);

        this.container.appendChild(sections);
    }

    /**
     * Create a settings section
     */
    createSection(title, id) {
        const section = document.createElement('div');
        section.className = 'settings-panel__section';
        section.id = id;

        const header = document.createElement('div');
        header.className = 'settings-panel__section-header';
        header.textContent = title;

        const content = document.createElement('div');
        content.className = 'settings-panel__section-content';

        section.appendChild(header);
        section.appendChild(content);

        return { element: section, content };
    }

    /**
     * Create auto-save settings button
     */
    createAutoSaveButton(container) {
        const btn = document.createElement('button');
        btn.className = 'settings-panel__button';
        btn.textContent = i18n.t('autoSaveSettings.title');
        btn.addEventListener('click', () => {
            const AutoSaveSettingsUI = require('./auto-save-settings-ui.js');
            const ui = new AutoSaveSettingsUI();
            ui.show();
        });
        container.appendChild(btn);
    }

    /**
     * Create keyboard shortcuts button
     */
    createShortcutsButton(container) {
        const btn = document.createElement('button');
        btn.className = 'settings-panel__button';
        btn.textContent = i18n.t('shortcuts.title');
        btn.addEventListener('click', () => {
            const KeyboardShortcutsUI = require('./keyboard-shortcuts-ui.js');
            const ui = new KeyboardShortcutsUI();
            ui.show();
        });
        container.appendChild(btn);
    }

    /**
     * Create advanced markdown settings button
     */
    createAdvancedMarkdownButton(container) {
        const btn = document.createElement('button');
        btn.className = 'settings-panel__button';
        btn.textContent = i18n.t('advancedMarkdown.title');
        btn.addEventListener('click', () => {
            const AdvancedMarkdownSettingsUI = require('./advanced-markdown-settings-ui.js');
            const ui = new AdvancedMarkdownSettingsUI();
            ui.show();
        });
        container.appendChild(btn);
    }

    /**
     * Create image paste settings button
     */
    createImagePasteButton(container) {
        const btn = document.createElement('button');
        btn.className = 'settings-panel__button';
        btn.textContent = i18n.t('imagePasteSettings.title');
        btn.addEventListener('click', () => {
            const ImagePasteSettingsUI = require('./image-paste-settings-ui.js');
            const ui = new ImagePasteSettingsUI();
            ui.show();
        });
        container.appendChild(btn);
    }

    /**
     * Create AI autocomplete settings button
     */
    createAIAutocompleteButton(container) {
        const btn = document.createElement('button');
        btn.className = 'settings-panel__button';
        btn.textContent = i18n.t('settings.aiAutocomplete.configure') || 'Configurar Autocomplete';
        btn.addEventListener('click', () => {
            const AIAutocompleteSettingsUI = require('./ai-autocomplete-settings-ui.js');
            const ui = new AIAutocompleteSettingsUI();
            ui.show();
        });
        container.appendChild(btn);
    }

    /**
     * Create theme selector button
     */
    createThemeButton(container) {
        const btn = document.createElement('button');
        btn.className = 'settings-panel__button';
        btn.textContent = i18n.t('themeSelector.title');
        btn.addEventListener('click', () => {
            if (window.themeSelector) {
                window.themeSelector.open();
            }
        });
        container.appendChild(btn);
    }

    /**
     * Setup locale change listener to re-render panel
     */
    setupLocaleListener() {
        this.removeLocaleListener = i18n.onLocaleChange(() => {
            this.render();
        });
    }

    /**
     * Destroy the panel
     */
    destroy() {
        if (this.removeLocaleListener) {
            this.removeLocaleListener();
        }
        if (this.languageSelector) {
            this.languageSelector.destroy();
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

module.exports = SettingsPanel;
