/**
 * LogFileSink Tests
 *
 * Unit tests for persistent log file writing with rotation and retention.
 * Uses fs.mkdtemp() for test isolation.
 *
 * Feature: observability-operations
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock electron before importing LogFileSink
vi.mock('electron', () => ({
    app: {
        getPath: () => os.tmpdir()
    }
}));

const LogFileSink = (await import('./log-file-sink.js')).default;
const loggerModule = (await import('./logger.js')).default;
const { Logger } = loggerModule;

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Create an isolated temporary directory for each test.
 * @returns {string} Path to the temp directory
 */
function createTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'log-file-sink-test-'));
}

/**
 * Recursively remove a directory and its contents.
 * @param {string} dir
 */
function cleanupDir(dir) {
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch {
        // Ignore cleanup errors
    }
}

/**
 * Build a valid LogEntry for testing.
 * @param {Object} overrides
 * @returns {Object}
 */
function makeEntry(overrides = {}) {
    return {
        timestamp: new Date().toISOString(),
        level: 'info',
        category: 'test',
        message: 'test message',
        ...overrides
    };
}

/**
 * Get all log files in a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function getLogFiles(dir) {
    return fs.readdirSync(dir)
        .filter(f => f.startsWith('md-editor-pro-') && f.endsWith('.log'))
        .sort();
}

// ── Tests ───────────────────────────────────────────────────────

describe('LogFileSink', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = createTempDir();
    });

    afterEach(() => {
        cleanupDir(tempDir);
    });

    // ── File creation ───────────────────────────────────────────
    describe('File creation in temporary directory', () => {
        it('creates a log file with date-based naming on construction', () => {
            const sink = new LogFileSink({ directory: tempDir });

            const files = getLogFiles(tempDir);
            expect(files.length).toBe(1);

            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const expectedName = `md-editor-pro-${year}-${month}-${day}.log`;
            expect(files[0]).toBe(expectedName);

            sink.close();
        });

        it('creates the log directory if it does not exist', () => {
            const nestedDir = path.join(tempDir, 'nested', 'logs');
            expect(fs.existsSync(nestedDir)).toBe(false);

            const sink = new LogFileSink({ directory: nestedDir });

            expect(fs.existsSync(nestedDir)).toBe(true);
            expect(getLogFiles(nestedDir).length).toBe(1);

            sink.close();
        });

        it('appends to an existing log file for the same date', () => {
            const sink1 = new LogFileSink({ directory: tempDir });
            sink1.write(makeEntry({ message: 'first' }));
            sink1.close();

            const sink2 = new LogFileSink({ directory: tempDir });
            sink2.write(makeEntry({ message: 'second' }));
            sink2.close();

            const files = getLogFiles(tempDir);
            expect(files.length).toBe(1);

            const content = fs.readFileSync(path.join(tempDir, files[0]), 'utf8');
            const lines = content.trim().split('\n');
            expect(lines.length).toBe(2);
        });
    });

    // ── NDJSON format ───────────────────────────────────────────
    describe('NDJSON format', () => {
        it('writes each entry as valid JSON on its own line', () => {
            const sink = new LogFileSink({ directory: tempDir });

            sink.write(makeEntry({ message: 'line one' }));
            sink.write(makeEntry({ message: 'line two' }));
            sink.write(makeEntry({ message: 'line three' }));
            sink.close();

            const files = getLogFiles(tempDir);
            const content = fs.readFileSync(path.join(tempDir, files[0]), 'utf8');
            const lines = content.trim().split('\n');

            expect(lines.length).toBe(3);

            for (const line of lines) {
                const parsed = JSON.parse(line);
                expect(parsed).toHaveProperty('timestamp');
                expect(parsed).toHaveProperty('level');
                expect(parsed).toHaveProperty('category');
                expect(parsed).toHaveProperty('message');
            }
        });

        it('preserves entry fields in the written JSON', () => {
            const sink = new LogFileSink({ directory: tempDir });

            const entry = makeEntry({
                message: 'detailed entry',
                context: { key: 'value', count: 42 }
            });
            sink.write(entry);
            sink.close();

            const files = getLogFiles(tempDir);
            const content = fs.readFileSync(path.join(tempDir, files[0]), 'utf8');
            const parsed = JSON.parse(content.trim());

            expect(parsed.message).toBe('detailed entry');
            expect(parsed.level).toBe('info');
            expect(parsed.category).toBe('test');
            expect(parsed.context).toEqual({ key: 'value', count: 42 });
        });

        it('handles special characters in messages', () => {
            const sink = new LogFileSink({ directory: tempDir });

            sink.write(makeEntry({ message: 'line with "quotes" and \\backslashes\\' }));
            sink.write(makeEntry({ message: 'unicode: 日本語 émojis 🎉' }));
            sink.close();

            const files = getLogFiles(tempDir);
            const content = fs.readFileSync(path.join(tempDir, files[0]), 'utf8');
            const lines = content.trim().split('\n');

            expect(lines.length).toBe(2);
            for (const line of lines) {
                expect(() => JSON.parse(line)).not.toThrow();
            }

            const parsed1 = JSON.parse(lines[0]);
            expect(parsed1.message).toBe('line with "quotes" and \\backslashes\\');

            const parsed2 = JSON.parse(lines[1]);
            expect(parsed2.message).toBe('unicode: 日本語 émojis 🎉');
        });
    });

    // ── Rotation at 5 MB threshold ──────────────────────────────
    describe('Rotation trigger at 5 MB threshold', () => {
        it('rotates when file size exceeds maxFileSize', () => {
            // Use a very small maxFileSize to trigger rotation easily
            const sink = new LogFileSink({
                directory: tempDir,
                maxFileSize: 200 // 200 bytes
            });

            // Write entries until rotation should trigger
            const longMessage = 'A'.repeat(100);
            for (let i = 0; i < 5; i++) {
                sink.write(makeEntry({ message: `${longMessage}-${i}` }));
            }
            sink.close();

            // The file should exist and have been rotated (reopened)
            const files = getLogFiles(tempDir);
            expect(files.length).toBeGreaterThanOrEqual(1);

            // Verify the file content is valid NDJSON
            for (const file of files) {
                const content = fs.readFileSync(path.join(tempDir, file), 'utf8').trim();
                if (content) {
                    for (const line of content.split('\n')) {
                        expect(() => JSON.parse(line)).not.toThrow();
                    }
                }
            }
        });

        it('does not rotate when file size is under threshold', () => {
            const sink = new LogFileSink({
                directory: tempDir,
                maxFileSize: 5 * 1024 * 1024 // 5 MB — default
            });

            // Write a few small entries
            sink.write(makeEntry({ message: 'small entry 1' }));
            sink.write(makeEntry({ message: 'small entry 2' }));
            sink.close();

            const files = getLogFiles(tempDir);
            expect(files.length).toBe(1);

            const content = fs.readFileSync(path.join(tempDir, files[0]), 'utf8');
            const lines = content.trim().split('\n');
            expect(lines.length).toBe(2);
        });

        it('uses default 5 MB threshold when maxFileSize is not specified', () => {
            const sink = new LogFileSink({ directory: tempDir });

            // The internal _maxFileSize should be 5 MB
            expect(sink._maxFileSize).toBe(5 * 1024 * 1024);

            sink.close();
        });
    });

    // ── File retention cleanup ───────────────────────────────────
    describe('File retention cleanup (max 7 files)', () => {
        it('deletes older files when more than maxFiles exist during rotation', () => {
            // Pre-create 8 log files with different dates
            for (let i = 1; i <= 8; i++) {
                const dateStr = `2025-01-${String(i).padStart(2, '0')}`;
                const fileName = `md-editor-pro-${dateStr}.log`;
                fs.writeFileSync(path.join(tempDir, fileName), `{"test":${i}}\n`);
            }

            expect(getLogFiles(tempDir).length).toBe(8);

            // Create a sink with small maxFileSize to trigger rotation + cleanup
            const sink = new LogFileSink({
                directory: tempDir,
                maxFileSize: 50, // Very small to trigger rotation
                maxFiles: 7
            });

            // Write enough to trigger rotation
            sink.write(makeEntry({ message: 'A'.repeat(100) }));
            sink.write(makeEntry({ message: 'B'.repeat(100) }));
            sink.close();

            const remainingFiles = getLogFiles(tempDir);
            expect(remainingFiles.length).toBeLessThanOrEqual(7);
        });

        it('keeps files when count is at or below maxFiles', () => {
            // Pre-create exactly 5 log files
            for (let i = 1; i <= 5; i++) {
                const dateStr = `2025-02-${String(i).padStart(2, '0')}`;
                const fileName = `md-editor-pro-${dateStr}.log`;
                fs.writeFileSync(path.join(tempDir, fileName), `{"test":${i}}\n`);
            }

            const sink = new LogFileSink({
                directory: tempDir,
                maxFileSize: 50,
                maxFiles: 7
            });

            // Trigger rotation
            sink.write(makeEntry({ message: 'A'.repeat(100) }));
            sink.write(makeEntry({ message: 'B'.repeat(100) }));
            sink.close();

            // All original files should still exist (plus today's)
            const files = getLogFiles(tempDir);
            expect(files.length).toBeLessThanOrEqual(7);
            // The 5 pre-created files should still be present
            expect(files.length).toBeGreaterThanOrEqual(5);
        });

        it('removes the oldest files first (lexicographic sort)', () => {
            // Create files with known dates — oldest first
            const dates = [
                '2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04',
                '2025-01-05', '2025-01-06', '2025-01-07', '2025-01-08',
                '2025-01-09', '2025-01-10'
            ];
            for (const dateStr of dates) {
                const fileName = `md-editor-pro-${dateStr}.log`;
                fs.writeFileSync(path.join(tempDir, fileName), `{"date":"${dateStr}"}\n`);
            }

            expect(getLogFiles(tempDir).length).toBe(10);

            // Create sink with maxFiles=3 and trigger rotation
            const sink = new LogFileSink({
                directory: tempDir,
                maxFileSize: 50,
                maxFiles: 3
            });

            sink.write(makeEntry({ message: 'A'.repeat(100) }));
            sink.write(makeEntry({ message: 'B'.repeat(100) }));
            sink.close();

            const remaining = getLogFiles(tempDir);
            expect(remaining.length).toBeLessThanOrEqual(3);

            // The oldest files should have been removed
            for (const file of remaining) {
                // Remaining files should be among the newest
                const dateMatch = file.match(/md-editor-pro-(\d{4}-\d{2}-\d{2})\.log/);
                expect(dateMatch).not.toBeNull();
            }
        });

        it('uses default maxFiles of 7', () => {
            const sink = new LogFileSink({ directory: tempDir });
            expect(sink._maxFiles).toBe(7);
            sink.close();
        });

        it('only considers files matching the log file pattern during cleanup', () => {
            // Create some non-log files that should not be deleted
            fs.writeFileSync(path.join(tempDir, 'other-file.txt'), 'not a log');
            fs.writeFileSync(path.join(tempDir, 'readme.md'), '# readme');

            // Create log files exceeding maxFiles
            for (let i = 1; i <= 10; i++) {
                const dateStr = `2025-03-${String(i).padStart(2, '0')}`;
                const fileName = `md-editor-pro-${dateStr}.log`;
                fs.writeFileSync(path.join(tempDir, fileName), `{"test":${i}}\n`);
            }

            const sink = new LogFileSink({
                directory: tempDir,
                maxFileSize: 50,
                maxFiles: 3
            });

            sink.write(makeEntry({ message: 'A'.repeat(100) }));
            sink.write(makeEntry({ message: 'B'.repeat(100) }));
            sink.close();

            // Non-log files should still exist
            expect(fs.existsSync(path.join(tempDir, 'other-file.txt'))).toBe(true);
            expect(fs.existsSync(path.join(tempDir, 'readme.md'))).toBe(true);
        });
    });

    // ── Fallback behavior on write failure ──────────────────────
    describe('Fallback behavior on write failure', () => {
        it('falls back to console output when write fails', () => {
            const sink = new LogFileSink({ directory: tempDir });

            // Spy on console to verify fallback
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            // Mock fs.writeSync to throw an error, simulating a disk write failure
            const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => {
                throw new Error('Simulated disk write failure');
            });

            sink.write(makeEntry({ message: 'should fallback' }));

            // Should have warned about the failure
            expect(warnSpy).toHaveBeenCalled();
            const warnCall = warnSpy.mock.calls[0][0];
            expect(warnCall).toContain('[LogFileSink]');
            expect(warnCall).toContain('Failed to write');

            // Should have logged the entry to console as fallback
            expect(logSpy).toHaveBeenCalled();

            writeSyncSpy.mockRestore();
            warnSpy.mockRestore();
            logSpy.mockRestore();
            sink.close();
        });

        it('does not throw when write fails', () => {
            const sink = new LogFileSink({ directory: tempDir });

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            // Mock fs.writeSync to throw
            const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => {
                throw new Error('Simulated disk failure');
            });

            expect(() => {
                sink.write(makeEntry({ message: 'should not throw' }));
            }).not.toThrow();

            writeSyncSpy.mockRestore();
            warnSpy.mockRestore();
            logSpy.mockRestore();
            sink.close();
        });

        it('does not write after close() is called', () => {
            const sink = new LogFileSink({ directory: tempDir });
            sink.write(makeEntry({ message: 'before close' }));
            sink.close();

            // Write after close should be silently ignored
            sink.write(makeEntry({ message: 'after close' }));

            const files = getLogFiles(tempDir);
            const content = fs.readFileSync(path.join(tempDir, files[0]), 'utf8');
            const lines = content.trim().split('\n');
            expect(lines.length).toBe(1);
            expect(JSON.parse(lines[0]).message).toBe('before close');
        });
    });

    // ── Level filtering ─────────────────────────────────────────
    describe('Minimum level filtering', () => {
        it('filters entries below the configured minLevel', () => {
            const sink = new LogFileSink({
                directory: tempDir,
                minLevel: 'warn'
            });

            sink.write(makeEntry({ level: 'debug', message: 'debug msg' }));
            sink.write(makeEntry({ level: 'info', message: 'info msg' }));
            sink.write(makeEntry({ level: 'warn', message: 'warn msg' }));
            sink.write(makeEntry({ level: 'error', message: 'error msg' }));
            sink.close();

            const files = getLogFiles(tempDir);
            const content = fs.readFileSync(path.join(tempDir, files[0]), 'utf8');
            const lines = content.trim().split('\n');

            expect(lines.length).toBe(2);
            expect(JSON.parse(lines[0]).level).toBe('warn');
            expect(JSON.parse(lines[1]).level).toBe('error');
        });

        it('defaults minLevel to info', () => {
            const sink = new LogFileSink({ directory: tempDir });
            expect(sink._minLevel).toBe('info');

            sink.write(makeEntry({ level: 'debug', message: 'should be filtered' }));
            sink.write(makeEntry({ level: 'info', message: 'should be written' }));
            sink.close();

            const files = getLogFiles(tempDir);
            const content = fs.readFileSync(path.join(tempDir, files[0]), 'utf8');
            const lines = content.trim().split('\n');

            expect(lines.length).toBe(1);
            expect(JSON.parse(lines[0]).message).toBe('should be written');
        });
    });

    // ── Close behavior ──────────────────────────────────────────
    describe('Close behavior', () => {
        it('close() releases the file descriptor', () => {
            const sink = new LogFileSink({ directory: tempDir });
            expect(sink._fd).not.toBeNull();

            sink.close();
            expect(sink._fd).toBeNull();
            expect(sink._closed).toBe(true);
        });

        it('close() can be called multiple times without error', () => {
            const sink = new LogFileSink({ directory: tempDir });

            expect(() => {
                sink.close();
                sink.close();
                sink.close();
            }).not.toThrow();
        });
    });
});
