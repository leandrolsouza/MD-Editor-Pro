/**
 * Tests for keyword-matcher utility
 * Validates the generic matchKeywordSet function extracted from mermaid-codemirror-lang.js
 */

const { matchKeywordSet } = require('./keyword-matcher');

/**
 * Creates a mock CodeMirror stream for testing.
 * Simulates the stream.match(), stream.string, and stream.pos behavior.
 */
function createMockStream(text, pos = 0) {
    return {
        string: text,
        pos: pos,
        match(pattern, consume = true) {
            if (typeof pattern === 'string') {
                if (this.string.substring(this.pos).startsWith(pattern)) {
                    if (consume) {
                        this.pos += pattern.length;
                    }
                    return true;
                }
                return false;
            }
            return false;
        }
    };
}

describe('matchKeywordSet', () => {
    const keywords = ['participant', 'actor', 'note', 'end'];

    it('should match a keyword at the end of the line', () => {
        const stream = createMockStream('participant', 0);
        const result = matchKeywordSet(stream, keywords);
        expect(result).toBe('keyword');
        expect(stream.pos).toBe('participant'.length);
    });

    it('should match a keyword followed by whitespace', () => {
        const stream = createMockStream('actor Alice', 0);
        const result = matchKeywordSet(stream, keywords);
        expect(result).toBe('keyword');
        expect(stream.pos).toBe('actor'.length);
    });

    it('should match a keyword followed by colon', () => {
        const stream = createMockStream('note:text', 0);
        const result = matchKeywordSet(stream, keywords);
        expect(result).toBe('keyword');
        expect(stream.pos).toBe('note'.length);
    });

    it('should match a keyword followed by bracket', () => {
        const stream = createMockStream('note[info]', 0);
        const result = matchKeywordSet(stream, keywords);
        expect(result).toBe('keyword');
        expect(stream.pos).toBe('note'.length);
    });

    it('should not match a keyword that is a prefix of a longer word', () => {
        const stream = createMockStream('endpoint', 0);
        const result = matchKeywordSet(stream, keywords);
        expect(result).toBeNull();
        expect(stream.pos).toBe(0);
    });

    it('should return null when no keyword matches', () => {
        const stream = createMockStream('unknown', 0);
        const result = matchKeywordSet(stream, keywords);
        expect(result).toBeNull();
        expect(stream.pos).toBe(0);
    });

    it('should use custom tokenType when provided', () => {
        const stream = createMockStream('actor Alice', 0);
        const result = matchKeywordSet(stream, keywords, 'type');
        expect(result).toBe('type');
    });

    it('should default tokenType to keyword', () => {
        const stream = createMockStream('end', 0);
        const result = matchKeywordSet(stream, keywords);
        expect(result).toBe('keyword');
    });

    it('should match the first keyword when multiple could match', () => {
        const stream = createMockStream('note over', 0);
        const result = matchKeywordSet(stream, keywords);
        expect(result).toBe('keyword');
        expect(stream.pos).toBe('note'.length);
    });

    it('should handle empty keywords array', () => {
        const stream = createMockStream('anything', 0);
        const result = matchKeywordSet(stream, []);
        expect(result).toBeNull();
    });

    it('should handle multi-word keywords', () => {
        const multiWordKeywords = ['left of', 'right of'];
        const stream = createMockStream('left of Alice', 0);
        const result = matchKeywordSet(stream, multiWordKeywords);
        expect(result).toBe('keyword');
        expect(stream.pos).toBe('left of'.length);
    });
});
