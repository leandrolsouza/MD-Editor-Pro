/**
 * IPC Error Codes Tests
 *
 * Property-based test (fast-check) validating correctness property P5.
 * Unit tests for VALIDATION_ERROR assignment and all known code mappings.
 *
 * Feature: observability-operations
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

const { IPC_ERROR_CODES, SYSTEM_ERROR_MAP, mapErrorToCode } = require('./ipc-error-codes');

// ── Constants ───────────────────────────────────────────────────

/** Known system error codes and their expected IPC mappings */
const KNOWN_SYSTEM_CODES = {
    'ENOENT': IPC_ERROR_CODES.FILE_NOT_FOUND,
    'EACCES': IPC_ERROR_CODES.PERMISSION_DENIED,
    'EPERM': IPC_ERROR_CODES.PERMISSION_DENIED,
    'ENOSPC': IPC_ERROR_CODES.DISK_FULL,
    'EROFS': IPC_ERROR_CODES.READ_ONLY_FS
};

const KNOWN_CODE_KEYS = Object.keys(KNOWN_SYSTEM_CODES);

/** All valid IPC error code values */
const VALID_IPC_CODES = Object.values(IPC_ERROR_CODES);

// ── Arbitraries ─────────────────────────────────────────────────

/** Arbitrary for known system error codes */
const arbKnownCode = fc.constantFrom(...KNOWN_CODE_KEYS);

/** Arbitrary for unknown system error codes (not in the known set) */
const arbUnknownCode = fc.string({ minLength: 1, maxLength: 20 })
    .filter(code => !KNOWN_CODE_KEYS.includes(code));

/** Arbitrary for error messages */
const arbMessage = fc.string({ minLength: 1, maxLength: 300 });

/** Build an Error with a specific system code and message */
function makeSystemError(code, message) {
    const err = new Error(message);
    err.code = code;
    return err;
}

// ── Property-Based Tests ────────────────────────────────────────

