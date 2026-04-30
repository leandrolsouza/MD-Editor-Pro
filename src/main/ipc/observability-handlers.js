/**
 * IPC Handlers — Observability Operations
 * Handles: log:error, get-health-metrics
 *
 * Requirements: 4.4, 6.5
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Register IPC handlers for observability operations
 * @param {Object} deps - Dependencies
 * @param {import('../utils/logger')} deps.logger - Logger instance
 * @param {import('../metrics-collector')} deps.metricsCollector - MetricsCollector instance
 * @param {Electron.IpcMain} deps.ipcMain - Electron ipcMain instance
 */
function register({ logger, metricsCollector, ipcMain }) {
    // Renderer error forwarding — receives errors from the renderer process
    // and logs them via the centralized Logger with source: 'renderer'
    ipcMain.handle('log:error', createIPCHandler(async (event, { level, message, context }) => {
        logger[level](message, { ...context, source: 'renderer' });
        return { success: true };
    }, 'logging renderer error'));

    // Health metrics — returns the most recent MetricsSnapshot to the renderer
    ipcMain.handle('get-health-metrics', createIPCHandler(async () => {
        return { success: true, metrics: metricsCollector.getLatest() };
    }, 'getting health metrics'));
}

module.exports = { register };
