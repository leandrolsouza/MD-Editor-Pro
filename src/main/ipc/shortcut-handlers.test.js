/**
 * Tests for shortcut-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./shortcut-handlers');

describe('shortcut-handlers', () => {
    let keyboardShortcutManager;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        keyboardShortcutManager = {
            getShortcut: vi.fn(),
            setShortcut: vi.fn(),
            resetShortcut: vi.fn(),
            resetAllShortcuts: vi.fn(),
            getAllShortcuts: vi.fn(),
            getAvailableActions: vi.fn(),
            hasConflict: vi.fn(),
            getConflictingAction: vi.fn(),
            getDefaultShortcut: vi.fn()
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ keyboardShortcutManager, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 8 shortcut IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(8);
        expect(handlers['shortcuts:get']).toBeDefined();
        expect(handlers['shortcuts:set']).toBeDefined();
        expect(handlers['shortcuts:reset']).toBeDefined();
        expect(handlers['shortcuts:reset-all']).toBeDefined();
        expect(handlers['shortcuts:get-all']).toBeDefined();
        expect(handlers['shortcuts:get-available-actions']).toBeDefined();
        expect(handlers['shortcuts:check-conflict']).toBeDefined();
        expect(handlers['shortcuts:get-default']).toBeDefined();
    });

    describe('shortcuts:get', () => {
        it('returns shortcut for given actionId', async () => {
            const mockShortcut = { key: 'Ctrl+S', actionId: 'save' };
            keyboardShortcutManager.getShortcut.mockReturnValue(mockShortcut);

            const result = await handlers['shortcuts:get']({}, 'save');

            expect(keyboardShortcutManager.getShortcut).toHaveBeenCalledWith('save');
            expect(result).toEqual({ success: true, shortcut: mockShortcut });
        });

        it('throws when keyboardShortcutManager.getShortcut throws', async () => {
            keyboardShortcutManager.getShortcut.mockImplementation(() => { throw new Error('not found'); });

            await expect(handlers['shortcuts:get']({}, 'invalid')).rejects.toThrow('not found');
        });
    });

    describe('shortcuts:set', () => {
        it('sets shortcut and returns success', async () => {
            const result = await handlers['shortcuts:set']({}, 'save', 'Ctrl+Shift+S');

            expect(keyboardShortcutManager.setShortcut).toHaveBeenCalledWith('save', 'Ctrl+Shift+S');
            expect(result).toEqual({ success: true });
        });

        it('throws when keyboardShortcutManager.setShortcut throws', async () => {
            keyboardShortcutManager.setShortcut.mockImplementation(() => { throw new Error('invalid binding'); });

            await expect(handlers['shortcuts:set']({}, 'save', 'bad')).rejects.toThrow('invalid binding');
        });
    });

    describe('shortcuts:reset', () => {
        it('resets shortcut for given actionId and returns success', async () => {
            const result = await handlers['shortcuts:reset']({}, 'save');

            expect(keyboardShortcutManager.resetShortcut).toHaveBeenCalledWith('save');
            expect(result).toEqual({ success: true });
        });

        it('throws when keyboardShortcutManager.resetShortcut throws', async () => {
            keyboardShortcutManager.resetShortcut.mockImplementation(() => { throw new Error('reset error'); });

            await expect(handlers['shortcuts:reset']({}, 'save')).rejects.toThrow('reset error');
        });
    });

    describe('shortcuts:reset-all', () => {
        it('resets all shortcuts and returns success', async () => {
            const result = await handlers['shortcuts:reset-all']({});

            expect(keyboardShortcutManager.resetAllShortcuts).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true });
        });

        it('throws when keyboardShortcutManager.resetAllShortcuts throws', async () => {
            keyboardShortcutManager.resetAllShortcuts.mockImplementation(() => { throw new Error('reset all error'); });

            await expect(handlers['shortcuts:reset-all']({})).rejects.toThrow('reset all error');
        });
    });

    describe('shortcuts:get-all', () => {
        it('returns all shortcuts', async () => {
            const mockShortcuts = [{ actionId: 'save', key: 'Ctrl+S' }, { actionId: 'open', key: 'Ctrl+O' }];
            keyboardShortcutManager.getAllShortcuts.mockReturnValue(mockShortcuts);

            const result = await handlers['shortcuts:get-all']({});

            expect(keyboardShortcutManager.getAllShortcuts).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, shortcuts: mockShortcuts });
        });

        it('throws when keyboardShortcutManager.getAllShortcuts throws', async () => {
            keyboardShortcutManager.getAllShortcuts.mockImplementation(() => { throw new Error('load error'); });

            await expect(handlers['shortcuts:get-all']({})).rejects.toThrow('load error');
        });
    });

    describe('shortcuts:get-available-actions', () => {
        it('returns all available actions', async () => {
            const mockActions = [{ id: 'save', label: 'Save' }, { id: 'open', label: 'Open' }];
            keyboardShortcutManager.getAvailableActions.mockReturnValue(mockActions);

            const result = await handlers['shortcuts:get-available-actions']({});

            expect(keyboardShortcutManager.getAvailableActions).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, actions: mockActions });
        });

        it('throws when keyboardShortcutManager.getAvailableActions throws', async () => {
            keyboardShortcutManager.getAvailableActions.mockImplementation(() => { throw new Error('fail'); });

            await expect(handlers['shortcuts:get-available-actions']({})).rejects.toThrow('fail');
        });
    });

    describe('shortcuts:check-conflict', () => {
        it('returns conflict info for given key binding', async () => {
            keyboardShortcutManager.hasConflict.mockReturnValue(true);
            keyboardShortcutManager.getConflictingAction.mockReturnValue({ actionId: 'open', key: 'Ctrl+S' });

            const result = await handlers['shortcuts:check-conflict']({}, 'Ctrl+S', 'save');

            expect(keyboardShortcutManager.hasConflict).toHaveBeenCalledWith('Ctrl+S', 'save');
            expect(keyboardShortcutManager.getConflictingAction).toHaveBeenCalledWith('Ctrl+S', 'save');
            expect(result).toEqual({
                success: true,
                hasConflict: true,
                conflictingAction: { actionId: 'open', key: 'Ctrl+S' }
            });
        });

        it('returns no conflict when binding is available', async () => {
            keyboardShortcutManager.hasConflict.mockReturnValue(false);
            keyboardShortcutManager.getConflictingAction.mockReturnValue(null);

            const result = await handlers['shortcuts:check-conflict']({}, 'Ctrl+Shift+X', null);

            expect(keyboardShortcutManager.hasConflict).toHaveBeenCalledWith('Ctrl+Shift+X', null);
            expect(result).toEqual({
                success: true,
                hasConflict: false,
                conflictingAction: null
            });
        });

        it('throws when keyboardShortcutManager.hasConflict throws', async () => {
            keyboardShortcutManager.hasConflict.mockImplementation(() => { throw new Error('conflict error'); });

            await expect(handlers['shortcuts:check-conflict']({}, 'Ctrl+S', 'save')).rejects.toThrow('conflict error');
        });
    });

    describe('shortcuts:get-default', () => {
        it('returns default shortcut for given actionId', async () => {
            const mockShortcut = { key: 'Ctrl+S', actionId: 'save' };
            keyboardShortcutManager.getDefaultShortcut.mockReturnValue(mockShortcut);

            const result = await handlers['shortcuts:get-default']({}, 'save');

            expect(keyboardShortcutManager.getDefaultShortcut).toHaveBeenCalledWith('save');
            expect(result).toEqual({ success: true, shortcut: mockShortcut });
        });

        it('throws when keyboardShortcutManager.getDefaultShortcut throws', async () => {
            keyboardShortcutManager.getDefaultShortcut.mockImplementation(() => { throw new Error('default error'); });

            await expect(handlers['shortcuts:get-default']({}, 'save')).rejects.toThrow('default error');
        });
    });
});
