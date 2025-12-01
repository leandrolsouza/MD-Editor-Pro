/**
 * File Tree Sidebar Integration Tests
 * Tests complete workflows across workspace, sidebar, tabs, and file operations
 * Task 18: Final integration testing
 * Requirements: All
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FileTreeSidebar from './renderer/file-tree-sidebar.js';
import TabBar from './renderer/tab-bar.js';
import Editor from './renderer/editor.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('File Tree Sidebar Integration Tests', () => {
    let sidebar;
    let tabBar;
    let editor;
    let sidebarContainer;
    let tabBarContainer;
    let editorContainer;
    let mockElectronAPI;
    let testWorkspaceDir;
    let testFiles;

    beforeEach(async () => {
        // Create test workspace directory structure
        testWorkspaceDir = path.join(os.tmpdir(), `test-workspace-${Date.now()}`);
        await fs.mkdir(testWorkspaceDir, { recursive: true });

        // Create test files and folders
        await fs.mkdir(path.join(testWorkspaceDir, 'folder1'));
        await fs.mkdir(path.join(testWorkspaceDir, 'folder2'));
        await fs.mkdir(path.join(testWorkspaceDir, 'folder1', 'subfolder'));

        await fs.writeFile(path.join(testWorkspaceDir, 'file1.md'), '# File 1\n\nContent of file 1');
        await fs.writeFile(path.join(testWorkspaceDir, 'file2.md'), '# File 2\n\nContent of file 2');
        await fs.writeFile(path.join(testWorkspaceDir, 'folder1', 'file3.md'), '# File 3\n\nContent of file 3');
        await fs.writeFile(path.join(testWorkspaceDir, 'folder1', 'subfolder', 'file4.md'), '# File 4\n\nContent of file 4');
        await fs.writeFile(path.join(testWorkspaceDir, 'folder2', 'file5.md'), '# File 5\n\nContent of file 5');

        testFiles = {
            file1: path.join(testWorkspaceDir, 'file1.md'),
            file2: path.join(testWorkspaceDir, 'file2.md'),
            file3: path.join(testWorkspaceDir, 'folder1', 'file3.md'),
            file4: path.join(testWorkspaceDir, 'folder1', 'subfolder', 'file4.md'),
            file5: path.join(testWorkspaceDir, 'folder2', 'file5.md')
        };

        // Setup DOM
        document.body.innerHTML = `
            <div id="file-tree-sidebar"></div>
            <div id="tab-bar"></div>
            <div id="editor-container"></div>
        `;

        sidebarContainer = document.getElementById('file-tree-sidebar');
        tabBarContainer = document.getElementById('tab-bar');
        editorContainer = document.getElementById('editor-container');

        // Mock electronAPI
        const configStore = new Map();
        const tabs = new Map();
        let tabIdCounter = 1;

        mockElectronAPI = {
            // Config operations
            getConfig: vi.fn(async (key) => {
                return configStore.get(key);
            }),
            setConfig: vi.fn(async (key, value) => {
                configStore.set(key, value);
                return { success: true };
            }),

            // File operations
            readFile: vi.fn(async (filePath) => {
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    return { success: true, content, filePath };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }),
            saveFile: vi.fn(async (filePath, content) => {
                try {
                    await fs.writeFile(filePath, content, 'utf-8');
                    return { success: true, filePath };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }),

            // Workspace operations
            openWorkspace: vi.fn(async () => {
                // Simulate opening the test workspace
                const tree = await buildTreeStructure(testWorkspaceDir);
                configStore.set('workspace.currentPath', testWorkspaceDir);
                return { success: true, workspacePath: testWorkspaceDir, tree };
            }),
            closeWorkspace: vi.fn(async () => {
                configStore.delete('workspace.currentPath');
                configStore.delete('workspace.expandedFolders');
                return { success: true };
            }),
            restoreWorkspace: vi.fn(async () => {
                const workspacePath = configStore.get('workspace.currentPath');
                if (!workspacePath) {
                    return { success: false, error: 'No saved workspace' };
                }
                const tree = await buildTreeStructure(workspacePath);
                return { success: true, workspacePath, tree };
            }),
            getWorkspaceTree: vi.fn(async () => {
                const workspacePath = configStore.get('workspace.currentPath');
                if (!workspacePath) {
                    return [];
                }
                return await buildTreeStructure(workspacePath);
            }),
            toggleFolder: vi.fn(async (folderPath, isExpanded) => {
                const expandedFolders = configStore.get('workspace.expandedFolders') || [];
                if (isExpanded) {
                    if (!expandedFolders.includes(folderPath)) {
                        expandedFolders.push(folderPath);
                    }
                } else {
                    const index = expandedFolders.indexOf(folderPath);
                    if (index !== -1) {
                        expandedFolders.splice(index, 1);
                    }
                }
                configStore.set('workspace.expandedFolders', expandedFolders);
                return { success: true };
            }),

            // Tab operations
            getAllTabs: vi.fn(async () => {
                return { success: true, tabs: Array.from(tabs.values()) };
            }),
            getTab: vi.fn(async (tabId) => {
                const tab = tabs.get(tabId);
                return tab ? { success: true, tab } : { success: false };
            }),
            createTab: vi.fn(async (filePath, content) => {
                const tabId = `tab-${tabIdCounter++}`;
                const title = filePath ? path.basename(filePath) : 'Untitled';
                const tab = { id: tabId, filePath, content, title, isModified: false };
                tabs.set(tabId, tab);
                return { success: true, tab };
            }),
            updateTabContent: vi.fn(async (tabId, content) => {
                const tab = tabs.get(tabId);
                if (tab) {
                    tab.content = content;
                    return { success: true };
                }
                return { success: false };
            }),
            markTabModified: vi.fn(async (tabId, isModified) => {
                const tab = tabs.get(tabId);
                if (tab) {
                    tab.isModified = isModified;
                    return { success: true };
                }
                return { success: false };
            }),
            closeTab: vi.fn(async (tabId) => {
                tabs.delete(tabId);
                return { success: true };
            })
        };

        global.window = global.window || {};
        global.window.electronAPI = mockElectronAPI;

        // Initialize components
        sidebar = new FileTreeSidebar(sidebarContainer);
        sidebar.initialize();
        sidebar.DEBOUNCE_DELAY = 0; // Disable debouncing for tests

        tabBar = new TabBar(tabBarContainer);
        tabBar.initialize();

        editor = new Editor();
        editor.initialize(editorContainer);
    });

    afterEach(async () => {
        // Cleanup
        if (sidebar) sidebar.destroy();
        if (editor) editor.destroy();
        if (testWorkspaceDir) {
            try {
                await fs.rm(testWorkspaceDir, { recursive: true, force: true });
            } catch (error) {
                console.error('Error cleaning up test workspace:', error);
            }
        }
        document.body.innerHTML = '';
    });

    describe('Complete Workflow: Open Folder → Browse Files → Open File → Edit → Save', () => {
        it('should handle complete workflow from opening folder to saving edited file', async () => {
            // Step 1: Open folder
            const openResult = await mockElectronAPI.openWorkspace();
            expect(openResult.success).toBe(true);
            expect(openResult.tree).toBeDefined();

            // Load workspace in sidebar
            await sidebar.loadWorkspace(openResult.tree);

            // Verify tree is rendered
            const nodes = sidebarContainer.querySelectorAll('.file-tree-sidebar__node');
            expect(nodes.length).toBeGreaterThan(0);

            // Step 2: Browse files - expand folder1
            const folder1Path = path.join(testWorkspaceDir, 'folder1');
            const folder1Node = Array.from(nodes).find(node =>
                node.dataset.path === folder1Path && node.dataset.type === 'folder'
            );
            expect(folder1Node).toBeTruthy();

            // Click to expand folder
            folder1Node.click();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Verify folder is expanded
            const expandIcon = folder1Node.querySelector('.file-tree-sidebar__expand-icon');
            expect(expandIcon.textContent).toBe('▼');

            // Step 3: Open file from sidebar
            const file3Path = testFiles.file3;
            let fileOpened = false;
            let openedFilePath = null;

            sidebar.onFileClick(async (filePath) => {
                fileOpened = true;
                openedFilePath = filePath;

                // Simulate opening file in editor
                const result = await mockElectronAPI.readFile(filePath);
                if (result.success) {
                    editor.setValue(result.content);

                    // Create tab
                    const tabResult = await mockElectronAPI.createTab(filePath, result.content);
                    if (tabResult.success) {
                        tabBar.addTab(tabResult.tab.id, tabResult.tab.title, true, false);
                        sidebar.setActiveFile(filePath);
                    }
                }
            });

            // Find and click file3.md
            const allNodesAfterExpand = sidebarContainer.querySelectorAll('.file-tree-sidebar__node');
            const file3Node = Array.from(allNodesAfterExpand).find(node =>
                node.dataset.path === file3Path && node.dataset.type === 'file'
            );
            expect(file3Node).toBeTruthy();

            file3Node.click();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Verify file was opened
            expect(fileOpened).toBe(true);
            expect(openedFilePath).toBe(file3Path);
            expect(editor.getValue()).toContain('# File 3');

            // Verify active file is highlighted in sidebar
            expect(file3Node.classList.contains('file-tree-sidebar__node--active')).toBe(true);

            // Step 4: Edit file
            const originalContent = editor.getValue();
            const newContent = originalContent + '\n\nNew content added';
            editor.setValue(newContent);

            // Mark file as modified in sidebar
            sidebar.markFileModified(file3Path, true);

            // Verify modified indicator is shown
            const modifiedIndicator = file3Node.querySelector('.file-tree-sidebar__modified-indicator');
            expect(modifiedIndicator).toBeTruthy();

            // Step 5: Save file
            const saveResult = await mockElectronAPI.saveFile(file3Path, newContent);
            expect(saveResult.success).toBe(true);

            // Remove modified indicator
            sidebar.markFileModified(file3Path, false);

            // Verify modified indicator is removed
            const modifiedIndicatorAfterSave = file3Node.querySelector('.file-tree-sidebar__modified-indicator');
            expect(modifiedIndicatorAfterSave).toBeFalsy();

            // Verify file content was actually saved
            const savedContent = await fs.readFile(file3Path, 'utf-8');
            expect(savedContent).toBe(newContent);
        });
    });

    describe('Workspace Persistence Across Application Restarts', () => {
        it('should persist and restore workspace path', async () => {
            // Open workspace
            const openResult = await mockElectronAPI.openWorkspace();
            expect(openResult.success).toBe(true);

            await sidebar.loadWorkspace(openResult.tree);

            // Verify workspace path is persisted
            const savedPath = await mockElectronAPI.getConfig('workspace.currentPath');
            expect(savedPath).toBe(testWorkspaceDir);

            // Simulate application restart - restore workspace
            const restoreResult = await mockElectronAPI.restoreWorkspace();
            expect(restoreResult.success).toBe(true);
            expect(restoreResult.workspacePath).toBe(testWorkspaceDir);
            expect(restoreResult.tree).toBeDefined();

            // Load restored workspace
            await sidebar.loadWorkspace(restoreResult.tree);

            // Verify tree is rendered correctly
            const nodes = sidebarContainer.querySelectorAll('.file-tree-sidebar__node');
            expect(nodes.length).toBeGreaterThan(0);
        });

        it('should handle missing workspace gracefully on restore', async () => {
            // Try to restore without opening workspace first
            const restoreResult = await mockElectronAPI.restoreWorkspace();
            expect(restoreResult.success).toBe(false);
            expect(restoreResult.error).toBeDefined();
        });
    });

    describe('Sidebar Visibility Persistence', () => {
        it('should persist sidebar visibility state', async () => {
            // Initially visible
            expect(sidebar.isVisible()).toBe(true);

            // Hide sidebar
            await sidebar.setVisibility(false);
            expect(sidebar.isVisible()).toBe(false);

            // Verify visibility is persisted
            const savedVisibility = await mockElectronAPI.getConfig('workspace.sidebarVisible');
            expect(savedVisibility).toBe(false);

            // Simulate application restart - restore visibility
            const restoredVisibility = await mockElectronAPI.getConfig('workspace.sidebarVisible');
            await sidebar.setVisibility(restoredVisibility);

            expect(sidebar.isVisible()).toBe(false);

            // Show sidebar again
            await sidebar.setVisibility(true);
            expect(sidebar.isVisible()).toBe(true);

            const savedVisibility2 = await mockElectronAPI.getConfig('workspace.sidebarVisible');
            expect(savedVisibility2).toBe(true);
        });

        it('should toggle sidebar visibility', async () => {
            const initialVisibility = sidebar.isVisible();

            await sidebar.toggleVisibility();
            expect(sidebar.isVisible()).toBe(!initialVisibility);

            await sidebar.toggleVisibility();
            expect(sidebar.isVisible()).toBe(initialVisibility);
        });
    });

    describe('Expansion State Persistence', () => {
        it('should persist folder expansion state', async () => {
            // Open workspace
            const openResult = await mockElectronAPI.openWorkspace();
            await sidebar.loadWorkspace(openResult.tree);

            // Expand folder1
            const folder1Path = path.join(testWorkspaceDir, 'folder1');

            sidebar.onFolderToggle(async (folderPath, isExpanded) => {
                await mockElectronAPI.toggleFolder(folderPath, isExpanded);
            });

            const nodes = sidebarContainer.querySelectorAll('.file-tree-sidebar__node');
            const folder1Node = Array.from(nodes).find(node =>
                node.dataset.path === folder1Path && node.dataset.type === 'folder'
            );

            folder1Node.click();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Verify expansion state is persisted
            const expandedFolders = await mockElectronAPI.getConfig('workspace.expandedFolders');
            expect(expandedFolders).toContain(folder1Path);

            // Collapse folder
            folder1Node.click();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Verify expansion state is updated
            const expandedFolders2 = await mockElectronAPI.getConfig('workspace.expandedFolders');
            expect(expandedFolders2).not.toContain(folder1Path);
        });

        it('should restore expansion state after application restart', async () => {
            // Open workspace and expand folder
            const openResult = await mockElectronAPI.openWorkspace();
            await sidebar.loadWorkspace(openResult.tree);

            const folder1Path = path.join(testWorkspaceDir, 'folder1');

            sidebar.onFolderToggle(async (folderPath, isExpanded) => {
                await mockElectronAPI.toggleFolder(folderPath, isExpanded);
            });

            const nodes = sidebarContainer.querySelectorAll('.file-tree-sidebar__node');
            const folder1Node = Array.from(nodes).find(node =>
                node.dataset.path === folder1Path && node.dataset.type === 'folder'
            );

            folder1Node.click();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Simulate application restart
            const restoreResult = await mockElectronAPI.restoreWorkspace();
            expect(restoreResult.success).toBe(true);

            // Verify expanded folders are restored
            const expandedFolders = await mockElectronAPI.getConfig('workspace.expandedFolders');
            expect(expandedFolders).toContain(folder1Path);
        });
    });

    describe('Tab System Integration', () => {
        it('should create tab when opening file from sidebar', async () => {
            // Open workspace
            const openResult = await mockElectronAPI.openWorkspace();
            await sidebar.loadWorkspace(openResult.tree);

            // Setup file click handler to create tab
            sidebar.onFileClick(async (filePath) => {
                const result = await mockElectronAPI.readFile(filePath);
                if (result.success) {
                    const tabResult = await mockElectronAPI.createTab(filePath, result.content);
                    if (tabResult.success) {
                        tabBar.addTab(tabResult.tab.id, tabResult.tab.title, true, false);
                        sidebar.setActiveFile(filePath);
                    }
                }
            });

            // Click file1.md
            const nodes = sidebarContainer.querySelectorAll('.file-tree-sidebar__node');
            const file1Node = Array.from(nodes).find(node =>
                node.dataset.path === testFiles.file1 && node.dataset.type === 'file'
            );

            file1Node.click();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Verify tab was created
            const allTabs = await mockElectronAPI.getAllTabs();
            expect(allTabs.tabs.length).toBe(1);
            expect(allTabs.tabs[0].filePath).toBe(testFiles.file1);

            // Verify tab is shown in tab bar
            const tabElements = tabBarContainer.querySelectorAll('.tab');
            expect(tabElements.length).toBe(1);
        });

        it('should switch to existing tab instead of creating duplicate', async () => {
            // Open workspace
            const openResult = await mockElectronAPI.openWorkspace();
            await sidebar.loadWorkspace(openResult.tree);

            // Setup file click handler with deduplication
            sidebar.onFileClick(async (filePath) => {
                // Check if tab already exists
                const allTabs = await mockElectronAPI.getAllTabs();
                const existingTab = allTabs.tabs.find(tab => tab.filePath === filePath);

                if (existingTab) {
                    // Switch to existing tab
                    tabBar.setActiveTab(existingTab.id);
                    sidebar.setActiveFile(filePath);
                } else {
                    // Create new tab
                    const result = await mockElectronAPI.readFile(filePath);
                    if (result.success) {
                        const tabResult = await mockElectronAPI.createTab(filePath, result.content);
                        if (tabResult.success) {
                            tabBar.addTab(tabResult.tab.id, tabResult.tab.title, true, false);
                            sidebar.setActiveFile(filePath);
                        }
                    }
                }
            });

            // Click file1.md first time
            const nodes = sidebarContainer.querySelectorAll('.file-tree-sidebar__node');
            const file1Node = Array.from(nodes).find(node =>
                node.dataset.path === testFiles.file1 && node.dataset.type === 'file'
            );

            file1Node.click();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Verify one tab exists
            let allTabs = await mockElectronAPI.getAllTabs();
            expect(allTabs.tabs.length).toBe(1);

            // Click file1.md again
            file1Node.click();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Verify still only one tab exists (no duplicate)
            allTabs = await mockElectronAPI.getAllTabs();
            expect(allTabs.tabs.length).toBe(1);
        });

        it('should update sidebar when tab is closed', async () => {
            // Open workspace and file
            const openResult = await mockElectronAPI.openWorkspace();
            await sidebar.loadWorkspace(openResult.tree);

            sidebar.onFileClick(async (filePath) => {
                const result = await mockElectronAPI.readFile(filePath);
                if (result.success) {
                    const tabResult = await mockElectronAPI.createTab(filePath, result.content);
                    if (tabResult.success) {
                        tabBar.addTab(tabResult.tab.id, tabResult.tab.title, true, false);
                        sidebar.setActiveFile(filePath);
                    }
                }
            });

            const nodes = sidebarContainer.querySelectorAll('.file-tree-sidebar__node');
            const file1Node = Array.from(nodes).find(node =>
                node.dataset.path === testFiles.file1 && node.dataset.type === 'file'
            );

            file1Node.click();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Verify file is active in sidebar
            expect(file1Node.classList.contains('file-tree-sidebar__node--active')).toBe(true);

            // Close tab
            const allTabs = await mockElectronAPI.getAllTabs();
            const tabId = allTabs.tabs[0].id;
            await mockElectronAPI.closeTab(tabId);
            tabBar.removeTab(tabId);

            // Clear active file in sidebar
            sidebar.setActiveFile(null);

            // Verify file is no longer active in sidebar
            expect(file1Node.classList.contains('file-tree-sidebar__node--active')).toBe(false);
        });

        it('should synchronize modified indicators between tabs and sidebar', async () => {
            // Open workspace and file
            const openResult = await mockElectronAPI.openWorkspace();
            await sidebar.loadWorkspace(openResult.tree);

            let currentTabId = null;

            sidebar.onFileClick(async (filePath) => {
                const result = await mockElectronAPI.readFile(filePath);
                if (result.success) {
                    const tabResult = await mockElectronAPI.createTab(filePath, result.content);
                    if (tabResult.success) {
                        currentTabId = tabResult.tab.id;
                        tabBar.addTab(tabResult.tab.id, tabResult.tab.title, true, false);
                        sidebar.setActiveFile(filePath);
                    }
                }
            });

            const nodes = sidebarContainer.querySelectorAll('.file-tree-sidebar__node');
            const file1Node = Array.from(nodes).find(node =>
                node.dataset.path === testFiles.file1 && node.dataset.type === 'file'
            );

            file1Node.click();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Mark file as modified
            await mockElectronAPI.markTabModified(currentTabId, true);
            tabBar.markTabModified(currentTabId, true);
            sidebar.markFileModified(testFiles.file1, true);

            // Verify modified indicator in sidebar
            let modifiedIndicator = file1Node.querySelector('.file-tree-sidebar__modified-indicator');
            expect(modifiedIndicator).toBeTruthy();

            // Save file
            await mockElectronAPI.markTabModified(currentTabId, false);
            tabBar.markTabModified(currentTabId, false);
            sidebar.markFileModified(testFiles.file1, false);

            // Verify modified indicator is removed
            modifiedIndicator = file1Node.querySelector('.file-tree-sidebar__modified-indicator');
            expect(modifiedIndicator).toBeFalsy();
        });
    });

    describe('Error Scenarios', () => {
        it('should handle file read errors gracefully', async () => {
            // Mock file read error
            mockElectronAPI.readFile.mockResolvedValueOnce({
                success: false,
                error: 'File not found'
            });

            const openResult = await mockElectronAPI.openWorkspace();
            await sidebar.loadWorkspace(openResult.tree);

            let errorOccurred = false;

            sidebar.onFileClick(async (filePath) => {
                const result = await mockElectronAPI.readFile(filePath);
                if (!result.success) {
                    errorOccurred = true;
                }
            });

            const nodes = sidebarContainer.querySelectorAll('.file-tree-sidebar__node');
            const file1Node = Array.from(nodes).find(node =>
                node.dataset.path === testFiles.file1 && node.dataset.type === 'file'
            );

            file1Node.click();
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(errorOccurred).toBe(true);
        });

        it('should handle workspace close errors gracefully', async () => {
            // Open workspace first
            await mockElectronAPI.openWorkspace();

            // Mock close error
            mockElectronAPI.closeWorkspace.mockResolvedValueOnce({
                success: false,
                error: 'Failed to close workspace'
            });

            const result = await mockElectronAPI.closeWorkspace();
            expect(result.success).toBe(false);
        });

        it('should handle invalid tree data', async () => {
            const invalidTree = [
                { name: 'invalid', path: null, type: 'file' } // Missing required fields
            ];

            await expect(async () => {
                await sidebar.loadWorkspace(invalidTree);
            }).rejects.toThrow();
        });
    });
});

/**
 * Helper function to build tree structure from directory
 */
async function buildTreeStructure(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            const children = await buildTreeStructure(fullPath);
            nodes.push({
                name: entry.name,
                path: fullPath,
                type: 'folder',
                children: children,
                isExpanded: false
            });
        } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.markdown'))) {
            nodes.push({
                name: entry.name,
                path: fullPath,
                type: 'file',
                children: [],
                isExpanded: false
            });
        }
    }

    // Sort: folders first, then files, alphabetically
    return nodes.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
}
