const { dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');

/**
 * FileManager - Handles file operations (open, save, saveAs)
 * Implements secure file handling with path validation
 */
class FileManager {
    constructor(windowManager, configStore = null) {
        this.windowManager = windowManager;
        this.configStore = configStore;
        this.currentFilePath = null;
    }

    /**
     * Sanitizes and validates file paths for security
     * Prevents directory traversal attacks and validates path format
     * @param {string} filePath - The file path to validate
     * @returns {string} The normalized, safe file path
     * @throws {Error} If path is invalid or contains suspicious patterns
     */
    _validateFilePath(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('Invalid file path: path must be a non-empty string');
        }

        // Normalize the path to handle cross-platform differences
        const normalizedPath = path.normalize(filePath);

        // Resolve to absolute path to prevent directory traversal
        const resolvedPath = path.resolve(normalizedPath);

        // Check for suspicious patterns (null bytes, etc.)
        if (resolvedPath.includes('\0')) {
            throw new Error('Invalid file path: contains null bytes');
        }

        // Ensure the path doesn't try to escape using relative paths
        if (normalizedPath.includes('..')) {
            // After normalization, if '..' still exists, it's suspicious
            const relative = path.relative(path.dirname(resolvedPath), resolvedPath);

            if (relative.startsWith('..')) {
                throw new Error('Invalid file path: directory traversal detected');
            }
        }

        return resolvedPath;
    }

    /**
     * Opens a file dialog and reads the selected markdown file
     * @returns {Promise<{filePath: string, content: string}>} The file path and content
     * @throws {Error} If file reading fails
     */
    async openFile() {
        const window = this.windowManager.getMainWindow();

        if (!window) {
            throw new Error('No window available for dialog');
        }

        // Show open dialog
        const result = await dialog.showOpenDialog(window, {
            title: 'Open Markdown File',
            filters: [
                { name: 'Markdown Files', extensions: ['md', 'markdown', 'txt'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
        });

        // User cancelled the dialog
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        const filePath = result.filePaths[0];

        // Validate the file path
        const safePath = this._validateFilePath(filePath);

        try {
            // Read file content
            const content = await fs.readFile(safePath, 'utf-8');

            this.currentFilePath = safePath;

            // Add to recent files
            if (this.configStore) {
                this.configStore.addRecentFile(safePath);
            }

            return {
                filePath: safePath,
                content: content
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${safePath}`);
            } else if (error.code === 'EACCES' || error.code === 'EPERM') {
                throw new Error(`Permission denied: Cannot read file ${safePath}`);
            } else {
                throw new Error(`Failed to read file: ${error.message}`);
            }
        }
    }

    /**
     * Reads a file from the specified path
     * @param {string} filePath - The path of the file to read
     * @returns {Promise<{success: boolean, content: string, filePath: string}>} The file content
     * @throws {Error} If file reading fails
     */
    async readFile(filePath) {
        // Validate the file path
        const safePath = this._validateFilePath(filePath);

        try {
            // Read file content
            const content = await fs.readFile(safePath, 'utf-8');

            // Add to recent files
            if (this.configStore) {
                this.configStore.addRecentFile(safePath);
            }

            return {
                success: true,
                content: content,
                filePath: safePath
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${safePath}`);
            } else if (error.code === 'EACCES' || error.code === 'EPERM') {
                throw new Error(`Permission denied: Cannot read file ${safePath}`);
            } else {
                throw new Error(`Failed to read file: ${error.message}`);
            }
        }
    }

    /**
     * Saves content to the specified file path
     * @param {string} filePath - The path where to save the file
     * @param {string} content - The content to save
     * @returns {Promise<void>}
     * @throws {Error} If file writing fails
     */
    async saveFile(filePath, content) {
        if (content === undefined || content === null) {
            throw new Error('Content cannot be null or undefined');
        }

        // Validate the file path
        const safePath = this._validateFilePath(filePath);

        try {
            // Write file content
            await fs.writeFile(safePath, content, 'utf-8');
            this.currentFilePath = safePath;

            // Add to recent files
            if (this.configStore) {
                this.configStore.addRecentFile(safePath);
            }
        } catch (error) {
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                throw new Error(`Permission denied: Cannot write to file ${safePath}`);
            } else if (error.code === 'ENOSPC') {
                throw new Error(`Disk full: Cannot save file ${safePath}`);
            } else if (error.code === 'EROFS') {
                throw new Error(`Read-only filesystem: Cannot save file ${safePath}`);
            } else {
                throw new Error(`Failed to save file: ${error.message}`);
            }
        }
    }

    /**
     * Shows a save dialog and saves content to the selected location
     * @param {string} content - The content to save
     * @returns {Promise<string>} The path where the file was saved
     * @throws {Error} If file writing fails
     */
    async saveFileAs(content) {
        try {
            const window = this.windowManager.getMainWindow();

            if (!window) {
                throw new Error('No window available for dialog');
            }

            // Show save dialog
            const result = await dialog.showSaveDialog(window, {
                title: 'Save Markdown File',
                defaultPath: 'untitled.md',
                filters: [
                    { name: 'Markdown Files', extensions: ['md', 'markdown'] },
                    { name: 'Text Files', extensions: ['txt'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            // User cancelled the dialog
            if (result.canceled || !result.filePath) {
                return null;
            }

            const filePath = result.filePath;

            // Save the file
            await this.saveFile(filePath, content);

            return filePath;
        } catch (error) {
            console.error('Error in saveFileAs:', error);
            throw error;
        }
    }

    /**
     * Shows a dialog asking user about unsaved changes
     * @returns {Promise<number>} The button index clicked (0: Save, 1: Don't Save, 2: Cancel)
     */
    async showUnsavedChangesDialog() {
        try {
            const window = this.windowManager.getMainWindow();

            if (!window) {
                throw new Error('No window available for dialog');
            }

            const result = await dialog.showMessageBox(window, {
                type: 'question',
                buttons: ['Save', "Don't Save", 'Cancel'],
                defaultId: 0,
                cancelId: 2,
                title: 'Unsaved Changes',
                message: 'Do you want to save the changes you made?',
                detail: 'Your changes will be lost if you don\'t save them.'
            });

            return result.response;
        } catch (error) {
            console.error('Error in showUnsavedChangesDialog:', error);
            throw error;
        }
    }

    /**
     * Gets the current file path
     * @returns {string | null} The current file path or null
     */
    getCurrentFilePath() {
        return this.currentFilePath;
    }

    /**
     * Sets the current file path
     * @param {string | null} filePath - The file path to set
     */
    setCurrentFilePath(filePath) {
        this.currentFilePath = filePath;
    }

    /**
     * Opens a specific file by path (used for recent files)
     * @param {string} filePath - The path of the file to open
     * @returns {Promise<{filePath: string, content: string}>} The file path and content
     * @throws {Error} If file reading fails
     */
    async openRecentFile(filePath) {
        // Validate the file path
        const safePath = this._validateFilePath(filePath);

        try {
            // Read file content
            const content = await fs.readFile(safePath, 'utf-8');

            this.currentFilePath = safePath;

            // Add to recent files (updates timestamp)
            if (this.configStore) {
                this.configStore.addRecentFile(safePath);
            }

            return {
                filePath: safePath,
                content: content
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File no longer exists, remove from recent files
                if (this.configStore) {
                    this.configStore.removeRecentFile(filePath);
                }
                throw new Error(`File not found: ${safePath}`);
            } else if (error.code === 'EACCES' || error.code === 'EPERM') {
                throw new Error(`Permission denied: Cannot read file ${safePath}`);
            } else {
                throw new Error(`Failed to read file: ${error.message}`);
            }
        }
    }

    /**
     * Saves an image from clipboard to the assets folder
     * @param {Buffer|Uint8Array|Array} imageBuffer - The image data as a buffer
     * @param {string} currentFilePath - The current markdown file path (to determine relative path)
     * @returns {Promise<{success: boolean, imagePath: string, relativePath: string}>} The saved image path
     * @throws {Error} If image saving fails
     */
    async saveImageFromClipboard(imageBuffer, currentFilePath) {
        // Convert to Buffer if needed
        if (!Buffer.isBuffer(imageBuffer)) {
            if (imageBuffer instanceof Uint8Array || Array.isArray(imageBuffer)) {
                imageBuffer = Buffer.from(imageBuffer);
            } else {
                throw new Error('Invalid image data: must be a Buffer, Uint8Array, or Array');
            }
        }

        try {
            // Get assets folder configuration
            const assetsFolder = this.configStore ? this.configStore.getAssetsFolder() : './assets';

            // Determine the base directory (where the markdown file is, or current working directory)
            let baseDir;
            if (currentFilePath) {
                baseDir = path.dirname(currentFilePath);
            } else {
                baseDir = process.cwd();
            }

            // Create full assets path
            const assetsPath = path.join(baseDir, assetsFolder);

            // Ensure assets directory exists
            await fs.mkdir(assetsPath, { recursive: true });

            // Generate unique filename with timestamp
            const timestamp = Date.now();
            const filename = `image-${timestamp}.png`;
            const fullPath = path.join(assetsPath, filename);

            // Save the image
            await fs.writeFile(fullPath, imageBuffer);

            // Calculate relative path from markdown file to image
            let relativePath;
            if (currentFilePath) {
                relativePath = path.relative(path.dirname(currentFilePath), fullPath);
            } else {
                relativePath = path.join(assetsFolder, filename);
            }

            // Normalize path separators for markdown (use forward slashes)
            relativePath = relativePath.replace(/\\/g, '/');

            // Ensure path starts with ./ for relative paths
            if (!relativePath.startsWith('./') && !relativePath.startsWith('../') && !path.isAbsolute(relativePath)) {
                relativePath = './' + relativePath;
            }

            return {
                success: true,
                imagePath: fullPath,
                relativePath: relativePath
            };
        } catch (error) {
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                throw new Error(`Permission denied: Cannot write to assets folder`);
            } else if (error.code === 'ENOSPC') {
                throw new Error(`Disk full: Cannot save image`);
            } else {
                throw new Error(`Failed to save image: ${error.message}`);
            }
        }
    }

    /**
     * Cleanup method to release resources
     * FileManager doesn't hold persistent resources, but this method
     * is provided for consistency with the component pattern
     */
    cleanup() {
        this.currentFilePath = null;
    }
}

module.exports = FileManager;
