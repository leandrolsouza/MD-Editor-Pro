/**
 * FocusMode class - Manages distraction-free writing mode
 * Hides UI elements and expands editor to fill window
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

class FocusMode {
    constructor(editor) {
        if (!editor) {
            throw new Error('Editor instance is required');
        }

        this.editor = editor;
        this.isActive = false;
        this.mouseIdleTimer = null;
        this.overlay = null;

        // Bind methods to maintain context
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleEscapeKey = this.handleEscapeKey.bind(this);
    }

    /**
     * Initialize focus mode (create overlay element)
     */
    initialize() {
        // Create exit instruction overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'focus-mode-overlay hidden';
        this.overlay.innerHTML = `
            <div class="focus-mode-overlay-content">
                <p>Press <kbd>Esc</kbd> to exit focus mode</p>
            </div>
        `;
        document.body.appendChild(this.overlay);

        // Add CSS for overlay if not already present
        this._injectStyles();
    }

    /**
     * Inject CSS styles for focus mode
     */
    _injectStyles() {
        // Check if styles already exist
        if (document.getElementById('focus-mode-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'focus-mode-styles';
        style.textContent = `
            /* Focus Mode Styles */
            body.focus-mode .tab-bar,
            body.focus-mode .status-bar,
            body.focus-mode .search-panel {
                display: none !important;
            }

            body.focus-mode #app-container {
                margin-top: 0 !important;
                height: 100% !important;
            }

            body.focus-mode #editor-pane {
                flex: 1 !important;
            }

            .focus-mode-overlay {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.8);
                color: #fff;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 10000;
                pointer-events: none;
                opacity: 1;
                transition: opacity 0.3s ease;
            }

            .focus-mode-overlay.hidden {
                opacity: 0;
                pointer-events: none;
            }

            .focus-mode-overlay-content {
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }

            .focus-mode-overlay kbd {
                background-color: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 3px;
                padding: 2px 6px;
                font-family: monospace;
                font-size: 13px;
                margin: 0 4px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Enter focus mode
     * Requirements: 4.1, 4.2
     */
    enter() {
        if (this.isActive) {
            return;
        }

        this.isActive = true;

        // Hide UI elements and expand editor
        this.hideUIElements();

        // Setup event listeners
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('keydown', this.handleEscapeKey);

        // Show overlay initially
        this.showExitOverlay();

        console.log('Focus mode entered');
    }

    /**
     * Exit focus mode
     * Requirements: 4.3
     */
    exit() {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;

        // Restore UI elements
        this.showUIElements();

        // Remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('keydown', this.handleEscapeKey);

        // Hide overlay
        this.hideExitOverlay();

        // Clear any pending timers
        if (this.mouseIdleTimer) {
            clearTimeout(this.mouseIdleTimer);
            this.mouseIdleTimer = null;
        }

        console.log('Focus mode exited');
    }

    /**
     * Toggle focus mode on/off
     */
    toggle() {
        if (this.isActive) {
            this.exit();
        } else {
            this.enter();
        }
    }

    /**
     * Check if focus mode is currently active
     * @returns {boolean}
     */
    isActiveMode() {
        return this.isActive;
    }

    /**
     * Hide UI elements (toolbar, status bar, tab bar)
     * Requirements: 4.1, 4.2
     */
    hideUIElements() {
        document.body.classList.add('focus-mode');
    }

    /**
     * Show UI elements (restore normal view)
     * Requirements: 4.3
     */
    showUIElements() {
        document.body.classList.remove('focus-mode');
    }

    /**
     * Show exit instruction overlay
     * Requirements: 4.4
     */
    showExitOverlay() {
        if (this.overlay) {
            this.overlay.classList.remove('hidden');
        }
    }

    /**
     * Hide exit instruction overlay
     * Requirements: 4.5
     */
    hideExitOverlay() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
    }

    /**
     * Handle mouse movement - show overlay and auto-hide after 2 seconds
     * Requirements: 4.4, 4.5
     */
    handleMouseMove() {
        if (!this.isActive) {
            return;
        }

        // Show overlay
        this.showExitOverlay();

        // Clear existing timer
        if (this.mouseIdleTimer) {
            clearTimeout(this.mouseIdleTimer);
        }

        // Set new timer to hide overlay after 2 seconds
        this.mouseIdleTimer = setTimeout(() => {
            this.hideExitOverlay();
        }, 2000);
    }

    /**
     * Handle Escape key press to exit focus mode
     * Requirements: 4.3
     */
    handleEscapeKey(event) {
        if (!this.isActive) {
            return;
        }

        if (event.key === 'Escape') {
            // Check if search panel is open - don't exit focus mode if it is
            const searchPanel = document.querySelector('.search-panel');
            if (searchPanel && !searchPanel.classList.contains('hidden')) {
                // Let the search panel handle the Escape key
                return;
            }

            event.preventDefault();
            this.exit();
        }
    }

    /**
     * Destroy focus mode instance and cleanup
     */
    destroy() {
        // Exit focus mode if active
        if (this.isActive) {
            this.exit();
        }

        // Remove overlay element
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
            this.overlay = null;
        }

        // Remove injected styles
        const styleElement = document.getElementById('focus-mode-styles');
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }
    }
}

module.exports = FocusMode;
