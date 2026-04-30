/**
 * MetricsCollector - Collects runtime health metrics at configurable intervals
 *
 * Follows the existing Manager pattern. Gathers memory usage from
 * process.memoryUsage() and active window count from BrowserWindow.getAllWindows()
 * at a periodic interval, logging each snapshot at debug level.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.5, 6.6
 */

const { BrowserWindow } = require('electron');

class MetricsCollector {
    /**
     * @param {import('./utils/logger')} logger - Logger instance
     * @param {import('./window')} windowManager - WindowManager instance
     * @param {Object} [options]
     * @param {number} [options.interval=30000] - Collection interval in milliseconds
     */
    constructor(logger, windowManager, options = {}) {
        if (!logger) {
            throw new Error('Logger is required');
        }
        if (!windowManager) {
            throw new Error('WindowManager is required');
        }

        this._logger = logger.child('metrics');
        this._windowManager = windowManager;
        this._interval = options.interval || 30000;
        this._timerId = null;
        this._latestSnapshot = null;
    }

    /**
     * Start periodic metrics collection.
     * Collects an initial snapshot immediately, then repeats at the configured interval.
     */
    start() {
        if (this._timerId !== null) {
            return;
        }

        this._latestSnapshot = this.collect();
        this._timerId = setInterval(() => {
            this.collect();
        }, this._interval);

        this._logger.info('Metrics collection started', { interval: this._interval });
    }

    /**
     * Stop periodic metrics collection.
     */
    stop() {
        if (this._timerId === null) {
            return;
        }

        clearInterval(this._timerId);
        this._timerId = null;
        this._logger.info('Metrics collection stopped');
    }

    /**
     * Collect a single metrics snapshot.
     * @returns {{ timestamp: string, memory: { heapUsed: number, heapTotal: number, rss: number, external: number }, activeWindows: number }}
     */
    collect() {
        const memUsage = process.memoryUsage();
        const allWindows = BrowserWindow.getAllWindows();

        const snapshot = {
            timestamp: new Date().toISOString(),
            memory: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                rss: memUsage.rss,
                external: memUsage.external
            },
            activeWindows: allWindows.length
        };

        this._latestSnapshot = snapshot;
        this._logger.debug('Metrics snapshot', snapshot);

        return snapshot;
    }

    /**
     * Get the most recent metrics snapshot.
     * @returns {{ timestamp: string, memory: Object, activeWindows: number } | null}
     */
    getLatest() {
        return this._latestSnapshot;
    }
}

module.exports = MetricsCollector;
