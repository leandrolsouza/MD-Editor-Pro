/**
 * Tests for observability-handlers IPC module
 * Validates: Requirements 4.4, 6.5
 *
 * @vitest-environment node
 */

const { register } = require('./observability-handlers');

describe('observability-handlers', () => {
    let logger;
    let metricsCollector;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        logger = {
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            fatal: vi.fn()
        };
        metricsCollector = {
            getLatest: vi.fn()
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ logger, metricsCollector, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers both observability IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(2);
        expect(handlers['log:error']).toBeDefined();
        expect(handlers['get-health-metrics']).toBeDefined();
    });

    describe('log:error', () => {
        it('logs at the specified level with renderer source and returns success', async () => {
            const result = await handlers['log:error']({}, {
                level: 'error',
                message: 'Something broke in the UI',
                context: { component: 'editor' }
            });

            expect(logger.error).toHaveBeenCalledWith(
                'Something broke in the UI',
                { component: 'editor', source: 'renderer' }
            );
            expect(result).toEqual({ success: true });
        });

        it('logs at warn level when level is warn', async () => {
            await handlers['log:error']({}, {
                level: 'warn',
                message: 'Deprecation warning',
                context: {}
            });

            expect(logger.warn).toHaveBeenCalledWith(
                'Deprecation warning',
                { source: 'renderer' }
            );
        });

        it('logs at info level when level is info', async () => {
            await handlers['log:error']({}, {
                level: 'info',
                message: 'Component mounted',
                context: { view: 'preview' }
            });

            expect(logger.info).toHaveBeenCalledWith(
                'Component mounted',
                { view: 'preview', source: 'renderer' }
            );
        });

        it('merges source: renderer into existing context without overwriting other fields', async () => {
            await handlers['log:error']({}, {
                level: 'error',
                message: 'Render failed',
                context: { file: 'doc.md', line: 42 }
            });

            expect(logger.error).toHaveBeenCalledWith(
                'Render failed',
                { file: 'doc.md', line: 42, source: 'renderer' }
            );
        });

        it('handles undefined context gracefully', async () => {
            const result = await handlers['log:error']({}, {
                level: 'error',
                message: 'No context error',
                context: undefined
            });

            expect(logger.error).toHaveBeenCalledWith(
                'No context error',
                { source: 'renderer' }
            );
            expect(result).toEqual({ success: true });
        });
    });

    describe('get-health-metrics', () => {
        it('returns success with latest metrics snapshot', async () => {
            const mockMetrics = {
                timestamp: '2025-01-15T10:30:00.000Z',
                memory: { heapUsed: 52428800, heapTotal: 67108864, rss: 104857600, external: 1048576 },
                activeWindows: 1
            };
            metricsCollector.getLatest.mockReturnValue(mockMetrics);

            const result = await handlers['get-health-metrics']({});

            expect(metricsCollector.getLatest).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, metrics: mockMetrics });
        });

        it('returns null metrics when no snapshot has been collected yet', async () => {
            metricsCollector.getLatest.mockReturnValue(null);

            const result = await handlers['get-health-metrics']({});

            expect(result).toEqual({ success: true, metrics: null });
        });
    });
});
