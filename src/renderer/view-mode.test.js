/**
 * Tests for ViewModeManager component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ViewModeManager from './view-mode.js';

// Mock window.electronAPI
global.window = global.window || {};
global.window.electronAPI = {
    getConfig: vi.fn(),
    setConfig: vi.fn()
};

describe('ViewModeManager', () => {
    let viewModeManager;
    let editorPane;
    let previewPane;
    let divider;

    beforeEach(() => {
        // Create DOM elements
        editorPane = document.createElement('div');
        editorPane.id = 'editor-pane';
        document.body.appendChild(editorPane);

        previewPane = document.createElement('div');
        previewPane.id = 'preview-pane';
        document.body.appendChild(previewPane);

        divider = document.createElement('div');
        divider.id = 'divider';
        document.body.appendChild(divider);

        // Reset mocks
        vi.clearAllMocks();
        window.electronAPI.getConfig.mockResolvedValue('split');
        window.electronAPI.setConfig.mockResolvedValue(true);

        // Create ViewModeManager instance
        viewModeManager = new ViewModeManager();
    });

    afterEach(() => {
        // Clean up DOM
        if (editorPane && editorPane.parentNode) {
            editorPane.parentNode.removeChild(editorPane);
        }
        if (previewPane && previewPane.parentNode) {
            previewPane.parentNode.removeChild(previewPane);
        }
        if (divider && divider.parentNode) {
            divider.parentNode.removeChild(divider);
        }
    });

    describe('view mode change listeners', () => {
        beforeEach(async () => {
            await viewModeManager.initialize();
        });

        it('should register a view mode change listener', () => {
            const callback = vi.fn();
            const removeListener = viewModeManager.onViewModeChange(callback);

            expect(typeof removeListener).toBe('function');
            expect(viewModeManager.viewModeChangeListeners.length).toBe(1);
        });

        it('should throw error when registering non-function listener', () => {
            expect(() => viewModeManager.onViewModeChange(null)).toThrow('Callback must be a function');
            expect(() => viewModeManager.onViewModeChange('not a function')).toThrow('Callback must be a function');
        });

        it('should notify listeners when view mode changes', async () => {
            const callback = vi.fn();

            viewModeManager.onViewModeChange(callback);

            await viewModeManager.setViewMode('editor');

            expect(callback).toHaveBeenCalledWith('editor');
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should notify multiple listeners', async () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            const callback3 = vi.fn();

            viewModeManager.onViewModeChange(callback1);
            viewModeManager.onViewModeChange(callback2);
            viewModeManager.onViewModeChange(callback3);

            await viewModeManager.setViewMode('preview');

            expect(callback1).toHaveBeenCalledWith('preview');
            expect(callback2).toHaveBeenCalledWith('preview');
            expect(callback3).toHaveBeenCalledWith('preview');
        });

        it('should remove listener when cleanup function is called', async () => {
            const callback = vi.fn();
            const removeListener = viewModeManager.onViewModeChange(callback);

            expect(viewModeManager.viewModeChangeListeners.length).toBe(1);

            removeListener();

            expect(viewModeManager.viewModeChangeListeners.length).toBe(0);

            // Verify listener is not called after removal
            await viewModeManager.setViewMode('editor');
            expect(callback).not.toHaveBeenCalled();
        });

        it('should handle errors in listeners gracefully', async () => {
            const errorCallback = vi.fn(() => {
                throw new Error('Listener error');
            });
            const normalCallback = vi.fn();

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            viewModeManager.onViewModeChange(errorCallback);
            viewModeManager.onViewModeChange(normalCallback);

            await viewModeManager.setViewMode('editor');

            // Both callbacks should be called despite error in first one
            expect(errorCallback).toHaveBeenCalled();
            expect(normalCallback).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('should notify listeners with correct mode for each change', async () => {
            const callback = vi.fn();

            viewModeManager.onViewModeChange(callback);

            await viewModeManager.setViewMode('editor');
            expect(callback).toHaveBeenLastCalledWith('editor');

            await viewModeManager.setViewMode('preview');
            expect(callback).toHaveBeenLastCalledWith('preview');

            await viewModeManager.setViewMode('split');
            expect(callback).toHaveBeenLastCalledWith('split');

            expect(callback).toHaveBeenCalledTimes(3);
        });
    });

    describe('view mode application', () => {
        beforeEach(async () => {
            await viewModeManager.initialize();
        });

        it('should show editor and hide preview in editor mode', async () => {
            await viewModeManager.setViewMode('editor');

            expect(editorPane.style.display).toBe('');
            expect(previewPane.style.display).toBe('none');
            expect(editorPane.classList.contains('full-width')).toBe(true);
            expect(previewPane.classList.contains('hidden')).toBe(true);
        });

        it('should show preview and hide editor in preview mode', async () => {
            await viewModeManager.setViewMode('preview');

            expect(editorPane.style.display).toBe('none');
            expect(previewPane.style.display).toBe('');
            expect(editorPane.classList.contains('hidden')).toBe(true);
            expect(previewPane.classList.contains('full-width')).toBe(true);
        });

        it('should show both editor and preview in split mode', async () => {
            await viewModeManager.setViewMode('split');

            expect(editorPane.style.display).toBe('');
            expect(previewPane.style.display).toBe('');
            expect(editorPane.classList.contains('hidden')).toBe(false);
            expect(previewPane.classList.contains('hidden')).toBe(false);
        });
    });
});
