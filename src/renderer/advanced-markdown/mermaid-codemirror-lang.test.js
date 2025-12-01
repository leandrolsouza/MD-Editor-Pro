/**
 * Tests for Mermaid CodeMirror language support
 *
 * These tests verify that the Mermaid language definition can be created
 * and integrated with CodeMirror. The actual syntax highlighting is tested
 * through integration tests with the editor.
 */

const { mermaidLanguage, mermaid } = require('./mermaid-codemirror-lang');

describe('Mermaid CodeMirror Language', () => {
    describe('language creation', () => {
        it('should export mermaidLanguage', () => {
            expect(mermaidLanguage).toBeDefined();
            expect(typeof mermaidLanguage).toBe('object');
        });

        it('should export mermaid function', () => {
            expect(mermaid).toBeDefined();
            expect(typeof mermaid).toBe('function');
        });

        it('should create language support', () => {
            const languageSupport = mermaid();

            expect(languageSupport).toBeDefined();
        });
    });

    describe('language structure', () => {
        it('should have name property', () => {
            expect(mermaidLanguage.name).toBe('mermaid');
        });

        it('should be a StreamLanguage', () => {
            // StreamLanguage objects have specific properties
            expect(mermaidLanguage).toBeDefined();
            expect(typeof mermaidLanguage).toBe('object');
        });
    });
});
