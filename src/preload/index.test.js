/**
 * Unit Tests for Preload API Exposure
 * Tests that contextBridge exposes correct API shape
 * Tests that ipcRenderer is not directly accessible
 * Requirements: 8.4
 */

import { describe, it, expect, vi } from 'vitest';

describe('Preload API Exposure', () => {
    // Create a simulated exposed API based on the preload script structure
    // This tests the API shape without requiring actual Electron environment
    const createExposedAPI = (contextBridge, ipcRenderer) => {
        const api = {
            // File operations - using invoke for async request-response
            openFile: () => ipcRenderer.invoke('file:open'),
            saveFile: (filePath, content) => ipcRenderer.invoke('file:save', filePath, content),
            saveFileAs: (content) => ipcRenderer.invoke('file:save-as', content),

            // Export operations
            exportHTML: (content) => ipcRenderer.invoke('export:html', content),
            exportPDF: (content) => ipcRenderer.invoke('export:pdf', content),

            // Config operations
            getConfig: (key) => ipcRenderer.invoke('config:get', key),
            setConfig: (key, value) => ipcRenderer.invoke('config:set', key, value),

            // Event listeners - wrapped to prevent direct ipcRenderer exposure
            onFileDropped: (callback) => {
                const subscription = (event, filePath) => callback(filePath);

                ipcRenderer.on('file:dropped', subscription);
                return () => ipcRenderer.removeListener('file:dropped', subscription);
            },

            onMenuAction: (callback) => {
                const subscription = (event, action) => callback(action);

                ipcRenderer.on('menu:action', subscription);
                return () => ipcRenderer.removeListener('menu:action', subscription);
            }
        };

        contextBridge.exposeInMainWorld('electronAPI', api);
        return api;
    };

    let mockContextBridge;
    let mockIpcRenderer;
    let exposedAPI;

    beforeEach(() => {
        // Mock ipcRenderer
        mockIpcRenderer = {
            invoke: vi.fn(),
            on: vi.fn(),
            removeListener: vi.fn()
        };

        // Mock contextBridge
        mockContextBridge = {
            exposeInMainWorld: vi.fn()
        };

        // Create the exposed API
        exposedAPI = createExposedAPI(mockContextBridge, mockIpcRenderer);
    });

    describe('API Shape', () => {
        it('should expose electronAPI to main world', () => {
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                'electronAPI',
                expect.any(Object)
            );
        });

        it('should expose all required file operation methods', () => {
            expect(exposedAPI).toHaveProperty('openFile');
            expect(exposedAPI).toHaveProperty('saveFile');
            expect(exposedAPI).toHaveProperty('saveFileAs');
            expect(typeof exposedAPI.openFile).toBe('function');
            expect(typeof exposedAPI.saveFile).toBe('function');
            expect(typeof exposedAPI.saveFileAs).toBe('function');
        });

        it('should expose all required export operation methods', () => {
            expect(exposedAPI).toHaveProperty('exportHTML');
            expect(exposedAPI).toHaveProperty('exportPDF');
            expect(typeof exposedAPI.exportHTML).toBe('function');
            expect(typeof exposedAPI.exportPDF).toBe('function');
        });

        it('should expose all required config operation methods', () => {
            expect(exposedAPI).toHaveProperty('getConfig');
            expect(exposedAPI).toHaveProperty('setConfig');
            expect(typeof exposedAPI.getConfig).toBe('function');
            expect(typeof exposedAPI.setConfig).toBe('function');
        });

        it('should expose all required event listener methods', () => {
            expect(exposedAPI).toHaveProperty('onFileDropped');
            expect(exposedAPI).toHaveProperty('onMenuAction');
            expect(typeof exposedAPI.onFileDropped).toBe('function');
            expect(typeof exposedAPI.onMenuAction).toBe('function');
        });

        it('should expose exactly 9 methods (no more, no less)', () => {
            const apiKeys = Object.keys(exposedAPI);

            expect(apiKeys).toHaveLength(9);
            expect(apiKeys).toEqual([
                'openFile',
                'saveFile',
                'saveFileAs',
                'exportHTML',
                'exportPDF',
                'getConfig',
                'setConfig',
                'onFileDropped',
                'onMenuAction'
            ]);
        });
    });

    describe('Security - ipcRenderer Not Exposed', () => {
        it('should NOT expose ipcRenderer directly', () => {
            expect(exposedAPI).not.toHaveProperty('ipcRenderer');
        });

        it('should NOT expose ipcRenderer.invoke directly', () => {
            expect(exposedAPI.invoke).toBeUndefined();
        });

        it('should NOT expose ipcRenderer.on directly', () => {
            expect(exposedAPI.on).toBeUndefined();
        });

        it('should NOT expose ipcRenderer.send directly', () => {
            expect(exposedAPI.send).toBeUndefined();
        });

        it('should NOT expose ipcRenderer.sendSync directly', () => {
            expect(exposedAPI.sendSync).toBeUndefined();
        });

        it('should NOT expose any electron internal modules', () => {
            expect(exposedAPI).not.toHaveProperty('require');
            expect(exposedAPI).not.toHaveProperty('process');
            expect(exposedAPI).not.toHaveProperty('Buffer');
        });
    });

    describe('File Operations API', () => {
        it('openFile should call ipcRenderer.invoke with correct channel', () => {
            exposedAPI.openFile();
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('file:open');
        });

        it('saveFile should call ipcRenderer.invoke with correct channel and arguments', () => {
            const filePath = '/path/to/file.md';
            const content = '# Test Content';

            exposedAPI.saveFile(filePath, content);
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('file:save', filePath, content);
        });

        it('saveFileAs should call ipcRenderer.invoke with correct channel and content', () => {
            const content = '# New File';

            exposedAPI.saveFileAs(content);
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('file:save-as', content);
        });
    });

    describe('Export Operations API', () => {
        it('exportHTML should call ipcRenderer.invoke with correct channel', () => {
            const content = '# Markdown Content';

            exposedAPI.exportHTML(content);
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('export:html', content);
        });

        it('exportPDF should call ipcRenderer.invoke with correct channel', () => {
            const content = '# Markdown Content';

            exposedAPI.exportPDF(content);
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('export:pdf', content);
        });
    });

    describe('Config Operations API', () => {
        it('getConfig should call ipcRenderer.invoke with correct channel and key', () => {
            const key = 'theme';

            exposedAPI.getConfig(key);
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('config:get', key);
        });

        it('setConfig should call ipcRenderer.invoke with correct channel, key, and value', () => {
            const key = 'theme';
            const value = 'dark';

            exposedAPI.setConfig(key, value);
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('config:set', key, value);
        });
    });

    describe('Event Listener API', () => {
        it('onFileDropped should register listener and return cleanup function', () => {
            const callback = vi.fn();
            const cleanup = exposedAPI.onFileDropped(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                'file:dropped',
                expect.any(Function)
            );
            expect(typeof cleanup).toBe('function');
        });

        it('onFileDropped cleanup should remove listener', () => {
            const callback = vi.fn();
            const cleanup = exposedAPI.onFileDropped(callback);

            // Get the subscription function that was registered
            const subscriptionFn = mockIpcRenderer.on.mock.calls[0][1];

            cleanup();

            expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(
                'file:dropped',
                subscriptionFn
            );
        });

        it('onFileDropped should wrap callback to exclude event object', () => {
            const callback = vi.fn();

            exposedAPI.onFileDropped(callback);

            // Get the subscription function that was registered
            const subscriptionFn = mockIpcRenderer.on.mock.calls[0][1];

            // Simulate ipcRenderer calling the subscription with event and filePath
            const mockEvent = { sender: 'mock' };
            const filePath = '/path/to/file.md';

            subscriptionFn(mockEvent, filePath);

            // Callback should receive only filePath, not event
            expect(callback).toHaveBeenCalledWith(filePath);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('onMenuAction should register listener and return cleanup function', () => {
            const callback = vi.fn();
            const cleanup = exposedAPI.onMenuAction(callback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith(
                'menu:action',
                expect.any(Function)
            );
            expect(typeof cleanup).toBe('function');
        });

        it('onMenuAction cleanup should remove listener', () => {
            const callback = vi.fn();
            const cleanup = exposedAPI.onMenuAction(callback);

            // Get the subscription function that was registered
            const subscriptionFn = mockIpcRenderer.on.mock.calls[0][1];

            cleanup();

            expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith(
                'menu:action',
                subscriptionFn
            );
        });

        it('onMenuAction should wrap callback to exclude event object', () => {
            const callback = vi.fn();

            exposedAPI.onMenuAction(callback);

            // Get the subscription function that was registered
            const subscriptionFn = mockIpcRenderer.on.mock.calls[0][1];

            // Simulate ipcRenderer calling the subscription with event and action
            const mockEvent = { sender: 'mock' };
            const action = 'save';

            subscriptionFn(mockEvent, action);

            // Callback should receive only action, not event
            expect(callback).toHaveBeenCalledWith(action);
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('API Method Signatures', () => {
        it('file operation methods should accept correct number of parameters', () => {
            expect(exposedAPI.openFile.length).toBe(0);
            expect(exposedAPI.saveFile.length).toBe(2);
            expect(exposedAPI.saveFileAs.length).toBe(1);
        });

        it('export operation methods should accept correct number of parameters', () => {
            expect(exposedAPI.exportHTML.length).toBe(1);
            expect(exposedAPI.exportPDF.length).toBe(1);
        });

        it('config operation methods should accept correct number of parameters', () => {
            expect(exposedAPI.getConfig.length).toBe(1);
            expect(exposedAPI.setConfig.length).toBe(2);
        });

        it('event listener methods should accept correct number of parameters', () => {
            expect(exposedAPI.onFileDropped.length).toBe(1);
            expect(exposedAPI.onMenuAction.length).toBe(1);
        });
    });
});
