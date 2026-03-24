/**
 * Internationalization (i18n) Manager
 * Handles translations for the application
 */

const en = require('./locales/en.js');
const ptBR = require('./locales/pt-BR.js');

const LOCALES = {
    'en': en,
    'pt-BR': ptBR
};

const DEFAULT_LOCALE = 'en';
const STORAGE_KEY = 'app-locale';

class I18n {
    constructor() {
        this.currentLocale = DEFAULT_LOCALE;
        this.translations = LOCALES[DEFAULT_LOCALE];
        this.listeners = [];
    }

    /**
     * Initialize i18n with saved locale or system default
     */
    async initialize() {
        try {
            // Try to get saved locale from config
            if (window.electronAPI && window.electronAPI.getConfig) {
                const savedLocale = await window.electronAPI.getConfig(STORAGE_KEY);

                if (savedLocale && LOCALES[savedLocale]) {
                    this.setLocale(savedLocale, false);
                    return;
                }
            }

            // Fall back to system locale detection
            const systemLocale = navigator.language || navigator.userLanguage;
            const matchedLocale = this.findBestMatch(systemLocale);

            this.setLocale(matchedLocale, false);
        } catch (err) {
            console.error('Failed to initialize i18n:', err);
            this.setLocale(DEFAULT_LOCALE, false);
        }
    }

    /**
     * Find best matching locale from available locales
     */
    findBestMatch(locale) {
        if (LOCALES[locale]) {
            return locale;
        }

        // Try language code only (e.g., 'pt' from 'pt-BR')
        const langCode = locale.split('-')[0];

        for (const key of Object.keys(LOCALES)) {
            if (key.startsWith(langCode)) {
                return key;
            }
        }

        return DEFAULT_LOCALE;
    }

    /**
     * Set the current locale
     */
    async setLocale(locale, save = true) {
        if (!LOCALES[locale]) {
            console.warn(`Locale '${locale}' not found, using default`);
            locale = DEFAULT_LOCALE;
        }

        this.currentLocale = locale;
        this.translations = LOCALES[locale];

        if (save && window.electronAPI && window.electronAPI.setConfig) {
            try {
                await window.electronAPI.setConfig(STORAGE_KEY, locale);
            } catch (err) {
                console.error('Failed to save locale:', err);
            }
        }

        // Notify listeners
        this.listeners.forEach(callback => callback(locale));
    }

    /**
     * Get current locale
     */
    getLocale() {
        return this.currentLocale;
    }

    /**
     * Get available locales
     */
    getAvailableLocales() {
        return Object.keys(LOCALES).map(key => ({
            code: key,
            name: LOCALES[key].meta.name,
            nativeName: LOCALES[key].meta.nativeName
        }));
    }

    /**
     * Get translation by key path (e.g., 'contextMenu.cut')
     */
    t(keyPath, params = {}) {
        const keys = keyPath.split('.');
        let value = this.translations;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                console.warn(`Translation key not found: ${keyPath}`);
                return keyPath;
            }
        }

        if (typeof value !== 'string') {
            console.warn(`Translation value is not a string: ${keyPath}`);
            return keyPath;
        }

        // Replace parameters like {name} with actual values
        return value.replace(/\{(\w+)\}/g, (match, paramName) => {
            return params[paramName] !== undefined ? params[paramName] : match;
        });
    }

    /**
     * Subscribe to locale changes
     */
    onLocaleChange(callback) {
        this.listeners.push(callback);

        return () => {
            const index = this.listeners.indexOf(callback);

            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
}

// Singleton instance
const i18n = new I18n();

module.exports = i18n;
