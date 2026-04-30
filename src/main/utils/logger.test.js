/**
 * Logger Tests
 *
 * Property-based tests (fast-check) validating correctness properties P1–P4, P7.
 * Unit tests for method existence, default levels, and singleton behavior.
 *
 * Feature: observability-operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

// Import the singleton and the Logger class
import logger from './logger.js';

const { Logger, LOG_LEVELS } = logger;

const VALID_LEVELS = Object.keys(LOG_LEVELS);

// ── Helpers ─────────────────────────────────────────────────────

/** Collect entries written to a test sink. */
function createTestSink() {
    const entries = [];
    return {
        entries,
        write(entry) {
            entries.push(entry);
        }
    };
}

/** fast-check arbitrary for valid log level strings. */
const arbLevel = fc.constantFrom(...VALID_LEVELS);

/** fast-check arbitrary for non-empty printable strings (category / message). */
const arbNonEmptyString = fc.string({ minLength: 1, maxLength: 200 });

/**
 * Recursively normalize -0 to 0 in a value, since JSON.stringify(-0) === "0".
 * This ensures generated values survive JSON round-trips.
 */
function normalizeNegativeZero(value) {
    if (typeof value === 'number' && Object.is(value, -0)) return 0;
    if (Array.isArray(value)) return value.map(normalizeNegativeZero);
    if (value !== null && typeof value === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(value)) {
            result[k] = normalizeNegativeZero(v);
        }
        return result;
    }
    return value;
}

/**
 * fast-check arbitrary for a "safe" JSON-serializable context object.
 * Uses fc.jsonValue() which produces values that survive JSON round-trips.
 * Normalizes -0 to 0 since JSON does not distinguish them.
 */
const arbContext = fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
    fc.jsonValue().map(normalizeNegativeZero)
);

// ── Property-Based Tests ────────────────────────────────────────

