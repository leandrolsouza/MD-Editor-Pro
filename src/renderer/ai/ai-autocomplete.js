/**
 * AI Autocomplete for CodeMirror Editor
 * Shows inline ghost text suggestions while typing
 */

class AIAutocomplete {
    constructor(editor) {
        this.editor = editor;
        this.enabled = true; // Default to enabled
        this.debounceMs = 500;
        this.minCharsToTrigger = 10;
        this.debounceTimer = null;
        this.currentSuggestion = null;
        this.ghostElement = null;
        this.isAccepting = false;
        this.lastRequestText = '';
        this.lastCursorPos = -1;
        this.pendingRequest = null;
    }

    async initialize() {
        try {
            await this.loadSettings();
            this.setupKeyboardHandlers();
            console.log('AIAutocomplete initialized, enabled:', this.enabled, 'debounce:', this.debounceMs, 'minChars:', this.minCharsToTrigger);
        } catch (error) {
            console.error('Failed to initialize AIAutocomplete:', error);
        }
    }

    async loadSettings() {
        try {
            const settings = await window.electronAPI.aiAutocompleteGetSettings();

            console.log('AIAutocomplete settings loaded:', settings);

            if (settings) {
                this.enabled = settings.enabled;
                this.debounceMs = settings.debounceMs || 500;
                this.minCharsToTrigger = settings.minCharsToTrigger || 10;
            }
        } catch (error) {
            console.error('Failed to load autocomplete settings:', error);
        }
    }

    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            if (!this.currentSuggestion) return;

            if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                const activeElement = document.activeElement;
                const editorElement = this.editor.view?.dom;

