const fs = require('fs').promises;
const path = require('path');

// Regex patterns for link extraction
const MARKDOWN_LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;
const WIKI_LINK_REGEX = /\[\[([^\]]+)\]\]/g;
const EXTERNAL_LINK_REGEX = /^https?:\/\//i;
const ANCHOR_LINK_REGEX = /^#/;

/**
 * LinkAnalyzerManager - Scans markdown files in a workspace, extracts internal
 * links, and builds a graph data structure of document connections.
 * Follows the Manager pattern used by other managers in src/main/.
 */
class LinkAnalyzerManager {
    /**
     * @param {Object} workspaceManager - WorkspaceManager instance for workspace access
     */
    constructor(workspaceManager) {
        this.workspaceManager = workspaceManager;
    }

    /**
     * Checks whether a link is internal (not external URL or anchor).
     * @param {string} link - The link string to check
     * @returns {boolean} true if the link is internal, false for http/https/anchor links
     */
    isInternalLink(link) {
        if (EXTERNAL_LINK_REGEX.test(link)) {
            return false;
        }
        if (ANCHOR_LINK_REGEX.test(link)) {
            return false;
        }
        return true;
    }

    /**
     * Extracts internal links from markdown content.
     * Supports standard markdown links [text](path.md) and wiki links [[filename]].
     * Filters out external URLs and anchor links.
     * @param {string} content - The markdown content to parse
     * @param {string} sourceFilePath - Absolute path of the source file
     * @returns {Array<{target: string, type: string}>} Array of extracted link info
     */
    extractLinks(content, sourceFilePath) {
        const links = [];
        let match;

        // Extract standard markdown links: [text](path.md)
        MARKDOWN_LINK_REGEX.lastIndex = 0;
        while ((match = MARKDOWN_LINK_REGEX.exec(content)) !== null) {
            const linkPath = match[2];
            if (this.isInternalLink(linkPath)) {
                links.push({ target: linkPath, type: 'markdown' });
            }
        }

        // Extract wiki links: [[filename]]
        WIKI_LINK_REGEX.lastIndex = 0;
        while ((match = WIKI_LINK_REGEX.exec(content)) !== null) {
            const linkName = match[1];
            if (this.isInternalLink(linkName)) {
                links.push({ target: linkName, type: 'wiki' });
            }
        }

        return links;
    }

    /**
     * Resolves a link path relative to the source document's directory.
     * Returns a workspace-relative id (using forward slashes).
     * @param {string} link - The link target (relative path or wiki name)
     * @param {string} sourceDir - Absolute path of the source file's directory
     * @param {string} workspacePath - Absolute path of the workspace root
     * @returns {string} Workspace-relative path used as node id
     */
    resolveLinkPath(link, sourceDir, workspacePath) {
        // For wiki links without extension, append .md
        let linkPath = link;
        if (!path.extname(linkPath)) {
            linkPath = linkPath + '.md';
        }

        // Resolve the absolute path from the source directory
        const absolutePath = path.resolve(sourceDir, linkPath);

        // Security: ensure resolved path stays within the workspace
        const normalizedWorkspace = path.normalize(workspacePath) + path.sep;
        const normalizedAbsolute = path.normalize(absolutePath);

        if (!normalizedAbsolute.startsWith(normalizedWorkspace) && normalizedAbsolute !== path.normalize(workspacePath)) {
            // Link points outside workspace — return a safe relative indicator
            return null;
        }

        // Return workspace-relative path with forward slashes
        const relativePath = path.relative(workspacePath, absolutePath);
        return relativePath.replace(/\\/g, '/');
    }

