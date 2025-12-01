/**
 * ImagePaste - Handles image paste from clipboard
 * Intercepts Ctrl+V, saves images to assets folder, and inserts markdown links
 */

class ImagePaste {
    constructor(editor) {
        this.editor = editor;
        this.enabled = true;
        this.pasteHandler = null;
    }

    /**
     * Initialize image paste functionality
     */
    async initialize() {
        // Load configuration
        const config = await window.electronAPI.getConfig('imagePaste');
        this.enabled = config.value?.enabled !== false;

        // Set up paste event listener
        this.setupPasteListener();
    }

    /**
     * Set up paste event listener on editor
     */
    setupPasteListener() {
        if (!this.editor || !this.editor.view) {
            console.error('Editor not initialized');
            return;
        }

        // Add paste event listener to editor DOM
        const editorDOM = this.editor.view.dom;

        this.pasteHandler = async (event) => {
            if (!this.enabled) {
                return;
            }

            // Check if clipboard contains image data
            const items = event.clipboardData?.items;
            if (!items) {
                return;
            }

            // Find image item in clipboard
            let imageItem = null;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    imageItem = items[i];
                    break;
                }
            }

            if (!imageItem) {
                return;
            }

            // Prevent default paste behavior for images
            event.preventDefault();

            try {
                // Get image as blob
                const blob = imageItem.getAsFile();
                if (!blob) {
                    console.error('Failed to get image from clipboard');
                    return;
                }

                // Convert blob to buffer
                const arrayBuffer = await blob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                // Get current file path for relative path calculation
                const activeTab = await window.electronAPI.getActiveTab();
                const currentFilePath = activeTab?.tab?.filePath || null;

                // Save image via IPC (send as Uint8Array which IPC can serialize)
                const result = await window.electronAPI.saveImageFromClipboard(uint8Array, currentFilePath);

                if (result.success) {
                    // Insert markdown image syntax at cursor position
                    const imageMarkdown = `![image](${result.relativePath})`;
                    this.editor.insertText(imageMarkdown);

                    console.log('Image saved and inserted:', result.relativePath);
                } else {
                    console.error('Failed to save image');
                }
            } catch (error) {
                console.error('Error handling image paste:', error);
            }
        };

        editorDOM.addEventListener('paste', this.pasteHandler);
    }

    /**
     * Enable or disable image paste functionality
     * @param {boolean} enabled - Whether to enable image paste
     */
    async setEnabled(enabled) {
        this.enabled = enabled;
        await window.electronAPI.setConfig('imagePaste.enabled', enabled);
    }

    /**
     * Get current enabled status
     * @returns {boolean} Whether image paste is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Clean up event listeners
     */
    cleanup() {
        if (this.pasteHandler && this.editor?.view?.dom) {
            this.editor.view.dom.removeEventListener('paste', this.pasteHandler);
            this.pasteHandler = null;
        }
    }
}

module.exports = ImagePaste;
