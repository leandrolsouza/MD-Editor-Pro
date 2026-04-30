/**
 * Tests for createIPCHandler
 *
 * Property-based test (fast-check) validating correctness property P6.
 * Unit tests for error enrichment with errorCode field and slow call detection.
 *
 * Feature: observability-operations
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 6.4
 */

import fc from 'fast-check';

// Use CJS require to get the same logger instance that ipc-utils.js uses
const logger = require('./logger');
const { createIPCHandler } = require('./ipc-utils');
const { IPC_ERROR_CODES } = require('./ipc-error-codes');

// Test sink to capture log entries from the real logger
function createTestSink() {
    const entries = [];
    return {
        entries,
        write(entry) {
            entries.push(JSON.parse(JSON.stringify(entry)));
        }
    };
}

describe('createIPCHandler', () => {
    let testSink;

    beforeEach(() => {
        testSink = createTestSink();
        logger.addSink(testSink);
    });

    afterEach(() => {
        // Remove the test sink
        const idx = logger._sinks.indexOf(testSink);
        if (idx !== -1) logger._sinks.splice(idx, 1);
    });

    it('executes the original handler function and returns its result', async () => {
        const handlerFn = vi.fn().mockResolvedValue({ success: true, data: 42 });
        const wrapped = createIPCHandler(handlerFn, 'test operation');

        const result = await wrapped({}, 'arg1');

        expect(result).toEqual({ success: true, data: 42 });
        expect(handlerFn).toHaveBeenCalledOnce();
    });

    it('passes event and all args correctly to the original function', async () => {
        const handlerFn = vi.fn().mockResolvedValue(null);
        const wrapped = createIPCHandler(handlerFn, 'test operation');

        const fakeEvent = { sender: 'renderer' };
        await wrapped(fakeEvent, 'arg1', 'arg2', 123);

        expect(handlerFn).toHaveBeenCalledWith(fakeEvent, 'arg1', 'arg2', 123);
    });

    it('throws an enriched error with errorCode when the handler throws', async () => {
        const originalError = new Error('something went wrong');
        const handlerFn = vi.fn().mockRejectedValue(originalError);
        const wrapped = createIPCHandler(handlerFn, 'doing something');

        let caughtError;
        try {
            await wrapped({});
        } catch (e) {
            caughtError = e;
        }

        expect(caughtError).toBeDefined();
        expect(caughtError.message).toBe('something went wrong');
        expect(caughtError.errorCode).toBe('INTERNAL_ERROR');
    });

    it('logs the error with context via logger when the handler throws', async () => {
        const originalError = new Error('disk full');
        const handlerFn = vi.fn().mockRejectedValue(originalError);
        const wrapped = createIPCHandler(handlerFn, 'saving file');

        await expect(wrapped({})).rejects.toThrow();

        const errorEntries = testSink.entries.filter(e => e.level === 'error');
        expect(errorEntries.length).toBeGreaterThanOrEqual(1);

        const logEntry = errorEntries.find(e => e.message === 'Error saving file');
        expect(logEntry).toBeDefined();
        expect(logEntry.category).toBe('IPC');
        expect(logEntry.context).toBeDefined();
        expect(logEntry.context.errorCode).toBe('INTERNAL_ERROR');
    });

    it('throws a NEW enriched error (not the original) with errorCode field', async () => {
        const originalError = new Error('original');
        const handlerFn = vi.fn().mockRejectedValue(originalError);
        const wrapped = createIPCHandler(handlerFn, 'context');

        let caughtError;
        try {
            await wrapped({});
        } catch (e) {
            caughtError = e;
        }

        expect(caughtError).not.toBe(originalError);
        expect(caughtError).toBeInstanceOf(Error);
        expect(caughtError.message).toBe('original');
        expect(caughtError.errorCode).toBe('INTERNAL_ERROR');
    });

    it('returns a function (the wrapped handler)', () => {
        const handlerFn = vi.fn();
        const wrapped = createIPCHandler(handlerFn, 'context');

        expect(typeof wrapped).toBe('function');
    });

    it('works with handlers that receive no extra args beyond event', async () => {
        const handlerFn = vi.fn().mockResolvedValue('result');
        const wrapped = createIPCHandler(handlerFn, 'no-args operation');

        const result = await wrapped({ sender: 'test' });

        expect(result).toBe('result');
        expect(handlerFn).toHaveBeenCalledWith({ sender: 'test' });
    });

    it('maps system error codes to correct IPC error codes', async () => {
        const enoentError = new Error('File not found: /path/to/file.md');
        enoentError.code = 'ENOENT';
        const handlerFn = vi.fn().mockRejectedValue(enoentError);
        const wrapped = createIPCHandler(handlerFn, 'reading file');

        let caughtError;
        try {
            await wrapped({});
        } catch (e) {
            caughtError = e;
        }

        expect(caughtError.errorCode).toBe('FILE_NOT_FOUND');
        expect(caughtError.message).toBe('File not found: /path/to/file.md');
    });

    it('does not log a slow call warning for fast handlers', async () => {
        const handlerFn = vi.fn().mockResolvedValue('fast');
        const wrapped = createIPCHandler(handlerFn, 'fast operation');

        await wrapped({});

        const warnEntries = testSink.entries.filter(e => e.level === 'warn');
        expect(warnEntries).toHaveLength(0);
    });

    it('logs a slow call warning when handler exceeds 1000ms', async () => {
        const handlerFn = vi.fn().mockResolvedValue('slow result');
        const wrapped = createIPCHandler(handlerFn, 'slow operation');

        const originalDateNow = Date.now;
        let callCount = 0;
        Date.now = vi.fn(() => {
            callCount++;
            return callCount === 1 ? 0 : 1500;
        });

        try {
            await wrapped({});

            const warnEntries = testSink.entries.filter(e => e.level === 'warn');
            expect(warnEntries.length).toBeGreaterThanOrEqual(1);

            const slowEntry = warnEntries.find(e => e.message.includes('Slow IPC call'));
            expect(slowEntry).toBeDefined();
            expect(slowEntry.category).toBe('IPC');
            expect(slowEntry.context.duration).toBe(1500);
            expect(slowEntry.context.errorContext).toBe('slow operation');
        } finally {
            Date.now = originalDateNow;
        }
    });

    it('does not log a slow call warning when handler takes exactly 1000ms', async () => {
        const handlerFn = vi.fn().mockResolvedValue('result');
        const wrapped = createIPCHandler(handlerFn, 'borderline operation');

        const originalDateNow = Date.now;
        let callCount = 0;
        Date.now = vi.fn(() => {
            callCount++;
            return callCount === 1 ? 0 : 1000;
        });

        try {
            await wrapped({});
            const warnEntries = testSink.entries.filter(e => e.level === 'warn');
            expect(warnEntries).toHaveLength(0);
        } finally {
            Date.now = originalDateNow;
        }
    });
});

