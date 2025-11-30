/**
 * Unit tests for StatisticsCalculator class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import StatisticsCalculator from './statistics.js';
import Editor from './editor.js';

// Mock window.electronAPI
global.window = {
    electronAPI: {
        getConfig: vi.fn().mockResolvedValue({ value: { visible: true } }),
        setConfig: vi.fn().mockResolvedValue(undefined)
    }
};

describe('StatisticsCalculator', () => {
    let calculator;
    let editor;
    let container;

    beforeEach(() => {
        // Create a container element for the editor
        container = document.createElement('div');
        document.body.appendChild(container);

        // Create status bar for statistics panel
        const statusBar = document.createElement('div');
        statusBar.id = 'status-bar';
        document.body.appendChild(statusBar);

        // Initialize editor
        editor = new Editor();
        editor.initialize(container);

        // Create calculator
        calculator = new StatisticsCalculator(editor);
    });

    afterEach(() => {
        if (calculator) {
            calculator.destroy();
        }
        if (editor) {
            editor.destroy();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        const statusBar = document.getElementById('status-bar');
        if (statusBar && statusBar.parentNode) {
            statusBar.parentNode.removeChild(statusBar);
        }
    });

    describe('initialization', () => {
        it('should throw error when created without editor', () => {
            expect(() => new StatisticsCalculator(null)).toThrow('Editor instance is required');
        });

        it('should initialize with default values', async () => {
            await calculator.initialize();
            expect(calculator.visible).toBe(true);
            expect(calculator.debounceDelay).toBe(100);
        });

        it('should create statistics panel in DOM', async () => {
            await calculator.initialize();
            const panel = document.getElementById('statistics-panel');
            expect(panel).not.toBeNull();
        });
    });

    describe('calculateWordCount', () => {
        it('should return 0 for empty string', () => {
            expect(calculator.calculateWordCount('')).toBe(0);
        });

        it('should return 0 for null', () => {
            expect(calculator.calculateWordCount(null)).toBe(0);
        });

        it('should count words in plain text', () => {
            expect(calculator.calculateWordCount('Hello world')).toBe(2);
            expect(calculator.calculateWordCount('One two three four')).toBe(4);
        });

        it('should exclude markdown headers from word count', () => {
            const content = '# Header\nSome text';
            const wordCount = calculator.calculateWordCount(content);
            // After stripping markdown, we get "Header\nSome text" = 3 words
            expect(wordCount).toBe(3); // "Header Some text"
        });

        it('should exclude markdown bold from word count', () => {
            const content = '**bold** text';
            const wordCount = calculator.calculateWordCount(content);
            expect(wordCount).toBe(2); // "bold text" without **
        });

        it('should exclude markdown italic from word count', () => {
            const content = '*italic* text';
            const wordCount = calculator.calculateWordCount(content);
            expect(wordCount).toBe(2); // "italic text" without *
        });

        it('should exclude markdown links from word count', () => {
            const content = '[link text](https://example.com)';
            const wordCount = calculator.calculateWordCount(content);
            expect(wordCount).toBe(2); // Only "link text"
        });

        it('should exclude markdown code blocks from word count', () => {
            const content = '```\ncode here\n```\nregular text';
            const wordCount = calculator.calculateWordCount(content);
            expect(wordCount).toBe(2); // Only "regular text"
        });

        it('should exclude inline code from word count', () => {
            const content = 'Some `code` here';
            const wordCount = calculator.calculateWordCount(content);
            expect(wordCount).toBe(2); // "Some here"
        });

        it('should handle complex markdown', () => {
            const content = `# Title
            
**Bold text** and *italic text*

- List item one
- List item two

[Link](url) and ![Image](url)

\`\`\`
code block
\`\`\`

Regular paragraph text.`;
            const wordCount = calculator.calculateWordCount(content);
            // Should count: Bold text and italic text, List item one, List item two, Link, Image, Regular paragraph text
            expect(wordCount).toBeGreaterThan(0);
        });
    });

    describe('calculateCharacterCount', () => {
        it('should return 0 for empty string', () => {
            expect(calculator.calculateCharacterCount('')).toBe(0);
        });

        it('should return 0 for null', () => {
            expect(calculator.calculateCharacterCount(null)).toBe(0);
        });

        it('should count all characters including markdown', () => {
            expect(calculator.calculateCharacterCount('Hello')).toBe(5);
            expect(calculator.calculateCharacterCount('**bold**')).toBe(8);
            expect(calculator.calculateCharacterCount('# Header')).toBe(8);
        });

        it('should count spaces and newlines', () => {
            expect(calculator.calculateCharacterCount('Hello World')).toBe(11);
            expect(calculator.calculateCharacterCount('Line 1\nLine 2')).toBe(13);
        });
    });

    describe('calculateReadingTime', () => {
        it('should return 0 for empty string', () => {
            expect(calculator.calculateReadingTime('')).toBe(0);
        });

        it('should return 0 for null', () => {
            expect(calculator.calculateReadingTime(null)).toBe(0);
        });

        it('should calculate reading time at 200 WPM', () => {
            // 200 words should take 1 minute
            const words = Array(200).fill('word').join(' ');
            expect(calculator.calculateReadingTime(words)).toBe(1);
        });

        it('should round to nearest minute', () => {
            // 250 words should round to 1 minute (250/200 = 1.25)
            const words = Array(250).fill('word').join(' ');
            expect(calculator.calculateReadingTime(words)).toBe(1);

            // 350 words should round to 2 minutes (350/200 = 1.75)
            const words2 = Array(350).fill('word').join(' ');
            expect(calculator.calculateReadingTime(words2)).toBe(2);
        });

        it('should return minimum 1 minute if there are words', () => {
            expect(calculator.calculateReadingTime('Just a few words')).toBe(1);
        });

        it('should use custom words per minute', () => {
            const words = Array(300).fill('word').join(' ');
            // At 300 WPM, 300 words should take 1 minute
            expect(calculator.calculateReadingTime(words, 300)).toBe(1);
        });
    });

    describe('getStatistics', () => {
        it('should return all statistics', () => {
            const content = 'Hello world this is a test';
            const stats = calculator.getStatistics(content);

            expect(stats).toHaveProperty('wordCount');
            expect(stats).toHaveProperty('characterCount');
            expect(stats).toHaveProperty('readingTime');

            expect(stats.wordCount).toBe(6);
            expect(stats.characterCount).toBe(26);
            expect(stats.readingTime).toBe(1);
        });

        it('should return zeros for empty content', () => {
            const stats = calculator.getStatistics('');

            expect(stats.wordCount).toBe(0);
            expect(stats.characterCount).toBe(0);
            expect(stats.readingTime).toBe(0);
        });
    });

    describe('updateDisplay', () => {
        beforeEach(async () => {
            await calculator.initialize();
        });

        it('should update display elements', () => {
            const stats = {
                wordCount: 100,
                characterCount: 500,
                readingTime: 5
            };

            calculator.updateDisplay(stats);

            expect(calculator.wordCountElement.textContent).toBe('100');
            expect(calculator.characterCountElement.textContent).toBe('500');
            expect(calculator.readingTimeElement.textContent).toBe('5 min');
        });

        it('should handle zero values', () => {
            const stats = {
                wordCount: 0,
                characterCount: 0,
                readingTime: 0
            };

            calculator.updateDisplay(stats);

            expect(calculator.wordCountElement.textContent).toBe('0');
            expect(calculator.characterCountElement.textContent).toBe('0');
            expect(calculator.readingTimeElement.textContent).toBe('0 min');
        });
    });

    describe('toggleVisibility', () => {
        beforeEach(async () => {
            await calculator.initialize();
        });

        it('should toggle visibility', async () => {
            expect(calculator.isVisible()).toBe(true);

            await calculator.toggleVisibility();
            expect(calculator.isVisible()).toBe(false);
            expect(calculator.panel.classList.contains('hidden')).toBe(true);

            await calculator.toggleVisibility();
            expect(calculator.isVisible()).toBe(true);
            expect(calculator.panel.classList.contains('hidden')).toBe(false);
        });
    });

    describe('_stripMarkdownSyntax', () => {
        it('should remove headers', () => {
            const result = calculator._stripMarkdownSyntax('# Header');
            expect(result).toBe('Header');
        });

        it('should remove bold', () => {
            const result = calculator._stripMarkdownSyntax('**bold**');
            expect(result).toBe('bold');
        });

        it('should remove italic', () => {
            const result = calculator._stripMarkdownSyntax('*italic*');
            expect(result).toBe('italic');
        });

        it('should remove links', () => {
            const result = calculator._stripMarkdownSyntax('[text](url)');
            expect(result).toBe('text');
        });

        it('should remove images', () => {
            const result = calculator._stripMarkdownSyntax('![alt](url)');
            expect(result).toBe('alt');
        });

        it('should remove code blocks', () => {
            const result = calculator._stripMarkdownSyntax('```code```');
            expect(result).toBe('');
        });

        it('should remove inline code', () => {
            const result = calculator._stripMarkdownSyntax('`code`');
            expect(result).toBe('');
        });

        it('should remove list markers', () => {
            const result = calculator._stripMarkdownSyntax('- item');
            expect(result).toBe('item');
        });

        it('should remove blockquotes', () => {
            const result = calculator._stripMarkdownSyntax('> quote');
            expect(result).toBe('quote');
        });
    });

    describe('_countWords', () => {
        it('should count words separated by spaces', () => {
            expect(calculator._countWords('one two three')).toBe(3);
        });

        it('should handle multiple spaces', () => {
            expect(calculator._countWords('one  two   three')).toBe(3);
        });

        it('should handle leading/trailing spaces', () => {
            expect(calculator._countWords('  one two  ')).toBe(2);
        });

        it('should return 0 for empty string', () => {
            expect(calculator._countWords('')).toBe(0);
        });

        it('should return 0 for whitespace only', () => {
            expect(calculator._countWords('   ')).toBe(0);
        });
    });

    describe('destroy', () => {
        beforeEach(async () => {
            await calculator.initialize();
        });

        it('should remove panel from DOM', () => {
            const panel = document.getElementById('statistics-panel');
            expect(panel).not.toBeNull();

            calculator.destroy();

            const panelAfter = document.getElementById('statistics-panel');
            expect(panelAfter).toBeNull();
        });

        it('should clear references', () => {
            calculator.destroy();

            expect(calculator.panel).toBeNull();
            expect(calculator.wordCountElement).toBeNull();
            expect(calculator.characterCountElement).toBeNull();
            expect(calculator.readingTimeElement).toBeNull();
        });

        it('should cancel pending updates', () => {
            calculator.updateTimeoutId = setTimeout(() => { }, 1000);
            calculator.destroy();

            expect(calculator.updateTimeoutId).toBeNull();
        });
    });
});
