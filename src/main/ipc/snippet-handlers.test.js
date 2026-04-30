/**
 * Tests for snippet-handlers IPC module
 * Validates: Requirements 7.2, 7.3
 *
 * @vitest-environment node
 */

const { register } = require('./snippet-handlers');

describe('snippet-handlers', () => {
    let snippetManager;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        snippetManager = {
            getBuiltInSnippets: vi.fn(),
            getCustomSnippets: vi.fn(),
            saveCustomSnippet: vi.fn(),
            deleteCustomSnippet: vi.fn(),
            findPlaceholders: vi.fn(),
            configStore: {
                updateCustomSnippet: vi.fn()
            }
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ snippetManager, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 6 snippet IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(6);
        expect(handlers['snippet:get-all']).toBeDefined();
        expect(handlers['snippet:get-builtin']).toBeDefined();
        expect(handlers['snippet:get-custom']).toBeDefined();
        expect(handlers['snippet:save-custom']).toBeDefined();
        expect(handlers['snippet:delete-custom']).toBeDefined();
        expect(handlers['snippet:update-custom']).toBeDefined();
    });

    describe('snippet:get-all', () => {
        it('returns combined built-in and custom snippets', async () => {
            const builtIn = [{ trigger: 'code', isBuiltIn: true }];
            const custom = [{ trigger: 'hello', isBuiltIn: false }];
            snippetManager.getBuiltInSnippets.mockReturnValue(builtIn);
            snippetManager.getCustomSnippets.mockReturnValue(custom);

            const result = await handlers['snippet:get-all']({});

            expect(snippetManager.getBuiltInSnippets).toHaveBeenCalledOnce();
            expect(snippetManager.getCustomSnippets).toHaveBeenCalledOnce();
            expect(result).toEqual({
                success: true,
                snippets: [...builtIn, ...custom]
            });
        });

        it('returns only built-in when no custom snippets exist', async () => {
            const builtIn = [{ trigger: 'code', isBuiltIn: true }];
            snippetManager.getBuiltInSnippets.mockReturnValue(builtIn);
            snippetManager.getCustomSnippets.mockReturnValue([]);

            const result = await handlers['snippet:get-all']({});

            expect(result.snippets).toEqual(builtIn);
        });

        it('throws when snippetManager throws', async () => {
            snippetManager.getBuiltInSnippets.mockImplementation(() => {
                throw new Error('unexpected error');
            });

            await expect(handlers['snippet:get-all']({})).rejects.toThrow('unexpected error');
        });
    });

    describe('snippet:get-builtin', () => {
        it('returns built-in snippets', async () => {
            const builtIn = [
                { trigger: 'code', isBuiltIn: true },
                { trigger: 'table', isBuiltIn: true }
            ];
            snippetManager.getBuiltInSnippets.mockReturnValue(builtIn);

            const result = await handlers['snippet:get-builtin']({});

            expect(snippetManager.getBuiltInSnippets).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, snippets: builtIn });
        });

        it('throws when snippetManager throws', async () => {
            snippetManager.getBuiltInSnippets.mockImplementation(() => {
                throw new Error('read error');
            });

            await expect(handlers['snippet:get-builtin']({})).rejects.toThrow('read error');
        });
    });

    describe('snippet:get-custom', () => {
        it('returns custom snippets', async () => {
            const custom = [{ trigger: 'hello', content: 'Hello {{name}}!' }];
            snippetManager.getCustomSnippets.mockReturnValue(custom);

            const result = await handlers['snippet:get-custom']({});

            expect(snippetManager.getCustomSnippets).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, snippets: custom });
        });

        it('returns empty array when no custom snippets exist', async () => {
            snippetManager.getCustomSnippets.mockReturnValue([]);

            const result = await handlers['snippet:get-custom']({});

            expect(result).toEqual({ success: true, snippets: [] });
        });

        it('throws when snippetManager throws', async () => {
            snippetManager.getCustomSnippets.mockImplementation(() => {
                throw new Error('store error');
            });

            await expect(handlers['snippet:get-custom']({})).rejects.toThrow('store error');
        });
    });

    describe('snippet:save-custom', () => {
        it('calls snippetManager.saveCustomSnippet with correct args and returns result', async () => {
            const savedSnippet = {
                trigger: 'greet',
                content: 'Hello {{name}}!',
                description: 'A greeting',
                placeholders: ['{{name}}'],
                isBuiltIn: false,
                createdAt: Date.now()
            };
            snippetManager.saveCustomSnippet.mockReturnValue(savedSnippet);

            const result = await handlers['snippet:save-custom']({}, 'greet', 'Hello {{name}}!', 'A greeting');

            expect(snippetManager.saveCustomSnippet).toHaveBeenCalledWith({
                trigger: 'greet',
                content: 'Hello {{name}}!',
                description: 'A greeting'
            });
            expect(result).toEqual({ success: true, snippet: savedSnippet });
        });

        it('passes undefined description when not provided', async () => {
            snippetManager.saveCustomSnippet.mockReturnValue({ trigger: 'test' });

            await handlers['snippet:save-custom']({}, 'test', 'content');

            expect(snippetManager.saveCustomSnippet).toHaveBeenCalledWith({
                trigger: 'test',
                content: 'content',
                description: undefined
            });
        });

        it('throws when snippetManager.saveCustomSnippet throws', async () => {
            snippetManager.saveCustomSnippet.mockImplementation(() => {
                throw new Error('duplicate trigger');
            });

            await expect(handlers['snippet:save-custom']({}, 'dup', 'content'))
                .rejects.toThrow('duplicate trigger');
        });
    });

    describe('snippet:delete-custom', () => {
        it('calls snippetManager.deleteCustomSnippet and returns success', async () => {
            const result = await handlers['snippet:delete-custom']({}, 'hello');

            expect(snippetManager.deleteCustomSnippet).toHaveBeenCalledWith('hello');
            expect(result).toEqual({ success: true });
        });

        it('throws when snippetManager.deleteCustomSnippet throws', async () => {
            snippetManager.deleteCustomSnippet.mockImplementation(() => {
                throw new Error('not found');
            });

            await expect(handlers['snippet:delete-custom']({}, 'missing'))
                .rejects.toThrow('not found');
        });
    });

    describe('snippet:update-custom', () => {
        it('calls configStore.updateCustomSnippet with trigger and updates', async () => {
            const updates = { description: 'Updated description' };

            const result = await handlers['snippet:update-custom']({}, 'hello', updates);

            expect(snippetManager.configStore.updateCustomSnippet).toHaveBeenCalledWith('hello', updates);
            expect(result).toEqual({ success: true });
        });

        it('computes placeholders when content is updated', async () => {
            const updates = { content: 'Hello {{name}} from {{place}}!' };
            snippetManager.findPlaceholders.mockReturnValue(['{{name}}', '{{place}}']);

            const result = await handlers['snippet:update-custom']({}, 'hello', updates);

            expect(snippetManager.findPlaceholders).toHaveBeenCalledWith('Hello {{name}} from {{place}}!');
            expect(snippetManager.configStore.updateCustomSnippet).toHaveBeenCalledWith('hello', {
                content: 'Hello {{name}} from {{place}}!',
                placeholders: ['{{name}}', '{{place}}']
            });
            expect(result).toEqual({ success: true });
        });

        it('does not compute placeholders when content is not in updates', async () => {
            const updates = { description: 'New desc' };

            await handlers['snippet:update-custom']({}, 'hello', updates);

            expect(snippetManager.findPlaceholders).not.toHaveBeenCalled();
        });

        it('throws when configStore.updateCustomSnippet throws', async () => {
            snippetManager.configStore.updateCustomSnippet.mockImplementation(() => {
                throw new Error('snippet not found');
            });

            await expect(handlers['snippet:update-custom']({}, 'missing', { description: 'x' }))
                .rejects.toThrow('snippet not found');
        });
    });
});