// ── Property-Based Tests ────────────────────────────────────────

describe('createIPCHandler — Property-Based Tests', () => {
    let testSink;

    beforeEach(() => {
        testSink = createTestSink();
        logger.addSink(testSink);
    });

    afterEach(() => {
        const idx = logger._sinks.indexOf(testSink);
        if (idx !== -1) logger._sinks.splice(idx, 1);
    });

    /**
     * **Validates: Requirements 6.4**
     *
     * Property 6: Slow IPC call detection
     *
     * For any IPC handler call whose execution duration exceeds 1000ms,
     * the wrapper SHALL emit a warn-level log entry containing the duration
     * and error context. For calls completing within 1000ms, no warn-level
     * log SHALL be emitted for duration.
     */
    describe('Property 6: Slow IPC call detection', () => {

        it('emits a warn-level log iff handler duration exceeds 1000ms', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate durations from 0 to 5000ms to cover both sides of the threshold
                    fc.integer({ min: 0, max: 5000 }),
                    fc.string({ minLength: 1, maxLength: 50 }),
                    async (duration, errorContext) => {
                        // Clear sink entries from previous iteration
                        testSink.entries.length = 0;

                        const handlerFn = vi.fn().mockResolvedValue('result');
                        const wrapped = createIPCHandler(handlerFn, errorContext);

                        // Stub Date.now to simulate the desired duration
                        const originalDateNow = Date.now;
                        let callCount = 0;
                        Date.now = vi.fn(() => {
                            callCount++;
                            // First call is the start timestamp, second is the end
                            return callCount === 1 ? 0 : duration;
                        });

                        try {
                            await wrapped({});

                            const warnEntries = testSink.entries.filter(
                                e => e.level === 'warn' && e.message.includes('Slow IPC call')
                            );

                            if (duration > 1000) {
                                // Requirement 6.4: warn-level log emitted for slow calls
                                expect(warnEntries.length).toBe(1);
                                expect(warnEntries[0].category).toBe('IPC');
                                expect(warnEntries[0].context.duration).toBe(duration);
                                expect(warnEntries[0].context.errorContext).toBe(errorContext);
                            } else {
                                // No warn-level log for fast calls (duration <= 1000ms)
                                expect(warnEntries.length).toBe(0);
                            }
                        } finally {
                            Date.now = originalDateNow;
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

// ── Error Enrichment Unit Tests ─────────────────────────────────

describe('createIPCHandler — Error enrichment with errorCode', () => {
    let testSink;

    beforeEach(() => {
        testSink = createTestSink();
        logger.addSink(testSink);
    });

    afterEach(() => {
        const idx = logger._sinks.indexOf(testSink);
        if (idx !== -1) logger._sinks.splice(idx, 1);
    });

    it('enriches ENOENT errors with FILE_NOT_FOUND errorCode', async () => {
        const error = new Error('no such file');
        error.code = 'ENOENT';
        const wrapped = createIPCHandler(vi.fn().mockRejectedValue(error), 'reading');

        const caught = await wrapped({}).catch(e => e);
        expect(caught.errorCode).toBe(IPC_ERROR_CODES.FILE_NOT_FOUND);
        expect(caught.message).toBe('no such file');
    });

    it('enriches EACCES errors with PERMISSION_DENIED errorCode', async () => {
        const error = new Error('access denied');
        error.code = 'EACCES';
        const wrapped = createIPCHandler(vi.fn().mockRejectedValue(error), 'writing');

        const caught = await wrapped({}).catch(e => e);
        expect(caught.errorCode).toBe(IPC_ERROR_CODES.PERMISSION_DENIED);
        expect(caught.message).toBe('access denied');
    });

    it('enriches EPERM errors with PERMISSION_DENIED errorCode', async () => {
        const error = new Error('operation not permitted');
        error.code = 'EPERM';
        const wrapped = createIPCHandler(vi.fn().mockRejectedValue(error), 'deleting');

        const caught = await wrapped({}).catch(e => e);
        expect(caught.errorCode).toBe(IPC_ERROR_CODES.PERMISSION_DENIED);
        expect(caught.message).toBe('operation not permitted');
    });

    it('enriches ENOSPC errors with DISK_FULL errorCode', async () => {
        const error = new Error('no space left on device');
        error.code = 'ENOSPC';
        const wrapped = createIPCHandler(vi.fn().mockRejectedValue(error), 'saving');

        const caught = await wrapped({}).catch(e => e);
        expect(caught.errorCode).toBe(IPC_ERROR_CODES.DISK_FULL);
        expect(caught.message).toBe('no space left on device');
    });

    it('enriches EROFS errors with READ_ONLY_FS errorCode', async () => {
        const error = new Error('read-only file system');
        error.code = 'EROFS';
        const wrapped = createIPCHandler(vi.fn().mockRejectedValue(error), 'writing');

        const caught = await wrapped({}).catch(e => e);
        expect(caught.errorCode).toBe(IPC_ERROR_CODES.READ_ONLY_FS);
        expect(caught.message).toBe('read-only file system');
    });

    it('enriches unknown errors with INTERNAL_ERROR errorCode', async () => {
        const error = new Error('something unexpected');
        const wrapped = createIPCHandler(vi.fn().mockRejectedValue(error), 'processing');

        const caught = await wrapped({}).catch(e => e);
        expect(caught.errorCode).toBe(IPC_ERROR_CODES.INTERNAL_ERROR);
        expect(caught.message).toBe('something unexpected');
    });

    it('enriches validation errors with VALIDATION_ERROR errorCode', async () => {
        const error = new Error('invalid input');
        error.name = 'ValidationError';
        const wrapped = createIPCHandler(vi.fn().mockRejectedValue(error), 'validating');

        const caught = await wrapped({}).catch(e => e);
        expect(caught.errorCode).toBe(IPC_ERROR_CODES.VALIDATION_ERROR);
        expect(caught.message).toBe('invalid input');
    });

    it('logs the errorCode in the error log entry context', async () => {
        const error = new Error('file missing');
        error.code = 'ENOENT';
        const wrapped = createIPCHandler(vi.fn().mockRejectedValue(error), 'opening file');

        await wrapped({}).catch(() => { });

        const errorEntries = testSink.entries.filter(e => e.level === 'error');
        expect(errorEntries.length).toBeGreaterThanOrEqual(1);

        const logEntry = errorEntries.find(e => e.message === 'Error opening file');
        expect(logEntry).toBeDefined();
        expect(logEntry.context.errorCode).toBe('FILE_NOT_FOUND');
    });
});
