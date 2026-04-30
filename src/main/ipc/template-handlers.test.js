/**
 * Tests for template-handlers IPC module
 * Validates: Requirements 1.1, 1.2
 *
 * @vitest-environment node
 */

const { register } = require('./template-handlers');

describe('template-handlers', () => {
    let templateManager;
    let ipcMain;
    let handlers;

    beforeEach(() => {
        templateManager = {
            getTemplate: vi.fn(),
            getAllTemplates: vi.fn(),
            getBuiltInTemplates: vi.fn(),
            getCustomTemplates: vi.fn(),
            saveCustomTemplate: vi.fn(),
            deleteCustomTemplate: vi.fn(),
            updateCustomTemplate: vi.fn(),
            getCategories: vi.fn(),
            getTemplatesByCategory: vi.fn(),
            markTemplateUsed: vi.fn(),
            findPlaceholders: vi.fn(),
            getFirstPlaceholderPosition: vi.fn()
        };
        ipcMain = {
            handle: vi.fn()
        };

        register({ templateManager, ipcMain });

        // Collect registered handlers by channel name
        handlers = {};
        for (const call of ipcMain.handle.mock.calls) {
            handlers[call[0]] = call[1];
        }
    });

    it('registers all 12 template IPC handlers', () => {
        expect(ipcMain.handle).toHaveBeenCalledTimes(12);
        expect(handlers['template:get']).toBeDefined();
        expect(handlers['template:get-all']).toBeDefined();
        expect(handlers['template:get-builtin']).toBeDefined();
        expect(handlers['template:get-custom']).toBeDefined();
        expect(handlers['template:save-custom']).toBeDefined();
        expect(handlers['template:delete-custom']).toBeDefined();
        expect(handlers['template:update-custom']).toBeDefined();
        expect(handlers['template:get-categories']).toBeDefined();
        expect(handlers['template:get-by-category']).toBeDefined();
        expect(handlers['template:mark-used']).toBeDefined();
        expect(handlers['template:find-placeholders']).toBeDefined();
        expect(handlers['template:get-first-placeholder-position']).toBeDefined();
    });

    describe('template:get', () => {
        it('returns template with success true when found', async () => {
            const mockTemplate = { id: 'tpl-1', name: 'Blog Post', content: '# Blog' };
            templateManager.getTemplate.mockReturnValue(mockTemplate);

            const result = await handlers['template:get']({}, 'tpl-1');

            expect(templateManager.getTemplate).toHaveBeenCalledWith('tpl-1');
            expect(result).toEqual({ success: true, template: mockTemplate });
        });

        it('returns success false when template not found', async () => {
            templateManager.getTemplate.mockReturnValue(null);

            const result = await handlers['template:get']({}, 'nonexistent');

            expect(result).toEqual({ success: false, template: null });
        });

        it('throws when templateManager.getTemplate throws', async () => {
            templateManager.getTemplate.mockImplementation(() => { throw new Error('db error'); });

            await expect(handlers['template:get']({}, 'tpl-1')).rejects.toThrow('db error');
        });
    });

    describe('template:get-all', () => {
        it('returns all templates', async () => {
            const mockTemplates = [{ id: '1' }, { id: '2' }];
            templateManager.getAllTemplates.mockReturnValue(mockTemplates);

            const result = await handlers['template:get-all']({});

            expect(templateManager.getAllTemplates).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, templates: mockTemplates });
        });

        it('throws when templateManager.getAllTemplates throws', async () => {
            templateManager.getAllTemplates.mockImplementation(() => { throw new Error('load error'); });

            await expect(handlers['template:get-all']({})).rejects.toThrow('load error');
        });
    });

    describe('template:get-builtin', () => {
        it('returns built-in templates', async () => {
            const mockTemplates = [{ id: 'builtin-1', isBuiltIn: true }];
            templateManager.getBuiltInTemplates.mockReturnValue(mockTemplates);

            const result = await handlers['template:get-builtin']({});

            expect(templateManager.getBuiltInTemplates).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, templates: mockTemplates });
        });

        it('throws when templateManager.getBuiltInTemplates throws', async () => {
            templateManager.getBuiltInTemplates.mockImplementation(() => { throw new Error('fail'); });

            await expect(handlers['template:get-builtin']({})).rejects.toThrow('fail');
        });
    });

    describe('template:get-custom', () => {
        it('returns custom templates', async () => {
            const mockTemplates = [{ id: 'custom-1', isBuiltIn: false }];
            templateManager.getCustomTemplates.mockReturnValue(mockTemplates);

            const result = await handlers['template:get-custom']({});

            expect(templateManager.getCustomTemplates).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, templates: mockTemplates });
        });

        it('throws when templateManager.getCustomTemplates throws', async () => {
            templateManager.getCustomTemplates.mockImplementation(() => { throw new Error('fail'); });

            await expect(handlers['template:get-custom']({})).rejects.toThrow('fail');
        });
    });

    describe('template:save-custom', () => {
        it('saves custom template and returns it', async () => {
            const mockTemplate = { id: 'new-1', name: 'My Template' };
            templateManager.saveCustomTemplate.mockReturnValue(mockTemplate);

            const result = await handlers['template:save-custom']({}, 'My Template', '# Content', { category: 'blog' });

            expect(templateManager.saveCustomTemplate).toHaveBeenCalledWith('My Template', '# Content', { category: 'blog' });
            expect(result).toEqual({ success: true, template: mockTemplate });
        });

        it('throws when templateManager.saveCustomTemplate throws', async () => {
            templateManager.saveCustomTemplate.mockImplementation(() => { throw new Error('save error'); });

            await expect(handlers['template:save-custom']({}, 'name', 'content', {})).rejects.toThrow('save error');
        });
    });

    describe('template:delete-custom', () => {
        it('deletes custom template and returns success', async () => {
            templateManager.deleteCustomTemplate.mockReturnValue(true);

            const result = await handlers['template:delete-custom']({}, 'tpl-1');

            expect(templateManager.deleteCustomTemplate).toHaveBeenCalledWith('tpl-1');
            expect(result).toEqual({ success: true });
        });

        it('returns success false when template not found for deletion', async () => {
            templateManager.deleteCustomTemplate.mockReturnValue(false);

            const result = await handlers['template:delete-custom']({}, 'nonexistent');

            expect(result).toEqual({ success: false });
        });

        it('throws when templateManager.deleteCustomTemplate throws', async () => {
            templateManager.deleteCustomTemplate.mockImplementation(() => { throw new Error('delete error'); });

            await expect(handlers['template:delete-custom']({}, 'tpl-1')).rejects.toThrow('delete error');
        });
    });

    describe('template:update-custom', () => {
        it('updates custom template and returns success', async () => {
            templateManager.updateCustomTemplate.mockReturnValue(true);

            const updates = { name: 'Updated Name' };
            const result = await handlers['template:update-custom']({}, 'tpl-1', updates);

            expect(templateManager.updateCustomTemplate).toHaveBeenCalledWith('tpl-1', updates);
            expect(result).toEqual({ success: true });
        });

        it('returns success false when template not found for update', async () => {
            templateManager.updateCustomTemplate.mockReturnValue(false);

            const result = await handlers['template:update-custom']({}, 'nonexistent', { name: 'X' });

            expect(result).toEqual({ success: false });
        });

        it('throws when templateManager.updateCustomTemplate throws', async () => {
            templateManager.updateCustomTemplate.mockImplementation(() => { throw new Error('update error'); });

            await expect(handlers['template:update-custom']({}, 'tpl-1', {})).rejects.toThrow('update error');
        });
    });

    describe('template:get-categories', () => {
        it('returns all categories', async () => {
            const mockCategories = ['blog', 'documentation', 'notes'];
            templateManager.getCategories.mockReturnValue(mockCategories);

            const result = await handlers['template:get-categories']({});

            expect(templateManager.getCategories).toHaveBeenCalledOnce();
            expect(result).toEqual({ success: true, categories: mockCategories });
        });

        it('throws when templateManager.getCategories throws', async () => {
            templateManager.getCategories.mockImplementation(() => { throw new Error('fail'); });

            await expect(handlers['template:get-categories']({})).rejects.toThrow('fail');
        });
    });

    describe('template:get-by-category', () => {
        it('returns templates filtered by category', async () => {
            const mockTemplates = [{ id: '1', category: 'blog' }];
            templateManager.getTemplatesByCategory.mockReturnValue(mockTemplates);

            const result = await handlers['template:get-by-category']({}, 'blog');

            expect(templateManager.getTemplatesByCategory).toHaveBeenCalledWith('blog');
            expect(result).toEqual({ success: true, templates: mockTemplates });
        });

        it('throws when templateManager.getTemplatesByCategory throws', async () => {
            templateManager.getTemplatesByCategory.mockImplementation(() => { throw new Error('fail'); });

            await expect(handlers['template:get-by-category']({}, 'blog')).rejects.toThrow('fail');
        });
    });

    describe('template:mark-used', () => {
        it('marks template as used and returns success', async () => {
            const result = await handlers['template:mark-used']({}, 'tpl-1');

            expect(templateManager.markTemplateUsed).toHaveBeenCalledWith('tpl-1');
            expect(result).toEqual({ success: true });
        });

        it('throws when templateManager.markTemplateUsed throws', async () => {
            templateManager.markTemplateUsed.mockImplementation(() => { throw new Error('mark error'); });

            await expect(handlers['template:mark-used']({}, 'tpl-1')).rejects.toThrow('mark error');
        });
    });

    describe('template:find-placeholders', () => {
        it('returns placeholders found in content', async () => {
            const mockPlaceholders = ['{{title}}', '{{date}}'];
            templateManager.findPlaceholders.mockReturnValue(mockPlaceholders);

            const result = await handlers['template:find-placeholders']({}, '# {{title}} - {{date}}');

            expect(templateManager.findPlaceholders).toHaveBeenCalledWith('# {{title}} - {{date}}');
            expect(result).toEqual({ success: true, placeholders: mockPlaceholders });
        });

        it('throws when templateManager.findPlaceholders throws', async () => {
            templateManager.findPlaceholders.mockImplementation(() => { throw new Error('parse error'); });

            await expect(handlers['template:find-placeholders']({}, 'content')).rejects.toThrow('parse error');
        });
    });

    describe('template:get-first-placeholder-position', () => {
        it('returns first placeholder position in content', async () => {
            const mockPosition = { line: 0, ch: 2 };
            templateManager.getFirstPlaceholderPosition.mockReturnValue(mockPosition);

            const result = await handlers['template:get-first-placeholder-position']({}, '# {{title}}');

            expect(templateManager.getFirstPlaceholderPosition).toHaveBeenCalledWith('# {{title}}');
            expect(result).toEqual({ success: true, position: mockPosition });
        });

        it('returns null position when no placeholders found', async () => {
            templateManager.getFirstPlaceholderPosition.mockReturnValue(null);

            const result = await handlers['template:get-first-placeholder-position']({}, '# No placeholders');

            expect(result).toEqual({ success: true, position: null });
        });

        it('throws when templateManager.getFirstPlaceholderPosition throws', async () => {
            templateManager.getFirstPlaceholderPosition.mockImplementation(() => { throw new Error('parse error'); });

            await expect(handlers['template:get-first-placeholder-position']({}, 'content')).rejects.toThrow('parse error');
        });
    });
});
