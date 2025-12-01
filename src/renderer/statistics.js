/**
 * StatisticsCalculator - Calculates and displays real-time document statistics
 * Implements word count, character count, and reading time calculation
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7
 */

class StatisticsCalculator {
    constructor(editor) {
        if (!editor) {
            throw new Error('Editor instance is required');
        }

        this.editor = editor;
        this.visible = true;
        this.updateTimeoutId = null;
        this.debounceDelay = 100; // 100ms debounce

        // Statistics panel elements
        this.panel = null;
        this.wordCountElement = null;
        this.characterCountElement = null;
        this.readingTimeElement = null;

        // Current statistics
        this.currentStats = {
            wordCount: 0,
            characterCount: 0,
            readingTime: 0
        };
    }

    /**
     * Initialize the statistics calculator
     * Loads configuration and sets up UI
     */
    async initialize() {
        // Load configuration from electronAPI
        try {
            const config = await window.electronAPI.getConfig('statistics');

            if (config && config.value) {
                this.visible = config.value.visible !== false;
            }
        } catch (error) {
            console.warn('Failed to load statistics config, using defaults:', error);
        }

        // Setup statistics panel UI
        this._setupPanel();

        // Listen to editor content changes with debouncing
        this.editor.onContentChange((content) => {
            this._scheduleUpdate(content);
        });

        // Calculate initial statistics
        const initialContent = this.editor.getValue();

        this._updateStatistics(initialContent);
    }

    /**
     * Setup the statistics panel UI
     * @private
     */
    _setupPanel() {
        // Create statistics panel
        this.panel = document.createElement('div');
        this.panel.id = 'statistics-panel';
        this.panel.className = 'statistics-panel';

        // Create statistics content
        const content = document.createElement('div');

        content.className = 'statistics-content';

        // Word count
        const wordCountContainer = document.createElement('div');

        wordCountContainer.className = 'stat-item';
        const wordCountLabel = document.createElement('span');

        wordCountLabel.className = 'stat-label';
        wordCountLabel.textContent = 'Words: ';
        this.wordCountElement = document.createElement('span');
        this.wordCountElement.className = 'stat-value';
        this.wordCountElement.textContent = '0';
        wordCountContainer.appendChild(wordCountLabel);
        wordCountContainer.appendChild(this.wordCountElement);

        // Character count
        const charCountContainer = document.createElement('div');

        charCountContainer.className = 'stat-item';
        const charCountLabel = document.createElement('span');

        charCountLabel.className = 'stat-label';
        charCountLabel.textContent = 'Characters: ';
        this.characterCountElement = document.createElement('span');
        this.characterCountElement.className = 'stat-value';
        this.characterCountElement.textContent = '0';
        charCountContainer.appendChild(charCountLabel);
        charCountContainer.appendChild(this.characterCountElement);

        // Reading time
        const readingTimeContainer = document.createElement('div');

        readingTimeContainer.className = 'stat-item';
        const readingTimeLabel = document.createElement('span');

        readingTimeLabel.className = 'stat-label';
        readingTimeLabel.textContent = 'Reading time: ';
        this.readingTimeElement = document.createElement('span');
        this.readingTimeElement.className = 'stat-value';
        this.readingTimeElement.textContent = '0 min';
        readingTimeContainer.appendChild(readingTimeLabel);
        readingTimeContainer.appendChild(this.readingTimeElement);

        // Append all stat items to content
        content.appendChild(wordCountContainer);
        content.appendChild(charCountContainer);
        content.appendChild(readingTimeContainer);

        // Append content to panel
        this.panel.appendChild(content);

        // Add panel to status bar
        const statusBar = document.getElementById('status-bar');

        if (statusBar) {
            statusBar.appendChild(this.panel);
        } else {
            console.warn('Status bar not found, statistics panel not added to DOM');
        }

        // Set initial visibility
        if (!this.visible) {
            this.panel.classList.add('hidden');
        }
    }

    /**
     * Schedule a statistics update with debouncing
     * @param {string} content - The content to calculate statistics for
     * @private
     */
    _scheduleUpdate(content) {
        // Cancel any existing scheduled update
        if (this.updateTimeoutId !== null) {
            clearTimeout(this.updateTimeoutId);
        }

        // Schedule new update
        this.updateTimeoutId = setTimeout(() => {
            this._updateStatistics(content);
        }, this.debounceDelay);
    }

    /**
     * Update statistics based on content
     * @param {string} content - The content to calculate statistics for
     * @private
     */
    _updateStatistics(content) {
        // Calculate statistics
        const stats = this.getStatistics(content);

        this.currentStats = stats;

        // Update display
        this.updateDisplay(stats);
    }

    /**
     * Calculate word count from content
     * @param {string} content - The content to count words in
     * @returns {number} Word count
     */
    calculateWordCount(content) {
        if (!content || typeof content !== 'string') {
            return 0;
        }

        // Strip markdown syntax
        const plainText = this._stripMarkdownSyntax(content);

        // Count words
        return this._countWords(plainText);
    }