describe('IPC Error Codes — Property-Based Tests', () => {

    /**
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
     *
     * Property 5: IPC error code mapping
     *
     * For any Error with a known system code, mapErrorToCode SHALL return
     * the corresponding IPC error code and preserve the original message.
     * For any Error without a recognized code, mapErrorToCode SHALL return
     * INTERNAL_ERROR and preserve the original message.
     */
    describe('Property 5: IPC error code mapping', () => {

        it('maps known system error codes to their correct IPC error codes and preserves the message', () => {
            fc.assert(
                fc.property(
                    arbKnownCode,
                    arbMessage,
                    (systemCode, message) => {
                        const error = makeSystemError(systemCode, message);
                        const result = mapErrorToCode(error);

                        // Requirement 5.2: known codes map to descriptive IPC error codes
                        expect(result.errorCode).toBe(KNOWN_SYSTEM_CODES[systemCode]);

                        // Requirement 5.1: errorCode is a string
                        expect(typeof result.errorCode).toBe('string');

                        // Requirement 5.4: original message is preserved
                        expect(result.message).toBe(message);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('assigns INTERNAL_ERROR for errors with unknown system codes and preserves the message', () => {
            fc.assert(
                fc.property(
                    arbUnknownCode,
                    arbMessage,
                    (unknownCode, message) => {
                        const error = makeSystemError(unknownCode, message);
                        const result = mapErrorToCode(error);

                        // Requirement 5.3: unknown codes get INTERNAL_ERROR
                        expect(result.errorCode).toBe(IPC_ERROR_CODES.INTERNAL_ERROR);

                        // Requirement 5.1: errorCode is a string
                        expect(typeof result.errorCode).toBe('string');

                        // Requirement 5.4: original message is preserved
                        expect(result.message).toBe(message);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('assigns INTERNAL_ERROR for errors with no code property and preserves the message', () => {
            fc.assert(
                fc.property(
                    arbMessage,
                    (message) => {
                        const error = new Error(message);
                        const result = mapErrorToCode(error);

                        // Requirement 5.3: no code → INTERNAL_ERROR
                        expect(result.errorCode).toBe(IPC_ERROR_CODES.INTERNAL_ERROR);

                        // Requirement 5.4: original message is preserved
                        expect(result.message).toBe(message);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('always returns a valid IPC error code from the defined set', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        arbKnownCode.map(code => makeSystemError(code, 'test')),
                        arbUnknownCode.map(code => makeSystemError(code, 'test')),
                        fc.constant(new Error('plain error'))
                    ),
                    (error) => {
                        const result = mapErrorToCode(error);
                        expect(VALID_IPC_CODES).toContain(result.errorCode);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

// ── Unit Tests ──────────────────────────────────────────────────

describe('IPC Error Codes — Unit Tests', () => {

    describe('VALIDATION_ERROR assignment', () => {

        /**
         * **Validates: Requirement 5.5**
         */
        it('assigns VALIDATION_ERROR for errors with name "ValidationError"', () => {
            const error = new Error('Field "title" is required');
            error.name = 'ValidationError';
            const result = mapErrorToCode(error);

            expect(result.errorCode).toBe(IPC_ERROR_CODES.VALIDATION_ERROR);
            expect(result.message).toBe('Field "title" is required');
        });

        it('assigns VALIDATION_ERROR for errors with isValidationError flag', () => {
            const error = new Error('Invalid input data');
            error.isValidationError = true;
            const result = mapErrorToCode(error);

            expect(result.errorCode).toBe(IPC_ERROR_CODES.VALIDATION_ERROR);
            expect(result.message).toBe('Invalid input data');
        });
    });

    describe('known system code mappings', () => {

        it('maps ENOENT to FILE_NOT_FOUND', () => {
            const error = makeSystemError('ENOENT', 'no such file or directory');
            expect(mapErrorToCode(error).errorCode).toBe('FILE_NOT_FOUND');
        });

        it('maps EACCES to PERMISSION_DENIED', () => {
            const error = makeSystemError('EACCES', 'permission denied');
            expect(mapErrorToCode(error).errorCode).toBe('PERMISSION_DENIED');
        });

        it('maps EPERM to PERMISSION_DENIED', () => {
            const error = makeSystemError('EPERM', 'operation not permitted');
            expect(mapErrorToCode(error).errorCode).toBe('PERMISSION_DENIED');
        });

        it('maps ENOSPC to DISK_FULL', () => {
            const error = makeSystemError('ENOSPC', 'no space left on device');
            expect(mapErrorToCode(error).errorCode).toBe('DISK_FULL');
        });

        it('maps EROFS to READ_ONLY_FS', () => {
            const error = makeSystemError('EROFS', 'read-only file system');
            expect(mapErrorToCode(error).errorCode).toBe('READ_ONLY_FS');
        });
    });

    describe('fallback message', () => {

        it('uses default message when error has no message', () => {
            const error = new Error();
            error.message = '';
            const result = mapErrorToCode(error);

            expect(result.errorCode).toBe(IPC_ERROR_CODES.INTERNAL_ERROR);
            expect(result.message).toBe('An unexpected error occurred');
        });
    });

    describe('SYSTEM_ERROR_MAP completeness', () => {

        it('contains all five expected system error codes', () => {
            expect(Object.keys(SYSTEM_ERROR_MAP)).toEqual(
                expect.arrayContaining(['ENOENT', 'EACCES', 'EPERM', 'ENOSPC', 'EROFS'])
            );
            expect(Object.keys(SYSTEM_ERROR_MAP)).toHaveLength(5);
        });
    });

    describe('IPC_ERROR_CODES completeness', () => {

        it('contains all six expected IPC error codes', () => {
            expect(IPC_ERROR_CODES).toEqual({
                FILE_NOT_FOUND: 'FILE_NOT_FOUND',
                PERMISSION_DENIED: 'PERMISSION_DENIED',
                DISK_FULL: 'DISK_FULL',
                READ_ONLY_FS: 'READ_ONLY_FS',
                VALIDATION_ERROR: 'VALIDATION_ERROR',
                INTERNAL_ERROR: 'INTERNAL_ERROR'
            });
        });
    });
});
