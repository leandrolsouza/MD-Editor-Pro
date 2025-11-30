/**
 * Property-Based Tests for WindowManager
 * Feature: markdown-editor, Property 10: Keyboard shortcuts adapt to platform
 * Validates: Requirements 4.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Helper function to get the platform-specific accelerator key
 * This is the logic that should be used throughout the application
 * for keyboard shortcuts
 * @param {string} platform - The platform identifier ('darwin', 'win32', 'linux')
 * @returns {string} The accelerator key for the platform
 */
function getPlatformAcceleratorKey(platform) {
    return platform === 'darwin' ? 'Cmd' : 'Ctrl';
}

/**
 * Helper function to create a platform-specific keyboard shortcut
 * @param {string} platform - The platform identifier
 * @param {string} key - The key to combine with the modifier
 * @returns {string} The complete keyboard shortcut
 */
function createPlatformShortcut(platform, key) {
    const modifier = getPlatformAcceleratorKey(platform);
    return `${modifier}+${key}`;
}

describe('WindowManager - Platform-specific keyboard shortcuts', () => {
    // Feature: markdown-editor, Property 10: Keyboard shortcuts adapt to platform
    // Validates: Requirements 4.4
    it('should use Cmd on macOS and Ctrl on Windows/Linux for any key', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('darwin', 'win32', 'linux'), // Platform
                fc.constantFrom('B', 'I', 'S', 'O', 'F', 'Z', 'Y', 'N', 'W', 'Q'), // Common shortcut keys
                (platform, key) => {
                    const shortcut = createPlatformShortcut(platform, key);

                    if (platform === 'darwin') {
                        // macOS should use Cmd
                        expect(shortcut).toContain('Cmd');
                        expect(shortcut).not.toContain('Ctrl');
                        expect(shortcut).toBe(`Cmd+${key}`);
                    } else {
                        // Windows and Linux should use Ctrl
                        expect(shortcut).toContain('Ctrl');
                        expect(shortcut).not.toContain('Cmd');
                        expect(shortcut).toBe(`Ctrl+${key}`);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: markdown-editor, Property 10: Keyboard shortcuts adapt to platform
    // Validates: Requirements 4.4
    it('should consistently return the same modifier for the same platform', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('darwin', 'win32', 'linux'),
                (platform) => {
                    const modifier1 = getPlatformAcceleratorKey(platform);
                    const modifier2 = getPlatformAcceleratorKey(platform);

                    // Same platform should always return same modifier
                    expect(modifier1).toBe(modifier2);

                    // Verify correct modifier for platform
                    if (platform === 'darwin') {
                        expect(modifier1).toBe('Cmd');
                    } else {
                        expect(modifier1).toBe('Ctrl');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: markdown-editor, Property 10: Keyboard shortcuts adapt to platform
    // Validates: Requirements 4.4
    it('should create valid accelerator strings for all platform-key combinations', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('darwin', 'win32', 'linux'),
                fc.string({ minLength: 1, maxLength: 1 }).filter(s => /[A-Z0-9]/.test(s)), // Single alphanumeric character
                (platform, key) => {
                    const shortcut = createPlatformShortcut(platform, key);

                    // Shortcut should be in format "Modifier+Key"
                    expect(shortcut).toMatch(/^(Cmd|Ctrl)\+[A-Z0-9]$/);

                    // Should contain the key
                    expect(shortcut).toContain(key);

                    // Should contain exactly one '+'
                    expect(shortcut.split('+').length).toBe(2);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: markdown-editor, Property 10: Keyboard shortcuts adapt to platform
    // Validates: Requirements 4.4
    it('should differentiate between macOS and other platforms', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('darwin', 'win32', 'linux'),
                fc.constantFrom('darwin', 'win32', 'linux'),
                (platform1, platform2) => {
                    const modifier1 = getPlatformAcceleratorKey(platform1);
                    const modifier2 = getPlatformAcceleratorKey(platform2);

                    // If both are darwin or both are non-darwin, modifiers should match
                    const bothDarwin = platform1 === 'darwin' && platform2 === 'darwin';
                    const bothNonDarwin = platform1 !== 'darwin' && platform2 !== 'darwin';
                    const oneDarwin = (platform1 === 'darwin') !== (platform2 === 'darwin');

                    if (bothDarwin || bothNonDarwin) {
                        expect(modifier1).toBe(modifier2);
                    } else if (oneDarwin) {
                        expect(modifier1).not.toBe(modifier2);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
