/**
 * ThemeManager Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Use require() to get the same module instance as the source code
const ThemeManager = require('./theme.js');
const eventBus = require('../core/event-bus.js');

describe('ThemeManager', () => {
    let themeManager;
    let mockElectronAPI;

    beforeEach(() => {
        // Mock DOM
        document.body.className = '';
        document.body.innerHTML = `
            <div id="editor-pane"></div>
            <div id="preview-pane"></div>
        `;

        // Mock stylesheets
        const themes = ['light', 'dark', 'solarized-light', 'solarized-dark', 'dracula', 'monokai', 'nord'];
        themes.forEach(theme => {
            const link = document.createElement('link');
            link.id = `theme-${theme}`;
            link.rel = 'stylesheet';
            link.disabled = theme !== 'light';
            document.head.appendChild(link);
        });

        // Mock electronAPI
        mockElectronAPI = {
            getConfig: vi.fn().mockResolvedValue({ value: 'light' }),
            setConfig: vi.fn().mockResolvedValue({ success: true })
        };
        global.window = { electronAPI: mockElectronAPI };

        themeManager = new ThemeManager();
    });

    describe('initialization', () => {
        it('should initialize with default light theme', async () => {
            await themeManager.initialize();
            expect(themeManager.getCurrentTheme()).toBe('light');
        });

        it('should load saved theme from config', async () => {
            mockElectronAPI.getConfig.mockResolvedValue({ value: 'dark' });
            await themeManager.initialize();
            expect(themeManager.getCurrentTheme()).toBe('dark');
        });

        it('should handle invalid saved theme', async () => {
            mockElectronAPI.getConfig.mockResolvedValue({ value: 'invalid-theme' });
            await themeManager.initialize();
            expect(themeManager.getCurrentTheme()).toBe('light');
        });
    });

    describe('theme validation', () => {
        it('should validate correct theme IDs', () => {
            expect(themeManager.isValidTheme('light')).toBe(true);
            expect(themeManager.isValidTheme('dark')).toBe(true);
            expect(themeManager.isValidTheme('dracula')).toBe(true);
            expect(themeManager.isValidTheme('monokai')).toBe(true);
            expect(themeManager.isValidTheme('nord')).toBe(true);
            expect(themeManager.isValidTheme('solarized-light')).toBe(true);
            expect(themeManager.isValidTheme('solarized-dark')).toBe(true);
        });

        it('should reject invalid theme IDs', () => {
            expect(themeManager.isValidTheme('invalid')).toBe(false);
            expect(themeManager.isValidTheme('')).toBe(false);
            expect(themeManager.isValidTheme(null)).toBe(false);
        });
    });

    describe('theme switching', () => {
        beforeEach(async () => {
            await themeManager.initialize();
        });

        it('should switch to valid theme', async () => {
            await themeManager.setTheme('dark');
            expect(themeManager.getCurrentTheme()).toBe('dark');
            expect(document.body.classList.contains('theme-dark')).toBe(true);
        });

        it('should switch to dracula theme', async () => {
            await themeManager.setTheme('dracula');
            expect(themeManager.getCurrentTheme()).toBe('dracula');
            expect(document.body.classList.contains('theme-dracula')).toBe(true);
        });

        it('should not switch to invalid theme', async () => {
            const currentTheme = themeManager.getCurrentTheme();
            await themeManager.setTheme('invalid-theme');
            expect(themeManager.getCurrentTheme()).toBe(currentTheme);
        });

        it('should persist theme to config', async () => {
            await themeManager.setTheme('nord');
            expect(mockElectronAPI.setConfig).toHaveBeenCalledWith('theme', 'nord');
        });

        it('should toggle between light and dark', async () => {
            await themeManager.setTheme('light');
            await themeManager.toggleTheme();
            expect(themeManager.getCurrentTheme()).toBe('dark');
            await themeManager.toggleTheme();
            expect(themeManager.getCurrentTheme()).toBe('light');
        });

        it('should cycle through all themes', async () => {
            await themeManager.setTheme('light');
            await themeManager.cycleTheme();
            expect(themeManager.getCurrentTheme()).toBe('dark');
            await themeManager.cycleTheme();
            expect(themeManager.getCurrentTheme()).toBe('solarized-light');
        });
    });

    describe('event bus integration', () => {
        beforeEach(async () => {
            await themeManager.initialize();
        });

        it('should emit theme:changed event on event bus when theme changes', async () => {
            const eventCallback = vi.fn();
            const cleanup = eventBus.on('theme:changed', eventCallback);

            await themeManager.setTheme('dark');

            expect(eventCallback).toHaveBeenCalledWith({ theme: 'dark' });
            expect(eventCallback).toHaveBeenCalledTimes(1);

            cleanup();
        });

        it('should emit theme:changed with correct theme for each change', async () => {
            const eventCallback = vi.fn();
            const cleanup = eventBus.on('theme:changed', eventCallback);

            await themeManager.setTheme('dark');
            expect(eventCallback).toHaveBeenLastCalledWith({ theme: 'dark' });

            await themeManager.setTheme('dracula');
            expect(eventCallback).toHaveBeenLastCalledWith({ theme: 'dracula' });

            await themeManager.setTheme('nord');
            expect(eventCallback).toHaveBeenLastCalledWith({ theme: 'nord' });

            expect(eventCallback).toHaveBeenCalledTimes(3);

            cleanup();
        });

        it('should not emit theme:changed for invalid theme', async () => {
            const eventCallback = vi.fn();
            const cleanup = eventBus.on('theme:changed', eventCallback);

            await themeManager.setTheme('invalid-theme');

            expect(eventCallback).not.toHaveBeenCalled();

            cleanup();
        });

        it('should emit theme:changed when toggling theme', async () => {
            const eventCallback = vi.fn();
            const cleanup = eventBus.on('theme:changed', eventCallback);

            await themeManager.toggleTheme();

            expect(eventCallback).toHaveBeenCalledWith({ theme: 'dark' });

            cleanup();
        });

        it('should emit theme:changed when cycling theme', async () => {
            const eventCallback = vi.fn();
            const cleanup = eventBus.on('theme:changed', eventCallback);

            await themeManager.cycleTheme();

            expect(eventCallback).toHaveBeenCalledWith({ theme: 'dark' });

            cleanup();
        });
    });

    describe('theme metadata', () => {
        it('should return all available themes', () => {
            const themes = themeManager.getAvailableThemes();
            expect(themes.length).toBeGreaterThan(2);
            expect(themes.some(t => t.id === 'light')).toBe(true);
            expect(themes.some(t => t.id === 'dracula')).toBe(true);
        });

        it('should filter themes by category', () => {
            const popularThemes = themeManager.getThemesByCategory('popular');
            expect(popularThemes.length).toBeGreaterThan(0);
            expect(popularThemes.every(t => t.category === 'popular')).toBe(true);
        });

        it('should include theme metadata', () => {
            const themes = themeManager.getAvailableThemes();
            themes.forEach(theme => {
                expect(theme).toHaveProperty('id');
                expect(theme).toHaveProperty('name');
                expect(theme).toHaveProperty('category');
                expect(theme).toHaveProperty('description');
            });
        });
    });
});
