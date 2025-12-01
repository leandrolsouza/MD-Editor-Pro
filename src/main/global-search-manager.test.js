/**
 * Tests for GlobalSearchManager
 */

const { describe, it, expect, beforeEach, vi } = globalThis;
const GlobalSearchManager = require('./global-search-manager');

describe('GlobalSearchManager', () => {
    let globalSearchManager;
    let mockWorkspaceManager;

    beforeEach(() => {
        mockWorkspaceManager = {
            getWorkspacePath: vi.fn()
        };

        globalSearchManager = new GlobalSearchManager(mockWorkspaceManager);
    });

    describe('isMarkdownFile', () => {
        it('should return true for .md files', () => {
            expect(globalSearchManager.isMarkdownFile('test.md')).toBe(true);
        });

        it('should return true for .markdown files', () => {
            expect(globalSearchManager.isMarkdownFile('test.markdown')).toBe(true);
        });

        it('should return false for non-markdown files', () => {
            expect(globalSearchManager.isMarkdownFile('test.txt')).toBe(false);
            expect(globalSearchManager.isMarkdownFile('test.js')).toBe(false);
        });

        it('should be case insensitive', () => {
            expect(globalSearchManager.isMarkdownFile('test.MD')).toBe(true);
            expect(globalSearchManager.isMarkdownFile('test.MARKDOWN')).toBe(true);
        });
    });

    describe('createSearchPattern', () => {
        it('should create case-insensitive pattern by default', () => {
            const pattern = globalSearchManager.createSearchPattern('test', { caseSensitive: false });

            expect('test'.match(pattern)).toBeTruthy();
            expect('TEST'.match(pattern)).toBeTruthy();
        });

        it('should create case-sensitive pattern when specified', () => {
            const pattern = globalSearchManager.createSearchPattern('test', { caseSensitive: true });

            expect('test'.match(pattern)).toBeTruthy();
            expect('TEST'.match(pattern)).toBeFalsy();
        });

        it('should match whole words when specified', () => {
            const pattern = globalSearchManager.createSearchPattern('test', { wholeWord: true });

            expect('test'.match(pattern)).toBeTruthy();
            expect('testing'.match(pattern)).toBeFalsy();
            expect('a test here'.match(pattern)).toBeTruthy();
        });

        it('should escape special regex characters', () => {
            const pattern = globalSearchManager.createSearchPattern('test.file', {});

            expect('test.file'.match(pattern)).toBeTruthy();
            expect('testXfile'.match(pattern)).toBeFalsy();
        });
    });

    describe('searchInWorkspace', () => {
        it('should return error when no workspace is open', async () => {
            mockWorkspaceManager.getWorkspacePath.mockReturnValue(null);

            const result = await globalSearchManager.searchInWorkspace('test');

            expect(result.success).toBe(false);
            expect(result.error).toBe('No workspace is currently open');
        });

        it('should return error when search text is empty', async () => {
            mockWorkspaceManager.getWorkspacePath.mockReturnValue('/some/path');

            const result = await globalSearchManager.searchInWorkspace('');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Search text cannot be empty');
        });

        it('should return error when search text is only whitespace', async () => {
            mockWorkspaceManager.getWorkspacePath.mockReturnValue('/some/path');

            const result = await globalSearchManager.searchInWorkspace('   ');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Search text cannot be empty');
        });
    });
});
