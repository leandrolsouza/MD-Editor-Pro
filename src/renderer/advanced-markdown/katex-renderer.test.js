/**
 * Tests for KaTeX Renderer shared module
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

const { renderKatexElement } = require('./katex-renderer');

describe('renderKatexElement', () => {
    let element;
    let mockKatex;

    beforeEach(() => {
        element = document.createElement('span');
        mockKatex = {
            render: vi.fn()
        };
    });

    test('renders latex from data-katex attribute', () => {
        element.setAttribute('data-katex', 'E = mc^2');

        renderKatexElement(element, mockKatex);

        expect(mockKatex.render).toHaveBeenCalledWith('E = mc^2', element, {
            throwOnError: false,
            displayMode: false
        });
    });

    test('adds katex-rendered class on success', () => {
        element.setAttribute('data-katex', 'x^2');
        mockKatex.render.mockImplementation(() => { });

        renderKatexElement(element, mockKatex);

        expect(element.classList.contains('katex-rendered')).toBe(true);
    });

    test('passes displayMode: true for block rendering', () => {
        element.setAttribute('data-katex', '\\sum_{i=1}^n i');

        renderKatexElement(element, mockKatex, { displayMode: true });

        expect(mockKatex.render).toHaveBeenCalledWith('\\sum_{i=1}^n i', element, {
            throwOnError: false,
            displayMode: true
        });
    });

    test('passes displayMode: false for inline rendering', () => {
        element.setAttribute('data-katex', 'x');

        renderKatexElement(element, mockKatex, { displayMode: false });

        expect(mockKatex.render).toHaveBeenCalledWith('x', element, {
            throwOnError: false,
            displayMode: false
        });
    });

    test('defaults to displayMode: false when no options provided', () => {
        element.setAttribute('data-katex', 'y');

        renderKatexElement(element, mockKatex);

        expect(mockKatex.render).toHaveBeenCalledWith('y', element, {
            throwOnError: false,
            displayMode: false
        });
    });

    test('skips element already marked katex-rendered', () => {
        element.setAttribute('data-katex', 'x');
        element.classList.add('katex-rendered');

        renderKatexElement(element, mockKatex);

        expect(mockKatex.render).not.toHaveBeenCalled();
    });

    test('skips element already marked katex-error', () => {
        element.setAttribute('data-katex', 'x');
        element.classList.add('katex-error');

        renderKatexElement(element, mockKatex);

        expect(mockKatex.render).not.toHaveBeenCalled();
    });

    test('skips element without data-katex attribute', () => {
        renderKatexElement(element, mockKatex);

        expect(mockKatex.render).not.toHaveBeenCalled();
    });

    test('handles render error by adding katex-error class and showing latex text', () => {
        element.setAttribute('data-katex', '\\invalid');
        mockKatex.render.mockImplementation(() => {
            throw new Error('KaTeX parse error');
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderKatexElement(element, mockKatex);

        expect(element.classList.contains('katex-error')).toBe(true);
        expect(element.textContent).toBe('\\invalid');
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
});
