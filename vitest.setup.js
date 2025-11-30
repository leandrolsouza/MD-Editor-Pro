/**
 * Vitest Setup File
 * Global mocks and configurations for all tests
 */

// Mock getClientRects for CodeMirror in JSDOM environment
if (typeof Range !== 'undefined') {
    // Store original method if it exists
    const originalGetClientRects = Range.prototype.getClientRects;

    Range.prototype.getClientRects = function () {
        try {
            // Try to call original method
            if (originalGetClientRects && typeof originalGetClientRects === 'function') {
                return originalGetClientRects.call(this);
            }
        } catch (e) {
            // If it fails, return mock
        }

        // Return mock DOMRectList
        return {
            length: 1,
            item: () => ({
                top: 0,
                left: 0,
                right: 100,
                bottom: 20,
                width: 100,
                height: 20,
                x: 0,
                y: 0
            }),
            [0]: {
                top: 0,
                left: 0,
                right: 100,
                bottom: 20,
                width: 100,
                height: 20,
                x: 0,
                y: 0
            },
            [Symbol.iterator]: function* () {
                yield this[0];
            }
        };
    };

    Range.prototype.getBoundingClientRect = function () {
        return {
            top: 0,
            left: 0,
            right: 100,
            bottom: 20,
            width: 100,
            height: 20,
            x: 0,
            y: 0
        };
    };
}

// Mock document.createRange if needed
if (typeof document !== 'undefined' && document.createRange) {
    const originalCreateRange = document.createRange;
    document.createRange = function () {
        const range = originalCreateRange.call(this);

        // Ensure getClientRects is available
        if (!range.getClientRects || typeof range.getClientRects !== 'function') {
            range.getClientRects = Range.prototype.getClientRects;
        }

        if (!range.getBoundingClientRect || typeof range.getBoundingClientRect !== 'function') {
            range.getBoundingClientRect = Range.prototype.getBoundingClientRect;
        }

        return range;
    };
}
