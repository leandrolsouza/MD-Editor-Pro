/**
 * Tests for HTML to Markdown Converter
 */

const HtmlToMarkdownConverter = require('./html-to-markdown');

describe('HtmlToMarkdownConverter', () => {
    let converter;

    beforeEach(() => {
        converter = new HtmlToMarkdownConverter();
    });

    describe('Basic HTML Elements', () => {
        it('should convert headings', () => {
            const html = '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>';
            const markdown = converter.convert(html);

            expect(markdown).toContain('# Heading 1');
            expect(markdown).toContain('## Heading 2');
            expect(markdown).toContain('### Heading 3');
        });

        it('should convert paragraphs', () => {
            const html = '<p>This is a paragraph.</p><p>This is another paragraph.</p>';
            const markdown = converter.convert(html);

            expect(markdown).toContain('This is a paragraph.');
            expect(markdown).toContain('This is another paragraph.');
        });

        it('should convert bold text', () => {
            const html = '<p>This is <strong>bold</strong> text.</p>';
            const markdown = converter.convert(html);

            expect(markdown).toContain('**bold**');
        });

        it('should convert italic text', () => {
            const html = '<p>This is <em>italic</em> text.</p>';
            const markdown = converter.convert(html);

            expect(markdown).toContain('*italic*');
        });

        it('should convert strikethrough text', () => {
            const html = '<p>This is <del>deleted</del> text.</p>';
            const markdown = converter.convert(html);

            expect(markdown).toContain('~~deleted~~');
        });

        it('should convert inline code', () => {
            const html = '<p>This is <code>inline code</code>.</p>';
            const markdown = converter.convert(html);

            expect(markdown).toContain('`inline code`');
        });
    });

    describe('Links and Images', () => {
        it('should convert links', () => {
            const html = '<a href="https://example.com">Example Link</a>';
            const markdown = converter.convert(html);

            expect(markdown).toContain('[Example Link](https://example.com)');
        });

        it('should convert images', () => {
            const html = '<img src="image.jpg" alt="Alt Text">';
            const markdown = converter.convert(html);

            expect(markdown).toContain('![Alt Text](image.jpg)');
        });

        it('should convert images without alt text', () => {
            const html = '<img src="image.jpg">';
            const markdown = converter.convert(html);

            expect(markdown).toContain('![](image.jpg)');
        });
    });

    describe('Lists', () => {
        it('should convert unordered lists', () => {
            const html = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
            const markdown = converter.convert(html);

            expect(markdown).toMatch(/-\s+Item 1/);
            expect(markdown).toMatch(/-\s+Item 2/);
            expect(markdown).toMatch(/-\s+Item 3/);
        });

        it('should convert ordered lists', () => {
            const html = '<ol><li>First</li><li>Second</li><li>Third</li></ol>';
            const markdown = converter.convert(html);

            expect(markdown).toMatch(/1\.\s+First/);
            expect(markdown).toMatch(/2\.\s+Second/);
            expect(markdown).toMatch(/3\.\s+Third/);
        });

        it('should convert nested lists', () => {
            const html = '<ul><li>Item 1<ul><li>Nested 1</li><li>Nested 2</li></ul></li><li>Item 2</li></ul>';
            const markdown = converter.convert(html);

            expect(markdown).toMatch(/-\s+Item 1/);
            expect(markdown).toMatch(/-\s+Nested 1/);
            expect(markdown).toMatch(/-\s+Nested 2/);
            expect(markdown).toMatch(/-\s+Item 2/);
        });
    });

    describe('Code Blocks', () => {
        it('should convert code blocks', () => {
            const html = '<pre><code>const x = 10;\nconsole.log(x);</code></pre>';
            const markdown = converter.convert(html);

            expect(markdown).toContain('```');
            expect(markdown).toContain('const x = 10;');
            expect(markdown).toContain('console.log(x);');
        });

        it('should convert code blocks with language', () => {
            const html = '<pre><code class="language-javascript">const x = 10;</code></pre>';
            const markdown = converter.convert(html);

            expect(markdown).toContain('```javascript');
            expect(markdown).toContain('const x = 10;');
        });
    });

    describe('Blockquotes', () => {
        it('should convert blockquotes', () => {
            const html = '<blockquote>This is a quote.</blockquote>';
            const markdown = converter.convert(html);

            expect(markdown).toContain('> This is a quote.');
        });

        it('should convert nested blockquotes', () => {
            const html = '<blockquote>Level 1<blockquote>Level 2</blockquote></blockquote>';
            const markdown = converter.convert(html);

            expect(markdown).toContain('> Level 1');
            expect(markdown).toContain('> > Level 2');
        });
    });

    describe('Tables', () => {
        it('should convert simple tables', () => {
            const html = `
                <table>
                    <thead>
                        <tr><th>Header 1</th><th>Header 2</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Cell 1</td><td>Cell 2</td></tr>
                        <tr><td>Cell 3</td><td>Cell 4</td></tr>
                    </tbody>
                </table>
            `;
            const markdown = converter.convert(html);

            expect(markdown).toContain('Header 1');
            expect(markdown).toContain('Header 2');
            expect(markdown).toContain('Cell 1');
            expect(markdown).toContain('Cell 2');
        });
    });

    describe('HTML Cleaning', () => {
        it('should remove script tags', () => {
            const html = '<p>Content</p><script>alert("test");</script>';
            const markdown = converter.convert(html);

            expect(markdown).not.toContain('script');
            expect(markdown).not.toContain('alert');
            expect(markdown).toContain('Content');
        });

        it('should remove style tags', () => {
            const html = '<p>Content</p><style>.test { color: red; }</style>';
            const markdown = converter.convert(html);

            expect(markdown).not.toContain('style');
            expect(markdown).not.toContain('color: red');
            expect(markdown).toContain('Content');
        });

        it('should remove HTML comments', () => {
            const html = '<p>Content</p><!-- This is a comment -->';
            const markdown = converter.convert(html);

            expect(markdown).not.toContain('<!--');
            expect(markdown).not.toContain('comment');
            expect(markdown).toContain('Content');
        });
    });

    describe('HTML Detection', () => {
        it('should detect HTML content', () => {
            expect(converter.isHtml('<p>Test</p>')).toBe(true);
            expect(converter.isHtml('<div>Test</div>')).toBe(true);
            expect(converter.isHtml('Test &amp; Test')).toBe(true);
        });

        it('should not detect plain text as HTML', () => {
            expect(converter.isHtml('Plain text')).toBe(false);
            expect(converter.isHtml('Text with < and >')).toBe(false);
            expect(converter.isHtml('')).toBe(false);
            expect(converter.isHtml(null)).toBe(false);
        });

        it('should determine if content should be converted', () => {
            // Should convert
            expect(converter.shouldConvert('<h1>Title</h1><p>Content</p>')).toBe(true);
            expect(converter.shouldConvert('<div><p>Complex HTML with more content</p><p>Multiple paragraphs</p></div>')).toBe(true);

            // Should not convert
            expect(converter.shouldConvert('Plain text')).toBe(false);
            expect(converter.shouldConvert('<b>x</b>')).toBe(false); // Too simple
        });
    });

    describe('Post-processing', () => {
        it('should remove excessive blank lines', () => {
            const html = '<p>Para 1</p><br><br><br><p>Para 2</p>';
            const markdown = converter.convert(html);

            // Should not have more than 2 consecutive newlines
            expect(markdown).not.toMatch(/\n{3,}/);
        });

        it('should trim whitespace', () => {
            const html = '  <p>Content</p>  ';
            const markdown = converter.convert(html);

            expect(markdown).toBe('Content');
        });

        it('should add proper spacing around headings', () => {
            const html = '<p>Text</p><h2>Heading</h2><p>More text</p>';
            const markdown = converter.convert(html);

            // Should have blank lines around heading
            expect(markdown).toMatch(/Text\n\n## Heading\n\nMore text/);
        });
    });

    describe('Complex HTML', () => {
        it('should convert complex nested HTML', () => {
            const html = `
                <article>
                    <h1>Article Title</h1>
                    <p>This is the <strong>introduction</strong> with a <a href="https://example.com">link</a>.</p>
                    <h2>Section 1</h2>
                    <p>Some content with <em>emphasis</em>.</p>
                    <ul>
                        <li>Item 1</li>
                        <li>Item 2</li>
                    </ul>
                    <h2>Section 2</h2>
                    <blockquote>A quote from someone.</blockquote>
                    <pre><code>const code = "example";</code></pre>
                </article>
            `;
            const markdown = converter.convert(html);

            expect(markdown).toContain('# Article Title');
            expect(markdown).toContain('**introduction**');
            expect(markdown).toContain('[link](https://example.com)');
            expect(markdown).toContain('## Section 1');
            expect(markdown).toContain('*emphasis*');
            expect(markdown).toMatch(/-\s+Item 1/);
            expect(markdown).toMatch(/-\s+Item 2/);
            expect(markdown).toContain('> A quote from someone.');
            expect(markdown).toContain('```');
            expect(markdown).toContain('const code = "example";');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty HTML', () => {
            expect(converter.convert('')).toBe('');
            expect(converter.convert('   ')).toBe('');
        });

        it('should handle null/undefined', () => {
            expect(converter.convert(null)).toBe('');
            expect(converter.convert(undefined)).toBe('');
        });

        it('should handle malformed HTML gracefully', () => {
            const html = '<p>Unclosed paragraph';
            const result = converter.convert(html);

            expect(result).toBeTruthy();
            expect(result).toContain('Unclosed paragraph');
        });

        it('should return original content if conversion fails', () => {
            // Mock turndown to throw error
            const originalTurndown = converter.turndownService.turndown;
            converter.turndownService.turndown = () => {
                throw new Error('Conversion error');
            };

            const html = '<p>Test</p>';
            const result = converter.convert(html);

            expect(result).toBe(html);

            // Restore
            converter.turndownService.turndown = originalTurndown;
        });
    });
});