    /**
     * Calculate character count from content
     * @param {string} content - The content to count characters in
     * @returns {number} Character count
     */
    calculateCharacterCount(content) {
        if (!content || typeof content !== 'string') {
            return 0;
        }

        return content.length;
    }

    /**
     * Calculate reading time from content
     * @param {string} content - The content to calculate reading time for
     * @param {number} wordsPerMinute - Reading speed (default: 200 WPM)
     * @returns {number} Reading time in minutes
     */
    calculateReadingTime(content, wordsPerMinute = 200) {
        if (!content || typeof content !== 'string') {
            return 0;
        }

        const wordCount = this.calculateWordCount(content);
        const readingTime = wordCount / wordsPerMinute;

        // Round to nearest minute, minimum 1 minute if there are words
        return wordCount > 0 ? Math.max(1, Math.round(readingTime)) : 0;
    }

    /**
     * Get all statistics at once
     * @param {string} content - The content to calculate statistics for
     * @returns {Object} Statistics object with wordCount, characterCount, readingTime
     */
    getStatistics(content) {
        return {
            wordCount: this.calculateWordCount(content),
            characterCount: this.calculateCharacterCount(content),
            readingTime: this.calculateReadingTime(content)
        };
    }

    /**
     * Update the display with statistics
     * @param {Object} statistics - Statistics object
     */
    updateDisplay(statistics) {
        if (!this.wordCountElement || !this.characterCountElement || !this.readingTimeElement) {
            return;
        }

        this.wordCountElement.textContent = statistics.wordCount.toString();
        this.characterCountElement.textContent = statistics.characterCount.toString();
        this.readingTimeElement.textContent = `${statistics.readingTime} min`;
    }

    /**
     * Toggle visibility of the statistics panel
     */
    async toggleVisibility() {
        this.visible = !this.visible;

        if (this.panel) {
            if (this.visible) {
                this.panel.classList.remove('hidden');
            } else {
                this.panel.classList.add('hidden');
            }
        }

        // Save configuration
        await this._saveConfig();
    }

    /**
     * Check if statistics panel is visible
     * @returns {boolean} True if visible
     */
    isVisible() {
        return this.visible;
    }

    /**
     * Strip markdown syntax from content
     * @param {string} content - The content to strip markdown from
     * @returns {string} Plain text without markdown syntax
     * @private
     */
    _stripMarkdownSyntax(content) {
        let text = content;

        // Remove code blocks (```...```)
        text = text.replace(/```[\s\S]*?```/g, '');

        // Remove inline code (`...`)
        text = text.replace(/`[^`]+`/g, '');

        // Remove images ![alt](url) - must come before links
        text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1');

        // Remove links [text](url)
        text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

        // Remove headers (# ## ### etc.) - keep the text after the #
        text = text.replace(/^#{1,6}\s+(.*)$/gm, '$1');

        // Remove bold (**text** or __text__)
        text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');

        // Remove italic (*text* or _text_)
        text = text.replace(/(\*|_)(.*?)\1/g, '$2');

        // Remove strikethrough (~~text~~)
        text = text.replace(/~~(.*?)~~/g, '$1');

        // Remove horizontal rules (---, ***, ___)
        text = text.replace(/^(\*{3,}|-{3,}|_{3,})$/gm, '');

        // Remove blockquotes (> text)
        text = text.replace(/^>\s+/gm, '');

        // Remove list markers (-, *, +, 1., etc.)
        text = text.replace(/^[\s]*[-*+]\s+/gm, '');
        text = text.replace(/^[\s]*\d+\.\s+/gm, '');

        // Remove task list markers (- [ ] or - [x])
        text = text.replace(/^[\s]*-\s+\[[x\s]\]\s+/gm, '');

        // Remove HTML tags
        text = text.replace(/<[^>]+>/g, '');

        return text;
    }

    /**
     * Count words in plain text
     * @param {string} plainText - The plain text to count words in
     * @returns {number} Word count
     * @private
     */
    _countWords(plainText) {
        if (!plainText || plainText.trim().length === 0) {
            return 0;
        }

        // Split by whitespace and filter out empty strings
        const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);

        return words.length;
    }

    /**
     * Save configuration via electronAPI
     * @private
     */
    async _saveConfig() {
        try {
            await window.electronAPI.setConfig('statistics', {
                visible: this.visible
            });
        } catch (error) {
            console.error('Failed to save statistics config:', error);
        }
    }

    /**
     * Destroy the statistics calculator
     */
    destroy() {
        // Cancel any pending updates
        if (this.updateTimeoutId !== null) {
            clearTimeout(this.updateTimeoutId);
            this.updateTimeoutId = null;
        }

        // Remove panel from DOM
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }

        // Clear references
        this.panel = null;
        this.wordCountElement = null;
        this.characterCountElement = null;
        this.readingTimeElement = null;
    }
}

module.exports = StatisticsCalculator;
