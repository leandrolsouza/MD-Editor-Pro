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

    // Tests for saveImageFromClipboard
    describe('saveImageFromClipboard', () => {
        it('should save image buffer to assets folder', async () => {
            const imageBuffer = Buffer.from('fake-image-data');
            const currentFilePath = path.join(testDir, 'document.md');

            const result = await fileManager.saveImageFromClipboard(imageBuffer, currentFilePath);

            expect(result.success).toBe(true);
            expect(result.imagePath).toBeDefined();
            expect(result.relativePath).toBeDefined();
            expect(result.relativePath).toMatch(/assets[\/\\]image-\d+\.png$/);

            // Verify file was created
            const fileExists = await fs.access(result.imagePath).then(() => true).catch(() => false);
            expect(fileExists).toBe(true);
        });

        it('should create assets folder if it does not exist', async () => {
            const imageBuffer = Buffer.from('fake-image-data');
            const currentFilePath = path.join(testDir, 'document.md');

            const result = await fileManager.saveImageFromClipboard(imageBuffer, currentFilePath);

            expect(result.success).toBe(true);

            // Verify assets folder was created
            const assetsPath = path.join(testDir, 'assets');
            const folderExists = await fs.access(assetsPath).then(() => true).catch(() => false);
            expect(folderExists).toBe(true);
        });

        it('should generate unique filenames with timestamp', async () => {
            const imageBuffer = Buffer.from('fake-image-data');
            const currentFilePath = path.join(testDir, 'document.md');

            const result1 = await fileManager.saveImageFromClipboard(imageBuffer, currentFilePath);

            // Wait 1ms to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 1));

            const result2 = await fileManager.saveImageFromClipboard(imageBuffer, currentFilePath);

            expect(result1.imagePath).not.toBe(result2.imagePath);
            expect(result1.relativePath).not.toBe(result2.relativePath);
        });

        it('should throw error for invalid buffer', async () => {
            const currentFilePath = path.join(testDir, 'document.md');

            await expect(
                fileManager.saveImageFromClipboard('not-a-buffer', currentFilePath)
            ).rejects.toThrow('Invalid image data: must be a Buffer, Uint8Array, or Array');
        });

        it('should accept Uint8Array as input', async () => {
            const uint8Array = new Uint8Array([1, 2, 3, 4]);
            const currentFilePath = path.join(testDir, 'document.md');

            const result = await fileManager.saveImageFromClipboard(uint8Array, currentFilePath);

            expect(result.success).toBe(true);
            expect(result.imagePath).toBeDefined();
        });

        it('should accept Array as input', async () => {
            const array = [1, 2, 3, 4];
            const currentFilePath = path.join(testDir, 'document.md');

            const result = await fileManager.saveImageFromClipboard(array, currentFilePath);

            expect(result.success).toBe(true);
            expect(result.imagePath).toBeDefined();
        });

        it('should use current working directory when no file path provided', async () => {
            const imageBuffer = Buffer.from('fake-image-data');

            const result = await fileManager.saveImageFromClipboard(imageBuffer, null);

            expect(result.success).toBe(true);
            expect(result.relativePath).toMatch(/assets[\/\\]image-\d+\.png$/);
        });
    });
});
