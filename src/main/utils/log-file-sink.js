/**
 * Log File Sink
 *
 * Persistent log file writer with rotation and retention.
 * Writes LogEntries as newline-delimited JSON (NDJSON) to date-based log files.
 *
 * - Rotates when a file exceeds 5 MB
 * - Retains a maximum of 7 log files
 * - Falls back to console-only output on write failure
 */

const fs = require('fs');
const path = require('path');
const loggerModule = require('./logger');
const LoggerClass = loggerModule.Logger;
const LOG_LEVELS = loggerModule.LOG_LEVELS;

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const DEFAULT_MAX_FILES = 7;
const LOG_FILE_PREFIX = 'md-editor-pro-';
const LOG_FILE_EXT = '.log';

/**
 * Get the default log directory using Electron's app.getPath('userData').
 * Falls back to a temp directory if Electron is not available.
 * @returns {string}
 */
function getDefaultLogDirectory() {
    try {
        const { app } = require('electron');
        return path.join(app.getPath('userData'), 'logs');
    } catch {
        return path.join(require('os').tmpdir(), 'md-editor-pro-logs');
    }
}

/**
 * Format a Date as YYYY-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Build a log file name from a date string.
 * @param {string} dateStr - YYYY-MM-DD formatted date
 * @returns {string}
 */
function buildFileName(dateStr) {
    return `${LOG_FILE_PREFIX}${dateStr}${LOG_FILE_EXT}`;
}

class LogFileSink {
    /**
     * @param {Object} options
     * @param {string}  [options.directory]    - Log file directory
     * @param {number}  [options.maxFileSize]  - Max file size in bytes before rotation (default: 5 MB)
     * @param {number}  [options.maxFiles]     - Max number of retained log files (default: 7)
     * @param {string}  [options.minLevel]     - Minimum level to write to file (default: 'info')
     */
    constructor(options = {}) {
        this._directory = options.directory || getDefaultLogDirectory();
        this._maxFileSize = options.maxFileSize || DEFAULT_MAX_FILE_SIZE;
        this._maxFiles = options.maxFiles || DEFAULT_MAX_FILES;
        this._minLevel = options.minLevel || 'info';
        this._fd = null;
        this._currentFilePath = null;
        this._currentSize = 0;
        this._closed = false;

        this._ensureDirectory();
        this._openCurrentFile();
    }

    /**
     * Write a log entry to the current log file as NDJSON.
     * Falls back to console on failure.
     * @param {Object} entry - A LogEntry object
     */
    write(entry) {
        if (this._closed) {
            return;
        }

        // Filter by minimum level
        if (LOG_LEVELS[entry.level] < LOG_LEVELS[this._minLevel]) {
            return;
        }

        try {
            const line = LoggerClass.serialize(entry) + '\n';
            const bytes = Buffer.byteLength(line, 'utf8');

            // Check if we need to rotate before writing
            if (this._fd !== null && this._currentSize + bytes > this._maxFileSize) {
                this._rotate();
            }

            // Ensure we have a valid file descriptor
            if (this._fd === null) {
                this._openCurrentFile();
            }

            if (this._fd !== null) {
                fs.writeSync(this._fd, line, null, 'utf8');
                this._currentSize += bytes;
            }
        } catch (err) {
            // Fallback: console-only output, log a warning
            console.warn(`[LogFileSink] Failed to write to log file: ${err.message}`);
            try {
                console.log(LoggerClass.serialize(entry));
            } catch {
                console.log(`[${entry.level}] ${entry.message}`);
            }
        }
    }

    /**
     * Close the file handle.
     */
    close() {
        this._closed = true;
        this._closeCurrentFd();
    }

    // ── Internal ────────────────────────────────────────────────

    /**
     * Ensure the log directory exists.
     */
    _ensureDirectory() {
        try {
            fs.mkdirSync(this._directory, { recursive: true });
        } catch (err) {
            console.warn(`[LogFileSink] Failed to create log directory: ${err.message}`);
        }
    }

    /**
     * Open (or reopen) the current date-based log file.
     */
    _openCurrentFile() {
        try {
            const dateStr = formatDate(new Date());
            const fileName = buildFileName(dateStr);
            const filePath = path.join(this._directory, fileName);

            this._closeCurrentFd();

            this._fd = fs.openSync(filePath, 'a');
            this._currentFilePath = filePath;

            // Get current file size for rotation tracking
            const stats = fs.fstatSync(this._fd);
            this._currentSize = stats.size;
        } catch (err) {
            console.warn(`[LogFileSink] Failed to open log file: ${err.message}`);
            this._fd = null;
            this._currentFilePath = null;
            this._currentSize = 0;
        }
    }

    /**
     * Close the current file descriptor if open.
     */
    _closeCurrentFd() {
        if (this._fd !== null) {
            try {
                fs.closeSync(this._fd);
            } catch {
                // Ignore close errors
            }
            this._fd = null;
        }
    }

    /**
     * Rotate to a new log file. Closes the current file and opens a fresh one.
     * Then cleans up old files beyond the retention limit.
     */
    _rotate() {
        this._closeCurrentFd();
        this._currentSize = 0;

        // Open a new file for today's date.
        // If the current date file is the one that exceeded the limit,
        // we still reopen it (append mode) — the size check will be
        // based on the new _currentSize after cleanup.
        this._openCurrentFile();

        // Clean up old files
        this._cleanup();
    }

    /**
     * Remove old log files beyond the retention limit.
     * Keeps the most recent maxFiles files.
     */
    _cleanup() {
        try {
            const files = fs.readdirSync(this._directory)
                .filter(f => f.startsWith(LOG_FILE_PREFIX) && f.endsWith(LOG_FILE_EXT))
                .sort(); // Lexicographic sort works for YYYY-MM-DD naming

            if (files.length <= this._maxFiles) {
                return;
            }

            const toDelete = files.slice(0, files.length - this._maxFiles);
            for (const file of toDelete) {
                try {
                    fs.unlinkSync(path.join(this._directory, file));
                } catch {
                    // Ignore individual delete failures
                }
            }
        } catch (err) {
            console.warn(`[LogFileSink] Failed to clean up old log files: ${err.message}`);
        }
    }
}

module.exports = LogFileSink;
