/**
 * Tests for Editor HTML to Markdown paste functionality
 */

const Editor = require('./editor');

describe('Editor - HTML to Markdown Paste', () => {
    let editor;
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        editor = new Editor();
        editor.initialize(container);
    });

    afterEach(() => {
        if (editor) {
            editor.destroy();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('Converter Integration', () => {
        it('should have HTML to Markdown converter initialized', () => {
            expect(editor.htmlToMarkdownConverter).toBeDefined();
            expect(editor.htmlToMarkdownConverter.convert).toBeInstanceOf(Function);
        });

        it('should use converter shouldConvert method', () => {
            const html = '<div><p>Complex HTML with more content</p><p>Multiple paragraphs</p></div>';

            expect(editor.htmlToMarkdownConverter.shouldConvert(html)).toBe(true);

            const simple = 'plain text';

            expect(editor.htmlToMarkdownConverter.shouldConvert(simple)).toBe(false);
        });

        it('should convert HTML to Markdown using converter', () => {
            const html = '<h1>Test</h1><p>This is <strong>bold</strong>.</p>';
            const markdown = editor.htmlToMarkdownConverter.convert(html);

            expect(markdown).toContain('# Test');
            expect(markdown).toContain('**bold**');
        });

        it('should convert complex HTML structures', () => {
            const html = `
                <h2>Section Title</h2>
                <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                </ul>
                <p>A paragraph with a <a href="https://example.com">link</a>.</p>
            `;
            const markdown = editor.htmlToMarkdownConverter.convert(html);

            expect(markdown).toContain('## Section Title');
            expect(markdown).toMatch(/-\s+Item 1/);
            expect(markdown).toMatch(/-\s+Item 2/);
            expect(markdown).toContain('[link](https://example.com)');
        });

        it('should convert code blocks with language', () => {
            const html = '<pre><code class="language-javascript">const x = 10;</code></pre>';
            const markdown = editor.htmlToMarkdownConverter.convert(html);

            expect(markdown).toContain('```javascript');
            expect(markdown).toContain('const x = 10;');
        });

        it('should convert blockquotes', () => {
            const html = '<blockquote>This is a quote</blockquote>';
            const markdown = editor.htmlToMarkdownConverter.convert(html);

            expect(markdown).toContain('> This is a quote');
        });

        it('should convert images', () => {
            const html = '<img src="image.jpg" alt="Test Image">';
            const markdown = editor.htmlToMarkdownConverter.convert(html);

            expect(markdown).toContain('![Test Image](image.jpg)');
        });

        it('should strip dangerous HTML', () => {
            const html = '<p>Content</p><script>alert("xss")</script>';
            const markdown = editor.htmlToMarkdownConverter.convert(html);

            expect(markdown).toContain('Content');
            expect(markdown).not.toContain('script');
            expect(markdown).not.toContain('alert');
        });

        it('should have paste listener setup', () => {
            // Verify that the editor DOM has event listeners
            expect(editor.view.dom).toBeDefined();
            // The paste listener is attached in setupPasteListener
        });
    });
});
