/**
 * Tests for markdown parser configuration
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { MarkdownParser, createMarkdownParser, getMarkdownParser, renderMarkdown } from './markdown-parser.js';

describe('Markdown Parser Configuration', () => {
    test('creates markdown parser instance', () => {
        const parser = createMarkdownParser();

        expect(parser).toBeDefined();
        expect(typeof parser.render).toBe('function');
    });

    test('singleton returns same instance', () => {
        const parser1 = getMarkdownParser();
        const parser2 = getMarkdownParser();

        expect(parser1).toBe(parser2);
    });

    test('renders basic markdown', () => {
        const html = renderMarkdown('# Hello World');

        expect(html).toContain('<h1>');
        expect(html).toContain('Hello World');
    });

    test('disables HTML tags for security', () => {
        const html = renderMarkdown('<script>alert("xss")</script>');

        expect(html).not.toContain('<script>');
    });

    test('renders CommonMark headings (ATX)', () => {
        const html = renderMarkdown('# H1\n## H2\n### H3');

        expect(html).toContain('<h1>H1</h1>');
        expect(html).toContain('<h2>H2</h2>');
        expect(html).toContain('<h3>H3</h3>');
    });

    test('renders CommonMark headings (Setext)', () => {
        const html = renderMarkdown('Heading 1\n=========\n\nHeading 2\n---------');

        expect(html).toContain('<h1>Heading 1</h1>');
        expect(html).toContain('<h2>Heading 2</h2>');
    });

    test('renders unordered lists', () => {
        const html = renderMarkdown('- Item 1\n- Item 2\n- Item 3');

        expect(html).toContain('<ul>');
        expect(html).toContain('<li>Item 1</li>');
    });

    test('renders ordered lists', () => {
        const html = renderMarkdown('1. First\n2. Second\n3. Third');

        expect(html).toContain('<ol>');
        expect(html).toContain('<li>First</li>');
    });

    test('renders links', () => {
        const html = renderMarkdown('[Link Text](https://example.com)');

        expect(html).toContain('<a href="https://example.com">Link Text</a>');
    });

    test('renders images', () => {
        const html = renderMarkdown('![Alt Text](image.png)');

        expect(html).toContain('<img');
        // The parser converts relative paths to file:// URLs
        expect(html).toContain('src="file://');
        expect(html).toContain('image.png');
        expect(html).toContain('alt="Alt Text"');
    });

    test('renders code blocks', () => {
        const html = renderMarkdown('```\ncode here\n```');

        expect(html).toContain('<pre>');
        expect(html).toContain('<code>');
    });

    test('renders inline code', () => {
        const html = renderMarkdown('This is `inline code`');

        expect(html).toContain('<code>inline code</code>');
    });

    test('renders blockquotes', () => {
        const html = renderMarkdown('> This is a quote');

        expect(html).toContain('<blockquote>');
        expect(html).toContain('This is a quote');
    });

    test('renders emphasis (italic)', () => {
        const html = renderMarkdown('*italic* and _italic_');

        expect(html).toContain('<em>italic</em>');
    });

    test('renders strong (bold)', () => {
        const html = renderMarkdown('**bold** and __bold__');

        expect(html).toContain('<strong>bold</strong>');
    });

    test('renders GFM tables', () => {
        const markdown = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
        const html = renderMarkdown(markdown);

        expect(html).toContain('<table>');
        expect(html).toContain('<thead>');
        expect(html).toContain('<tbody>');
        expect(html).toContain('Header 1');
        expect(html).toContain('Cell 1');
    });

    test('renders GFM strikethrough', () => {
        const html = renderMarkdown('~~strikethrough~~');

        expect(html).toContain('<s>strikethrough</s>');
    });

    test('renders task lists', () => {
        const markdown = '- [ ] Unchecked task\n- [x] Checked task';
        const html = renderMarkdown(markdown);

        expect(html).toContain('type="checkbox"');
        expect(html).toContain('class="task-list-item');
        expect(html).toContain('checked=""'); // Checked task should have checked attribute
    });

    test('auto-converts URLs to links (linkify)', () => {
        const html = renderMarkdown('Visit https://example.com');

        expect(html).toContain('<a href="https://example.com">');
    });

    test('applies syntax highlighting to code blocks', () => {
        const markdown = '```javascript\nconst x = 1;\n```';
        const html = renderMarkdown(markdown);

        expect(html).toContain('<pre>');
        expect(html).toContain('<code');
        // highlight.js adds span elements with classes
        expect(html).toContain('hljs');
    });

    test('handles code blocks without language gracefully', () => {
        const markdown = '```\nplain code\n```';
        const html = renderMarkdown(markdown);

        expect(html).toContain('<pre>');
        expect(html).toContain('plain code');
    });

    test('handles invalid language in code blocks', () => {
        const markdown = '```invalidlang\ncode\n```';
        const html = renderMarkdown(markdown);

        expect(html).toContain('<pre>');
        expect(html).toContain('code');
    });
});

describe('MarkdownParser Class', () => {
    test('creates parser without advanced features', () => {
        const parser = new MarkdownParser();

        expect(parser).toBeDefined();
        expect(parser.md).toBeDefined();
        expect(typeof parser.parse).toBe('function');
    });

    test('parses basic markdown', () => {
        const parser = new MarkdownParser();
        const html = parser.parse('# Hello World');

        expect(html).toContain('<h1>');
        expect(html).toContain('Hello World');
    });

    test('handles empty markdown', () => {
        const parser = new MarkdownParser();
        const html = parser.parse('');

        expect(html).toBe('');
    });

    test('handles null markdown', () => {
        const parser = new MarkdownParser();
        const html = parser.parse(null);

        expect(html).toBe('');
    });

    test('reinitialize recreates parser instance', () => {
        const parser = new MarkdownParser();
        const oldMd = parser.md;

        parser.reinitialize();
        expect(parser.md).toBeDefined();
        expect(parser.md).not.toBe(oldMd);
    });
});

describe('MarkdownParser with Advanced Features', () => {
    let mockManager;

    beforeEach(() => {
        // Create a mock AdvancedMarkdownManager
        mockManager = {
            isFeatureEnabled: (feature) => {
                // All features enabled by default
                return true;
            }
        };
    });

    test('creates parser with advanced markdown manager', () => {
        const parser = new MarkdownParser(mockManager);

        expect(parser).toBeDefined();
        expect(parser.advancedMarkdownManager).toBe(mockManager);
    });

    test('loads Mermaid plugin when enabled', () => {
        mockManager.isFeatureEnabled = (feature) => feature === 'mermaid';
        const parser = new MarkdownParser(mockManager);

        const markdown = '```mermaid\ngraph TD\nA-->B\n```';
        const html = parser.parse(markdown);

        // Should contain mermaid-diagram class
        expect(html).toContain('mermaid-diagram');
        expect(html).toContain('data-mermaid-id');
    });

    test('does not load Mermaid plugin when disabled', () => {
        mockManager.isFeatureEnabled = (feature) => feature !== 'mermaid';
        const parser = new MarkdownParser(mockManager);

        const markdown = '```mermaid\ngraph TD\nA-->B\n```';
        const html = parser.parse(markdown);

        // Should be treated as regular code block
        expect(html).not.toContain('mermaid-diagram');
        expect(html).toContain('<pre>');
        expect(html).toContain('<code');
    });

    test('loads KaTeX plugin when enabled', () => {
        mockManager.isFeatureEnabled = (feature) => feature === 'katex';
        const parser = new MarkdownParser(mockManager);

        const markdown = 'Inline math: $x^2$';
        const html = parser.parse(markdown);

        // Should contain katex-inline class
        expect(html).toContain('katex-inline');
        expect(html).toContain('data-katex');
    });

    test('does not load KaTeX plugin when disabled', () => {
        mockManager.isFeatureEnabled = (feature) => feature !== 'katex';
        const parser = new MarkdownParser(mockManager);

        const markdown = 'Inline math: $x^2$';
        const html = parser.parse(markdown);

        // Should be treated as regular text
        expect(html).not.toContain('katex-inline');
        expect(html).toContain('$x^2$');
    });

    test('loads Callouts plugin when enabled', () => {
        mockManager.isFeatureEnabled = (feature) => feature === 'callouts';
        const parser = new MarkdownParser(mockManager);

        const markdown = '> [!NOTE]\n> This is a note';
        const html = parser.parse(markdown);

        // Should contain callout classes
        expect(html).toContain('callout');
        expect(html).toContain('callout-note');
    });

    test('does not load Callouts plugin when disabled', () => {
        mockManager.isFeatureEnabled = (feature) => feature !== 'callouts';
        const parser = new MarkdownParser(mockManager);

        const markdown = '> [!NOTE]\n> This is a note';
        const html = parser.parse(markdown);

        // Should be treated as regular blockquote
        expect(html).not.toContain('callout-note');
        expect(html).toContain('<blockquote>');
    });

    test('loads all plugins when all features enabled', () => {
        mockManager.isFeatureEnabled = () => true;
        const parser = new MarkdownParser(mockManager);

        const markdown = `
# Test Document

\`\`\`mermaid
graph TD
A-->B
\`\`\`

Inline math: $x^2$

> [!NOTE]
> This is a note
`;
        const html = parser.parse(markdown);

        // Should contain all advanced features
        expect(html).toContain('mermaid-diagram');
        expect(html).toContain('katex-inline');
        expect(html).toContain('callout');
    });

    test('reinitialize updates plugins based on new configuration', () => {
        // Start with all features enabled
        mockManager.isFeatureEnabled = () => true;
        const parser = new MarkdownParser(mockManager);

        let html = parser.parse('```mermaid\ngraph TD\nA-->B\n```');

        expect(html).toContain('mermaid-diagram');

        // Disable mermaid
        mockManager.isFeatureEnabled = (feature) => feature !== 'mermaid';
        parser.reinitialize();

        html = parser.parse('```mermaid\ngraph TD\nA-->B\n```');
        expect(html).not.toContain('mermaid-diagram');
    });

    test('handles errors in plugin initialization gracefully', () => {
        // Create a manager that throws errors
        const errorManager = {
            isFeatureEnabled: () => {
                throw new Error('Test error');
            }
        };

        // Should not throw, just log error
        expect(() => {
            const parser = new MarkdownParser(errorManager);
        }).not.toThrow();
    });
});

describe('MarkdownParser Async Parsing', () => {
    test('parseAsync returns HTML without post-processor', async () => {
        const parser = new MarkdownParser();
        const html = await parser.parseAsync('# Hello');

        expect(html).toContain('<h1>');
        expect(html).toContain('Hello');
    });

    test('parseAsync with post-processor processes HTML', async () => {
        const mockPostProcessor = {
            processHTML: async (container) => {
                // Mock post-processing
                container.innerHTML = container.innerHTML + '<!-- processed -->';
            }
        };

        const parser = new MarkdownParser(null, mockPostProcessor);
        const container = { innerHTML: '' };

        const html = await parser.parseAsync('# Hello', container);

        expect(html).toContain('<!-- processed -->');
    });

    test('parseAsync without container returns HTML', async () => {
        const mockPostProcessor = {
            processHTML: async () => { }
        };

        const parser = new MarkdownParser(null, mockPostProcessor);
        const html = await parser.parseAsync('# Hello');

        expect(html).toContain('<h1>');
    });
});

describe('Backward Compatibility', () => {
    test('existing code using legacy functions still works', () => {
        // Test that old code patterns still work
        const parser = createMarkdownParser();

        expect(parser).toBeDefined();

        const singleton = getMarkdownParser();

        expect(singleton).toBeDefined();

        const html = renderMarkdown('# Test');

        expect(html).toContain('<h1>');
    });

    test('legacy functions support all basic markdown', () => {
        const tests = [
            { input: '# Heading', expected: '<h1>' },
            { input: '**bold**', expected: '<strong>' },
            { input: '*italic*', expected: '<em>' },
            { input: '[link](url)', expected: '<a href' },
            { input: '- list', expected: '<ul>' },
            { input: '```\ncode\n```', expected: '<pre>' }
        ];

        tests.forEach(({ input, expected }) => {
            const html = renderMarkdown(input);

            expect(html).toContain(expected);
        });
    });
});
