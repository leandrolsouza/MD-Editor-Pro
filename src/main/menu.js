/**
 * Menu Module - Creates application menu with platform-specific accelerators
 * Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 6.1, 6.2, 7.1, 4.4
 */

const { Menu, app } = require('electron');

/**
 * Creates and sets the application menu
 * @param {WindowManager} windowManager - Window manager instance
 * @param {FileManager} fileManager - File manager instance
 * @param {Exporter} exporter - Exporter instance
 * @param {ConfigStore} configStore - Config store instance
 */
function createApplicationMenu(windowManager, fileManager, exporter, configStore) {
    const isMac = process.platform === 'darwin';

    // Get recent files for menu
    const recentFiles = configStore ? configStore.getRecentFiles() : [];

    // Define menu template
    const template = [
        // macOS app menu
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),

        // File menu
        {
            label: 'File',
            submenu: [
                {
                    label: 'New',
                    accelerator: isMac ? 'Cmd+N' : 'Ctrl+N',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'new');
                        }
                    }
                },
                {
                    label: 'Open...',
                    accelerator: isMac ? 'Cmd+O' : 'Ctrl+O',
                    click: () => {
                        console.log('Open menu clicked');
                        const mainWindow = windowManager.getMainWindow();

                        console.log('Main window:', mainWindow ? 'exists' : 'null');
                        if (mainWindow) {
                            console.log('Sending menu:action open');
                            mainWindow.webContents.send('menu:action', 'open');
                        }
                    }
                },
                {
                    label: 'Open Folder...',
                    accelerator: isMac ? 'Cmd+Shift+O' : 'Ctrl+Shift+O',
                    click: () => {
                        console.log('Open Folder menu clicked');
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            console.log('Sending menu:action open-folder');
                            mainWindow.webContents.send('menu:action', 'open-folder');
                        }
                    }
                },
                {
                    label: 'Close Folder',
                    click: () => {
                        console.log('Close Folder menu clicked');
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            console.log('Sending menu:action close-folder');
                            mainWindow.webContents.send('menu:action', 'close-folder');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Open Recent',
                    submenu: recentFiles.length > 0 ? [
                        ...recentFiles.map(file => ({
                            label: file.name,
                            click: () => {
                                const mainWindow = windowManager.getMainWindow();
                                if (mainWindow) {
                                    mainWindow.webContents.send('menu:action', 'open-recent', file.path);
                                }
                            }
                        })),
                        { type: 'separator' },
                        {
                            label: 'Clear Recent Files',
                            click: () => {
                                if (configStore) {
                                    configStore.clearRecentFiles();
                                    // Rebuild menu to reflect changes
                                    createApplicationMenu(windowManager, fileManager, exporter, configStore);
                                }
                            }
                        }
                    ] : [
                        {
                            label: 'No Recent Files',
                            enabled: false
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: 'Save',
                    accelerator: isMac ? 'Cmd+S' : 'Ctrl+S',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'save');
                        }
                    }
                },
                {
                    label: 'Save As...',
                    accelerator: isMac ? 'Cmd+Shift+S' : 'Ctrl+Shift+S',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'save-as');
                        }
                    }
                },
                {
                    label: 'Save All',
                    accelerator: isMac ? 'Cmd+Alt+S' : 'Ctrl+Alt+S',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'save-all');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Export',
                    submenu: [
                        {
                            label: 'Export to HTML...',
                            click: () => {
                                const mainWindow = windowManager.getMainWindow();

                                if (mainWindow) {
                                    mainWindow.webContents.send('menu:action', 'export-html');
                                }
                            }
                        },
                        {
                            label: 'Export to PDF...',
                            click: () => {
                                const mainWindow = windowManager.getMainWindow();

                                if (mainWindow) {
                                    mainWindow.webContents.send('menu:action', 'export-pdf');
                                }
                            }
                        }
                    ]
                },
                { type: 'separator' },
                ...(isMac ? [] : [
                    {
                        label: 'Exit',
                        accelerator: 'Alt+F4',
                        click: () => {
                            app.quit();
                        }
                    }
                ])
            ]
        },

        // Insert menu
        {
            label: 'Insert',
            submenu: [
                {
                    label: 'Template...',
                    accelerator: isMac ? 'Cmd+Shift+I' : 'Ctrl+Shift+I',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'insert-template');
                        }
                    }
                }
            ]
        },

        // Edit menu
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: isMac ? 'Cmd+Z' : 'Ctrl+Z',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'undo');
                        }
                    }
                },
                {
                    label: 'Redo',
                    accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'redo');
                        }
                    }
                },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { type: 'separator' },
                {
                    label: 'Find...',
                    accelerator: isMac ? 'Cmd+F' : 'Ctrl+F',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'find');
                        }
                    }
                },
                {
                    label: 'Find in Files...',
                    accelerator: isMac ? 'Cmd+Shift+F' : 'Ctrl+Shift+F',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'find-in-files');
                        }
                    }
                }
            ]
        },

        // View menu
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Theme',
                    accelerator: isMac ? 'Cmd+T' : 'Ctrl+T',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'toggle-theme');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Toggle Line Numbers',
                    type: 'checkbox',
                    checked: configStore ? configStore.get('lineNumbers') !== false : true,
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'toggle-line-numbers');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'View Mode',
                    submenu: [
                        {
                            label: 'Editor Only',
                            click: () => {
                                const mainWindow = windowManager.getMainWindow();

                                if (mainWindow) {
                                    mainWindow.webContents.send('menu:action', 'view-mode-editor');
                                }
                            }
                        },
                        {
                            label: 'Preview Only',
                            click: () => {
                                const mainWindow = windowManager.getMainWindow();

                                if (mainWindow) {
                                    mainWindow.webContents.send('menu:action', 'view-mode-preview');
                                }
                            }
                        },
                        {
                            label: 'Split View',
                            click: () => {
                                const mainWindow = windowManager.getMainWindow();

                                if (mainWindow) {
                                    mainWindow.webContents.send('menu:action', 'view-mode-split');
                                }
                            }
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: 'Toggle Sidebar',
                    type: 'checkbox',
                    checked: configStore ? configStore.get('workspace.sidebarVisible') : false,
                    accelerator: isMac ? 'Cmd+Shift+B' : 'Ctrl+Shift+B',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'toggle-sidebar');
                        }
                    }
                },
                {
                    label: 'Outline Panel',
                    type: 'checkbox',
                    checked: configStore ? configStore.getOutlineVisible() : false,
                    accelerator: isMac ? 'Cmd+Shift+O' : 'Ctrl+Shift+O',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'toggle-outline');
                        }
                    }
                },
                {
                    label: 'Typewriter Scrolling',
                    type: 'checkbox',
                    checked: configStore ? configStore.getTypewriterEnabled() : false,
                    accelerator: isMac ? 'Cmd+Shift+T' : 'Ctrl+Shift+T',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'toggle-typewriter');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Focus Mode',
                    accelerator: 'F11',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'focus-mode');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Toggle Statistics',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'toggle-statistics');
                        }
                    }
                },
                { type: 'separator' },
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },

        // Settings menu
        {
            label: 'Settings',
            submenu: [
                {
                    label: 'Keyboard Shortcuts...',
                    accelerator: isMac ? 'Cmd+K Cmd+S' : 'Ctrl+K Ctrl+S',
                    click: () => {
                        const mainWindow = windowManager.getMainWindow();

                        if (mainWindow) {
                            mainWindow.webContents.send('menu:action', 'open-keyboard-shortcuts');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Auto-Save',
                    submenu: [
                        {
                            label: 'Enable Auto-Save',
                            type: 'checkbox',
                            checked: true,
                            click: (menuItem) => {
                                const mainWindow = windowManager.getMainWindow();

                                if (mainWindow) {
                                    mainWindow.webContents.send('menu:action', 'toggle-auto-save');
                                }
                            }
                        },
                        {
                            label: 'Auto-Save Settings...',
                            click: () => {
                                const mainWindow = windowManager.getMainWindow();

                                if (mainWindow) {
                                    mainWindow.webContents.send('menu:action', 'auto-save-settings');
                                }
                            }
                        }
                    ]
                }
            ]
        },

        // Help menu
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Learn More',
                    click: async () => {
                        try {
                            const { shell } = require('electron');

                            await shell.openExternal('https://commonmark.org/');
                        } catch (error) {
                            console.error('Failed to open external link:', error);
                        }
                    }
                },
                {
                    label: 'GitHub Flavored Markdown',
                    click: async () => {
                        try {
                            const { shell } = require('electron');

                            await shell.openExternal('https://github.github.com/gfm/');
                        } catch (error) {
                            console.error('Failed to open external link:', error);
                        }
                    }
                },
                { type: 'separator' },
                ...(isMac ? [] : [
                    {
                        label: 'About',
                        click: () => {
                            const mainWindow = windowManager.getMainWindow();

                            if (mainWindow) {
                                mainWindow.webContents.send('menu:action', 'about');
                            }
                        }
                    }
                ])
            ]
        }
    ];

    // Build menu from template
    const menu = Menu.buildFromTemplate(template);

    // Set as application menu
    Menu.setApplicationMenu(menu);
}

/**
 * Update menu item checked state
 * @param {string} menuPath - Path to menu item (e.g., 'View.Toggle Sidebar')
 * @param {boolean} checked - New checked state
 */
function updateMenuItemChecked(menuPath, checked) {
    const menu = Menu.getApplicationMenu();
    if (!menu) return;

    const parts = menuPath.split('.');
    let currentMenu = menu;

    // Navigate to the menu item
    for (let i = 0; i < parts.length - 1; i++) {
        const item = currentMenu.items.find(item => item.label === parts[i]);
        if (!item || !item.submenu) return;
        currentMenu = item.submenu;
    }

    // Find and update the final menu item
    const menuItem = currentMenu.items.find(item => item.label === parts[parts.length - 1]);
    if (menuItem && menuItem.type === 'checkbox') {
        menuItem.checked = checked;
    }
}

module.exports = { createApplicationMenu, updateMenuItemChecked };
