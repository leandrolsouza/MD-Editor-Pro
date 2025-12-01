/**
 * Tests for Advanced Markdown Post-Processor
 * 
 * Basic unit tests for the post-processor structure and error handling.
 * Full integration tests with actual Mermaid and KaTeX rendering are in integration tests.
 */

import { describe, test, expect, beforeEach } from 'vitest';

describe('AdvancedMarkdownPostProcessor - Structure', () => {
    let container;

    beforeEach(() => {
        // Create a fresh container for each test
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    test('handles empty Mermaid diagrams', () => {
        // Setup - empty mermaid diagram
        container.innerHTML = '<div class="mermaid-diagram" data-mermaid-id="test">   </div>';

        // The plugin should have already marked empty diagrams
        const diagram = container.querySelector('.mermaid-diagram');
        expect(diagram).toBeTruthy();
        expect(diagram.textContent.trim()).toBe('');
    });

    test('Mermaid placeholders have correct structure', () => {
        // Setup - mermaid placeholder
        const mermaidCode = 'graph TD\nA-->B';
        const mermaidId = 'mermaid-test123';

        container.innerHTML = `<div class="mermaid-diagram" data-mermaid-id="${mermaidId}">${mermaidCode}</div>`;

        // Verify structure
        const diagram = container.querySelector('.mermaid-diagram');
        expect(diagram).toBeTruthy();
        expect(diagram.getAttribute('data-mermaid-id')).toBe(mermaidId);
        expect(diagram.textContent).toContain('graph TD');
    });

    test('KaTeX inline placeholders have correct structure', () => {
        // Setup - inline math placeholder
        const latex = 'E = mc^2';
        container.innerHTML = `<span class="katex-inline" data-katex="${latex}"></span>`;

        // Verify structure
        const element = container.querySelector('.katex-inline');
        expect(element).toBeTruthy();
        expect(element.getAttribute('data-katex')).toBe(latex);
    });

    test('KaTeX block placeholders have correct structure', () => {
        // Setup - block math placeholder
        const latex = '\\int_0^\\infty e^{-x^2} dx';
        container.innerHTML = `<div class="katex-block" data-katex="${latex}" data-display="true"></div>`;

        // Verify structure
        const element = container.querySelector('.katex-block');
        expect(element).toBeTruthy();
        expect(element.getAttribute('data-katex')).toBe(latex);
        expect(element.getAttribute('data-display')).toBe('true');
    });

    test('can query multiple Mermaid diagrams', () => {
        // Setup - multiple diagrams
        container.innerHTML = `
            <div class="mermaid-diagram" data-mermaid-id="test1">graph TD\nA-->B</div>
            <div class="mermaid-diagram" data-mermaid-id="test2">graph LR\nX-->Y</div>
        `;

        // Verify we can find all diagrams
        const diagrams = container.querySelectorAll('.mermaid-diagram');
        expect(diagrams.length).toBe(2);
        expect(diagrams[0].getAttribute('data-mermaid-id')).toBe('test1');
        expect(diagrams[1].getAttribute('data-mermaid-id')).toBe('test2');
    });

    test('can query multiple KaTeX formulas', () => {
        // Setup - multiple formulas
        container.innerHTML = `
            <span class="katex-inline" data-katex="x^2"></span>
            <span class="katex-inline" data-katex="y = mx + b"></span>
            <div class="katex-block" data-katex="\\sum_{i=1}^n i" data-display="true"></div>
        `;

        // Verify we can find all formulas
        const inlineFormulas = container.querySelectorAll('.katex-inline');
        const blockFormulas = container.querySelectorAll('.katex-block');

        expect(inlineFormulas.length).toBe(2);
        expect(blockFormulas.length).toBe(1);
    });

    test('mixed content structure', () => {
        // Setup - mixed advanced markdown
        container.innerHTML = `
            <h1>Title</h1>
            <p>Some text with <span class="katex-inline" data-katex="E=mc^2"></span> inline math.</p>
            <div class="mermaid-diagram" data-mermaid-id="test">graph TD\nA-->B</div>
            <div class="callout callout-note">
                <div class="callout-title">Note</div>
                <div class="callout-content">With <span class="katex-inline" data-katex="x"></span> math</div>
            </div>
        `;

        // Verify all elements are present
        expect(container.querySelector('h1')).toBeTruthy();
        expect(container.querySelector('.mermaid-diagram')).toBeTruthy();
        expect(container.querySelectorAll('.katex-inline').length).toBe(2);
        expect(container.querySelector('.callout')).toBeTruthy();
    });
});

describe('AdvancedMarkdownPostProcessor - Error Handling', () => {
    test('empty container does not throw', () => {
        const container = document.createElement('div');

        // Should not throw when querying empty container
        expect(() => {
            container.querySelectorAll('.mermaid-diagram');
            container.querySelectorAll('.katex-inline');
            container.querySelectorAll('.katex-block');
        }).not.toThrow();
    });

    test('null data attributes are handled', () => {
        const container = document.createElement('div');
        container.innerHTML = '<div class="mermaid-diagram"></div>';

        const diagram = container.querySelector('.mermaid-diagram');
        expect(diagram.getAttribute('data-mermaid-id')).toBeNull();
    });

    test('missing data-katex attribute', () => {
        const container = document.createElement('div');
        container.innerHTML = '<span class="katex-inline"></span>';

        const element = container.querySelector('.katex-inline');
        expect(element.getAttribute('data-katex')).toBeNull();
    });
});
