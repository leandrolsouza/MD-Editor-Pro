/**
 * IPC Handlers — Config Operations
 * Handles: config:get, config:set, config:get-line-numbers, config:toggle-line-numbers
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de configuração
 * @param {Object} deps - Dependências
 * @param {import('../config-store')} deps.configStore - Instância do ConfigStore
 * @param {Function} deps.refreshMenu - Callback para atualizar o menu da aplicação
 * @param {Function} deps.updateMenuItemChecked - Callback para atualizar checkbox de menu item
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ configStore, refreshMenu, updateMenuItemChecked, ipcMain }) {
    ipcMain.handle('config:get', createIPCHandler(async (event, key) => {
        const value = configStore.get(key);

        return { success: true, value };
    }, 'getting config'));

    ipcMain.handle('config:set', createIPCHandler(async (event, key, value) => {
        configStore.set(key, value);

        // Update menu checkboxes for specific keys
        if (key === 'workspace.sidebarVisible') {
            updateMenuItemChecked('View.Toggle Sidebar', value);
        } else if (key === 'outline.visible') {
            updateMenuItemChecked('View.Outline Panel', value);
        } else if (key === 'typewriter.enabled') {
            updateMenuItemChecked('View.Typewriter Scrolling', value);
        }

        return { success: true };
    }, 'setting config'));

    ipcMain.handle('config:get-line-numbers', createIPCHandler(async () => {
        const enabled = configStore.get('lineNumbers');
        return enabled !== undefined ? enabled : true;
    }, 'getting line numbers config'));

    ipcMain.handle('config:toggle-line-numbers', createIPCHandler(async () => {
        const currentValue = configStore.get('lineNumbers');
        const newValue = currentValue !== undefined ? !currentValue : false;
        configStore.set('lineNumbers', newValue);

        // Update menu to reflect new state
        refreshMenu();

        return { success: true, enabled: newValue };
    }, 'toggling line numbers'));
}

module.exports = { register };
