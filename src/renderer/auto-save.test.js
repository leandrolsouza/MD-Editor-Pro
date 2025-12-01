/**
 * Auto-Save Tests with Advanced Markdown
 * Tests auto-save preservation of Mermaid, KaTeX, and Callout syntax
 * Requirements: 4.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AutoSaveManager from './auto-save.js';
import Editor from './editor.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Auto-Save with Advanced Markdown', () => {
    let autoSaveManager;
    let editor;
    let editorContainer;
    let tempDir;
    let testFilePath;
    let mockElectronAPI;

    beforeEach(async () => {
        // Create temporary directory for test files
        tempDir = path.join(os.tmpdir(), `md-editor-test-${Date.now()}`);
        await fs.promises.mkdir(tempDir, { recursive: true });
        testFilePath = path.join(tempDir, 'test-document.md');

        // Setup DOM
        document.body.innerHTML = `
            <div id="editor-container"></div>
            <div id="auto-save-status"></div>
        `;

        editorContainer = document.getElementById('editor-container');

        // Initialize editor
        editor = new Editor();
        editor.initialize(editorContainer);

        // Mock electronAPI
        mockElectronAPI = {
            getConfig: vi.fn().mockResolvedValue({
                success: true,
                value: { enabled: true, delay: 1 }
            }),
            setConfig: vi.fn().mockResolvedValue({ success: true }),
            saveFile: vi.fn(async (filePath, content) => {
                // Actually write to file system for testing
                await fs.promises.writeFile(filePath, content, 'utf-8');
                return { success: true };
            })
        };

        global.window = global.window || {};
        global.window.electronAPI = mockElectronAPI;

        // Initialize auto-save manager
        autoSaveManager = new AutoSaveManager(editor);
        await autoSaveManager.initialize();
        autoSaveManager.setCurrentFilePath(testFilePath);
    });

    afterEach(async () => {
        if (autoSaveManager) {
            autoSaveManager.destroy();
        }
        if (editor) {
            editor.destroy();
        }

        // Clean up temp directory
        try {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
            console.warn('Failed to clean up temp directory:', error);
        }

        document.body.innerHTML = '';
    });

    describe('Mermaid Diagram Preservation', () => {
        it('should preserve Mermaid flowchart syntax after auto-save', async () => {
            const mermaidContent = `# Flowchart Example

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D
\`\`\`

This is a flowchart diagram.`;

            // Set content in editor
            editor.setValue(mermaidContent);

            // Trigger auto-save
            await autoSaveManager.saveNow();

            // Verify file was saved
            expect(mockElectronAPI.saveFile).toHaveBeenCalledWith(testFilePath, mermaidContent);

            // Read file back from disk
            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            // Verify content is preserved exactly
            expect(savedContent).toBe(mermaidContent);
            expect(savedContent).toContain('```mermaid');
            expect(savedContent).toContain('graph TD');
            expect(savedContent).toContain('A[Start] --> B{Decision}');
        });

        it('should preserve Mermaid sequence diagram syntax', async () => {
            const sequenceDiagram = `# Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Server
    participant Database
    
    User->>Server: Request data
    Server->>Database: Query
    Database-->>Server: Results
    Server-->>User: Response
\`\`\``;

            editor.setValue(sequenceDiagram);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(sequenceDiagram);
            expect(savedContent).toContain('sequenceDiagram');
            expect(savedContent).toContain('participant');
            expect(savedContent).toContain('User->>Server');
        });

        it('should preserve multiple Mermaid diagrams', async () => {
            const multipleDiagrams = `# Multiple Diagrams

## Flowchart
\`\`\`mermaid
graph LR
    A --> B
    B --> C
\`\`\`

## Pie Chart
\`\`\`mermaid
pie title Pets
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
\`\`\``;

            editor.setValue(multipleDiagrams);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(multipleDiagrams);
            expect(savedContent).toContain('graph LR');
            expect(savedContent).toContain('pie title Pets');
        });
    });

    describe('KaTeX Math Formula Preservation', () => {
        it('should preserve inline math syntax', async () => {
            const inlineMath = `# Math Formulas

The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ and it's useful.

Einstein's equation: $E = mc^2$`;

            editor.setValue(inlineMath);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(inlineMath);
            expect(savedContent).toContain('$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$');
            expect(savedContent).toContain('$E = mc^2$');
        });

        it('should preserve display math syntax', async () => {
            const displayMath = `# Display Math

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}
$$`;

            editor.setValue(displayMath);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(displayMath);
            expect(savedContent).toContain('$$\n\\int_{-\\infty}^{\\infty}');
            expect(savedContent).toContain('$$\n\\sum_{n=1}^{\\infty}');
        });

        it('should preserve mixed inline and display math', async () => {
            const mixedMath = `# Mixed Math

Inline: $a^2 + b^2 = c^2$

Display:
$$
f(x) = \\begin{cases}
x^2 & \\text{if } x \\geq 0 \\\\
-x^2 & \\text{if } x < 0
\\end{cases}
$$

More inline: $\\alpha + \\beta = \\gamma$`;

            editor.setValue(mixedMath);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(mixedMath);
            expect(savedContent).toContain('$a^2 + b^2 = c^2$');
            expect(savedContent).toContain('$$\nf(x) = \\begin{cases}');
            expect(savedContent).toContain('$\\alpha + \\beta = \\gamma$');
        });
    });

    describe('Callout Block Preservation', () => {
        it('should preserve NOTE callout syntax', async () => {
            const noteCallout = `# Documentation

> [!NOTE]
> This is an important note that users should read carefully.
> It can span multiple lines.`;

            editor.setValue(noteCallout);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(noteCallout);
            expect(savedContent).toContain('> [!NOTE]');
            expect(savedContent).toContain('> This is an important note');
        });

        it('should preserve all callout types', async () => {
            const allCallouts = `# All Callout Types

> [!NOTE]
> Information note

> [!WARNING]
> Warning message

> [!TIP]
> Helpful tip

> [!IMPORTANT]
> Important information

> [!CAUTION]
> Caution message`;

            editor.setValue(allCallouts);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(allCallouts);
            expect(savedContent).toContain('> [!NOTE]');
            expect(savedContent).toContain('> [!WARNING]');
            expect(savedContent).toContain('> [!TIP]');
            expect(savedContent).toContain('> [!IMPORTANT]');
            expect(savedContent).toContain('> [!CAUTION]');
        });

        it('should preserve callouts with complex content', async () => {
            const complexCallout = `# Complex Callout

> [!WARNING]
> This callout contains:
> - A list item
> - **Bold text**
> - *Italic text*
> - \`inline code\`
> 
> And multiple paragraphs.`;

            editor.setValue(complexCallout);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(complexCallout);
            expect(savedContent).toContain('> [!WARNING]');
            expect(savedContent).toContain('> - A list item');
            expect(savedContent).toContain('> - **Bold text**');
        });
    });

    describe('Mixed Advanced Markdown Preservation', () => {
        it('should preserve document with all advanced features', async () => {
            const mixedContent = `# Complete Document

## Mermaid Diagram
\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

## Math Formulas

Inline math: $E = mc^2$

Display math:
$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

## Callouts

> [!NOTE]
> This is a note with $\\alpha$ math inside.

> [!WARNING]
> Be careful with this operation!

## More Content

Regular markdown with **bold** and *italic* text.`;

            editor.setValue(mixedContent);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            // Verify exact preservation
            expect(savedContent).toBe(mixedContent);

            // Verify all advanced features are present
            expect(savedContent).toContain('```mermaid');
            expect(savedContent).toContain('graph TD');
            expect(savedContent).toContain('$E = mc^2$');
            expect(savedContent).toContain('$$\n\\int_0^1');
            expect(savedContent).toContain('> [!NOTE]');
            expect(savedContent).toContain('> [!WARNING]');
            expect(savedContent).toContain('$\\alpha$');
        });

        it('should preserve document with nested structures', async () => {
            const nestedContent = `# Nested Structures

> [!TIP]
> You can use math in callouts: $x^2 + y^2 = r^2$
> 
> \`\`\`mermaid
> graph LR
>     A --> B
> \`\`\`

And regular content with $\\pi$ continues.`;

            editor.setValue(nestedContent);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(nestedContent);
        });
    });

    describe('Auto-Save Cycle Preservation', () => {
        it('should preserve content through multiple save cycles', async () => {
            const content1 = `# Version 1\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\``;

            editor.setValue(content1);
            await autoSaveManager.saveNow();

            let savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(content1);

            // Modify content
            const content2 = content1 + '\n\n$E = mc^2$';

            editor.setValue(content2);
            await autoSaveManager.saveNow();

            savedContent = await fs.promises.readFile(testFilePath, 'utf-8');
            expect(savedContent).toBe(content2);

            // Add callout
            const content3 = content2 + '\n\n> [!NOTE]\n> Important note';

            editor.setValue(content3);
            await autoSaveManager.saveNow();

            savedContent = await fs.promises.readFile(testFilePath, 'utf-8');
            expect(savedContent).toBe(content3);
        });

        it('should handle rapid content changes', async () => {
            const finalContent = `# Rapid Changes

\`\`\`mermaid
graph LR
    X --> Y
\`\`\`

$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$

> [!IMPORTANT]
> Final version`;

            // Simulate rapid typing
            editor.setValue('# Rapid Changes');
            editor.setValue('# Rapid Changes\n\n```mermaid');
            editor.setValue(finalContent);

            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(finalContent);
        });
    });

    describe('Special Characters and Edge Cases', () => {
        it('should preserve special characters in math formulas', async () => {
            const specialChars = `# Special Characters

Math with special chars: $\\{x \\in \\mathbb{R} : x > 0\\}$

Display: $$\\left[\\frac{a}{b}\\right]$$`;

            editor.setValue(specialChars);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(specialChars);
            expect(savedContent).toContain('\\{x \\in \\mathbb{R}');
            expect(savedContent).toContain('\\left[\\frac{a}{b}\\right]');
        });

        it('should preserve empty lines and whitespace', async () => {
            const whitespaceContent = `# Whitespace Test

\`\`\`mermaid
graph TD
    A --> B
    
    C --> D
\`\`\`


> [!NOTE]
> Note with spacing`;

            editor.setValue(whitespaceContent);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(whitespaceContent);
        });

        it('should preserve Unicode characters', async () => {
            const unicodeContent = `# Unicode Test

Math: $α + β = γ$

Mermaid:
\`\`\`mermaid
graph TD
    A[Café] --> B[Naïve]
\`\`\`

> [!NOTE]
> 你好世界 🌍`;

            editor.setValue(unicodeContent);
            await autoSaveManager.saveNow();

            const savedContent = await fs.promises.readFile(testFilePath, 'utf-8');

            expect(savedContent).toBe(unicodeContent);
            expect(savedContent).toContain('α + β = γ');
            expect(savedContent).toContain('Café');
            expect(savedContent).toContain('你好世界 🌍');
        });
    });
});
