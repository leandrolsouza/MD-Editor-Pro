/**
 * IPC Error Codes — maps system-level errors to application-level error codes
 * for structured IPC error responses.
 *
 * Follows the error categorization pattern from auto-updater.js but maps
 * system error codes (ENOENT, EACCES, etc.) to IPC error codes.
 */

/** Structured IPC error code constants */
const IPC_ERROR_CODES = {
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    DISK_FULL: 'DISK_FULL',
    READ_ONLY_FS: 'READ_ONLY_FS',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};

/** Map system error codes to IPC error codes */
const SYSTEM_ERROR_MAP = {
    'ENOENT': IPC_ERROR_CODES.FILE_NOT_FOUND,
    'EACCES': IPC_ERROR_CODES.PERMISSION_DENIED,
    'EPERM': IPC_ERROR_CODES.PERMISSION_DENIED,
    'ENOSPC': IPC_ERROR_CODES.DISK_FULL,
    'EROFS': IPC_ERROR_CODES.READ_ONLY_FS
};

/**
 * Map an error to an IPC error code.
 * @param {Error} error - The original error
 * @returns {{ errorCode: string, message: string }}
 */
function mapErrorToCode(error) {
    const message = error.message || 'An unexpected error occurred';

    // Check for known system error codes
    if (error.code && Object.prototype.hasOwnProperty.call(SYSTEM_ERROR_MAP, error.code)) {
        return {
            errorCode: SYSTEM_ERROR_MAP[error.code],
            message
        };
    }

    // Check for validation errors
    if (error.name === 'ValidationError' || error.isValidationError) {
        return {
            errorCode: IPC_ERROR_CODES.VALIDATION_ERROR,
            message
        };
    }

    // Default to INTERNAL_ERROR for unknown errors
    return {
        errorCode: IPC_ERROR_CODES.INTERNAL_ERROR,
        message
    };
}

module.exports = {
    IPC_ERROR_CODES,
    SYSTEM_ERROR_MAP,
    mapErrorToCode
};
