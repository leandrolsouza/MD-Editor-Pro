/**
 * Property-Based Tests for FileManager
 * Feature: markdown-editor, Property 8: File save-load round trip
 * Validates: Requirements 3.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import FileManager from './file-manager.js';

describe('FileManager - File save-load round trip', () => {
    let fileManager;
    let mockWindowManager;
    let testDir;
    let testDirs = [];

    beforeEach(async () => {
        // Create a temporary directory for test files
        testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'md-editor-test-'));
        testDirs.push(testDir);

        // Mock WindowManager
        mockWindowManager = {
            getMainWindow: () => ({
                // Mock window object
                webContents: {}
            })
        };

        fileManager = new FileManager(mockWindowManager);
    });

    afterEach(async () => {
        // Clean up all test directories created during this test
        for (const dir of testDirs) {
            try {
                await fs.rm(dir, { recursive: true, force: true });
            } catch (error) {
                // Ignore cleanup errors
            }
        }
        testDirs = [];
    });

    // Feature: markdown-editor, Property 8: File save-load round trip
    // Validates: Requirements 3.2
    it('should preserve content through save-load round trip for any markdown content', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(), // Generate arbitrary string content
                async (content) => {
                    // Create a unique file path for this test iteration
                    const fileName = `test-${Date.now()}-${Math.random().toString(36).substring(7)}.md`;
                    const filePath = path.join(testDir, fileName);

                    // Save the content
                    await fileManager.saveFile(filePath, content);

                    // Load the content back
                    const loadedContent = await fs.readFile(filePath, 'utf-8');

                    // The loaded content should match the original content exactly
                    expect(loadedContent).toBe(content);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: markdown-editor, Property 8: File save-load round trip
    // Validates: Requirements 3.2
    it('should preserve markdown formatting through save-load round trip', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    heading: fc.string(),
                    paragraph: fc.string(),
                    listItems: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
                    codeBlock: fc.string()
                }),
                async ({ heading, paragraph, listItems, codeBlock }) => {
                    // Construct markdown content with various elements
                    const markdownContent = [
                        `# ${heading}`,
                        '',
                        paragraph,
                        '',
                        ...listItems.map(item => `- ${item}`),
                        '',
                        '```',
                        codeBlock,
                        '```'
                    ].join('\n');

                    const fileName = `test-${Date.now()}-${Math.random().toString(36).substring(7)}.md`;
                    const filePath = path.join(testDir, fileName);

                    // Save the markdown content
                    await fileManager.saveFile(filePath, markdownContent);

                    // Load it back
                    const loadedContent = await fs.readFile(filePath, 'utf-8');

                    // Content should be identical
                    expect(loadedContent).toBe(markdownContent);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: markdown-editor, Property 8: File save-load round trip
    // Validates: Requirements 3.2
    it('should preserve special characters and unicode through save-load round trip', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(), // Generate strings including unicode characters
                async (content) => {
                    const fileName = `test-${Date.now()}-${Math.random().toString(36).substring(7)}.md`;
                    const filePath = path.join(testDir, fileName);

                    // Save the content with unicode
                    await fileManager.saveFile(filePath, content);

                    // Load it back
                    const loadedContent = await fs.readFile(filePath, 'utf-8');

                    // Unicode content should be preserved
                    expect(loadedContent).toBe(content);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: markdown-editor, Property 8: File save-load round trip
    // Validates: Requirements 3.2
    it('should preserve empty content through save-load round trip', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constant(''), // Empty string
                async (content) => {
                    const fileName = `test-${Date.now()}-${Math.random().toString(36).substring(7)}.md`;
                    const filePath = path.join(testDir, fileName);

                    // Save empty content
                    await fileManager.saveFile(filePath, content);

                    // Load it back
                    const loadedContent = await fs.readFile(filePath, 'utf-8');

                    // Empty content should remain empty
                    expect(loadedContent).toBe(content);
                    expect(loadedContent).toBe('');
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: markdown-editor, Property 8: File save-load round trip
    // Validates: Requirements 3.2
    it('should preserve whitespace and newlines through save-load round trip', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.oneof(
                        fc.string(),
                        fc.constant('\n'),
                        fc.constant('\t'),
                        fc.constant('  '),
                        fc.constant('\r\n')
                    ),
                    { minLength: 1, maxLength: 20 }
                ),
                async (contentParts) => {
                    const content = contentParts.join('');
                    const fileName = `test-${Date.now()}-${Math.random().toString(36).substring(7)}.md`;
                    const filePath = path.join(testDir, fileName);

                    // Save content with various whitespace
                    await fileManager.saveFile(filePath, content);

                    // Load it back
                    const loadedContent = await fs.readFile(filePath, 'utf-8');

                    // Whitespace should be preserved
                    expect(loadedContent).toBe(content);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: markdown-editor, Property 8: File save-load round trip
    // Validates: Requirements 3.2
    it('should handle multiple save-load cycles without data loss', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string(),
                fc.integer({ min: 2, max: 5 }), // Number of cycles
                async (initialContent, cycles) => {
                    const fileName = `test-${Date.now()}-${Math.random().toString(36).substring(7)}.md`;
                    const filePath = path.join(testDir, fileName);

                    let currentContent = initialContent;

                    // Perform multiple save-load cycles
                    for (let i = 0; i < cycles; i++) {
                        await fileManager.saveFile(filePath, currentContent);
                        currentContent = await fs.readFile(filePath, 'utf-8');
                    }

                    // After multiple cycles, content should still match original
                    expect(currentContent).toBe(initialContent);
                }
            ),
            { numRuns: 50 }
        );
    });

    // Feature: markdown-editor, Property 8: File save-load round trip
    // Validates: Requirements 3.2
    it('should preserve content length through save-load round trip', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 0, maxLength: 10000 }),
                async (content) => {
                    const fileName = `test-${Date.now()}-${Math.random().toString(36).substring(7)}.md`;
                    const filePath = path.join(testDir, fileName);

                    const originalLength = content.length;

                    // Save the content
                    await fileManager.saveFile(filePath, content);

                    // Load it back
                    const loadedContent = await fs.readFile(filePath, 'utf-8');

                    // Length should be preserved
                    expect(loadedContent.length).toBe(originalLength);
                    expect(loadedContent).toBe(content);
                }
            ),
            { numRuns: 100 }
        );
    });
});