                if (editorElement && (editorElement.contains(activeElement) || editorElement === activeElement)) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.acceptSuggestion();
                }
            } else if (e.key === 'Escape') {
                this.dismissSuggestion();
            }
        }, true);
    }

    /**
     * Called when editor content changes
     * @param {string} content - Current editor content
     * @param {number} cursorPos - Current cursor position
     */
    onContentChange(content, cursorPos) {
        if (!this.enabled) {
            return;
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        if (this.pendingRequest) {
            this.pendingRequest = null;
        }

        this.dismissSuggestion();

        if (this.isAccepting) {
            this.isAccepting = false;
            return;
        }

        const textBefore = content.slice(0, cursorPos);
        const textAfter = content.slice(cursorPos);

        if (textBefore.length < this.minCharsToTrigger) {
            return;
        }

        if (textAfter.length > 0 && /^\w/.test(textAfter)) {
            return;
        }

        const lastLine = textBefore.split('\n').pop();

        if (!lastLine || lastLine.trim().length < 3) {
            return;
        }

        if (textBefore === this.lastRequestText) {
            return;
        }

        this.lastCursorPos = cursorPos;

        console.log('AIAutocomplete: scheduling suggestion request, textBefore length:', textBefore.length);

        this.debounceTimer = setTimeout(() => {
            this.requestSuggestion(textBefore, textAfter, cursorPos);
        }, this.debounceMs);
    }

    async requestSuggestion(textBefore, textAfter, cursorPos) {
        this.lastRequestText = textBefore;

        const requestId = Date.now();

        this.pendingRequest = requestId;

        console.log('AIAutocomplete: requesting suggestion...');

        // Show loading indicator
        this.showLoadingIndicator(cursorPos);

        try {
            const result = await window.electronAPI.aiAutocompleteGetSuggestion(textBefore, textAfter);

            console.log('AIAutocomplete: got result:', result);

            // Hide loading indicator
            this.hideLoadingIndicator();

            if (this.pendingRequest !== requestId) return;

            const currentPos = this.editor.getCursorPosition();

            if (Math.abs(currentPos - cursorPos) > 5) return;

            if (result.success && result.suggestion) {
                console.log('AIAutocomplete: showing suggestion:', result.suggestion);
                this.showSuggestion(result.suggestion, currentPos);
            }
        } catch (error) {
            console.error('Autocomplete request failed:', error);
            this.hideLoadingIndicator();
        }
    }

    showSuggestion(suggestion, cursorPos) {
        let cleanSuggestion = suggestion;
        const content = this.editor.getValue();
        const textBefore = content.slice(0, cursorPos);

        if (textBefore.length > 0 && /\s$/.test(textBefore) && /^\s/.test(cleanSuggestion)) {
            cleanSuggestion = cleanSuggestion.trimStart();
        }

        this.currentSuggestion = cleanSuggestion;

        this.createGhostText(cleanSuggestion, cursorPos);
    }

    createGhostText(suggestion, cursorPos) {
        this.removeGhostText();

        const view = this.editor.view;

        if (!view) return;

        const coords = view.coordsAtPos(cursorPos);

        if (!coords) return;

        const ghost = document.createElement('span');

        ghost.className = 'ai-autocomplete-ghost';
        ghost.id = 'ai-autocomplete-ghost-text';
        ghost.textContent = suggestion;
        ghost.title = 'Tab para aceitar • Esc para dispensar';

        const editorContent = view.contentDOM;
        const computedStyle = window.getComputedStyle(editorContent);

        // Use a more visible color for dark mode
        ghost.style.cssText = `
            position: fixed;
            left: ${coords.left}px;
            top: ${coords.top}px;
            pointer-events: none;
            opacity: 0.6;
            color: #7c9cff;
            font-family: ${computedStyle.fontFamily};
            font-size: ${computedStyle.fontSize};
            line-height: ${computedStyle.lineHeight};
            white-space: pre;
            z-index: 1000;
            background: transparent;
            font-style: italic;
        `;

        document.body.appendChild(ghost);

        this.ghostElement = ghost;
    }

    removeGhostText() {
        if (this.ghostElement) {
            this.ghostElement.remove();
            this.ghostElement = null;
        }

        const existing = document.getElementById('ai-autocomplete-ghost-text');

        if (existing) {
            existing.remove();
        }

        // Also remove loading indicator
        this.hideLoadingIndicator();
    }

    showLoadingIndicator(cursorPos) {
        this.hideLoadingIndicator();

        const view = this.editor.view;

        if (!view) return;

        const coords = view.coordsAtPos(cursorPos);

        if (!coords) return;

        const loader = document.createElement('span');

        loader.id = 'ai-autocomplete-loading';
        loader.innerHTML = '⏳';
        loader.title = 'Gerando sugestão...';

        loader.style.cssText = `
            position: fixed;
            left: ${coords.left}px;
            top: ${coords.top}px;
            pointer-events: none;
            opacity: 0.7;
            font-size: 14px;
            z-index: 1000;
            animation: pulse 1s infinite;
        `;

        // Add animation style if not exists
        if (!document.getElementById('ai-autocomplete-styles')) {
            const style = document.createElement('style');

            style.id = 'ai-autocomplete-styles';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(loader);
    }

    hideLoadingIndicator() {
        const loader = document.getElementById('ai-autocomplete-loading');

        if (loader) {
            loader.remove();
        }
    }

    acceptSuggestion() {
        if (!this.currentSuggestion) return;

        this.isAccepting = true;
        const suggestion = this.currentSuggestion;

        this.editor.insertText(suggestion);
        this.dismissSuggestion();

        const content = this.editor.getValue();
        const cursorPos = this.editor.getCursorPosition();

        this.lastRequestText = content.slice(0, cursorPos);
    }

    dismissSuggestion() {
        this.currentSuggestion = null;
        this.removeGhostText();
    }

    async setEnabled(enabled) {
        this.enabled = enabled;

        if (!enabled) {
            this.dismissSuggestion();
        }

        try {
            await window.electronAPI.aiAutocompleteSetEnabled(enabled);
        } catch (error) {
            console.error('Failed to save autocomplete enabled state:', error);
        }
    }

    async setDebounceMs(ms) {
        this.debounceMs = ms;

        try {
            await window.electronAPI.aiAutocompleteSetDebounce(ms);
        } catch (error) {
            console.error('Failed to save autocomplete debounce:', error);
        }
    }

    async setMinCharsToTrigger(chars) {
        this.minCharsToTrigger = chars;

        try {
            await window.electronAPI.aiAutocompleteSetMinChars(chars);
        } catch (error) {
            console.error('Failed to save autocomplete min chars:', error);
        }
    }

    isEnabled() {
        return this.enabled;
    }

    getSettings() {
        return {
            enabled: this.enabled,
            debounceMs: this.debounceMs,
            minCharsToTrigger: this.minCharsToTrigger
        };
    }

    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.dismissSuggestion();
    }
}

module.exports = AIAutocomplete;
