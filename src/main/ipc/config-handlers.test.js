/**
 * Tests for config-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./config-handlers');

describe('config-handlers', () => {
    let configStore;
    let refreshMenu;
    let updateMenuItemChecked;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        configStore = {
            get: vi.fn(),
            set: vi.fn()
        };
        refreshMenu = vi.fn();
        updateMenuItemChecked = vi.fn();
        ipcMain = {
            handle: vi.fn()
        };

        register({ configStore, refreshMenu, updateMenuItemChecked, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 4 config IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(4);
        expect(handlers['config:get']).toBeDefined();
        expect(handlers['config:set']).toBeDefined();
        expect(handlers['config:get-line-numbers']).toBeDefined();
        expect(handlers['config:toggle-line-numbers']).toBeDefined();
    });

    describe('config:get', () => {
        it('calls configStore.get and returns success with value', async () => {
            configStore.get.mockReturnValue('dark');

            const result = await handlers['config:get']({}, 'theme');

            expect(configStore.get).toHaveBeenCalledWith('theme');
            expect(result).toEqual({ success: true, value: 'dark' });
        });

        it('returns undefined value when key does not exist', async () => {
            configStore.get.mockReturnValue(undefined);

            const result = await handlers['config:get']({}, 'nonexistent');

            expect(result).toEqual({ success: true, value: undefined });
        });

        it('throws when configStore.get throws', async () => {
            configStore.get.mockImplementation(() => { throw new Error('store error'); });

            await expect(handlers['config:get']({}, 'key')).rejects.toThrow('store error');
        });
    });

    describe('config:set', () => {
        it('calls configStore.set and returns success', async () => {
            const result = await handlers['config:set']({}, 'theme', 'dark');

            expect(configStore.set).toHaveBeenCalledWith('theme', 'dark');
            expect(result).toEqual({ success: true });
        });

        it('updates sidebar menu item when setting workspace.sidebarVisible', async () => {
            await handlers['config:set']({}, 'workspace.sidebarVisible', true);

            expect(updateMenuItemChecked).toHaveBeenCalledWith('View.Toggle Sidebar', true);
        });

        it('updates outline menu item when setting outline.visible', async () => {
            await handlers['config:set']({}, 'outline.visible', false);

            expect(updateMenuItemChecked).toHaveBeenCalledWith('View.Outline Panel', false);
        });

        it('updates typewriter menu item when setting typewriter.enabled', async () => {
            await handlers['config:set']({}, 'typewriter.enabled', true);

            expect(updateMenuItemChecked).toHaveBeenCalledWith('View.Typewriter Scrolling', true);
        });

        it('does not call updateMenuItemChecked for unrelated keys', async () => {
            await handlers['config:set']({}, 'theme', 'light');

            expect(updateMenuItemChecked).not.toHaveBeenCalled();
        });

        it('throws when configStore.set throws', async () => {
            configStore.set.mockImplementation(() => { throw new Error('write error'); });

            await expect(handlers['config:set']({}, 'key', 'val')).rejects.toThrow('write error');
        });
    });

    describe('config:get-line-numbers', () => {
        it('returns the stored lineNumbers value when defined', async () => {
            configStore.get.mockReturnValue(false);

            const result = await handlers['config:get-line-numbers']({});

            expect(configStore.get).toHaveBeenCalledWith('lineNumbers');
            expect(result).toBe(false);
        });

        it('defaults to true when lineNumbers is undefined', async () => {
            configStore.get.mockReturnValue(undefined);

            const result = await handlers['config:get-line-numbers']({});

            expect(result).toBe(true);
        });

        it('throws when configStore.get throws', async () => {
            configStore.get.mockImplementation(() => { throw new Error('read error'); });

            await expect(handlers['config:get-line-numbers']({})).rejects.toThrow('read error');
        });
    });

    describe('config:toggle-line-numbers', () => {
        it('toggles lineNumbers from true to false', async () => {
            configStore.get.mockReturnValue(true);

            const result = await handlers['config:toggle-line-numbers']({});

            expect(configStore.set).toHaveBeenCalledWith('lineNumbers', false);
            expect(result).toEqual({ success: true, enabled: false });
        });

        it('toggles lineNumbers from false to true', async () => {
            configStore.get.mockReturnValue(false);

            const result = await handlers['config:toggle-line-numbers']({});

            expect(configStore.set).toHaveBeenCalledWith('lineNumbers', true);
            expect(result).toEqual({ success: true, enabled: true });
        });

        it('defaults to false when lineNumbers is undefined (first toggle)', async () => {
            configStore.get.mockReturnValue(undefined);

            const result = await handlers['config:toggle-line-numbers']({});

            expect(configStore.set).toHaveBeenCalledWith('lineNumbers', false);
            expect(result).toEqual({ success: true, enabled: false });
        });

        it('calls refreshMenu after toggling', async () => {
            configStore.get.mockReturnValue(true);

            await handlers['config:toggle-line-numbers']({});

            expect(refreshMenu).toHaveBeenCalledOnce();
        });

        it('throws when configStore.get throws', async () => {
            configStore.get.mockImplementation(() => { throw new Error('store error'); });

            await expect(handlers['config:toggle-line-numbers']({})).rejects.toThrow('store error');
        });
    });
});