    /**
     * Checks if a file exists in the workspace.
     * @param {string} filePath - Absolute path to check
     * @returns {Promise<boolean>} true if the file exists and is accessible
     */
    async fileExistsInWorkspace(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Recursively collects all markdown file paths from a directory.
     * @param {string} dirPath - Directory to scan
     * @returns {Promise<string[]>} Array of absolute file paths
     * @private
     */
    async _collectMarkdownFiles(dirPath) {
        const files = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                try {
                    if (entry.isDirectory()) {
                        const subFiles = await this._collectMarkdownFiles(fullPath);
                        files.push(...subFiles);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (ext === '.md' || ext === '.markdown') {
                            files.push(fullPath);
                        }
                    }
                } catch (error) {
                    // Permission denied or other file-level error — skip and continue
                    if (error.code === 'EACCES' || error.code === 'EPERM') {
                        console.warn(`Permission denied, skipping: ${fullPath}`);
                    } else {
                        console.error(`Error processing ${fullPath}:`, error.message);
                    }
                    continue;
                }
            }
        } catch (error) {
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                console.warn(`Permission denied, skipping directory: ${dirPath}`);
            } else {
                throw error;
            }
        }

        return files;
    }

    /**
     * Analyzes all markdown files in the workspace and builds a graph
     * data structure with nodes (documents) and edges (links).
     * @returns {Promise<{success: boolean, graph?: Object, error?: string}>}
     */
    async analyzeWorkspace() {
        try {
            const workspacePath = this.workspaceManager.getWorkspacePath();

            if (!workspacePath) {
                return { success: false, error: 'No workspace open' };
            }

            // Collect all markdown files recursively
            const markdownFiles = await this._collectMarkdownFiles(workspacePath);

            // Maps for building the graph
            const nodesMap = new Map(); // id -> node
            const edges = [];

            // First pass: create nodes for all existing files
            for (const filePath of markdownFiles) {
                const id = path.relative(workspacePath, filePath).replace(/\\/g, '/');
                const label = path.basename(filePath, path.extname(filePath));

                nodesMap.set(id, {
                    id,
                    label,
                    filePath,
                    exists: true,
                    inDegree: 0,
                    outDegree: 0
                });
            }

            // Second pass: read each file, extract links, build edges
            for (const filePath of markdownFiles) {
                const sourceId = path.relative(workspacePath, filePath).replace(/\\/g, '/');
                const sourceDir = path.dirname(filePath);

                let content;
                try {
                    content = await fs.readFile(filePath, 'utf-8');
                } catch (error) {
                    if (error.code === 'EACCES' || error.code === 'EPERM') {
                        console.warn(`Permission denied reading file, skipping: ${filePath}`);
                    } else {
                        console.error(`Error reading file ${filePath}:`, error.message);
                    }
                    continue;
                }

                const links = this.extractLinks(content, filePath);

                for (const link of links) {
                    const targetId = this.resolveLinkPath(link.target, sourceDir, workspacePath);

                    // Skip links that resolve outside the workspace
                    if (targetId === null) {
                        continue;
                    }

                    // Create target node if it doesn't exist yet
                    if (!nodesMap.has(targetId)) {
                        const targetAbsPath = path.resolve(workspacePath, targetId);
                        const exists = await this.fileExistsInWorkspace(targetAbsPath);

                        nodesMap.set(targetId, {
                            id: targetId,
                            label: path.basename(targetId, path.extname(targetId)),
                            filePath: targetAbsPath,
                            exists,
                            inDegree: 0,
                            outDegree: 0
                        });
                    }

                    edges.push({ source: sourceId, target: targetId });
                }
            }

            // Calculate inDegree and outDegree
            for (const edge of edges) {
                const sourceNode = nodesMap.get(edge.source);
                const targetNode = nodesMap.get(edge.target);
                if (sourceNode) sourceNode.outDegree++;
                if (targetNode) targetNode.inDegree++;
            }

            const graph = {
                nodes: Array.from(nodesMap.values()),
                edges
            };

            return { success: true, graph };
        } catch (error) {
            console.error('Error analyzing workspace:', error);
            return { success: false, error: `Failed to analyze workspace: ${error.message}` };
        }
    }
}

module.exports = LinkAnalyzerManager;
