/**
 * Tests for advanced-markdown-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./advanced-markdown-handlers');

describe('advanced-markdown-handlers', () => {
    let advancedMarkdownManager;
    let windowManager;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        advancedMarkdownManager = {
            getAllFeatures: vi.fn(),
            toggleFeature: vi.fn()
        };
        windowManager = {
            getMainWindow: vi.fn()
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ advancedMarkdownManager, windowManager, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 2 advanced-markdown IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(2);
        expect(handlers['advanced-markdown:get-settings']).toBeDefined();
        expect(handlers['advanced-markdown:toggle-feature']).toBeDefined();
    });

    describe('advanced-markdown:get-settings', () => {
        it('calls getAllFeatures and returns success with features', async () => {
            const mockFeatures = { mermaid: true, katex: true, callouts: false };
            advancedMarkdownManager.getAllFeatures.mockReturnValue(mockFeatures);

            const result = await handlers['advanced-markdown:get-settings']({});

            expect(advancedMarkdownManager.getAllFeatures).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, features: mockFeatures });
        });

        it('throws when getAllFeatures throws', async () => {
            advancedMarkdownManager.getAllFeatures.mockImplementation(() => {
                throw new Error('config error');
            });

            await expect(handlers['advanced-markdown:get-settings']({})).rejects.toThrow('config error');
        });
    });

    describe('advanced-markdown:toggle-feature', () => {
        it('calls toggleFeature and returns success', async () => {
            windowManager.getMainWindow.mockReturnValue(null);

            const result = await handlers['advanced-markdown:toggle-feature']({}, 'mermaid', false);

            expect(advancedMarkdownManager.toggleFeature).toHaveBeenCalledWith('mermaid', false);
            expect(result).toEqual({ success: true });
        });

        it('sends settings-changed to renderer when mainWindow exists', async () => {
            const mockSend = vi.fn();
            windowManager.getMainWindow.mockReturnValue({
                webContents: { send: mockSend }
            });

            await handlers['advanced-markdown:toggle-feature']({}, 'katex', true);

            expect(mockSend).toHaveBeenCalledWith('advanced-markdown:settings-changed', 'katex', true);
        });

        it('does not send to renderer when mainWindow is null', async () => {
            windowManager.getMainWindow.mockReturnValue(null);

            await handlers['advanced-markdown:toggle-feature']({}, 'callouts', false);

            // No error thrown — gracefully handles missing window
            expect(windowManager.getMainWindow).toHaveBeenCalledOnce();
        });

        it('throws when toggleFeature throws', async () => {
            advancedMarkdownManager.toggleFeature.mockImplementation(() => {
                throw new Error('Unknown feature: invalid');
            });

            await expect(
                handlers['advanced-markdown:toggle-feature']({}, 'invalid', true)
            ).rejects.toThrow('Unknown feature: invalid');
        });
    });
});
