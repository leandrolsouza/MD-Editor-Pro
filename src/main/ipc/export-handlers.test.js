/**
 * Tests for export-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./export-handlers');

describe('export-handlers', () => {
    let exporter;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        exporter = {
            exportToHTML: vi.fn(),
            exportToPDF: vi.fn()
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ exporter, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 2 export IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(2);
        expect(handlers['export:html']).toBeDefined();
        expect(handlers['export:pdf']).toBeDefined();
    });

    describe('export:html', () => {
        it('calls exporter.exportToHTML and returns success with filePath', async () => {
            exporter.exportToHTML.mockResolvedValue('/exported/doc.html');

            const result = await handlers['export:html']({}, '# Hello', 'light');

            expect(exporter.exportToHTML).toHaveBeenCalledWith('# Hello', 'light');
            expect(result).toEqual({ success: true, filePath: '/exported/doc.html' });
        });

        it('uses light theme by default', async () => {
            exporter.exportToHTML.mockResolvedValue('/exported/doc.html');

            await handlers['export:html']({}, '# Hello');

            expect(exporter.exportToHTML).toHaveBeenCalledWith('# Hello', 'light');
        });

        it('returns cancelled when exporter returns null', async () => {
            exporter.exportToHTML.mockResolvedValue(null);

            const result = await handlers['export:html']({}, '# Hello', 'dark');

            expect(result).toEqual({ success: false, cancelled: true });
        });

        it('throws when exporter.exportToHTML throws', async () => {
            exporter.exportToHTML.mockRejectedValue(new Error('export failed'));

            await expect(handlers['export:html']({}, '# Hello', 'light')).rejects.toThrow('export failed');
        });
    });

    describe('export:pdf', () => {
        it('calls exporter.exportToPDF and returns success with filePath', async () => {
            exporter.exportToPDF.mockResolvedValue('/exported/doc.pdf');

            const result = await handlers['export:pdf']({}, '# Hello', 'dark');

            expect(exporter.exportToPDF).toHaveBeenCalledWith('# Hello', 'dark');
            expect(result).toEqual({ success: true, filePath: '/exported/doc.pdf' });
        });

        it('uses light theme by default', async () => {
            exporter.exportToPDF.mockResolvedValue('/exported/doc.pdf');

            await handlers['export:pdf']({}, '# Hello');

            expect(exporter.exportToPDF).toHaveBeenCalledWith('# Hello', 'light');
        });

        it('returns cancelled when exporter returns null', async () => {
            exporter.exportToPDF.mockResolvedValue(null);

            const result = await handlers['export:pdf']({}, '# Hello', 'light');

            expect(result).toEqual({ success: false, cancelled: true });
        });

        it('throws when exporter.exportToPDF throws', async () => {
            exporter.exportToPDF.mockRejectedValue(new Error('pdf generation failed'));

            await expect(handlers['export:pdf']({}, '# Hello', 'light')).rejects.toThrow('pdf generation failed');
        });
    });
});
