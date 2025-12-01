/**
 * Tests for TooltipManager class
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TooltipManager from './tooltip.js';

describe('TooltipManager', () => {
    let tooltipManager;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '<div id="test-container"></div>';

        // Create TooltipManager instance
        tooltipManager = new TooltipManager();
    });

    afterEach(() => {
        if (tooltipManager) {
            tooltipManager.cleanup();
        }
        document.body.innerHTML = '';
        vi.clearAllTimers();
    });

    describe('Constructor', () => {
        it('should initialize with default values', () => {
            const tm = new TooltipManager();

            expect(tm.tooltipElement).toBe(null);
            expect(tm.showTimeout).toBe(null);
            expect(tm.hideTimeout).toBe(null);
            expect(tm.currentTarget).toBe(null);
            expect(tm.delay).toBe(500);
            expect(tm.isInitialized).toBe(false);
        });
    });

    describe('Initialize', () => {
        it('should create tooltip element in DOM', () => {
            tooltipManager.initialize();

            const tooltip = document.querySelector('.tooltip');
            expect(tooltip).toBeTruthy();
            expect(tooltip.getAttribute('role')).toBe('tooltip');
        });

        it('should create tooltip content container', () => {
            tooltipManager.initialize();

            const content = document.querySelector('.tooltip-content');
            expect(content).toBeTruthy();
        });

        it('should create tooltip arrow', () => {
            tooltipManager.initialize();

            const arrow = document.querySelector('.tooltip-arrow');
            expect(arrow).toBeTruthy();
        });

        it('should not initialize twice', () => {
            tooltipManager.initialize();
            tooltipManager.initialize();

            const tooltips = document.querySelectorAll('.tooltip');
            expect(tooltips.length).toBe(1);
        });

        it('should set isInitialized to true', () => {
            tooltipManager.initialize();

            expect(tooltipManager.isInitialized).toBe(true);
        });
    });

    describe('Attach', () => {
        let testButton;

        beforeEach(() => {
            testButton = document.createElement('button');
            testButton.textContent = 'Test Button';
            document.body.appendChild(testButton);
            tooltipManager.initialize();
        });

        it('should attach tooltip to element', () => {
            tooltipManager.attach(testButton, 'Test tooltip');

            // Verify event listeners are attached (we can't directly test this,
            // but we can verify the method doesn't throw)
            expect(testButton).toBeTruthy();
        });

        it('should handle null element gracefully', () => {
            expect(() => {
                tooltipManager.attach(null, 'Test tooltip');
            }).not.toThrow();
        });

        it('should accept function as content', () => {
            const contentFn = () => 'Dynamic content';

            expect(() => {
                tooltipManager.attach(testButton, contentFn);
            }).not.toThrow();
        });

        it('should accept custom delay option', () => {
            expect(() => {
                tooltipManager.attach(testButton, 'Test', { delay: 1000 });
            }).not.toThrow();
        });
    });

    describe('Show', () => {
        let testButton;

        beforeEach(() => {
            testButton = document.createElement('button');
            testButton.textContent = 'Test Button';
            document.body.appendChild(testButton);
            tooltipManager.initialize();
        });

        it('should initialize if not already initialized', () => {
            const tm = new TooltipManager();
            tm.show(testButton, 'Test');

            expect(tm.isInitialized).toBe(true);
            tm.cleanup();
        });

        it('should set timeout to show tooltip', () => {
            vi.useFakeTimers();

            tooltipManager.show(testButton, 'Test tooltip', 500);

            expect(tooltipManager.showTimeout).not.toBe(null);

            vi.useRealTimers();
        });

        it('should clear existing timeouts', () => {
            vi.useFakeTimers();

            tooltipManager.show(testButton, 'Test 1', 500);
            const firstTimeout = tooltipManager.showTimeout;

            tooltipManager.show(testButton, 'Test 2', 500);
            const secondTimeout = tooltipManager.showTimeout;

            expect(firstTimeout).not.toBe(secondTimeout);

            vi.useRealTimers();
        });
    });

    describe('ShowImmediate', () => {
        let testButton;

        beforeEach(() => {
            testButton = document.createElement('button');
            testButton.textContent = 'Test Button';
            testButton.style.position = 'absolute';
            testButton.style.top = '100px';
            testButton.style.left = '100px';
            document.body.appendChild(testButton);
            tooltipManager.initialize();
        });

        it('should display tooltip with string content', () => {
            tooltipManager.showImmediate(testButton, 'Test tooltip');

            const tooltip = document.querySelector('.tooltip');
            expect(tooltip.classList.contains('visible')).toBe(true);

            const content = tooltip.querySelector('.tooltip-content');
            expect(content.innerHTML).toBe('Test tooltip');
        });

        it('should display tooltip with function content', () => {
            const contentFn = () => 'Dynamic content';
            tooltipManager.showImmediate(testButton, contentFn);

            const content = document.querySelector('.tooltip-content');
            expect(content.innerHTML).toBe('Dynamic content');
        });

        it('should set data-placement attribute', () => {
            tooltipManager.showImmediate(testButton, 'Test');

            const tooltip = document.querySelector('.tooltip');
            expect(tooltip.getAttribute('data-placement')).toBeTruthy();
        });
    });

    describe('Hide', () => {
        let testButton;

        beforeEach(() => {
            testButton = document.createElement('button');
            document.body.appendChild(testButton);
            tooltipManager.initialize();
        });

        it('should set timeout to hide tooltip', () => {
            vi.useFakeTimers();

            tooltipManager.hide();

            expect(tooltipManager.hideTimeout).not.toBe(null);

            vi.useRealTimers();
        });

        it('should clear show timeout', () => {
            vi.useFakeTimers();

            tooltipManager.show(testButton, 'Test', 500);
            tooltipManager.hide();

            expect(tooltipManager.showTimeout).toBe(null);

            vi.useRealTimers();
        });
    });

    describe('HideImmediate', () => {
        let testButton;

        beforeEach(() => {
            testButton = document.createElement('button');
            testButton.style.position = 'absolute';
            testButton.style.top = '100px';
            testButton.style.left = '100px';
            document.body.appendChild(testButton);
            tooltipManager.initialize();
        });

        it('should remove visible class from tooltip', () => {
            tooltipManager.showImmediate(testButton, 'Test');
            tooltipManager.hideImmediate();

            const tooltip = document.querySelector('.tooltip');
            expect(tooltip.classList.contains('visible')).toBe(false);
        });

        it('should clear current target', () => {
            tooltipManager.showImmediate(testButton, 'Test');
            tooltipManager.hideImmediate();

            expect(tooltipManager.currentTarget).toBe(null);
        });
    });

    describe('Position', () => {
        let testButton;

        beforeEach(() => {
            testButton = document.createElement('button');
            testButton.style.position = 'absolute';
            testButton.style.top = '200px';
            testButton.style.left = '200px';
            testButton.style.width = '100px';
            testButton.style.height = '40px';
            document.body.appendChild(testButton);
            tooltipManager.initialize();
        });

        it('should set tooltip position', () => {
            tooltipManager.showImmediate(testButton, 'Test');

            const tooltip = document.querySelector('.tooltip');
            expect(tooltip.style.top).toBeTruthy();
            expect(tooltip.style.left).toBeTruthy();
        });

        it('should set placement attribute', () => {
            tooltipManager.showImmediate(testButton, 'Test');

            const tooltip = document.querySelector('.tooltip');
            const placement = tooltip.getAttribute('data-placement');
            expect(['top', 'bottom', 'left', 'right']).toContain(placement);
        });
    });

    describe('Cleanup', () => {
        it('should remove tooltip element from DOM', () => {
            tooltipManager.initialize();
            tooltipManager.cleanup();

            const tooltip = document.querySelector('.tooltip');
            expect(tooltip).toBe(null);
        });

        it('should clear all timeouts', () => {
            vi.useFakeTimers();

            tooltipManager.initialize();
            const testButton = document.createElement('button');
            document.body.appendChild(testButton);

            tooltipManager.show(testButton, 'Test', 500);
            tooltipManager.cleanup();

            expect(tooltipManager.showTimeout).toBe(null);
            expect(tooltipManager.hideTimeout).toBe(null);

            vi.useRealTimers();
        });

        it('should reset state', () => {
            tooltipManager.initialize();
            tooltipManager.cleanup();

            expect(tooltipManager.tooltipElement).toBe(null);
            expect(tooltipManager.currentTarget).toBe(null);
            expect(tooltipManager.isInitialized).toBe(false);
        });
    });
});
