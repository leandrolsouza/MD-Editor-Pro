/**
 * Tests for markdown parser configuration
 */

import { describe, test, expect } from 'vitest';
import { createMarkdownParser, getMarkdownParser, renderMarkdown } from './markdown-parser.js';

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
        expect(html).toContain('src="image.png"');
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
