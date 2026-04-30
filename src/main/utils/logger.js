/**
 * Centralized Structured Logger
 *
 * Replaces scattered console.log/console.error calls with a structured,
 * level-aware logging system. Supports multiple sinks (console, file),
 * child loggers with preset categories, and safe serialization of
 * complex objects including circular references.
 */

const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
};

const VALID_LEVELS = Object.keys(LOG_LEVELS);

/**
 * Detect whether the app is running in production mode.
 * Works both when Electron's app module is available and in plain Node (tests).
 */
function isProduction() {
    try {
        const { app } = require('electron');
        return app && app.isPackaged;
    } catch {
        return process.env.NODE_ENV === 'production';
    }
}

/**
 * Build a JSON-safe replacer that replaces circular references with "[Circular]".
 * Returns a standard replacer function for JSON.stringify.
 */
function buildCircularReplacer() {
    const seen = new WeakSet();
    return (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }
        return value;
    };
}

/**
 * Extract useful properties from an Error object.
 * @param {Error} err
 * @returns {{ name: string, message: string, code: string|undefined, stack: string|undefined }}
 */
function extractError(err) {
    if (!(err instanceof Error)) {
        return err;
    }
    return {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack
    };
}

/**
 * Default console sink — writes structured JSON to stdout/stderr.
 */
const consoleSink = {
    write(entry) {
        const json = Logger.serialize(entry);
        const level = entry.level;
        if (level === 'error' || level === 'fatal') {
            console.error(json);
        } else if (level === 'warn') {
            console.warn(json);
        } else {
            console.log(json);
        }
    }
};

class Logger {
    /**
     * @param {Object} options
     * @param {string}  [options.category='app']  - Category label for log entries
     * @param {string}  [options.level]           - Minimum log level (auto-detected if omitted)
     * @param {Array}   [options.sinks]           - Array of sink objects with a write(entry) method
     * @param {boolean} [options._isChild=false]  - Internal flag for child loggers
     */
    constructor(options = {}) {
        this._category = options.category || 'app';
        this._sinks = options.sinks || [consoleSink];
        this._isChild = options._isChild || false;

        if (options.level) {
            this._validateLevel(options.level);
            this._level = options.level;
        } else {
            this._level = isProduction() ? 'info' : 'debug';
        }
    }

    // ── Public API ──────────────────────────────────────────────

    /**
     * Create a child logger that inherits sinks and level but has a fixed category.
     * @param {string} category
     * @returns {Logger}
     */
    child(category) {
        return new Logger({
            category,
            level: this._level,
            sinks: this._sinks,
            _isChild: true
        });
    }

    /** @param {string} message @param {Object} [context] */
    debug(message, context) {
        this._log('debug', message, context);
    }

    /** @param {string} message @param {Object} [context] */
    info(message, context) {
        this._log('info', message, context);
    }

    /** @param {string} message @param {Object} [context] */
    warn(message, context) {
        this._log('warn', message, context);
    }

    /** @param {string} message @param {Object} [context] */
    error(message, context) {
        this._log('error', message, context);
    }

    /** @param {string} message @param {Object} [context] */
    fatal(message, context) {
        this._log('fatal', message, context);
    }

    /**
     * Get the current minimum log level.
     * @returns {string}
     */
    getLevel() {
        return this._level;
    }

    /**
     * Set the minimum log level.
     * @param {string} level - One of: debug, info, warn, error, fatal
     */
    setLevel(level) {
        this._validateLevel(level);
        this._level = level;
    }

    /**
     * Add a log sink.
     * @param {{ write: function }} sink
     */
    addSink(sink) {
        this._sinks.push(sink);
    }

    // ── Static helpers ──────────────────────────────────────────

    /**
     * Serialize a LogEntry to a single-line JSON string.
     * Handles circular references by replacing them with "[Circular]".
     * @param {Object} entry - A LogEntry object
     * @returns {string} JSON string
     */
    static serialize(entry) {
        return JSON.stringify(entry, buildCircularReplacer());
    }

    /**
     * Parse a JSON string back into a LogEntry object.
     * @param {string} json
     * @returns {Object} LogEntry
     */
    static parse(json) {
        return JSON.parse(json);
    }

    // ── Internal ────────────────────────────────────────────────

    /**
     * Core logging method. Builds a LogEntry and dispatches to all sinks.
     * @param {string} level
     * @param {string} message
     * @param {Object} [context]
     */
    _log(level, message, context) {
        if (LOG_LEVELS[level] < LOG_LEVELS[this._level]) {
            return;
        }

        const entry = {
            timestamp: new Date().toISOString(),
            level,
            category: this._category,
            message: String(message)
        };

        if (context !== undefined && context !== null) {
            entry.context = this._processContext(level, context);
        }

        for (const sink of this._sinks) {
            try {
                sink.write(entry);
            } catch (sinkError) {
                // Last-resort fallback: write raw message to console
                console.error(`[Logger] Sink write failed: ${sinkError.message}`);
                console.error(`[Logger] Original: [${level}] ${message}`);
            }
        }
    }

    /**
     * Process context metadata. At error/fatal levels, extract Error objects.
     * @param {string} level
     * @param {Object} context
     * @returns {Object}
     */
    _processContext(level, context) {
        if (context instanceof Error && (level === 'error' || level === 'fatal')) {
            return { error: extractError(context) };
        }

        if (typeof context !== 'object') {
            return { value: context };
        }

        // For error/fatal levels, look for an 'error' property that is an Error instance
        if ((level === 'error' || level === 'fatal') && context.error instanceof Error) {
            return {
                ...context,
                error: extractError(context.error)
            };
        }

        return context;
    }

    /**
     * Validate that a level string is recognized.
     * @param {string} level
     */
    _validateLevel(level) {
        if (!VALID_LEVELS.includes(level)) {
            throw new Error(
                `Invalid log level "${level}". Must be one of: ${VALID_LEVELS.join(', ')}`
            );
        }
    }
}

// ── Singleton root instance ─────────────────────────────────────
const rootLogger = new Logger();

// Expose the class for testing and advanced usage
rootLogger.Logger = Logger;
rootLogger.LOG_LEVELS = LOG_LEVELS;

module.exports = rootLogger;
