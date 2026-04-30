/**
 * Tests for FocusMode class
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FocusMode from './focus-mode.js';

describe('FocusMode', () => {
    let focusMode;
    let mockEditor;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div class="tab-bar"></div>
            <div id="app-container"></div>
            <div class="status-bar"></div>
            <div class="search-panel hidden"></div>
        `;

        // Create mock editor
        mockEditor = {
            view: {
                scrollDOM: document.createElement('div')
            }
        };

        // Create FocusMode instance
        focusMode = new FocusMode(mockEditor);
        focusMode.initialize();
    });

    afterEach(() => {
        if (focusMode) {
            focusMode.destroy();
        }
        document.body.innerHTML = '';
        vi.clearAllTimers();
    });

    describe('Constructor', () => {
        it('should throw error if editor is not provided', () => {
            expect(() => new FocusMode()).toThrow('Editor instance is required');
        });

        it('should initialize with inactive state', () => {
            const fm = new FocusMode(mockEditor);

            expect(fm.isActiveMode()).toBe(false);
        });
    });

    describe('Initialize', () => {
        it('should create overlay element', () => {
            const overlay = document.querySelector('.focus-mode-overlay');

            expect(overlay).toBeTruthy();
            expect(overlay.classList.contains('hidden')).toBe(true);
        });

        it('should inject CSS styles', () => {
            const styleElement = document.getElementById('focus-mode-styles');

            expect(styleElement).toBeTruthy();
            expect(styleElement.textContent).toContain('body.focus-mode');
        });

        it('should not inject styles twice', () => {
            focusMode.initialize(); // Call again
            const styleElements = document.querySelectorAll('#focus-mode-styles');

            expect(styleElements.length).toBe(1);
        });
    });

    describe('Enter Focus Mode', () => {
        it('should set active state to true', () => {
            focusMode.enter();
            expect(focusMode.isActiveMode()).toBe(true);
        });

        it('should add focus-mode class to body', () => {
            focusMode.enter();
            expect(document.body.classList.contains('focus-mode')).toBe(true);
        });

        it('should show overlay initially', () => {
            focusMode.enter();
            const overlay = document.querySelector('.focus-mode-overlay');

            expect(overlay.classList.contains('hidden')).toBe(false);
        });

        it('should not enter twice if already active', () => {
            focusMode.enter();
            const firstState = focusMode.isActiveMode();

            focusMode.enter();
            expect(focusMode.isActiveMode()).toBe(firstState);
        });
    });

    describe('Exit Focus Mode', () => {
        beforeEach(() => {
            focusMode.enter();
        });

        it('should set active state to false', () => {
            focusMode.exit();
            expect(focusMode.isActiveMode()).toBe(false);
        });

        it('should remove focus-mode class from body', () => {
            focusMode.exit();
            expect(document.body.classList.contains('focus-mode')).toBe(false);
        });

        it('should hide overlay', () => {
            focusMode.exit();
            const overlay = document.querySelector('.focus-mode-overlay');

            expect(overlay.classList.contains('hidden')).toBe(true);
        });

        it('should not exit twice if already inactive', () => {
            focusMode.exit();
            const firstState = focusMode.isActiveMode();

            focusMode.exit();
            expect(focusMode.isActiveMode()).toBe(firstState);
        });
    });

    describe('Toggle Focus Mode', () => {
        it('should enter focus mode when inactive', () => {
            expect(focusMode.isActiveMode()).toBe(false);
            focusMode.toggle();
            expect(focusMode.isActiveMode()).toBe(true);
        });

        it('should exit focus mode when active', () => {
            focusMode.enter();
            expect(focusMode.isActiveMode()).toBe(true);
            focusMode.toggle();
            expect(focusMode.isActiveMode()).toBe(false);
        });
    });

    describe('UI Element Hiding/Showing', () => {
        it('should hide UI elements when entering focus mode', () => {
            focusMode.enter();
            expect(document.body.classList.contains('focus-mode')).toBe(true);
        });

        it('should show UI elements when exiting focus mode', () => {
            focusMode.enter();
            focusMode.exit();
            expect(document.body.classList.contains('focus-mode')).toBe(false);
        });
    });

    describe('Exit Overlay', () => {
        beforeEach(() => {
            focusMode.enter();
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should show overlay on mouse movement', () => {
            const overlay = document.querySelector('.focus-mode-overlay');

            overlay.classList.add('hidden');

            const event = new MouseEvent('mousemove');

            document.dispatchEvent(event);

            expect(overlay.classList.contains('hidden')).toBe(false);
        });

        it('should hide overlay after 2 seconds of inactivity', () => {
            const overlay = document.querySelector('.focus-mode-overlay');

            const event = new MouseEvent('mousemove');

            document.dispatchEvent(event);

            expect(overlay.classList.contains('hidden')).toBe(false);

            vi.advanceTimersByTime(2000);

            expect(overlay.classList.contains('hidden')).toBe(true);
        });

        it('should reset timer on subsequent mouse movements', () => {
            const overlay = document.querySelector('.focus-mode-overlay');

            // First movement
            document.dispatchEvent(new MouseEvent('mousemove'));
            expect(overlay.classList.contains('hidden')).toBe(false);

            // Advance 1 second
            vi.advanceTimersByTime(1000);

            // Second movement (should reset timer)
            document.dispatchEvent(new MouseEvent('mousemove'));

            // Advance 1.5 seconds (total 2.5 from first, but only 1.5 from second)
            vi.advanceTimersByTime(1500);

            // Should still be visible
            expect(overlay.classList.contains('hidden')).toBe(false);

            // Advance remaining 0.5 seconds
            vi.advanceTimersByTime(500);

            // Now should be hidden
            expect(overlay.classList.contains('hidden')).toBe(true);
        });
    });

    describe('Escape Key Handling', () => {
        beforeEach(() => {
            focusMode.enter();
        });

        it('should exit focus mode on Escape key', () => {
            const event = new KeyboardEvent('keydown', { key: 'Escape' });

            document.dispatchEvent(event);

            expect(focusMode.isActiveMode()).toBe(false);
        });

        it('should not exit if search panel is open', () => {
            const searchPanel = document.querySelector('.search-panel');

            searchPanel.classList.remove('hidden');

            const event = new KeyboardEvent('keydown', { key: 'Escape' });

            document.dispatchEvent(event);

            expect(focusMode.isActiveMode()).toBe(true);
        });

        it('should not respond to other keys', () => {
            const event = new KeyboardEvent('keydown', { key: 'Enter' });

            document.dispatchEvent(event);

            expect(focusMode.isActiveMode()).toBe(true);
        });
    });

    describe('Editor Functionality Preservation', () => {
        it('should maintain editor reference when entering focus mode', () => {
            focusMode.enter();
            expect(focusMode.editor).toBe(mockEditor);
        });

        it('should maintain editor reference when exiting focus mode', () => {
            focusMode.enter();
            focusMode.exit();
            expect(focusMode.editor).toBe(mockEditor);
        });
    });

    describe('Destroy', () => {
        it('should exit focus mode if active', () => {
            focusMode.enter();
            expect(focusMode.isActiveMode()).toBe(true);

            focusMode.destroy();
            expect(focusMode.isActiveMode()).toBe(false);
        });

        it('should remove overlay element', () => {
            focusMode.destroy();
            const overlay = document.querySelector('.focus-mode-overlay');

            expect(overlay).toBeFalsy();
        });

        it('should remove injected styles', () => {
            focusMode.destroy();
            const styleElement = document.getElementById('focus-mode-styles');

            expect(styleElement).toBeFalsy();
        });

        it('should handle destroy when already destroyed', () => {
            focusMode.destroy();
            expect(() => focusMode.destroy()).not.toThrow();
        });
    });
});
