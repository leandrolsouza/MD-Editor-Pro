/**
 * Unit tests for FileTreeSidebar class
 * Requirements: 3.1, 3.2, 4.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FileTreeSidebar from './file-tree-sidebar.js';

describe('FileTreeSidebar', () => {
    let sidebar;
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        sidebar = new FileTreeSidebar(container);
        sidebar.initialize();
        // Disable debouncing for tests
        sidebar.DEBOUNCE_DELAY = 0;
    });

    afterEach(() => {
        if (sidebar) {
            sidebar.destroy();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('initialization', () => {
        it('should initialize with container element', () => {
            expect(sidebar.container).toBe(container);
            expect(container.className).toBe('file-tree-sidebar');
            expect(container.getAttribute('role')).toBe('tree');
            expect(container.getAttribute('aria-label')).toBe('File tree');
            expect(container.getAttribute('tabindex')).toBe('0');
        });

        it('should throw error without container', () => {
            expect(() => new FileTreeSidebar(null)).toThrow('Container element is required');
        });
    });

    describe('file click handlers', () => {
        it('should trigger callback when file is clicked', async () => {
            const callback = vi.fn();
            sidebar.onFileClick(callback);

            const treeData = [
                { name: 'test.md', path: '/test.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);

            const fileNode = container.querySelector('.file-tree-sidebar__node');
            fileNode.click();

            expect(callback).toHaveBeenCalledWith('/test.md');
        });

        it('should handle multiple file click callbacks', async () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            sidebar.onFileClick(callback1);
            sidebar.onFileClick(callback2);

            const treeData = [
                { name: 'test.md', path: '/test.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);

            const fileNode = container.querySelector('.file-tree-sidebar__node');
            fileNode.click();

            expect(callback1).toHaveBeenCalledWith('/test.md');
            expect(callback2).toHaveBeenCalledWith('/test.md');
        });
    });

    describe('folder click handlers', () => {
        it('should expand collapsed folder when clicked', async () => {
            const callback = vi.fn();
            sidebar.onFolderToggle(callback);

            const treeData = [
                {
                    name: 'folder',
                    path: '/folder',
                    type: 'folder',
                    children: [
                        { name: 'test.md', path: '/folder/test.md', type: 'file', children: [], isExpanded: false }
                    ],
                    isExpanded: false
                }
            ];

            await sidebar.loadWorkspace(treeData);

            const folderNode = container.querySelector('.file-tree-sidebar__node');
            expect(folderNode.getAttribute('aria-expanded')).toBe('false');

            folderNode.click();

            expect(callback).toHaveBeenCalledWith('/folder', true);
            expect(treeData[0].isExpanded).toBe(true);
        });

        it('should collapse expanded folder when clicked', async () => {
            const callback = vi.fn();
            sidebar.onFolderToggle(callback);

            const treeData = [
                {
                    name: 'folder',
                    path: '/folder',
                    type: 'folder',
                    children: [
                        { name: 'test.md', path: '/folder/test.md', type: 'file', children: [], isExpanded: false }
                    ],
                    isExpanded: true
                }
            ];

            await sidebar.loadWorkspace(treeData);

            const folderNode = container.querySelector('.file-tree-sidebar__node');
            expect(folderNode.getAttribute('aria-expanded')).toBe('true');

            folderNode.click();

            expect(callback).toHaveBeenCalledWith('/folder', false);
            expect(treeData[0].isExpanded).toBe(false);
        });
    });

    describe('keyboard navigation', () => {
        it('should focus first node when container receives focus', async () => {
            const treeData = [
                { name: 'test1.md', path: '/test1.md', type: 'file', children: [], isExpanded: false },
                { name: 'test2.md', path: '/test2.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);

            container.focus();

            expect(sidebar.focusedNodePath).toBe('/test1.md');
        });

        it('should move focus down with ArrowDown key', async () => {
            const treeData = [
                { name: 'test1.md', path: '/test1.md', type: 'file', children: [], isExpanded: false },
                { name: 'test2.md', path: '/test2.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);

            container.focus();
            expect(sidebar.focusedNodePath).toBe('/test1.md');

            const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            container.dispatchEvent(event);

            expect(sidebar.focusedNodePath).toBe('/test2.md');
        });

        it('should move focus up with ArrowUp key', async () => {
            const treeData = [
                { name: 'test1.md', path: '/test1.md', type: 'file', children: [], isExpanded: false },
                { name: 'test2.md', path: '/test2.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);

            container.focus();
            sidebar._setFocusedNode('/test2.md');

            const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            container.dispatchEvent(event);

            expect(sidebar.focusedNodePath).toBe('/test1.md');
        });

        it('should expand folder with ArrowRight key', async () => {
            const treeData = [
                {
                    name: 'folder',
                    path: '/folder',
                    type: 'folder',
                    children: [
                        { name: 'test.md', path: '/folder/test.md', type: 'file', children: [], isExpanded: false }
                    ],
                    isExpanded: false
                }
            ];

            await sidebar.loadWorkspace(treeData);

            container.focus();
            expect(sidebar.focusedNodePath).toBe('/folder');
            expect(treeData[0].isExpanded).toBe(false);

            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            container.dispatchEvent(event);

            expect(treeData[0].isExpanded).toBe(true);
        });

        it('should collapse folder with ArrowLeft key', async () => {
            const treeData = [
                {
                    name: 'folder',
                    path: '/folder',
                    type: 'folder',
                    children: [
                        { name: 'test.md', path: '/folder/test.md', type: 'file', children: [], isExpanded: false }
                    ],
                    isExpanded: true
                }
            ];

            await sidebar.loadWorkspace(treeData);

            container.focus();
            expect(sidebar.focusedNodePath).toBe('/folder');
            expect(treeData[0].isExpanded).toBe(true);

            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            container.dispatchEvent(event);

            expect(treeData[0].isExpanded).toBe(false);
        });

        it('should trigger file click with Enter key', async () => {
            const callback = vi.fn();
            sidebar.onFileClick(callback);

            const treeData = [
                { name: 'test.md', path: '/test.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);

            container.focus();
            expect(sidebar.focusedNodePath).toBe('/test.md');

            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            container.dispatchEvent(event);

            expect(callback).toHaveBeenCalledWith('/test.md');
        });

        it('should trigger folder toggle with Enter key', async () => {
            // Mock window.electronAPI.toggleFolder
            window.electronAPI = window.electronAPI || {};
            window.electronAPI.toggleFolder = vi.fn().mockResolvedValue({
                success: true,
                children: []
            });

            const callback = vi.fn();
            sidebar.onFolderToggle(callback);

            const treeData = [
                {
                    name: 'folder',
                    path: '/folder',
                    type: 'folder',
                    children: [],
                    isExpanded: false
                }
            ];

            await sidebar.loadWorkspace(treeData);

            container.focus();
            expect(sidebar.focusedNodePath).toBe('/folder');

            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            container.dispatchEvent(event);

            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(callback).toHaveBeenCalledWith('/folder', true);
        });

        it('should focus first node with Home key', async () => {
            const treeData = [
                { name: 'test1.md', path: '/test1.md', type: 'file', children: [], isExpanded: false },
                { name: 'test2.md', path: '/test2.md', type: 'file', children: [], isExpanded: false },
                { name: 'test3.md', path: '/test3.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);

            container.focus();
            sidebar._setFocusedNode('/test3.md');

            const event = new KeyboardEvent('keydown', { key: 'Home' });
            container.dispatchEvent(event);

            expect(sidebar.focusedNodePath).toBe('/test1.md');
        });

        it('should focus last node with End key', async () => {
            const treeData = [
                { name: 'test1.md', path: '/test1.md', type: 'file', children: [], isExpanded: false },
                { name: 'test2.md', path: '/test2.md', type: 'file', children: [], isExpanded: false },
                { name: 'test3.md', path: '/test3.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);

            container.focus();
            expect(sidebar.focusedNodePath).toBe('/test1.md');

            const event = new KeyboardEvent('keydown', { key: 'End' });
            container.dispatchEvent(event);

            expect(sidebar.focusedNodePath).toBe('/test3.md');
        });
    });

    describe('ARIA attributes', () => {
        it('should set role="tree" on container', () => {
            expect(container.getAttribute('role')).toBe('tree');
        });

        it('should set role="treeitem" on nodes', async () => {
            const treeData = [
                { name: 'test.md', path: '/test.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);

            const node = container.querySelector('.file-tree-sidebar__node');
            expect(node.getAttribute('role')).toBe('treeitem');
        });

        it('should set aria-expanded on folder nodes', async () => {
            const treeData = [
                {
                    name: 'folder',
                    path: '/folder',
                    type: 'folder',
                    children: [],
                    isExpanded: false
                }
            ];

            await sidebar.loadWorkspace(treeData);

            const node = container.querySelector('.file-tree-sidebar__node');
            expect(node.getAttribute('aria-expanded')).toBe('false');
        });

        it('should set aria-selected on active file', async () => {
            const treeData = [
                { name: 'test.md', path: '/test.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);
            sidebar.setActiveFile('/test.md');

            const node = container.querySelector('.file-tree-sidebar__node');
            expect(node.getAttribute('aria-selected')).toBe('true');
        });

        it('should set aria-label on nodes', async () => {
            const treeData = [
                { name: 'test.md', path: '/test.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);

            const node = container.querySelector('.file-tree-sidebar__node');
            expect(node.getAttribute('aria-label')).toBe('test.md');
        });

        it('should set tabindex for keyboard navigation', async () => {
            const treeData = [
                { name: 'test1.md', path: '/test1.md', type: 'file', children: [], isExpanded: false },
                { name: 'test2.md', path: '/test2.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);

            container.focus();

            const nodes = container.querySelectorAll('.file-tree-sidebar__node');
            expect(nodes[0].getAttribute('tabindex')).toBe('0');
            expect(nodes[1].getAttribute('tabindex')).toBe('-1');
        });
    });

    describe('expand/collapse animations', () => {
        it('should animate folder expansion', async () => {
            const treeData = [
                {
                    name: 'folder',
                    path: '/folder',
                    type: 'folder',
                    children: [
                        { name: 'test.md', path: '/folder/test.md', type: 'file', children: [], isExpanded: false }
                    ],
                    isExpanded: false
                }
            ];

            await sidebar.loadWorkspace(treeData);

            const folderNode = container.querySelector('.file-tree-sidebar__node');
            folderNode.click();

            // Check that children container was created
            const childrenContainer = folderNode.nextElementSibling;
            expect(childrenContainer).toBeTruthy();
            expect(childrenContainer.classList.contains('file-tree-sidebar__children')).toBe(true);
        });

        it('should animate folder collapse', async () => {
            const treeData = [
                {
                    name: 'folder',
                    path: '/folder',
                    type: 'folder',
                    children: [
                        { name: 'test.md', path: '/folder/test.md', type: 'file', children: [], isExpanded: false }
                    ],
                    isExpanded: true
                }
            ];

            await sidebar.loadWorkspace(treeData);

            const folderNode = container.querySelector('.file-tree-sidebar__node');
            const childrenContainer = folderNode.nextElementSibling;
            expect(childrenContainer).toBeTruthy();

            folderNode.click();

            // Children container should still exist briefly during animation
            expect(childrenContainer.parentNode).toBeTruthy();
        });
    });

    describe('file state indicators', () => {
        it('should highlight active file', async () => {
            const treeData = [
                { name: 'test1.md', path: '/test1.md', type: 'file', children: [], isExpanded: false },
                { name: 'test2.md', path: '/test2.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);
            sidebar.setActiveFile('/test1.md');

            const nodes = container.querySelectorAll('.file-tree-sidebar__node');
            expect(nodes[0].classList.contains('file-tree-sidebar__node--active')).toBe(true);
            expect(nodes[1].classList.contains('file-tree-sidebar__node--active')).toBe(false);
        });

        it('should update active file highlight when changed', async () => {
            const treeData = [
                { name: 'test1.md', path: '/test1.md', type: 'file', children: [], isExpanded: false },
                { name: 'test2.md', path: '/test2.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);
            sidebar.setActiveFile('/test1.md');

            let nodes = container.querySelectorAll('.file-tree-sidebar__node');
            expect(nodes[0].classList.contains('file-tree-sidebar__node--active')).toBe(true);

            sidebar.setActiveFile('/test2.md');

            nodes = container.querySelectorAll('.file-tree-sidebar__node');
            expect(nodes[0].classList.contains('file-tree-sidebar__node--active')).toBe(false);
            expect(nodes[1].classList.contains('file-tree-sidebar__node--active')).toBe(true);
        });

        it('should display modified indicator for modified files', async () => {
            const treeData = [
                { name: 'test.md', path: '/test.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);
            sidebar.markFileModified('/test.md', true);

            const node = container.querySelector('.file-tree-sidebar__node');
            const indicator = node.querySelector('.file-tree-sidebar__modified-indicator');
            expect(indicator).toBeTruthy();
            expect(indicator.textContent).toBe('●');
        });

        it('should remove modified indicator when file is saved', async () => {
            const treeData = [
                { name: 'test.md', path: '/test.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);
            sidebar.markFileModified('/test.md', true);

            let node = container.querySelector('.file-tree-sidebar__node');
            let indicator = node.querySelector('.file-tree-sidebar__modified-indicator');
            expect(indicator).toBeTruthy();

            sidebar.markFileModified('/test.md', false);

            node = container.querySelector('.file-tree-sidebar__node');
            indicator = node.querySelector('.file-tree-sidebar__modified-indicator');
            expect(indicator).toBeFalsy();
        });

        it('should display multiple modified indicators', async () => {
            const treeData = [
                { name: 'test1.md', path: '/test1.md', type: 'file', children: [], isExpanded: false },
                { name: 'test2.md', path: '/test2.md', type: 'file', children: [], isExpanded: false },
                { name: 'test3.md', path: '/test3.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);
            sidebar.markFileModified('/test1.md', true);
            sidebar.markFileModified('/test3.md', true);

            const nodes = container.querySelectorAll('.file-tree-sidebar__node');
            const indicator1 = nodes[0].querySelector('.file-tree-sidebar__modified-indicator');
            const indicator2 = nodes[1].querySelector('.file-tree-sidebar__modified-indicator');
            const indicator3 = nodes[2].querySelector('.file-tree-sidebar__modified-indicator');

            expect(indicator1).toBeTruthy();
            expect(indicator2).toBeFalsy();
            expect(indicator3).toBeTruthy();
        });

        it('should clear indicators when workspace is cleared', async () => {
            const treeData = [
                { name: 'test.md', path: '/test.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);
            sidebar.setActiveFile('/test.md');
            sidebar.markFileModified('/test.md', true);

            expect(sidebar.activeFilePath).toBe('/test.md');
            expect(sidebar.modifiedFiles.has('/test.md')).toBe(true);

            sidebar.clearWorkspace();

            expect(sidebar.activeFilePath).toBe(null);
            expect(sidebar.modifiedFiles.size).toBe(0);
        });

        it('should maintain modified state when re-rendering tree', async () => {
            const treeData = [
                { name: 'test.md', path: '/test.md', type: 'file', children: [], isExpanded: false }
            ];

            await sidebar.loadWorkspace(treeData);
            sidebar.markFileModified('/test.md', true);

            // Re-render by loading workspace again
            await sidebar.loadWorkspace(treeData);

            const node = container.querySelector('.file-tree-sidebar__node');
            const indicator = node.querySelector('.file-tree-sidebar__modified-indicator');
            expect(indicator).toBeTruthy();
        });
    });
});
