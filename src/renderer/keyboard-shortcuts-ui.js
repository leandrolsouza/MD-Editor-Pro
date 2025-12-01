/**
 * KeyboardShortcutsUI - Settings dialog for customizing keyboard shortcuts
 * Displays all available actions with current bindings
 * Implements key recording mode for capturing key combinations
 * Requirements: 5.1, 5.2, 5.3, 5.7
 */

class KeyboardShortcutsUI {
    constructor() {
        this.dialog = null;
        this.recordingActionId = null;
        this.recordingElement = null;
        this.actions = [];
        this.onShortcutChanged = null;
    }

    /**
     * Show the keyboard shortcuts settings dialog
     */
    async show() {
        // Create dialog if it doesn't exist
        if (!this.dialog) {
            this.createDialog();
        }

        // Load current shortcuts
        await this.loadShortcuts();

        // Show dialog
        this.dialog.style.display = 'flex';

        // Add event listener for escape key to close dialog
        this.escapeHandler = (e) => {
            if (e.key === 'Escape' && !this.recordingActionId) {
                this.hide();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    /**
     * Hide the keyboard shortcuts settings dialog
     */
    hide() {
        if (this.dialog) {
            this.dialog.style.display = 'none';
        }

        // Remove escape key listener
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }

        // Cancel any ongoing recording
        if (this.recordingActionId) {
            this.cancelRecording();
        }
    }

    /**
     * Create the dialog HTML structure
     */
    createDialog() {
        this.dialog = document.createElement('div');
        this.dialog.className = 'shortcuts-dialog-overlay';
        this.dialog.innerHTML = `
            <div class="shortcuts-dialog">
                <div class="shortcuts-dialog-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="shortcuts-close-btn" aria-label="Close">&times;</button>
                </div>
                <div class="shortcuts-dialog-body">
                    <div class="shortcuts-search">
                        <input type="text" class="shortcuts-search-input" placeholder="Search shortcuts..." />
                    </div>
                    <div class="shortcuts-list"></div>
                </div>
                <div class="shortcuts-dialog-footer">
                    <button class="shortcuts-reset-all-btn">Reset All to Defaults</button>
                    <button class="shortcuts-done-btn">Done</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.dialog);

        // Add event listeners
        this.dialog.querySelector('.shortcuts-close-btn').addEventListener('click', () => this.hide());
        this.dialog.querySelector('.shortcuts-done-btn').addEventListener('click', () => this.hide());
        this.dialog.querySelector('.shortcuts-reset-all-btn').addEventListener('click', () => this.resetAll());
        this.dialog.querySelector('.shortcuts-search-input').addEventListener('input', (e) => this.filterShortcuts(e.target.value));

        // Close dialog when clicking overlay
        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) {
                this.hide();
            }
        });
    }

    /**
     * Load shortcuts from the main process
     */
    async loadShortcuts() {
        try {
            const result = await window.electronAPI.getAvailableActions();

            if (result.success) {
                this.actions = result.actions;
                this.renderShortcuts();
            }
        } catch (error) {
            console.error('Error loading shortcuts:', error);
        }
    }

    /**
     * Render the shortcuts list
     */
    renderShortcuts(filter = '') {
        const listContainer = this.dialog.querySelector('.shortcuts-list');

        listContainer.innerHTML = '';

        // Group actions by category
        const categories = {};

        for (const action of this.actions) {
            // Apply filter
            if (filter && !action.name.toLowerCase().includes(filter.toLowerCase()) &&
                !action.shortcut.toLowerCase().includes(filter.toLowerCase())) {
                continue;
            }

            if (!categories[action.category]) {
                categories[action.category] = [];
            }
            categories[action.category].push(action);
        }

        // Render each category
        for (const [category, actions] of Object.entries(categories)) {
            const categorySection = document.createElement('div');

            categorySection.className = 'shortcuts-category';

            const categoryHeader = document.createElement('h3');

            categoryHeader.className = 'shortcuts-category-header';
            categoryHeader.textContent = category;
            categorySection.appendChild(categoryHeader);

            for (const action of actions) {
                const actionRow = this.createActionRow(action);

                categorySection.appendChild(actionRow);
            }

            listContainer.appendChild(categorySection);
        }
    }

    /**
     * Create a row for an action
     */
    createActionRow(action) {
        const row = document.createElement('div');

        row.className = 'shortcuts-action-row';
        row.dataset.actionId = action.id;

        const nameCell = document.createElement('div');

        nameCell.className = 'shortcuts-action-name';
        nameCell.textContent = action.name;

        const shortcutCell = document.createElement('div');

        shortcutCell.className = 'shortcuts-action-shortcut';

        const shortcutButton = document.createElement('button');

        shortcutButton.className = 'shortcuts-shortcut-btn';
        shortcutButton.textContent = this.formatShortcut(action.shortcut);
        shortcutButton.dataset.actionId = action.id;
        shortcutButton.addEventListener('click', () => this.startRecording(action.id, shortcutButton));

        shortcutCell.appendChild(shortcutButton);

        const actionsCell = document.createElement('div');

        actionsCell.className = 'shortcuts-action-actions';

        if (!action.isDefault) {
            const resetButton = document.createElement('button');

            resetButton.className = 'shortcuts-reset-btn';
            resetButton.textContent = 'Reset';
            resetButton.title = 'Reset to default';
            resetButton.addEventListener('click', () => this.resetShortcut(action.id));
            actionsCell.appendChild(resetButton);
        }

        row.appendChild(nameCell);
        row.appendChild(shortcutCell);
        row.appendChild(actionsCell);

        return row;
    }

    /**
     * Format shortcut for display (convert Mod to Ctrl/Cmd)
     */
    formatShortcut(shortcut) {
        if (!shortcut) return '';

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modKey = isMac ? '⌘' : 'Ctrl';

        return shortcut
            .replace(/Mod/g, modKey)
            .replace(/Ctrl/g, isMac ? '⌃' : 'Ctrl')
            .replace(/Alt/g, isMac ? '⌥' : 'Alt')
            .replace(/Shift/g, isMac ? '⇧' : 'Shift')
            .replace(/-/g, isMac ? '' : '+');
    }

    /**
     * Start recording a key combination for an action
     */
    startRecording(actionId, buttonElement) {
        // Cancel any existing recording
        if (this.recordingActionId) {
            this.cancelRecording();
        }

        this.recordingActionId = actionId;
        this.recordingElement = buttonElement;

        buttonElement.textContent = 'Press keys...';
        buttonElement.classList.add('recording');

        // Add key down listener
        this.keyDownHandler = (e) => this.handleKeyDown(e);
        document.addEventListener('keydown', this.keyDownHandler);
    }

    /**
     * Cancel recording
     */
    cancelRecording() {
        if (this.recordingElement) {
            const action = this.actions.find(a => a.id === this.recordingActionId);

            if (action) {
                this.recordingElement.textContent = this.formatShortcut(action.shortcut);
            }
            this.recordingElement.classList.remove('recording');
        }

        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
            this.keyDownHandler = null;
        }

        this.recordingActionId = null;
        this.recordingElement = null;
    }

    /**
     * Handle key down during recording
     */
    async handleKeyDown(e) {
        e.preventDefault();
        e.stopPropagation();

        // Ignore modifier keys alone
        if (['Control', 'Alt', 'Shift', 'Meta', 'Command'].includes(e.key)) {
            return;
        }

        // Build key combination string
        const parts = [];

        if (e.ctrlKey || e.metaKey) {
            parts.push('Mod');
        }
        if (e.altKey) {
            parts.push('Alt');
        }
        if (e.shiftKey) {
            parts.push('Shift');
        }

        // Add the actual key
        let key = e.key;

        if (key === ' ') {
            key = 'Space';
        } else if (key.length === 1) {
            key = key.toUpperCase();
        }
        parts.push(key);

        const keyBinding = parts.join('-');

        // Check for conflicts
        try {
            const conflictResult = await window.electronAPI.checkShortcutConflict(keyBinding, this.recordingActionId);

            if (conflictResult.success && conflictResult.hasConflict) {
                const conflictingAction = this.actions.find(a => a.id === conflictResult.conflictingAction);
                const conflictingName = conflictingAction ? conflictingAction.name : conflictResult.conflictingAction;

                const confirmed = await this.showConflictDialog(keyBinding, conflictingName);

                if (!confirmed) {
                    this.cancelRecording();
                    return;
                }
            }

            // Set the shortcut
            await this.setShortcut(this.recordingActionId, keyBinding);

        } catch (error) {
            console.error('Error setting shortcut:', error);
            this.cancelRecording();
        }
    }

    /**
     * Show conflict warning dialog
     */
    async showConflictDialog(keyBinding, conflictingActionName) {
        const formattedBinding = this.formatShortcut(keyBinding);
        const message = `The shortcut "${formattedBinding}" is already assigned to "${conflictingActionName}".\n\nDo you want to reassign it?`;

        return confirm(message);
    }

    /**
     * Set a keyboard shortcut
     */
    async setShortcut(actionId, keyBinding) {
        try {
            const result = await window.electronAPI.setShortcut(actionId, keyBinding);

            if (result.success) {
                // Update local action
                const action = this.actions.find(a => a.id === actionId);

                if (action) {
                    action.shortcut = keyBinding;
                    action.isDefault = false;
                }

                // Update UI
                if (this.recordingElement) {
                    this.recordingElement.textContent = this.formatShortcut(keyBinding);
                }

                // Notify listeners
                if (this.onShortcutChanged) {
                    this.onShortcutChanged(actionId, keyBinding);
                }

                // Reload shortcuts to update UI
                await this.loadShortcuts();
            }
        } catch (error) {
            console.error('Error setting shortcut:', error);
        } finally {
            this.cancelRecording();
        }
    }

    /**
     * Reset a shortcut to default
     */
    async resetShortcut(actionId) {
        try {
            const result = await window.electronAPI.resetShortcut(actionId);

            if (result.success) {
                // Notify listeners
                if (this.onShortcutChanged) {
                    this.onShortcutChanged(actionId, null);
                }

                // Reload shortcuts
                await this.loadShortcuts();
            }
        } catch (error) {
            console.error('Error resetting shortcut:', error);
        }
    }

    /**
     * Reset all shortcuts to defaults
     */
    async resetAll() {
        const confirmed = confirm('Are you sure you want to reset all keyboard shortcuts to their default values?');

        if (!confirmed) {
            return;
        }

        try {
            const result = await window.electronAPI.resetAllShortcuts();

            if (result.success) {
                // Notify listeners
                if (this.onShortcutChanged) {
                    this.onShortcutChanged(null, null);
                }

                // Reload shortcuts
                await this.loadShortcuts();
            }
        } catch (error) {
            console.error('Error resetting all shortcuts:', error);
        }
    }

    /**
     * Filter shortcuts by search term
     */
    filterShortcuts(searchTerm) {
        this.renderShortcuts(searchTerm);
    }

    /**
     * Register callback for shortcut changes
     */
    onChange(callback) {
        this.onShortcutChanged = callback;
    }
}

module.exports = KeyboardShortcutsUI;
