/**
 * IPC Handlers — Template Operations
 * Handles: template:get, template:get-all, template:get-builtin, template:get-custom,
 *          template:save-custom, template:delete-custom, template:update-custom,
 *          template:get-categories, template:get-by-category, template:mark-used,
 *          template:find-placeholders, template:get-first-placeholder-position
 */

const { createIPCHandler } = require('../utils/ipc-utils');

/**
 * Registra IPC handlers para operações de template
 * @param {Object} deps - Dependências
 * @param {import('../template-manager')} deps.templateManager - Instância do TemplateManager
 * @param {Electron.IpcMain} deps.ipcMain - Instância do ipcMain do Electron
 */
function register({ templateManager, ipcMain }) {
    ipcMain.handle('template:get', createIPCHandler(async (event, templateId) => {
        const template = templateManager.getTemplate(templateId);
        return { success: !!template, template };
    }, 'getting template'));

    ipcMain.handle('template:get-all', createIPCHandler(async () => {
        const templates = templateManager.getAllTemplates();
        return { success: true, templates };
    }, 'getting all templates'));

    ipcMain.handle('template:get-builtin', createIPCHandler(async () => {
        const templates = templateManager.getBuiltInTemplates();
        return { success: true, templates };
    }, 'getting built-in templates'));

    ipcMain.handle('template:get-custom', createIPCHandler(async () => {
        const templates = templateManager.getCustomTemplates();
        return { success: true, templates };
    }, 'getting custom templates'));

    ipcMain.handle('template:save-custom', createIPCHandler(async (event, name, content, metadata) => {
        const template = templateManager.saveCustomTemplate(name, content, metadata);
        return { success: true, template };
    }, 'saving custom template'));

    ipcMain.handle('template:delete-custom', createIPCHandler(async (event, templateId) => {
        const result = templateManager.deleteCustomTemplate(templateId);
        return { success: result };
    }, 'deleting custom template'));

    ipcMain.handle('template:update-custom', createIPCHandler(async (event, templateId, updates) => {
        const result = templateManager.updateCustomTemplate(templateId, updates);
        return { success: result };
    }, 'updating custom template'));

    ipcMain.handle('template:get-categories', createIPCHandler(async () => {
        const categories = templateManager.getCategories();
        return { success: true, categories };
    }, 'getting categories'));

    ipcMain.handle('template:get-by-category', createIPCHandler(async (event, category) => {
        const templates = templateManager.getTemplatesByCategory(category);
        return { success: true, templates };
    }, 'getting templates by category'));

    ipcMain.handle('template:mark-used', createIPCHandler(async (event, templateId) => {
        templateManager.markTemplateUsed(templateId);
        return { success: true };
    }, 'marking template used'));

    ipcMain.handle('template:find-placeholders', createIPCHandler(async (event, content) => {
        const placeholders = templateManager.findPlaceholders(content);
        return { success: true, placeholders };
    }, 'finding placeholders'));

    ipcMain.handle('template:get-first-placeholder-position', createIPCHandler(async (event, content) => {
        const position = templateManager.getFirstPlaceholderPosition(content);
        return { success: true, position };
    }, 'getting first placeholder position'));
}

module.exports = { register };
