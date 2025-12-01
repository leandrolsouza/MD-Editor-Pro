/**
 * TypewriterScrolling - Keeps the active line centered while typing
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

const { EditorView } = require('@codemirror/view');
const { Compartment } = require('@codemirror/state');

class TypewriterScrolling {
    constructor(editor) {
        if (!editor) {
            throw new Error('Editor instance is required');
        }

        this.editor = editor;
        this.enabled = false;
        this.extensionCompartment = new Compartment();
        this.manualScrollSuspended = false;
        this.lastScrollTime = 0;
        this.scrollThrottle = 16; // 60 FPS (Requirement: 5.4)
    }

    /**
     * Enable typewriter scrolling mode
     * Requirements: 2.1, 2.2, 2.3, 2.6
     */
    enable() {
        if (this.enabled) {
            return;
        }

        this.enabled = true;
        this.manualScrollSuspended = false;

        // Add the typewriter scrolling extension to the editor
        const extension = this.createTypewriterExtension();

        this.editor.view.dispatch({
            effects: this.extensionCompartment.reconfigure(extension)
        });

        console.log('Typewriter scrolling enabled');
        this.announceToScreenReader('Typewriter scrolling enabled');
    }

    /**
     * Disable typewriter scrolling mode
     * Requirements: 2.6, 2.7
     */
    disable() {
        if (!this.enabled) {
            return;
        }

        this.enabled = false;
        this.manualScrollSuspended = false;

        // Remove the typewriter scrolling extension
        this.editor.view.dispatch({
            effects: this.extensionCompartment.reconfigure([])
        });

        console.log('Typewriter scrolling disabled');
        this.announceToScreenReader('Typewriter scrolling disabled');
    }

    /**
     * Toggle typewriter scrolling mode
     * Requirements: 2.6, 4.2, 4.4
     */
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    /**
     * Check if typewriter scrolling is enabled
     * Requirements: 2.6
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Create the CodeMirror 6 extension for typewriter scrolling
     * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.3
     * @returns {Extension}
     */
    createTypewriterExtension() {
        const self = this;

        return [
            // Update listener for cursor changes and typing
            EditorView.updateListener.of((update) => {
                // Only center if selection changed or document changed (typing)
                if (update.selectionSet || update.docChanged) {
                    // Resume auto-centering on typing or cursor movement (Requirement: 2.5)
                    if (self.manualScrollSuspended) {
                        self.manualScrollSuspended = false;
                    }

                    self.centerActiveLine(update.view);
                }
            }),

            // DOM event listener for manual scroll detection (Requirement: 2.5)
            EditorView.domEventHandlers({
                wheel: (event, view) => {
                    // Suspend auto-centering on manual scroll
                    self.manualScrollSuspended = true;
                    return false; // Don't prevent default
                },
                mousedown: (event, view) => {
                    // Check if clicking on scrollbar
                    const scrollDOM = view.scrollDOM;
                    const rect = scrollDOM.getBoundingClientRect();

                    // If click is near the right edge (scrollbar area)
                    if (event.clientX > rect.right - 20) {
                        self.manualScrollSuspended = true;
                    }
                    return false;
                }
            })
        ];
    }

    /**
     * Center the active line in the viewport
     * Requirements: 2.1, 2.2, 2.3, 2.4, 5.3, 5.4
     * @param {EditorView} view - The editor view
     */
    centerActiveLine(view) {
        if (!this.enabled || this.manualScrollSuspended) {
            return;
        }

        // Throttle scroll updates to 60 FPS (Requirement: 5.4)
        const now = Date.now();
        if (now - this.lastScrollTime < this.scrollThrottle) {
            return;
        }
        this.lastScrollTime = now;

        const scrollDOM = view.scrollDOM;
        const viewportHeight = scrollDOM.clientHeight;
        const scrollHeight = scrollDOM.scrollHeight;

        // Handle edge case: short documents (Requirement: 2.4)
        if (scrollHeight <= viewportHeight) {
            // Document fits in viewport, no need to center
            return;
        }

        // Get the cursor position
        const selection = view.state.selection.main;
        const cursorPos = selection.head;

        // Get the line coordinates
        const coords = view.coordsAtPos(cursorPos);
        if (!coords) {
            return;
        }

        // Calculate the desired scroll position to center the line
        const lineTop = coords.top;
        const viewportCenter = viewportHeight / 2;
        const desiredScrollTop = lineTop - viewportCenter;

        // Handle edge case: document boundaries (Requirement: 2.4)
        const maxScroll = scrollHeight - viewportHeight;
        const clampedScrollTop = Math.max(0, Math.min(desiredScrollTop, maxScroll));

        // Scroll to center the active line
        scrollDOM.scrollTop = clampedScrollTop;
    }

    /**
     * Initialize the typewriter scrolling extension compartment
     * This should be called during editor initialization
     */
    initialize() {
        if (!this.editor.view) {
            throw new Error('Editor view not initialized');
        }

        // Add the compartment to the editor (initially empty)
        this.editor.view.dispatch({
            effects: this.extensionCompartment.reconfigure([])
        });
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     */
    announceToScreenReader(message) {
        // Create or get the live region for announcements
        let liveRegion = document.getElementById('typewriter-announcer');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'typewriter-announcer';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }

        // Clear and set new message
        liveRegion.textContent = '';
        setTimeout(() => {
            liveRegion.textContent = message;
        }, 100);
    }
}

module.exports = TypewriterScrolling;