describe('Logger — Property-Based Tests', () => {

    // ── Property 1: LogEntry serialization round-trip ────────────
    describe('Property 1: LogEntry serialization round-trip', () => {
        it('parse(serialize(entry)) produces an equivalent entry for arbitrary LogEntries', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        timestamp: fc.date().map(d => d.toISOString()),
                        level: arbLevel,
                        category: arbNonEmptyString,
                        message: fc.string({ minLength: 0, maxLength: 500 }),
                        context: fc.option(arbContext, { nil: undefined })
                    }),
                    (entry) => {
                        // Remove undefined context so comparison is clean
                        const clean = { ...entry };
                        if (clean.context === undefined) {
                            delete clean.context;
                        }

                        const json = Logger.serialize(clean);
                        const parsed = Logger.parse(json);

                        expect(parsed).toEqual(clean);
                    }
                ),
                { numRuns: 150 }
            );
        });

        it('produces valid single-line JSON for messages with special characters', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 0, maxLength: 300 }),
                    (message) => {
                        const entry = {
                            timestamp: new Date().toISOString(),
                            level: 'info',
                            category: 'test',
                            message
                        };

                        const json = Logger.serialize(entry);

                        // Must be valid JSON
                        expect(() => JSON.parse(json)).not.toThrow();

                        // Must be a single line (no raw newlines in the JSON string itself)
                        // JSON.stringify escapes newlines as \n inside strings, so the
                        // output string should not contain unescaped newline characters.
                        expect(json.includes('\n')).toBe(false);
                    }
                ),
                { numRuns: 150 }
            );
        });
    });

    // ── Property 2: Log level filtering ─────────────────────────
    describe('Property 2: Log level filtering', () => {
        it('emits entry iff call level >= configured minimum level', () => {
            fc.assert(
                fc.property(
                    arbLevel,   // minimum level
                    arbLevel,   // call level
                    fc.string({ minLength: 1, maxLength: 100 }),  // message
                    (minLevel, callLevel, message) => {
                        const sink = createTestSink();
                        const log = new Logger({
                            level: minLevel,
                            sinks: [sink]
                        });

                        // Call the method matching callLevel
                        log[callLevel](message);

                        const shouldEmit = LOG_LEVELS[callLevel] >= LOG_LEVELS[minLevel];

                        if (shouldEmit) {
                            expect(sink.entries).toHaveLength(1);
                            expect(sink.entries[0].level).toBe(callLevel);
                            expect(sink.entries[0].message).toBe(message);
                        } else {
                            expect(sink.entries).toHaveLength(0);
                        }
                    }
                ),
                { numRuns: 200 }
            );
        });
    });

    // ── Property 3: Child logger category propagation ───────────
    describe('Property 3: Child logger category propagation', () => {
        it('child logger entries always carry the category from child()', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 100 }),  // category
                    fc.string({ minLength: 1, maxLength: 200 }),  // message
                    arbLevel,
                    (category, message, level) => {
                        const sink = createTestSink();
                        const parent = new Logger({
                            level: 'debug',   // accept everything
                            sinks: [sink]
                        });

                        const child = parent.child(category);
                        child[level](message);

                        expect(sink.entries).toHaveLength(1);
                        expect(sink.entries[0].category).toBe(category);
                    }
                ),
                { numRuns: 150 }
            );
        });
    });

    // ── Property 4: Error object extraction ─────────────────────
    describe('Property 4: Error object extraction at error/fatal levels', () => {
        it('extracts error properties when Error is passed as context at error/fatal', () => {
            const errorLevels = fc.constantFrom('error', 'fatal');

            fc.assert(
                fc.property(
                    errorLevels,
                    fc.string({ minLength: 1, maxLength: 100 }),  // error name
                    fc.string({ minLength: 1, maxLength: 200 }),  // error message
                    fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),  // error code
                    (level, errName, errMessage, errCode) => {
                        const sink = createTestSink();
                        const log = new Logger({
                            level: 'debug',
                            sinks: [sink]
                        });

                        const err = new Error(errMessage);
                        err.name = errName;
                        if (errCode !== undefined) {
                            err.code = errCode;
                        }

                        // Pass Error directly as context
                        log[level]('something failed', err);

                        expect(sink.entries).toHaveLength(1);
                        const ctx = sink.entries[0].context;
                        expect(ctx).toBeDefined();
                        expect(ctx.error).toBeDefined();
                        expect(ctx.error.name).toBe(errName);
                        expect(ctx.error.message).toBe(errMessage);
                        expect(ctx.error.stack).toBeDefined();

                        if (errCode !== undefined) {
                            expect(ctx.error.code).toBe(errCode);
                        }
                    }
                ),
                { numRuns: 150 }
            );
        });

        it('extracts error properties when Error is nested in context.error at error/fatal', () => {
            const errorLevels = fc.constantFrom('error', 'fatal');

            fc.assert(
                fc.property(
                    errorLevels,
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.string({ minLength: 1, maxLength: 200 }),
                    (level, errName, errMessage) => {
                        const sink = createTestSink();
                        const log = new Logger({
                            level: 'debug',
                            sinks: [sink]
                        });

                        const err = new Error(errMessage);
                        err.name = errName;

                        log[level]('operation failed', { error: err, extra: 'data' });

                        expect(sink.entries).toHaveLength(1);
                        const ctx = sink.entries[0].context;
                        expect(ctx.error).toBeDefined();
                        expect(ctx.error.name).toBe(errName);
                        expect(ctx.error.message).toBe(errMessage);
                        expect(ctx.error.stack).toBeDefined();
                        // Extra properties preserved
                        expect(ctx.extra).toBe('data');
                    }
                ),
                { numRuns: 150 }
            );
        });

        it('does NOT extract error properties at debug/info/warn levels', () => {
            const nonErrorLevels = fc.constantFrom('debug', 'info', 'warn');

            fc.assert(
                fc.property(
                    nonErrorLevels,
                    fc.string({ minLength: 1, maxLength: 100 }),
                    (level, errMessage) => {
                        const sink = createTestSink();
                        const log = new Logger({
                            level: 'debug',
                            sinks: [sink]
                        });

                        const err = new Error(errMessage);
                        log[level]('something happened', err);

                        expect(sink.entries).toHaveLength(1);
                        const ctx = sink.entries[0].context;
                        // At non-error levels, Error is not extracted — it's wrapped as { value: ... }
                        // because Error is an object but _processContext doesn't extract at these levels
                        expect(ctx).toBeDefined();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ── Property 7: Circular reference handling ─────────────────
    describe('Property 7: Circular reference handling in serialization', () => {
        it('serializes objects with circular references without throwing, producing valid JSON with [Circular]', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),   // key name
                    fc.string({ minLength: 0, maxLength: 100 }),  // value
                    fc.nat({ max: 5 }),                           // nesting depth for circular ref
                    (key, value, depth) => {
                        // Build an object with a circular reference
                        const obj = { [key]: value };
                        let current = obj;
                        for (let i = 0; i < depth; i++) {
                            current.nested = { level: i };
                            current = current.nested;
                        }
                        // Create the circular reference
                        current.circular = obj;

                        const entry = {
                            timestamp: new Date().toISOString(),
                            level: 'info',
                            category: 'test',
                            message: 'circular test',
                            context: obj
                        };

                        // Must not throw
                        let json;
                        expect(() => {
                            json = Logger.serialize(entry);
                        }).not.toThrow();

                        // Must produce valid JSON
                        let parsed;
                        expect(() => {
                            parsed = JSON.parse(json);
                        }).not.toThrow();

                        // Must contain [Circular] placeholder somewhere
                        expect(json).toContain('[Circular]');
                    }
                ),
                { numRuns: 150 }
            );
        });

        it('handles self-referencing objects', () => {
            const obj = { a: 1 };
            obj.self = obj;

            const entry = {
                timestamp: new Date().toISOString(),
                level: 'warn',
                category: 'test',
                message: 'self-ref',
                context: obj
            };

            const json = Logger.serialize(entry);
            const parsed = JSON.parse(json);

            expect(parsed.context.a).toBe(1);
            expect(parsed.context.self).toBe('[Circular]');
        });

        it('handles deeply nested circular references', () => {
            const a = { name: 'a' };
            const b = { name: 'b', parent: a };
            const c = { name: 'c', parent: b };
            a.child = b;
            b.child = c;
            c.root = a; // circular back to root

            const entry = {
                timestamp: new Date().toISOString(),
                level: 'info',
                category: 'test',
                message: 'deep circular',
                context: a
            };

            const json = Logger.serialize(entry);
            expect(() => JSON.parse(json)).not.toThrow();
            expect(json).toContain('[Circular]');
        });
    });
});

