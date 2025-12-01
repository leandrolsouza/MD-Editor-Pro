const { dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');

/**
 * WorkspaceManager handles workspace operations including opening folders,
 * scanning directory structures, and managing workspace state.
 */
class WorkspaceManager {
    /**
     * @param {Object} configStore - ConfigStore instance for persisting workspace state
     */
    constructor(configStore) {
        this.configStore = configStore;
        this.workspacePath = null;
        this.expandedFolders = new Set();
        // Performance optimization: Cache for scanned directory contents
        this.directoryCache = new Map();
        this.cacheTimestamps = new Map();
        this.CACHE_TTL = 30000; // 30 seconds cache TTL
    }

    /**
     * Opens a folder selection dialog and loads the selected folder as workspace
     * @returns {Promise<{success: boolean, workspacePath?: string, tree?: Array, error?: string}>}
     */
    async openWorkspace() {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory']
            });

            if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
                return { success: false, error: 'No folder selected' };
            }

            const selectedPath = result.filePaths[0];

            // Validate the path
            if (!this.isValidPath(selectedPath)) {
                console.error(`Invalid folder path: ${selectedPath}`);
                return { success: false, error: 'Invalid folder path. Please select a valid directory.' };
            }

            // Check if path exists and is accessible
            try {
                await fs.access(selectedPath, fs.constants.R_OK);
            } catch (accessError) {
                this._handleFileSystemError(accessError, selectedPath);
                return {
                    success: false,
                    error: 'Cannot access the selected folder. Please check permissions.'
                };
            }

            this.workspacePath = selectedPath;

            // Persist workspace path
            try {
                this.configStore.set('workspace.currentPath', selectedPath);
            } catch (configError) {
                console.error('Error persisting workspace path:', configError);
                // Continue anyway - this is not critical
            }

            // Scan the directory to build tree structure
            const tree = await this.scanDirectory(selectedPath);

            return {
                success: true,
                workspacePath: selectedPath,
                tree: tree
            };
        } catch (error) {
            console.error('Error opening workspace:', error);
            this._handleFileSystemError(error, 'workspace');
            return {
                success: false,
                error: `Failed to open workspace: ${error.message}`
            };
        }
    }

    /**
     * Closes the current workspace and clears state
     * @returns {{success: boolean}}
     */
    closeWorkspace() {
        try {
            this.workspacePath = null;
            this.expandedFolders.clear();

            // Clear caches
            this.directoryCache.clear();
            this.cacheTimestamps.clear();

            // Remove workspace path from config
            this.configStore.delete('workspace.currentPath');
            this.configStore.delete('workspace.expandedFolders');

            return { success: true };
        } catch (error) {
            console.error('Error closing workspace:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Gets the current workspace path
     * @returns {string|null}
     */
    getWorkspacePath() {
        return this.workspacePath;
    }

    /**
     * Gets the workspace tree structure
     * @returns {Promise<Array>}
     */
    async getWorkspaceTree() {
        if (!this.workspacePath) {
            return [];
        }

        try {
            return await this.scanDirectory(this.workspacePath);
        } catch (error) {
            console.error('Error getting workspace tree:', error);
            return [];
        }
    }

    /**
     * Scans a directory and builds a tree structure with lazy loading support
     * Performance optimization: Uses caching to avoid repeated file system scans
     * @param {string} dirPath - Directory path to scan
     * @param {boolean} recursive - Whether to recursively scan subdirectories (default: false for lazy loading)
     * @returns {Promise<Array<TreeNode>>}
     */
    async scanDirectory(dirPath, recursive = false) {
        try {
            // Check cache first
            const cached = this._getCachedDirectory(dirPath);
            if (cached) {
                return cached;
            }

            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            const nodes = [];

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                try {
                    if (entry.isDirectory()) {
                        // Include all subdirectories
                        const isExpanded = this.expandedFolders.has(fullPath);
                        let children = [];

                        // Only load children if folder is expanded (lazy loading)
                        // Or if recursive mode is enabled (for initial full scan)
                        if (isExpanded || recursive) {
                            children = await this.scanDirectory(fullPath, recursive);
                        }

                        nodes.push({
                            name: entry.name,
                            path: fullPath,
                            type: 'folder',
                            children: children,
                            isExpanded: isExpanded
                        });
                    } else if (entry.isFile() && this.isMarkdownFile(entry.name)) {
                        // Include only markdown files
                        nodes.push({
                            name: entry.name,
                            path: fullPath,
                            type: 'file',
                            children: [],
                            isExpanded: false
                        });
                    }
                } catch (error) {
                    // Handle specific error types
                    this._handleFileSystemError(error, fullPath);
                    // Continue processing remaining items
                    continue;
                }
            }

            // Sort: folders first, then files, alphabetically within each group
            const sortedNodes = this.sortNodes(nodes);

            // Cache the result
            this._cacheDirectory(dirPath, sortedNodes);

            return sortedNodes;
        } catch (error) {
            // Handle directory-level errors
            this._handleFileSystemError(error, dirPath);
            throw error;
        }
    }

    /**
     * Checks if a file is a markdown file based on extension
     * @param {string} filename - File name to check
     * @returns {boolean}
     */
    isMarkdownFile(filename) {
        const ext = path.extname(filename).toLowerCase();
        return ext === '.md' || ext === '.markdown';
    }

    /**
     * Sorts tree nodes: folders first, then files, alphabetically within each group
     * @param {Array<TreeNode>} nodes - Array of tree nodes to sort
     * @returns {Array<TreeNode>}
     */
    sortNodes(nodes) {
        return nodes.sort((a, b) => {
            // Folders come before files
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;

            // Within same type, sort alphabetically (case-insensitive)
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });
    }

    /**
     * Checks if a path is within the current workspace
     * @param {string} filePath - File path to check
     * @returns {boolean}
     */
    isPathInWorkspace(filePath) {
        if (!this.workspacePath || !filePath) {
            return false;
        }

        const normalizedWorkspace = path.normalize(this.workspacePath);
        const normalizedFile = path.normalize(filePath);

        return normalizedFile.startsWith(normalizedWorkspace);
    }

    /**
     * Validates a path for security and correctness
     * @param {string} pathToValidate - Path to validate
     * @returns {boolean}
     */
    isValidPath(pathToValidate) {
        if (!pathToValidate || typeof pathToValidate !== 'string') {
            return false;
        }

        try {
            // Normalize the path to resolve any .. or . segments
            const normalized = path.normalize(pathToValidate);

            // Check for path traversal attempts
            if (normalized.includes('..')) {
                return false;
            }

            // Check if path is absolute
            if (!path.isAbsolute(normalized)) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Restores workspace from saved configuration
     * @returns {Promise<{success: boolean, workspacePath?: string, tree?: Array, error?: string}>}
     */
    async restoreWorkspace() {
        try {
            const savedPath = this.configStore.get('workspace.currentPath');

            if (!savedPath) {
                return { success: false, error: 'No saved workspace found' };
            }

            // Validate the saved path still exists and is accessible
            try {
                await fs.access(savedPath, fs.constants.R_OK);
            } catch (accessError) {
                // Path no longer exists or is not accessible, clear it from config
                console.warn(`Saved workspace path is not accessible: ${savedPath}`);
                this._handleFileSystemError(accessError, savedPath);

                try {
                    this.configStore.delete('workspace.currentPath');
                    this.configStore.delete('workspace.expandedFolders');
                } catch (configError) {
                    console.error('Error clearing invalid workspace from config:', configError);
                }

                return {
                    success: false,
                    error: 'Saved workspace is no longer accessible. It may have been moved or deleted.'
                };
            }

            this.workspacePath = savedPath;

            // Restore expanded folders
            try {
                const expandedFolders = this.configStore.get('workspace.expandedFolders', []);
                this.expandedFolders = new Set(expandedFolders);
            } catch (configError) {
                console.error('Error restoring expanded folders:', configError);
                // Continue with empty set
                this.expandedFolders = new Set();
            }

            // Scan the directory
            const tree = await this.scanDirectory(savedPath);

            return {
                success: true,
                workspacePath: savedPath,
                tree: tree
            };
        } catch (error) {
            console.error('Error restoring workspace:', error);
            this._handleFileSystemError(error, 'workspace restore');
            return {
                success: false,
                error: `Failed to restore workspace: ${error.message}`
            };
        }
    }

    /**
     * Toggles folder expansion state and loads contents on-demand
     * @param {string} folderPath - Path of folder to toggle
     * @param {boolean} isExpanded - New expansion state
     * @returns {Promise<{success: boolean, children?: Array, error?: string}>}
     */
    async toggleFolder(folderPath, isExpanded) {
        try {
            // Validate folder path
            if (!folderPath || typeof folderPath !== 'string') {
                return { success: false, error: 'Invalid folder path' };
            }

            // Check if folder is within workspace
            if (!this.isPathInWorkspace(folderPath)) {
                console.error(`Folder path is not within workspace: ${folderPath}`);
                return { success: false, error: 'Folder is not within the current workspace' };
            }

            // Update expansion state
            if (isExpanded) {
                this.expandedFolders.add(folderPath);
            } else {
                this.expandedFolders.delete(folderPath);
            }

            // Persist expanded folders
            try {
                this.configStore.set('workspace.expandedFolders', Array.from(this.expandedFolders));
            } catch (configError) {
                console.error('Error persisting expanded folders:', configError);
                // Continue anyway - this is not critical
            }

            // Load folder contents on-demand when expanding
            let children = [];
            if (isExpanded) {
                try {
                    children = await this.loadFolderContents(folderPath);
                } catch (loadError) {
                    this._handleFileSystemError(loadError, folderPath);
                    return {
                        success: false,
                        error: `Failed to load folder contents: ${loadError.message}`
                    };
                }
            }

            return { success: true, children: children };
        } catch (error) {
            console.error('Error toggling folder:', error);
            this._handleFileSystemError(error, folderPath);
            return {
                success: false,
                error: `Failed to toggle folder: ${error.message}`
            };
        }
    }

    /**
     * Loads the contents of a specific folder on-demand
     * @param {string} folderPath - Path of folder to load
     * @returns {Promise<Array<TreeNode>>}
     */
    async loadFolderContents(folderPath) {
        try {
            // Validate path is within workspace
            if (!this.isPathInWorkspace(folderPath)) {
                throw new Error('Folder path is not within workspace');
            }

            // Scan only the immediate children (non-recursive)
            return await this.scanDirectory(folderPath, false);
        } catch (error) {
            console.error(`Error loading folder contents for ${folderPath}:`, error);
            throw error;
        }
    }

    /**
     * Get cached directory contents if available and not expired
     * Performance optimization: Requirement 8.3
     * @param {string} dirPath - Directory path
     * @returns {Array<TreeNode>|null} Cached nodes or null if not cached/expired
     * @private
     */
    _getCachedDirectory(dirPath) {
        if (!this.directoryCache.has(dirPath)) {
            return null;
        }

        const timestamp = this.cacheTimestamps.get(dirPath);
        const now = Date.now();

        // Check if cache is expired
        if (now - timestamp > this.CACHE_TTL) {
            this.directoryCache.delete(dirPath);
            this.cacheTimestamps.delete(dirPath);
            return null;
        }

        return this.directoryCache.get(dirPath);
    }

    /**
     * Cache directory contents
     * Performance optimization: Requirement 8.3
     * @param {string} dirPath - Directory path
     * @param {Array<TreeNode>} nodes - Tree nodes to cache
     * @private
     */
    _cacheDirectory(dirPath, nodes) {
        this.directoryCache.set(dirPath, nodes);
        this.cacheTimestamps.set(dirPath, Date.now());
    }

    /**
     * Invalidate cache for a specific directory
     * @param {string} dirPath - Directory path to invalidate
     */
    invalidateCache(dirPath) {
        this.directoryCache.delete(dirPath);
        this.cacheTimestamps.delete(dirPath);
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.directoryCache.clear();
        this.cacheTimestamps.clear();
    }

    /**
     * Handle file system errors with appropriate logging and user-friendly messages
     * Requirements: 4.5, 8.4
     * @param {Error} error - The error object
     * @param {string} path - The path where the error occurred
     * @private
     */
    _handleFileSystemError(error, path) {
        const errorCode = error.code;

        switch (errorCode) {
            case 'ENOENT':
                // File or directory not found
                console.warn(`File or directory not found: ${path}`);
                break;

            case 'EACCES':
            case 'EPERM':
                // Permission denied
                console.error(`Permission denied accessing: ${path}`);
                console.error('The application does not have permission to access this file or directory.');
                break;

            case 'EMFILE':
            case 'ENFILE':
                // Too many open files
                console.error(`Too many open files while accessing: ${path}`);
                console.error('System has too many open files. Try closing other applications.');
                break;

            case 'ENOTDIR':
                // Not a directory
                console.warn(`Expected directory but found file: ${path}`);
                break;

            case 'EISDIR':
                // Is a directory (when expecting a file)
                console.warn(`Expected file but found directory: ${path}`);
                break;

            case 'EBUSY':
                // Resource busy or locked
                console.error(`File or directory is busy: ${path}`);
                console.error('The file or directory is currently in use by another process.');
                break;

            default:
                // Unknown error
                console.error(`Error accessing ${path}:`, error.message);
                if (error.stack) {
                    console.error('Stack trace:', error.stack);
                }
                break;
        }
    }
}

module.exports = WorkspaceManager;
