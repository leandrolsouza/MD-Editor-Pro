/**
 * Tests for image-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./image-handlers');

describe('image-handlers', () => {
    let fileManager;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        fileManager = {
            saveImageFromClipboard: vi.fn()
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ fileManager, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers 1 image IPC handler', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(1);
        expect(handlers['image:save-from-clipboard']).toBeDefined();
    });

    describe('image:save-from-clipboard', () => {
        it('calls saveImageFromClipboard and returns result', async () => {
            const mockResult = { success: true, imagePath: '/path/to/image.png' };
            const mockBuffer = Buffer.from('fake-image');
            fileManager.saveImageFromClipboard.mockResolvedValue(mockResult);

            const result = await handlers['image:save-from-clipboard']({}, mockBuffer, '/path/to/doc.md');

            expect(fileManager.saveImageFromClipboard).toHaveBeenCalledWith(mockBuffer, '/path/to/doc.md');
            expect(result).toEqual(mockResult);
        });

        it('passes null currentFilePath correctly', async () => {
            const mockResult = { success: true, imagePath: '/tmp/image.png' };
            fileManager.saveImageFromClipboard.mockResolvedValue(mockResult);

            const result = await handlers['image:save-from-clipboard']({}, Buffer.from('data'), null);

            expect(fileManager.saveImageFromClipboard).toHaveBeenCalledWith(Buffer.from('data'), null);
            expect(result).toEqual(mockResult);
        });

        it('throws when saveImageFromClipboard throws', async () => {
            fileManager.saveImageFromClipboard.mockRejectedValue(new Error('Invalid image data'));

            await expect(
                handlers['image:save-from-clipboard']({}, 'not-a-buffer', '/path/to/doc.md')
            ).rejects.toThrow('Invalid image data');
        });
    });
});
