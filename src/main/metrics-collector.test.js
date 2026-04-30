/**
 * MetricsCollector Tests
 *
 * Unit tests for the runtime health metrics collector that gathers
 * memory usage and active window count at configurable intervals.
 *
 * @vitest-environment node
 *
 * Requirements: 6.1, 6.2, 6.3, 6.5, 6.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'module';

// Create mock for BrowserWindow.getAllWindows()
const mockGetAllWindows = vi.fn(() => []);

// Patch the require cache for 'electron' BEFORE importing metrics-collector.js.
const require_ = createRequire(import.meta.url);
const electronPath = require_.resolve('electron');
require_.cache[electronPath] = {
    id: electronPath,
    filename: electronPath,
    loaded: true,
    exports: {
        BrowserWindow: {
            getAllWindows: mockGetAllWindows
        }
    }
};

// Now import the module — its require('electron') will get our cached mock
const { default: MetricsCollector } = await import('./metrics-collector.js');

describe('MetricsCollector', () => {
    let collector;
    let mockLogger;
    let mockChildLogger;
    let mockWindowManager;
    let memoryUsageSpy;

    const fakeMemoryUsage = {
        heapUsed: 52428800,
        heapTotal: 67108864,
        rss: 104857600,
        external: 1048576,
        arrayBuffers: 524288
    };

    beforeEach(() => {
        vi.useFakeTimers();

        mockChildLogger = {
            info: vi.fn(),
            debug: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            fatal: vi.fn()
        };

        mockLogger = {
            child: vi.fn(() => mockChildLogger)
        };

        mockWindowManager = {};

        memoryUsageSpy = vi.spyOn(process, 'memoryUsage').mockReturnValue(fakeMemoryUsage);
        mockGetAllWindows.mockReturnValue([{ id: 1 }]);

        collector = new MetricsCollector(mockLogger, mockWindowManager);
    });

    afterEach(() => {
        collector.stop();
        vi.useRealTimers();
        vi.restoreAllMocks();
        mockGetAllWindows.mockReset();
    });

    describe('constructor', () => {
        it('should create a child logger with metrics category', () => {
            expect(mockLogger.child).toHaveBeenCalledWith('metrics');
        });

        it('should throw if logger is not provided', () => {
            expect(() => new MetricsCollector(null, mockWindowManager)).toThrow('Logger is required');
        });

        it('should throw if windowManager is not provided', () => {
            expect(() => new MetricsCollector(mockLogger, null)).toThrow('WindowManager is required');
        });

        it('should default interval to 30000ms', () => {
            expect(collector._interval).toBe(30000);
        });

        it('should accept a custom interval', () => {
            const custom = new MetricsCollector(mockLogger, mockWindowManager, { interval: 5000 });
            expect(custom._interval).toBe(5000);
        });
    });

    describe('collect()', () => {
        it('should return a snapshot with correct memory fields', () => {
            const snapshot = collector.collect();

            expect(snapshot.memory).toEqual({
                heapUsed: 52428800,
                heapTotal: 67108864,
                rss: 104857600,
                external: 1048576
            });
        });

        it('should return a snapshot with activeWindows count', () => {
            mockGetAllWindows.mockReturnValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

            const snapshot = collector.collect();

            expect(snapshot.activeWindows).toBe(3);
        });

        it('should return activeWindows as 0 when no windows exist', () => {
            mockGetAllWindows.mockReturnValue([]);

            const snapshot = collector.collect();

            expect(snapshot.activeWindows).toBe(0);
        });

        it('should include an ISO-8601 timestamp', () => {
            vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));

            const snapshot = collector.collect();

            expect(snapshot.timestamp).toBe('2025-01-15T10:30:00.000Z');
        });

        it('should not include arrayBuffers in the memory snapshot', () => {
            const snapshot = collector.collect();

            expect(snapshot.memory).not.toHaveProperty('arrayBuffers');
        });

        it('should log the snapshot at debug level', () => {
            const snapshot = collector.collect();

            expect(mockChildLogger.debug).toHaveBeenCalledWith('Metrics snapshot', snapshot);
        });
    });

    describe('start()', () => {
        it('should collect an initial snapshot immediately', () => {
            collector.start();

            expect(memoryUsageSpy).toHaveBeenCalled();
            expect(mockGetAllWindows).toHaveBeenCalled();
            expect(collector.getLatest()).not.toBeNull();
        });

        it('should log that collection started with interval', () => {
            collector.start();

            expect(mockChildLogger.info).toHaveBeenCalledWith(
                'Metrics collection started',
                { interval: 30000 }
            );
        });

        it('should collect periodically at the configured interval', () => {
            collector.start();

            // Initial collect call
            expect(memoryUsageSpy).toHaveBeenCalledTimes(1);

            // Advance by one interval
            vi.advanceTimersByTime(30000);
            expect(memoryUsageSpy).toHaveBeenCalledTimes(2);

            // Advance by another interval
            vi.advanceTimersByTime(30000);
            expect(memoryUsageSpy).toHaveBeenCalledTimes(3);
        });

        it('should be idempotent — calling start twice does not create duplicate timers', () => {
            collector.start();
            collector.start();

            // Only one initial collect
            expect(memoryUsageSpy).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(30000);
            // Only one interval collect, not two
            expect(memoryUsageSpy).toHaveBeenCalledTimes(2);
        });

        it('should use custom interval when provided', () => {
            const custom = new MetricsCollector(mockLogger, mockWindowManager, { interval: 5000 });
            custom.start();

            expect(memoryUsageSpy).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(5000);
            expect(memoryUsageSpy).toHaveBeenCalledTimes(2);

            vi.advanceTimersByTime(5000);
            expect(memoryUsageSpy).toHaveBeenCalledTimes(3);

            custom.stop();
        });
    });

    describe('stop()', () => {
        it('should halt periodic collection', () => {
            collector.start();
            expect(memoryUsageSpy).toHaveBeenCalledTimes(1);

            collector.stop();

            vi.advanceTimersByTime(60000);
            // No additional calls after stop
            expect(memoryUsageSpy).toHaveBeenCalledTimes(1);
        });

        it('should log that collection stopped', () => {
            collector.start();
            collector.stop();

            expect(mockChildLogger.info).toHaveBeenCalledWith('Metrics collection stopped');
        });

        it('should be idempotent — calling stop when not started does nothing', () => {
            // Should not throw or log
            collector.stop();

            expect(mockChildLogger.info).not.toHaveBeenCalledWith('Metrics collection stopped');
        });

        it('should allow restarting after stop', () => {
            collector.start();
            collector.stop();

            memoryUsageSpy.mockClear();

            collector.start();
            expect(memoryUsageSpy).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(30000);
            expect(memoryUsageSpy).toHaveBeenCalledTimes(2);

            collector.stop();
        });
    });

    describe('getLatest()', () => {
        it('should return null before any collection', () => {
            expect(collector.getLatest()).toBeNull();
        });

        it('should return the most recent snapshot after collect()', () => {
            const snapshot = collector.collect();

            expect(collector.getLatest()).toBe(snapshot);
        });

        it('should return the most recent snapshot after start()', () => {
            collector.start();

            const latest = collector.getLatest();
            expect(latest).not.toBeNull();
            expect(latest.memory.heapUsed).toBe(52428800);
        });

        it('should update to the latest snapshot after each interval', () => {
            vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));
            collector.start();

            const first = collector.getLatest();
            expect(first.timestamp).toBe('2025-01-15T10:00:00.000Z');

            // advanceTimersByTime also advances the system clock
            vi.advanceTimersByTime(30000);

            const second = collector.getLatest();
            expect(second.timestamp).toBe('2025-01-15T10:00:30.000Z');
            expect(second).not.toBe(first);
        });
    });

    describe('debug-level logging with metrics category', () => {
        it('should log each snapshot at debug level via the metrics child logger', () => {
            collector.collect();

            expect(mockChildLogger.debug).toHaveBeenCalledTimes(1);
            expect(mockChildLogger.debug).toHaveBeenCalledWith(
                'Metrics snapshot',
                expect.objectContaining({
                    timestamp: expect.any(String),
                    memory: expect.objectContaining({
                        heapUsed: expect.any(Number),
                        heapTotal: expect.any(Number),
                        rss: expect.any(Number),
                        external: expect.any(Number)
                    }),
                    activeWindows: expect.any(Number)
                })
            );
        });

        it('should log at debug level on each periodic collection', () => {
            collector.start();
            expect(mockChildLogger.debug).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(30000);
            expect(mockChildLogger.debug).toHaveBeenCalledTimes(2);

            vi.advanceTimersByTime(30000);
            expect(mockChildLogger.debug).toHaveBeenCalledTimes(3);
        });
    });
});
