/**
 * Language Selector Component
 * Allows users to change the application language
 */

const i18n = require('../i18n/index.js');

class LanguageSelector {
    constructor() {
        this.element = null;
        this.selectElement = null;
    }

    /**
     * Initialize the language selector
     * @param {HTMLElement} container - Container element to render into
     */
    initialize(container) {
        this.container = container;
        this.render();
    }

    /**
     * Render the language selector
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'language-selector';

        const label = document.createElement('label');

        label.className = 'language-selector-label';
        label.textContent = i18n.t('settings.language');
        label.setAttribute('for', 'language-select');

        this.selectElement = document.createElement('select');
        this.selectElement.id = 'language-select';
        this.selectElement.className = 'language-selector-select';

        const locales = i18n.getAvailableLocales();
        const currentLocale = i18n.getLocale();

        locales.forEach(locale => {
            const option = document.createElement('option');

            option.value = locale.code;
            option.textContent = locale.nativeName;
            option.selected = locale.code === currentLocale;
            this.selectElement.appendChild(option);
        });

        this.selectElement.addEventListener('change', (e) => {
            i18n.setLocale(e.target.value);
        });

        this.element.appendChild(label);
        this.element.appendChild(this.selectElement);

        if (this.container) {
            this.container.appendChild(this.element);
        }
    }

    /**
     * Get the element
     */
    getElement() {
        return this.element;
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

module.exports = LanguageSelector;
