/**
 * MainErrorBoundary Tests
 *
 * Unit tests for the main process error boundary that handles
 * uncaught exceptions, unhandled rejections, and renderer crashes.
 *
 * @vitest-environment node
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'module';

// Create mock functions
const mockShowErrorBox = vi.fn();
const mockShowMessageBoxSync = vi.fn(() => 0);

// Patch the require cache for 'electron' BEFORE importing error-boundary.js.
// The electron npm package normally exports a string (path to binary),
// but in the Electron runtime it provides { dialog, BrowserWindow, ... }.
// We need to replace the cached module with our mock.
const require_ = createRequire(import.meta.url);
const electronPath = require_.resolve('electron');
require_.cache[electronPath] = {
    id: electronPath,
    filename: electronPath,
    loaded: true,
    exports: {
        dialog: {
            showErrorBox: mockShowErrorBox,
            showMessageBoxSync: mockShowMessageBoxSync
        },
        BrowserWindow: {}
    }
};

// Now import the module — its require('electron') will get our cached mock
const { default: MainErrorBoundary } = await import('./error-boundary.js');

describe('MainErrorBoundary', () => {
    let boundary;
    let mockLogger;
    let mockChildLogger;
    let mockWebContents;
    let mockMainWindow;
    let mockWindowManager;
    let processOnSpy;
    let originalExit;

    beforeEach(() => {
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

        mockWebContents = {
            on: vi.fn(),
            reload: vi.fn()
        };

        mockMainWindow = {
            isDestroyed: vi.fn(() => false),
            webContents: mockWebContents,
            close: vi.fn()
        };

        mockWindowManager = {
            getMainWindow: vi.fn(() => mockMainWindow)
        };

        // Increase max listeners to avoid warnings from repeated process.on calls
        process.setMaxListeners(30);

        processOnSpy = vi.spyOn(process, 'on');

        originalExit = process.exit;
        process.exit = vi.fn();

        mockShowErrorBox.mockReset();
        mockShowMessageBoxSync.mockReset().mockReturnValue(0);

        boundary = new MainErrorBoundary(mockLogger, mockWindowManager);
    });

    afterEach(() => {
        process.exit = originalExit;
        processOnSpy.mockRestore();
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should create a child logger with ErrorBoundary category', () => {
            expect(mockLogger.child).toHaveBeenCalledWith('ErrorBoundary');
        });

        it('should not be registered initially', () => {
            expect(boundary._registered).toBe(false);
        });
    });

    describe('register()', () => {
        it('should attach uncaughtException handler on process', () => {
            boundary.register();

            expect(processOnSpy).toHaveBeenCalledWith(
                'uncaughtException',
                expect.any(Function)
            );
        });

        it('should attach unhandledRejection handler on process', () => {
            boundary.register();

            expect(processOnSpy).toHaveBeenCalledWith(
                'unhandledRejection',
                expect.any(Function)
            );
        });

        it('should attach render-process-gone listener on webContents', () => {
            boundary.register();

            expect(mockWebContents.on).toHaveBeenCalledWith(
                'render-process-gone',
                expect.any(Function)
            );
        });

        it('should log info message after registration', () => {
            boundary.register();

            expect(mockChildLogger.info).toHaveBeenCalledWith('Error boundary registered');
        });

        it('should prevent double registration', () => {
            boundary.register();
            processOnSpy.mockClear();
            mockWebContents.on.mockClear();
            mockChildLogger.info.mockClear();

            boundary.register();

            expect(processOnSpy).not.toHaveBeenCalledWith(
                'uncaughtException',
                expect.any(Function)
            );
            expect(processOnSpy).not.toHaveBeenCalledWith(
                'unhandledRejection',
                expect.any(Function)
            );
            expect(mockWebContents.on).not.toHaveBeenCalled();
            expect(mockChildLogger.info).not.toHaveBeenCalled();
        });

        it('should handle missing main window gracefully', () => {
            mockWindowManager.getMainWindow.mockReturnValue(null);

            expect(() => boundary.register()).not.toThrow();

            expect(processOnSpy).toHaveBeenCalledWith(
                'uncaughtException',
                expect.any(Function)
            );
        });

        it('should handle destroyed main window gracefully', () => {
            mockMainWindow.isDestroyed.mockReturnValue(true);

            expect(() => boundary.register()).not.toThrow();

            expect(mockWebContents.on).not.toHaveBeenCalled();
        });
    });

    describe('_handleUncaughtException()', () => {
        it('should log at fatal level with error context', () => {
            const error = new Error('test crash');

            boundary._handleUncaughtException(error);

            expect(mockChildLogger.fatal).toHaveBeenCalledWith(
                'Uncaught exception',
                { error }
            );
        });

        it('should show native error dialog with error message', () => {
            const error = new Error('something broke');

            boundary._handleUncaughtException(error);

            expect(mockShowErrorBox).toHaveBeenCalledWith(
                'Unexpected Error',
                expect.stringContaining('something broke')
            );
        });

        it('should exit process with code 1', () => {
            const error = new Error('fatal error');

            boundary._handleUncaughtException(error);

            expect(process.exit).toHaveBeenCalledWith(1);
        });

        it('should handle non-Error objects gracefully', () => {
            boundary._handleUncaughtException('string error');

            expect(mockChildLogger.fatal).toHaveBeenCalledWith(
                'Uncaught exception',
                { error: 'string error' }
            );
            expect(mockShowErrorBox).toHaveBeenCalledWith(
                'Unexpected Error',
                expect.stringContaining('string error')
            );
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        it('should still exit even if dialog throws', () => {
            mockShowErrorBox.mockImplementation(() => {
                throw new Error('dialog unavailable');
            });

            const error = new Error('crash');

            boundary._handleUncaughtException(error);

            expect(process.exit).toHaveBeenCalledWith(1);
        });
    });

    describe('_handleUnhandledRejection()', () => {
        it('should log at error level for Error reasons', () => {
            const reason = new Error('promise failed');

            boundary._handleUnhandledRejection(reason);

            expect(mockChildLogger.error).toHaveBeenCalledWith(
                'Unhandled promise rejection',
                { error: reason }
            );
        });

        it('should log at error level for non-Error reasons', () => {
            boundary._handleUnhandledRejection('string reason');

            expect(mockChildLogger.error).toHaveBeenCalledWith(
                'Unhandled promise rejection',
                { reason: 'string reason' }
            );
        });

        it('should NOT exit the process', () => {
            boundary._handleUnhandledRejection(new Error('non-fatal'));

            expect(process.exit).not.toHaveBeenCalled();
        });

        it('should NOT show a dialog', () => {
            boundary._handleUnhandledRejection(new Error('non-fatal'));

            expect(mockShowErrorBox).not.toHaveBeenCalled();
            expect(mockShowMessageBoxSync).not.toHaveBeenCalled();
        });
    });

    describe('_handleRendererCrash()', () => {
        it('should log at fatal level with crash details', () => {
            const details = { reason: 'crashed', exitCode: 1 };

            boundary._handleRendererCrash({}, details, mockMainWindow);

            expect(mockChildLogger.fatal).toHaveBeenCalledWith(
                'Renderer process crashed',
                { reason: 'crashed', exitCode: 1 }
            );
        });

        it('should show recovery dialog with reload option', () => {
            const details = { reason: 'killed', exitCode: -1 };
            mockShowMessageBoxSync.mockReturnValue(0);

            boundary._handleRendererCrash({}, details, mockMainWindow);

            expect(mockShowMessageBoxSync).toHaveBeenCalledWith(
                mockMainWindow,
                expect.objectContaining({
                    type: 'error',
                    buttons: ['Reload', 'Close'],
                    defaultId: 0,
                    title: 'Renderer Process Crashed',
                    message: 'The editor process has crashed.'
                })
            );
        });

        it('should reload window when user chooses Reload', () => {
            const details = { reason: 'crashed', exitCode: 1 };
            mockShowMessageBoxSync.mockReturnValue(0);

            boundary._handleRendererCrash({}, details, mockMainWindow);

            expect(mockWebContents.reload).toHaveBeenCalled();
            expect(mockMainWindow.close).not.toHaveBeenCalled();
        });

        it('should close window when user chooses Close', () => {
            const details = { reason: 'crashed', exitCode: 1 };
            mockShowMessageBoxSync.mockReturnValue(1);

            boundary._handleRendererCrash({}, details, mockMainWindow);

            expect(mockMainWindow.close).toHaveBeenCalled();
            expect(mockWebContents.reload).not.toHaveBeenCalled();
        });

        it('should not show dialog if window is destroyed', () => {
            const details = { reason: 'crashed', exitCode: 1 };
            mockMainWindow.isDestroyed.mockReturnValue(true);

            boundary._handleRendererCrash({}, details, mockMainWindow);

            expect(mockChildLogger.fatal).toHaveBeenCalled();
            expect(mockShowMessageBoxSync).not.toHaveBeenCalled();
        });

        it('should handle dialog errors gracefully', () => {
            const details = { reason: 'crashed', exitCode: 1 };
            mockShowMessageBoxSync.mockImplementation(() => {
                throw new Error('window destroyed');
            });

            expect(() => {
                boundary._handleRendererCrash({}, details, mockMainWindow);
            }).not.toThrow();
        });
    });

    describe('handler integration via register()', () => {
        it('should invoke _handleUncaughtException when uncaughtException fires', () => {
            boundary.register();

            const uncaughtCall = processOnSpy.mock.calls.find(
                ([event]) => event === 'uncaughtException'
            );
            expect(uncaughtCall).toBeDefined();

            const handler = uncaughtCall[1];
            const error = new Error('integration test');

            handler(error);

            expect(mockChildLogger.fatal).toHaveBeenCalledWith(
                'Uncaught exception',
                { error }
            );
            expect(process.exit).toHaveBeenCalledWith(1);
        });

        it('should invoke _handleUnhandledRejection when unhandledRejection fires', () => {
            boundary.register();

            const rejectionCall = processOnSpy.mock.calls.find(
                ([event]) => event === 'unhandledRejection'
            );
            expect(rejectionCall).toBeDefined();

            const handler = rejectionCall[1];
            const reason = new Error('rejected promise');

            handler(reason);

            expect(mockChildLogger.error).toHaveBeenCalledWith(
                'Unhandled promise rejection',
                { error: reason }
            );
        });

        it('should invoke _handleRendererCrash when render-process-gone fires', () => {
            boundary.register();

            const crashCall = mockWebContents.on.mock.calls.find(
                ([event]) => event === 'render-process-gone'
            );
            expect(crashCall).toBeDefined();

            const handler = crashCall[1];
            const details = { reason: 'crashed', exitCode: 1 };

            handler({}, details);

            expect(mockChildLogger.fatal).toHaveBeenCalledWith(
                'Renderer process crashed',
                { reason: 'crashed', exitCode: 1 }
            );
        });
    });
});
