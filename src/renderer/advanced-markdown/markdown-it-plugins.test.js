/**
 * Tests for markdown-it advanced plugins
 */

import { describe, test, expect } from 'vitest';
import markdownIt from 'markdown-it';
import markdownItMermaid from './markdown-it-mermaid-plugin.js';
import markdownItKatex from './markdown-it-katex-plugin.js';
import markdownItCallouts from './markdown-it-callout-plugin.js';

describe('Mermaid Plugin', () => {
    test('detects mermaid code blocks', () => {
        const md = markdownIt();

        md.use(markdownItMermaid);

        const markdown = '```mermaid\ngraph TD\n  A-->B\n```';
        const html = md.render(markdown);

        expect(html).toContain('class="mermaid-diagram"');
        expect(html).toContain('data-mermaid-id');
        expect(html).toContain('graph TD');
    });

    test('handles empty mermaid blocks', () => {
        const md = markdownIt();

        md.use(markdownItMermaid);

        const markdown = '```mermaid\n\n```';
        const html = md.render(markdown);

        expect(html).toContain('mermaid-empty');
        expect(html).toContain('Empty Mermaid diagram');
    });

    test('does not affect non-mermaid code blocks', () => {
        const md = markdownIt();

        md.use(markdownItMermaid);

        const markdown = '```javascript\nconst x = 1;\n```';
        const html = md.render(markdown);

        expect(html).not.toContain('mermaid-diagram');
        expect(html).toContain('<code');
    });

    test('escapes HTML in mermaid content', () => {
        const md = markdownIt();

        md.use(markdownItMermaid);

        const markdown = '```mermaid\ngraph TD\n  A[<script>alert("xss")</script>]\n```';
        const html = md.render(markdown);

        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });
});

describe('KaTeX Plugin', () => {
    test('detects inline math with single dollar signs', () => {
        const md = markdownIt();

        md.use(markdownItKatex);

        const markdown = 'This is $E = mc^2$ inline math.';
        const html = md.render(markdown);

        expect(html).toContain('class="katex-inline"');
        expect(html).toContain('data-katex');
        expect(html).toContain('E = mc^2');
    });

    test('detects display math with double dollar signs', () => {
        const md = markdownIt();

        md.use(markdownItKatex);

        const markdown = '$$\nE = mc^2\n$$';
        const html = md.render(markdown);

        expect(html).toContain('class="katex-block"');
        expect(html).toContain('data-katex');
        expect(html).toContain('data-display="true"');
        expect(html).toContain('E = mc^2');
    });

    test('handles escaped dollar signs', () => {
        const md = markdownIt();

        md.use(markdownItKatex);

        const markdown = 'This costs \\$5 and \\$10.';
        const html = md.render(markdown);

        expect(html).not.toContain('class="katex-inline"');
        expect(html).toContain('$5');
        expect(html).toContain('$10');
    });

    test('ignores empty inline math', () => {
        const md = markdownIt();

        md.use(markdownItKatex);

        const markdown = 'This is $ $ empty.';
        const html = md.render(markdown);

        expect(html).not.toContain('class="katex-inline"');
    });

    test('handles multiple inline math expressions', () => {
        const md = markdownIt();

        md.use(markdownItKatex);

        const markdown = 'Inline $x$ and another $y = mx + b$ expression.';
        const html = md.render(markdown);

        expect(html).toContain('class="katex-inline"');
        const xMatches = html.match(/data-katex="x"/g);
        const yMatches = html.match(/data-katex="y = mx \+ b"/g);

        expect(xMatches).toBeTruthy();
        expect(yMatches).toBeTruthy();
    });

    test('escapes HTML in math content', () => {
        const md = markdownIt();

        md.use(markdownItKatex);

        const markdown = '$<script>alert("xss")</script>$';
        const html = md.render(markdown);

        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });
});

describe('Callouts Plugin', () => {
    test('detects NOTE callout', () => {
        const md = markdownIt();

        md.use(markdownItCallouts);

        const markdown = '> [!NOTE]\n> This is a note.';
        const html = md.render(markdown);

        expect(html).toContain('class="callout');
        expect(html).toContain('callout-note');
        expect(html).toContain('callout-title');
        expect(html).toContain('Note');
        expect(html).toContain('This is a note');
    });

    test('detects WARNING callout', () => {
        const md = markdownIt();

        md.use(markdownItCallouts);

        const markdown = '> [!WARNING]\n> This is a warning.';
        const html = md.render(markdown);

        expect(html).toContain('callout-warning');
        expect(html).toContain('Warning');
    });

    test('detects TIP callout', () => {
        const md = markdownIt();

        md.use(markdownItCallouts);

        const markdown = '> [!TIP]\n> This is a tip.';
        const html = md.render(markdown);

        expect(html).toContain('callout-tip');
        expect(html).toContain('Tip');
    });

    test('detects IMPORTANT callout', () => {
        const md = markdownIt();

        md.use(markdownItCallouts);

        const markdown = '> [!IMPORTANT]\n> This is important.';
        const html = md.render(markdown);

        expect(html).toContain('callout-important');
        expect(html).toContain('Important');
    });

    test('detects CAUTION callout', () => {
        const md = markdownIt();

        md.use(markdownItCallouts);

        const markdown = '> [!CAUTION]\n> This is a caution.';
        const html = md.render(markdown);

        expect(html).toContain('callout-caution');
        expect(html).toContain('Caution');
    });

    test('handles unknown callout type with default', () => {
        const md = markdownIt();

        md.use(markdownItCallouts);

        const markdown = '> [!UNKNOWN]\n> This is unknown.';
        const html = md.render(markdown);

        expect(html).toContain('callout-note');
        expect(html).toContain('Note');
    });

    test('handles multi-line callout content', () => {
        const md = markdownIt();

        md.use(markdownItCallouts);

        const markdown = '> [!NOTE]\n> Line 1\n> Line 2\n> Line 3';
        const html = md.render(markdown);

        expect(html).toContain('Line 1');
        expect(html).toContain('Line 2');
        expect(html).toContain('Line 3');
    });

    test('does not affect regular blockquotes', () => {
        const md = markdownIt();

        md.use(markdownItCallouts);

        const markdown = '> This is a regular blockquote.';
        const html = md.render(markdown);

        expect(html).not.toContain('class="callout');
        expect(html).toContain('<blockquote>');
    });

    test('includes callout icon', () => {
        const md = markdownIt();

        md.use(markdownItCallouts);

        const markdown = '> [!NOTE]\n> Content';
        const html = md.render(markdown);

        expect(html).toContain('callout-icon');
        expect(html).toContain('ℹ️');
    });
});

describe('Plugin Integration', () => {
    test('all plugins work together', () => {
        const md = markdownIt();

        md.use(markdownItMermaid);
        md.use(markdownItKatex);
        md.use(markdownItCallouts);

        const markdown = `
# Document with Advanced Features

Inline math: $E = mc^2$

\`\`\`mermaid
graph TD
  A-->B
\`\`\`

> [!NOTE]
> This is a note with $x = 5$ math.

Display math:
$$
y = mx + b
$$
`;

        const html = md.render(markdown);

        expect(html).toContain('mermaid-diagram');
        expect(html).toContain('katex-inline');
        expect(html).toContain('katex-block');
        expect(html).toContain('callout');
    });
});
