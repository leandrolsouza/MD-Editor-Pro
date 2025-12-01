/**
 * Tests for KeyboardShortcutManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import KeyboardShortcutManager from './keyboard-shortcut-manager.js';
import ConfigStore from './config-store.js';

describe('KeyboardShortcutManager', () => {
    let manager;
    let configStore;

    beforeEach(() => {
        configStore = new ConfigStore();
        configStore.reset(); // Start with clean state
        manager = new KeyboardShortcutManager(configStore);
    });

    describe('Constructor', () => {
        it('should throw error if ConfigStore is not provided', () => {
            expect(() => new KeyboardShortcutManager()).toThrow('ConfigStore is required');
        });

        it('should initialize with default shortcuts', () => {
            expect(manager.defaultShortcuts).toBeDefined();
            expect(Object.keys(manager.defaultShortcuts).length).toBeGreaterThan(0);
        });

        it('should initialize with action metadata', () => {
            expect(manager.actionMetadata).toBeDefined();
            expect(Object.keys(manager.actionMetadata).length).toBeGreaterThan(0);
        });
    });

    describe('getShortcut', () => {
        it('should return default shortcut when no custom shortcut is set', () => {
            const shortcut = manager.getShortcut('file:save');

            expect(shortcut).toBe('Mod-S');
        });

        it('should return custom shortcut when set', () => {
            manager.setShortcut('file:save', 'Mod-Shift-S');
            const shortcut = manager.getShortcut('file:save');

            expect(shortcut).toBe('Mod-Shift-S');
        });

        it('should return undefined for non-existent action', () => {
            const shortcut = manager.getShortcut('non:existent');

            expect(shortcut).toBeUndefined();
        });
    });

    describe('setShortcut', () => {
        it('should set custom shortcut', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');
            expect(manager.getShortcut('file:save')).toBe('Ctrl-Alt-S');
        });

        it('should throw error for invalid action ID', () => {
            expect(() => manager.setShortcut('invalid:action', 'Mod-S')).toThrow('Invalid action ID');
        });

        it('should throw error for empty key binding', () => {
            expect(() => manager.setShortcut('file:save', '')).toThrow('Invalid key binding');
        });

        it('should throw error for non-string key binding', () => {
            expect(() => manager.setShortcut('file:save', 123)).toThrow('Invalid key binding');
        });

        it('should persist custom shortcut to ConfigStore', () => {
            manager.setShortcut('file:save', 'Mod-Shift-S');
            const stored = configStore.getKeyboardShortcut('file:save');

            expect(stored).toBe('Mod-Shift-S');
        });
    });

    describe('resetShortcut', () => {
        it('should reset shortcut to default', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');
            expect(manager.getShortcut('file:save')).toBe('Ctrl-Alt-S');

            manager.resetShortcut('file:save');
            expect(manager.getShortcut('file:save')).toBe('Mod-S');
        });

        it('should throw error for invalid action ID', () => {
            expect(() => manager.resetShortcut('invalid:action')).toThrow('Invalid action ID');
        });

        it('should remove custom shortcut from ConfigStore', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');
            manager.resetShortcut('file:save');

            const stored = configStore.getKeyboardShortcut('file:save');

            expect(stored).toBeUndefined();
        });
    });

    describe('resetAllShortcuts', () => {
        it('should reset all shortcuts to defaults', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');
            manager.setShortcut('file:open', 'Ctrl-Alt-O');

            manager.resetAllShortcuts();

            expect(manager.getShortcut('file:save')).toBe('Mod-S');
            expect(manager.getShortcut('file:open')).toBe('Mod-O');
        });

        it('should clear all custom shortcuts from ConfigStore', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');
            manager.setShortcut('file:open', 'Ctrl-Alt-O');

            manager.resetAllShortcuts();

            const allShortcuts = configStore.getAllKeyboardShortcuts();

            expect(Object.keys(allShortcuts).length).toBe(0);
        });
    });

    describe('hasConflict', () => {
        it('should return false when no conflict exists', () => {
            const hasConflict = manager.hasConflict('Ctrl-Alt-X');

            expect(hasConflict).toBe(false);
        });

        it('should return true when conflict exists with default shortcut', () => {
            const hasConflict = manager.hasConflict('Mod-S');

            expect(hasConflict).toBe(true);
        });

        it('should return true when conflict exists with custom shortcut', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');
            const hasConflict = manager.hasConflict('Ctrl-Alt-S');

            expect(hasConflict).toBe(true);
        });

        it('should exclude specified action from conflict check', () => {
            const hasConflict = manager.hasConflict('Mod-S', 'file:save');

            expect(hasConflict).toBe(false);
        });

        it('should be case-insensitive', () => {
            const hasConflict = manager.hasConflict('mod-s');

            expect(hasConflict).toBe(true);
        });
    });

    describe('getConflictingAction', () => {
        it('should return null when no conflict exists', () => {
            const conflicting = manager.getConflictingAction('Ctrl-Alt-X');

            expect(conflicting).toBeNull();
        });

        it('should return conflicting action ID', () => {
            const conflicting = manager.getConflictingAction('Mod-S');

            expect(conflicting).toBe('file:save');
        });

        it('should exclude specified action from conflict check', () => {
            const conflicting = manager.getConflictingAction('Mod-S', 'file:save');

            expect(conflicting).toBeNull();
        });
    });

    describe('getAvailableActions', () => {
        it('should return all available actions', () => {
            const actions = manager.getAvailableActions();

            expect(Array.isArray(actions)).toBe(true);
            expect(actions.length).toBeGreaterThan(0);
        });

        it('should include action metadata', () => {
            const actions = manager.getAvailableActions();
            const saveAction = actions.find(a => a.id === 'file:save');

            expect(saveAction).toBeDefined();
            expect(saveAction.name).toBe('Save File');
            expect(saveAction.category).toBe('File');
            expect(saveAction.shortcut).toBe('Mod-S');
            expect(saveAction.isDefault).toBe(true);
        });

        it('should mark custom shortcuts as not default', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');

            const actions = manager.getAvailableActions();
            const saveAction = actions.find(a => a.id === 'file:save');

            expect(saveAction.shortcut).toBe('Ctrl-Alt-S');
            expect(saveAction.isDefault).toBe(false);
        });
    });

    describe('getAllShortcuts', () => {
        it('should return all shortcuts', () => {
            const shortcuts = manager.getAllShortcuts();

            expect(typeof shortcuts).toBe('object');
            expect(Object.keys(shortcuts).length).toBeGreaterThan(0);
        });

        it('should include custom shortcuts', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');

            const shortcuts = manager.getAllShortcuts();

            expect(shortcuts['file:save']).toBe('Ctrl-Alt-S');
        });

        it('should include default shortcuts for actions without custom shortcuts', () => {
            const shortcuts = manager.getAllShortcuts();

            expect(shortcuts['file:open']).toBe('Mod-O');
        });
    });

    describe('getDefaultShortcut', () => {
        it('should return default shortcut', () => {
            const shortcut = manager.getDefaultShortcut('file:save');

            expect(shortcut).toBe('Mod-S');
        });

        it('should return undefined for non-existent action', () => {
            const shortcut = manager.getDefaultShortcut('non:existent');

            expect(shortcut).toBeUndefined();
        });

        it('should return default even when custom shortcut is set', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');
            const shortcut = manager.getDefaultShortcut('file:save');

            expect(shortcut).toBe('Mod-S');
        });
    });

    describe('hasCustomShortcut', () => {
        it('should return false when no custom shortcut is set', () => {
            const hasCustom = manager.hasCustomShortcut('file:save');

            expect(hasCustom).toBe(false);
        });

        it('should return true when custom shortcut is set', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');
            const hasCustom = manager.hasCustomShortcut('file:save');

            expect(hasCustom).toBe(true);
        });

        it('should return false after resetting shortcut', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');
            manager.resetShortcut('file:save');
            const hasCustom = manager.hasCustomShortcut('file:save');

            expect(hasCustom).toBe(false);
        });
    });

    describe('Integration with ConfigStore', () => {
        it('should persist shortcuts across manager instances', () => {
            manager.setShortcut('file:save', 'Ctrl-Alt-S');

            // Create new manager with same config store
            const newManager = new KeyboardShortcutManager(configStore);

            expect(newManager.getShortcut('file:save')).toBe('Ctrl-Alt-S');
        });

        it('should load existing shortcuts from ConfigStore', () => {
            configStore.setKeyboardShortcut('file:save', 'Ctrl-Alt-S');

            const newManager = new KeyboardShortcutManager(configStore);

            expect(newManager.getShortcut('file:save')).toBe('Ctrl-Alt-S');
        });
    });
});
