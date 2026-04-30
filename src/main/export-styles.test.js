/**
 * Tests for export-styles module
 * Validates CSS generation for HTML/PDF export with theme parameterization
 */

import { describe, it, expect } from 'vitest';
import { generateCSS, generateCalloutCSS, getThemeColors, THEME_COLORS } from './export-styles.js';

describe('export-styles', () => {
    describe('THEME_COLORS', () => {
        it('defines light and dark theme palettes', () => {
            expect(THEME_COLORS).toHaveProperty('light');
            expect(THEME_COLORS).toHaveProperty('dark');
        });

        it('light theme has all required color keys', () => {
            const light = THEME_COLORS.light;
            expect(light.bg).toBe('#ffffff');
            expect(light.text).toBe('#333333');
            expect(light.heading).toBe('#1a1a1a');
            expect(light.link).toBe('#0366d6');
            expect(light.codeBg).toBe('#f6f8fa');
            expect(light.callout).toBeDefined();
            expect(light.callout.note).toBeDefined();
        });

        it('dark theme has all required color keys', () => {
            const dark = THEME_COLORS.dark;
            expect(dark.bg).toBe('#1e1e1e');
            expect(dark.text).toBe('#d4d4d4');
            expect(dark.heading).toBe('#e0e0e0');
            expect(dark.link).toBe('#4a9eff');
            expect(dark.codeBg).toBe('#2d2d2d');
            expect(dark.callout).toBeDefined();
            expect(dark.callout.caution).toBeDefined();
        });

        it('both themes define the same callout types', () => {
            const lightCallouts = Object.keys(THEME_COLORS.light.callout);
            const darkCallouts = Object.keys(THEME_COLORS.dark.callout);
            expect(lightCallouts).toEqual(darkCallouts);
            expect(lightCallouts).toEqual(['note', 'warning', 'tip', 'important', 'caution']);
        });
    });

    describe('getThemeColors', () => {
        it('returns light colors for "light" theme', () => {
            expect(getThemeColors('light')).toBe(THEME_COLORS.light);
        });

        it('returns dark colors for "dark" theme', () => {
            expect(getThemeColors('dark')).toBe(THEME_COLORS.dark);
        });

        it('defaults to light for unknown theme', () => {
            expect(getThemeColors('unknown')).toBe(THEME_COLORS.light);
        });
    });

    describe('generateCSS', () => {
        it('generates CSS with light theme colors by default', () => {
            const css = generateCSS();
            expect(css).toContain('#ffffff');  // light bg
            expect(css).toContain('#333333');  // light text
            expect(css).toContain('#0366d6');  // light link
            expect(css).not.toContain('#1e1e1e');  // dark bg should not appear
        });

        it('generates CSS with dark theme colors', () => {
            const css = generateCSS('dark');
            expect(css).toContain('#1e1e1e');  // dark bg
            expect(css).toContain('#d4d4d4');  // dark text
            expect(css).toContain('#4a9eff');  // dark link
            expect(css).not.toContain('#ffffff');  // light bg should not appear
        });

        it('includes base layout styles', () => {
            const css = generateCSS('light');
            expect(css).toContain('box-sizing: border-box');
            expect(css).toContain('font-family:');
            expect(css).toContain('max-width: 800px');
        });

        it('includes table styles', () => {
            const css = generateCSS('light');
            expect(css).toContain('border-collapse: collapse');
            expect(css).toContain('table thead');
            expect(css).toContain('@media print');
        });

        it('includes syntax highlighting styles', () => {
            const css = generateCSS('light');
            expect(css).toContain('.hljs');
            expect(css).toContain('.hljs-keyword');
            expect(css).toContain('.hljs-string');
            expect(css).toContain('.hljs-comment');
        });

        it('includes task list styles', () => {
            const css = generateCSS('light');
            expect(css).toContain('.task-list-item');
        });
    });

    describe('generateCalloutCSS', () => {
        it('generates callout CSS with light theme colors by default', () => {
            const css = generateCalloutCSS();
            expect(css).toContain('#0969da');  // light note border
            expect(css).toContain('#ddf4ff');  // light note bg
            expect(css).not.toContain('#58a6ff');  // dark note border should not appear
        });

        it('generates callout CSS with dark theme colors', () => {
            const css = generateCalloutCSS('dark');
            expect(css).toContain('#58a6ff');  // dark note border
            expect(css).toContain('#1c2d41');  // dark note bg
            expect(css).not.toContain('#0969da');  // light note border should not appear
        });

        it('includes all callout types', () => {
            const css = generateCalloutCSS('light');
            expect(css).toContain('.callout-note');
            expect(css).toContain('.callout-warning');
            expect(css).toContain('.callout-tip');
            expect(css).toContain('.callout-important');
            expect(css).toContain('.callout-caution');
        });

        it('includes base callout structure styles', () => {
            const css = generateCalloutCSS('light');
            expect(css).toContain('.callout {');
            expect(css).toContain('.callout-title');
            expect(css).toContain('.callout-content');
            expect(css).toContain('.callout-icon');
        });

        it('includes mermaid error styles', () => {
            const css = generateCalloutCSS('light');
            expect(css).toContain('.mermaid-error');
            expect(css).toContain('.mermaid-diagram');
        });

        it('uses correct mermaid error bg per theme', () => {
            const lightCss = generateCalloutCSS('light');
            const darkCss = generateCalloutCSS('dark');
            expect(lightCss).toContain('#ffebe9');  // light mermaid error bg
            expect(darkCss).toContain('#4a1a1f');   // dark mermaid error bg
        });
    });
});
