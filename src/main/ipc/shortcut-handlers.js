/**
 * IPC Handlers — Keyboard Shortcut Operations
 * Handles: shortcuts:get, shortcuts:set, shortcuts:reset, shortcuts:reset-all,
 *          shortcuts:get-all, shortcuts:get-available-actions, shortcuts:check-conflict,
 *          shortcuts:get-default
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de atalhos de teclado
 * @param {Object} deps - Dependências
 * @param {import('../keyboard-shortcut-manager')} deps.keyboardShortcutManager - Instância do KeyboardShortcutManager
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ keyboardShortcutManager, ipcMain }) {
    ipcMain.handle('shortcuts:get', createIPCHandler(async (event, actionId) => {
        const shortcut = keyboardShortcutManager.getShortcut(actionId);

        return { success: true, shortcut };
    }, 'getting shortcut'));

    ipcMain.handle('shortcuts:set', createIPCHandler(async (event, actionId, keyBinding) => {
        keyboardShortcutManager.setShortcut(actionId, keyBinding);
        return { success: true };
    }, 'setting shortcut'));

    ipcMain.handle('shortcuts:reset', createIPCHandler(async (event, actionId) => {
        keyboardShortcutManager.resetShortcut(actionId);
        return { success: true };
    }, 'resetting shortcut'));

    ipcMain.handle('shortcuts:reset-all', createIPCHandler(async () => {
        keyboardShortcutManager.resetAllShortcuts();
        return { success: true };
    }, 'resetting all shortcuts'));

    ipcMain.handle('shortcuts:get-all', createIPCHandler(async () => {
        const shortcuts = keyboardShortcutManager.getAllShortcuts();

        return { success: true, shortcuts };
    }, 'getting all shortcuts'));

    ipcMain.handle('shortcuts:get-available-actions', createIPCHandler(async () => {
        const actions = keyboardShortcutManager.getAvailableActions();

        return { success: true, actions };
    }, 'getting available actions'));

    ipcMain.handle('shortcuts:check-conflict', createIPCHandler(async (event, keyBinding, excludeActionId) => {
        const hasConflict = keyboardShortcutManager.hasConflict(keyBinding, excludeActionId);
        const conflictingAction = keyboardShortcutManager.getConflictingAction(keyBinding, excludeActionId);

        return { success: true, hasConflict, conflictingAction };
    }, 'checking conflict'));

    ipcMain.handle('shortcuts:get-default', createIPCHandler(async (event, actionId) => {
        const shortcut = keyboardShortcutManager.getDefaultShortcut(actionId);

        return { success: true, shortcut };
    }, 'getting default shortcut'));
}

module.exports = { register };