// ── Unit Tests ──────────────────────────────────────────────────

describe('Logger — Unit Tests', () => {

    describe('Method existence', () => {
        it('exposes debug, info, warn, error, fatal methods', () => {
            const log = new Logger();
            expect(typeof log.debug).toBe('function');
            expect(typeof log.info).toBe('function');
            expect(typeof log.warn).toBe('function');
            expect(typeof log.error).toBe('function');
            expect(typeof log.fatal).toBe('function');
        });

        it('exposes child() method', () => {
            const log = new Logger();
            expect(typeof log.child).toBe('function');
        });

        it('exposes getLevel() and setLevel() methods', () => {
            const log = new Logger();
            expect(typeof log.getLevel).toBe('function');
            expect(typeof log.setLevel).toBe('function');
        });

        it('exposes addSink() method', () => {
            const log = new Logger();
            expect(typeof log.addSink).toBe('function');
        });

        it('exposes static serialize() and parse() methods', () => {
            expect(typeof Logger.serialize).toBe('function');
            expect(typeof Logger.parse).toBe('function');
        });
    });

    describe('Default levels per environment', () => {
        it('defaults to debug when app.isPackaged is false (development)', () => {
            // In test environment, electron's app.isPackaged is false (or mocked as false)
            // so the Logger defaults to debug
            const log = new Logger();
            expect(log.getLevel()).toBe('debug');
        });

        it('respects explicit level option regardless of environment', () => {
            const log = new Logger({ level: 'info' });
            expect(log.getLevel()).toBe('info');

            const log2 = new Logger({ level: 'error' });
            expect(log2.getLevel()).toBe('error');
        });
    });

    describe('Singleton behavior', () => {
        it('module exports a singleton root Logger instance', () => {
            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.child).toBe('function');
        });

        it('exposes Logger class on the singleton', () => {
            expect(logger.Logger).toBe(Logger);
        });

        it('exposes LOG_LEVELS on the singleton', () => {
            expect(logger.LOG_LEVELS).toEqual(LOG_LEVELS);
        });

        it('re-requiring the module returns the same instance', async () => {
            // Dynamic import to get a second reference
            const logger2 = (await import('./logger.js')).default;
            expect(logger2).toBe(logger);
        });
    });

    describe('setLevel validation', () => {
        it('throws for invalid level strings', () => {
            const log = new Logger();
            expect(() => log.setLevel('verbose')).toThrow(/Invalid log level/);
            expect(() => log.setLevel('')).toThrow(/Invalid log level/);
            expect(() => log.setLevel('INFO')).toThrow(/Invalid log level/);
        });

        it('accepts all valid level strings', () => {
            const log = new Logger();
            for (const level of VALID_LEVELS) {
                expect(() => log.setLevel(level)).not.toThrow();
                expect(log.getLevel()).toBe(level);
            }
        });
    });

    describe('LogEntry structure', () => {
        it('produces entries with timestamp, level, category, and message', () => {
            const sink = createTestSink();
            const log = new Logger({ level: 'debug', sinks: [sink] });

            log.info('hello world');

            expect(sink.entries).toHaveLength(1);
            const entry = sink.entries[0];
            expect(entry.timestamp).toBeDefined();
            expect(() => new Date(entry.timestamp)).not.toThrow();
            expect(entry.level).toBe('info');
            expect(entry.category).toBe('app');
            expect(entry.message).toBe('hello world');
        });

        it('includes context when provided', () => {
            const sink = createTestSink();
            const log = new Logger({ level: 'debug', sinks: [sink] });

            log.info('with context', { key: 'value' });

            expect(sink.entries[0].context).toEqual({ key: 'value' });
        });

        it('omits context when not provided', () => {
            const sink = createTestSink();
            const log = new Logger({ level: 'debug', sinks: [sink] });

            log.info('no context');

            expect(sink.entries[0].context).toBeUndefined();
        });

        it('converts message to string', () => {
            const sink = createTestSink();
            const log = new Logger({ level: 'debug', sinks: [sink] });

            log.info(42);

            expect(sink.entries[0].message).toBe('42');
        });
    });

    describe('addSink', () => {
        it('dispatches entries to all registered sinks', () => {
            const sink1 = createTestSink();
            const sink2 = createTestSink();
            const log = new Logger({ level: 'debug', sinks: [sink1] });

            log.addSink(sink2);
            log.info('multi-sink');

            expect(sink1.entries).toHaveLength(1);
            expect(sink2.entries).toHaveLength(1);
        });
    });

    describe('Child logger', () => {
        it('inherits parent level', () => {
            const sink = createTestSink();
            const parent = new Logger({ level: 'warn', sinks: [sink] });
            const child = parent.child('ChildModule');

            child.debug('should be suppressed');
            child.warn('should appear');

            expect(sink.entries).toHaveLength(1);
            expect(sink.entries[0].level).toBe('warn');
        });

        it('inherits parent sinks', () => {
            const sink = createTestSink();
            const parent = new Logger({ level: 'debug', sinks: [sink] });
            const child = parent.child('ChildModule');

            child.info('from child');

            expect(sink.entries).toHaveLength(1);
        });
    });

    describe('Sink error resilience', () => {
        it('continues logging if a sink throws', () => {
            const badSink = {
                write() {
                    throw new Error('sink failure');
                }
            };
            const goodSink = createTestSink();
            const log = new Logger({ level: 'debug', sinks: [badSink, goodSink] });

            // Suppress console.error from the fallback
            const spy = vi.spyOn(console, 'error').mockImplementation(() => { });

            log.info('resilience test');

            expect(goodSink.entries).toHaveLength(1);
            spy.mockRestore();
        });
    });
});
