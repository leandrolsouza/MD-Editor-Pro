/**
 * RendererErrorBoundary Tests
 *
 * Unit tests for the renderer process error boundary that captures
 * unhandled errors and promise rejections, displays notifications,
 * and forwards errors to the main process via IPC.
 *
 * @vitest-environment jsdom
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'module';

// Create mock notification manager
const mockNotificationError = vi.fn();
const mockNotificationManager = {
    error: mockNotificationError
};

// Patch the require cache for notification module BEFORE importing error-boundary.js
const require_ = createRequire(import.meta.url);
const notificationPath = require_.resolve('./ui/notification.js');
require_.cache[notificationPath] = {
    id: notificationPath,
    filename: notificationPath,
    loaded: true,
    exports: mockNotificationManager
};

// Now import the module — its require('./ui/notification.js') will get our cached mock
const { default: RendererErrorBoundary } = await import('./error-boundary.js');

describe('RendererErrorBoundary', () => {
    let boundary;
    let mockLogError;
    let addEventListenerSpy;

    beforeEach(() => {
        // Set up window.electronAPI mock
        mockLogError = vi.fn();
        window.electronAPI = {
            logError: mockLogError
        };

        addEventListenerSpy = vi.spyOn(window, 'addEventListener');

        // Reset window.onerror
        window.onerror = null;

        // Reset mocks
        mockNotificationError.mockReset();
        mockLogError.mockReset();

        boundary = new RendererErrorBoundary();
    });

    afterEach(() => {
        // Clean up
        window.onerror = null;
        delete window.electronAPI;
        addEventListenerSpy.mockRestore();
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should not be registered initially', () => {
            expect(boundary._registered).toBe(false);
        });
    });

    describe('register()', () => {
        it('should set window.onerror handler (Req 4.1)', () => {
            expect(window.onerror).toBeNull();

            boundary.register();

            expect(window.onerror).toBeTypeOf('function');
        });

        it('should add unhandledrejection event listener (Req 4.2)', () => {
            boundary.register();

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                'unhandledrejection',
                expect.any(Function)
            );
        });

        it('should mark as registered after calling register()', () => {
            boundary.register();

            expect(boundary._registered).toBe(true);
        });

        it('should prevent double registration (Req 4.5)', () => {
            boundary.register();
            const firstOnerror = window.onerror;
            addEventListenerSpy.mockClear();

            boundary.register();

            // onerror should not be reassigned
            expect(window.onerror).toBe(firstOnerror);
            // addEventListener should not be called again
            expect(addEventListenerSpy).not.toHaveBeenCalledWith(
                'unhandledrejection',
                expect.any(Function)
            );
        });
    });

    describe('window.onerror capture (Req 4.1)', () => {
        beforeEach(() => {
            boundary.register();
        });

        it('should capture errors via window.onerror and return true', () => {
            const error = new Error('test error');

            const result = window.onerror('test error', 'script.js', 10, 5, error);

            // Should return true to prevent default browser error handling
            expect(result).toBe(true);
        });

        it('should display notification for captured error (Req 4.3)', () => {
            const error = new Error('render failure');

            window.onerror('render failure', 'app.js', 1, 1, error);

            expect(mockNotificationError).toHaveBeenCalledWith(
                expect.stringContaining('render failure')
            );
        });

        it('should forward error to main process via IPC (Req 4.4)', () => {
            const error = new Error('ipc test error');

            window.onerror('ipc test error', 'renderer.js', 42, 10, error);

            expect(mockLogError).toHaveBeenCalledWith({
                level: 'error',
                message: expect.stringContaining('ipc test error'),
                context: expect.objectContaining({
                    source: 'renderer.js',
                    lineno: 42,
                    colno: 10,
                    stack: expect.any(String)
                })
            });
        });

        it('should handle onerror when error object is null', () => {
            window.onerror('Script error.', '', 0, 0, null);

            expect(mockNotificationError).toHaveBeenCalledWith(
                expect.stringContaining('Script error.')
            );
            // Empty string source falls back to 'unknown' via `source || 'unknown'`
            expect(mockLogError).toHaveBeenCalledWith({
                level: 'error',
                message: expect.stringContaining('Script error.'),
                context: expect.objectContaining({
                    source: 'unknown',
                    lineno: 0,
                    colno: 0
                })
            });
        });

        it('should use "unknown" source when source is not provided', () => {
            window.onerror('error msg', undefined, undefined, undefined, null);

            expect(mockLogError).toHaveBeenCalledWith(
                expect.objectContaining({
                    context: expect.objectContaining({
                        source: 'unknown'
                    })
                })
            );
        });
    });

    describe('unhandledrejection capture (Req 4.2)', () => {
        let rejectionHandler;

        beforeEach(() => {
            boundary.register();

            const call = addEventListenerSpy.mock.calls.find(
                ([event]) => event === 'unhandledrejection'
            );
            rejectionHandler = call[1];
        });

        it('should capture Error rejections and show notification', () => {
            const reason = new Error('async failure');

            rejectionHandler({ reason });

            expect(mockNotificationError).toHaveBeenCalledWith(
                expect.stringContaining('async failure')
            );
        });

        it('should forward Error rejections to main process (Req 4.4)', () => {
            const reason = new Error('promise rejected');

            rejectionHandler({ reason });

            expect(mockLogError).toHaveBeenCalledWith({
                level: 'error',
                message: expect.stringContaining('promise rejected'),
                context: expect.objectContaining({
                    stack: expect.any(String)
                })
            });
        });

        it('should handle non-Error rejection reasons', () => {
            rejectionHandler({ reason: 'string rejection' });

            expect(mockNotificationError).toHaveBeenCalledWith(
                expect.stringContaining('string rejection')
            );
            expect(mockLogError).toHaveBeenCalledWith({
                level: 'error',
                message: expect.stringContaining('string rejection'),
                context: expect.objectContaining({
                    stack: undefined
                })
            });
        });

        it('should handle numeric rejection reasons', () => {
            rejectionHandler({ reason: 404 });

            expect(mockNotificationError).toHaveBeenCalledWith(
                expect.stringContaining('404')
            );
        });
    });

    describe('notification display (Req 4.3)', () => {
        beforeEach(() => {
            boundary.register();
        });

        it('should call notificationManager.error with prefixed message', () => {
            const error = new Error('display test');

            window.onerror('display test', 'test.js', 1, 1, error);

            expect(mockNotificationError).toHaveBeenCalledWith(
                'An error occurred: display test'
            );
        });

        it('should handle gracefully when notificationManager.error throws', () => {
            mockNotificationError.mockImplementation(() => {
                throw new Error('DOM not ready');
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            expect(() => {
                window.onerror('error msg', 'test.js', 1, 1, new Error('error msg'));
            }).not.toThrow();

            // Should still forward to main process even if notification fails
            expect(mockLogError).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('IPC forwarding (Req 4.4)', () => {
        beforeEach(() => {
            boundary.register();
        });

        it('should forward via window.electronAPI.logError with correct structure', () => {
            window.onerror('ipc forward', 'app.js', 5, 3, new Error('ipc forward'));

            expect(mockLogError).toHaveBeenCalledTimes(1);
            expect(mockLogError).toHaveBeenCalledWith(
                expect.objectContaining({
                    level: 'error',
                    message: expect.stringContaining('Uncaught exception')
                })
            );
        });

        it('should handle gracefully when electronAPI is not available', () => {
            delete window.electronAPI;

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            expect(() => {
                window.onerror('no api', 'test.js', 1, 1, new Error('no api'));
            }).not.toThrow();

            // Notification should still be shown
            expect(mockNotificationError).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should handle gracefully when logError is not a function', () => {
            window.electronAPI = { logError: 'not a function' };

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            expect(() => {
                window.onerror('bad api', 'test.js', 1, 1, new Error('bad api'));
            }).not.toThrow();

            consoleSpy.mockRestore();
        });

        it('should handle gracefully when logError throws', () => {
            mockLogError.mockImplementation(() => {
                throw new Error('IPC channel closed');
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            expect(() => {
                window.onerror('ipc fail', 'test.js', 1, 1, new Error('ipc fail'));
            }).not.toThrow();

            consoleSpy.mockRestore();
        });

        it('should forward unhandledrejection errors to main process', () => {
            const handler = addEventListenerSpy.mock.calls.find(
                ([event]) => event === 'unhandledrejection'
            )[1];

            const reason = new Error('rejected');
            handler({ reason });

            expect(mockLogError).toHaveBeenCalledWith(
                expect.objectContaining({
                    level: 'error',
                    message: expect.stringContaining('Unhandled promise rejection')
                })
            );
        });
    });
});
