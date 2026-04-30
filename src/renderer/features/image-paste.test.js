/**
 * Tests for ImagePaste module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ImagePaste from './image-paste.js';

describe('ImagePaste', () => {
    let imagePaste;
    let mockEditor;

    beforeEach(() => {
        // Mock editor
        mockEditor = {
            view: {
                dom: {
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }
            },
            insertText: vi.fn()
        };

        // Mock window.electronAPI
        global.window = {
            electronAPI: {
                getConfig: vi.fn().mockResolvedValue({ value: { enabled: true } }),
                setConfig: vi.fn().mockResolvedValue(undefined),
                saveImageFromClipboard: vi.fn().mockResolvedValue({
                    success: true,
                    imagePath: '/path/to/assets/image-123.png',
                    relativePath: './assets/image-123.png'
                }),
                getActiveTab: vi.fn().mockResolvedValue({
                    tab: { filePath: '/path/to/document.md' }
                })
            }
        };

        imagePaste = new ImagePaste(mockEditor);
    });

    describe('initialize', () => {
        it('should load configuration and set up paste listener', async () => {
            await imagePaste.initialize();

            expect(window.electronAPI.getConfig).toHaveBeenCalledWith('imagePaste');
            expect(mockEditor.view.dom.addEventListener).toHaveBeenCalledWith('paste', expect.any(Function));
            expect(imagePaste.enabled).toBe(true);
        });

        it('should handle missing configuration gracefully', async () => {
            window.electronAPI.getConfig.mockResolvedValue({ value: null });

            await imagePaste.initialize();

            expect(imagePaste.enabled).toBe(true); // default value
        });
    });

    describe('setEnabled', () => {
        it('should update enabled status and save to config', async () => {
            await imagePaste.setEnabled(false);

            expect(imagePaste.enabled).toBe(false);
            expect(window.electronAPI.setConfig).toHaveBeenCalledWith('imagePaste.enabled', false);
        });

        it('should enable when set to true', async () => {
            imagePaste.enabled = false;
            await imagePaste.setEnabled(true);

            expect(imagePaste.enabled).toBe(true);
            expect(window.electronAPI.setConfig).toHaveBeenCalledWith('imagePaste.enabled', true);
        });
    });

    describe('isEnabled', () => {
        it('should return current enabled status', () => {
            imagePaste.enabled = true;
            expect(imagePaste.isEnabled()).toBe(true);

            imagePaste.enabled = false;
            expect(imagePaste.isEnabled()).toBe(false);
        });
    });

    describe('cleanup', () => {
        it('should remove event listener', async () => {
            await imagePaste.initialize();
            imagePaste.cleanup();

            expect(mockEditor.view.dom.removeEventListener).toHaveBeenCalledWith('paste', expect.any(Function));
            expect(imagePaste.pasteHandler).toBeNull();
        });

        it('should handle cleanup when not initialized', () => {
            expect(() => imagePaste.cleanup()).not.toThrow();
        });
    });

    describe('paste handler', () => {
        it('should not process paste when disabled', async () => {
            await imagePaste.initialize();
            imagePaste.enabled = false;

            const pasteHandler = mockEditor.view.dom.addEventListener.mock.calls[0][1];
            const mockEvent = {
                clipboardData: {
                    items: [{ type: 'image/png', getAsFile: () => null }]
                },
                preventDefault: vi.fn()
            };

            await pasteHandler(mockEvent);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(window.electronAPI.saveImageFromClipboard).not.toHaveBeenCalled();
        });

        it('should not process paste when no clipboard data', async () => {
            await imagePaste.initialize();

            const pasteHandler = mockEditor.view.dom.addEventListener.mock.calls[0][1];
            const mockEvent = {
                clipboardData: null,
                preventDefault: vi.fn()
            };

            await pasteHandler(mockEvent);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        });

        it('should not process paste when no image in clipboard', async () => {
            await imagePaste.initialize();

            const pasteHandler = mockEditor.view.dom.addEventListener.mock.calls[0][1];
            const mockEvent = {
                clipboardData: {
                    items: [{ type: 'text/plain' }]
                },
                preventDefault: vi.fn()
            };

            await pasteHandler(mockEvent);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        });
    });
});
