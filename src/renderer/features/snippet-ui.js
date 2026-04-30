/**
 * Snippet UI Components
 * Manages snippet panel, insertion, and custom snippet creation
 * Requirements: 7.1, 7.2, 7.5, 7.6
 */

const notificationManager = require('../ui/notification.js');
const i18n = require('../i18n/index.js');

class SnippetUI {
    constructor(snippetManager) {
        this.snippetManager = snippetManager;
        this.snippets = [];
        this.onInsertCallback = null;
        this.removeLocaleListener = null;
        this.sidebarPanel = null;
        this.customSnippetDialog = null;
        this.editingSnippet = null;
        this.setupLocaleListener();
    }

    setupLocaleListener() {
        this.removeLocaleListener = i18n.onLocaleChange(() => {
            this.updateTranslations();
        });
    }

    updateTranslations() {
        if (this.customSnippetDialog) {
            this.customSnippetDialog.remove();
            this.customSnippetDialog = null;
        }
        if (this.sidebarPanel) {
            this.renderSidebarContent();
        }
    }

    destroy() {
        if (this.removeLocaleListener) {
            this.removeLocaleListener();
            this.removeLocaleListener = null;
        }
        if (this.customSnippetDialog) {
            this.customSnippetDialog.remove();
            this.customSnippetDialog = null;
        }
    }

    async loadSnippets() {
        try {
            const result = await window.electronAPI.getAllSnippets();
            if (result.success) {
                this.snippets = result.snippets;
            }
        } catch (error) {
            console.error('Error loading snippets:', error);
            notificationManager.error(`Error loading snippets: ${error.message}`);
        }
    }


    createSidebarPanel() {
        const panel = document.createElement('div');
        panel.className = 'snippet-sidebar-panel';
        panel.innerHTML = `
            <div class="snippet-sidebar-actions">
                <button class="snippet-sidebar-create-btn">+ ${i18n.t('snippets.create')}</button>
            </div>
            <div class="snippet-sidebar-filters">
                <button class="snippet-filter-btn active" data-filter="all">${i18n.t('templates.all')}</button>
                <button class="snippet-filter-btn" data-filter="builtin">${i18n.t('snippets.builtIn')}</button>
                <button class="snippet-filter-btn" data-filter="custom">${i18n.t('snippets.custom')}</button>
            </div>
            <div class="snippet-sidebar-list"></div>
        `;

        panel.querySelector('.snippet-sidebar-create-btn').addEventListener('click', () => {
            this.showCustomSnippetDialog();
        });

        const filterButtons = panel.querySelectorAll('.snippet-filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderSidebarSnippets(e.target.dataset.filter);
            });
        });

        this.sidebarPanel = panel;
        this.renderSidebarContent();
        return panel;
    }

    async renderSidebarContent() {
        if (!this.sidebarPanel) return;

        try {
            await this.loadSnippets();
            this.renderSidebarSnippets('all');
        } catch (error) {
            console.error('Error rendering sidebar content:', error);
        }
    }

    renderSidebarSnippets(filter = 'all') {
        if (!this.sidebarPanel) return;

        const listContainer = this.sidebarPanel.querySelector('.snippet-sidebar-list');
        listContainer.innerHTML = '';

        let filtered = this.snippets;
        if (filter === 'builtin') {
            filtered = this.snippets.filter(s => s.isBuiltIn);
        } else if (filter === 'custom') {
            filtered = this.snippets.filter(s => !s.isBuiltIn);
        }

        if (filtered.length === 0) {
            listContainer.innerHTML = `<p class="snippet-sidebar-empty">${i18n.t('snippets.noSnippets')}</p>`;
            return;
        }

        filtered.forEach(snippet => {
            const item = document.createElement('div');
            item.className = 'snippet-sidebar-item';
            item.innerHTML = `
                <div class="snippet-sidebar-item-header">
                    <span class="snippet-sidebar-item-trigger">${snippet.trigger}</span>
                    <div class="snippet-sidebar-item-actions">
                        ${!snippet.isBuiltIn ? `
                            <button class="snippet-sidebar-edit-btn" title="${i18n.t('snippets.edit')}">✏️</button>
                            <button class="snippet-sidebar-delete-btn" title="${i18n.t('snippets.delete')}">🗑️</button>
                        ` : `<span class="snippet-builtin-badge">${i18n.t('snippets.builtIn')}</span>`}
                    </div>
                </div>
                <p class="snippet-sidebar-item-desc">${snippet.description || i18n.t('templates.noDescription')}</p>
                <pre class="snippet-sidebar-item-preview">${this.escapeHtml(snippet.content.substring(0, 100))}${snippet.content.length > 100 ? '...' : ''}</pre>
            `;

            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('snippet-sidebar-delete-btn') &&
                    !e.target.classList.contains('snippet-sidebar-edit-btn')) {
                    this.insertSnippet(snippet);
                }
            });

            if (!snippet.isBuiltIn) {
                const editBtn = item.querySelector('.snippet-sidebar-edit-btn');
                const deleteBtn = item.querySelector('.snippet-sidebar-delete-btn');

                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showCustomSnippetDialog(snippet);
                });

                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteSnippet(snippet.trigger);
                });
            }

            listContainer.appendChild(item);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    insertSnippet(snippet) {
        if (this.onInsertCallback) {
            this.onInsertCallback(snippet);
        }
    }

    async deleteSnippet(trigger) {
        const confirmed = await notificationManager.confirm(
            `${i18n.t('snippets.delete')}: "${trigger}"?`,
            { confirmText: i18n.t('actions.delete'), cancelText: i18n.t('actions.cancel'), type: 'warning' }
        );

        if (!confirmed) return;

        try {
            const result = await window.electronAPI.deleteCustomSnippet(trigger);
            if (result.success) {
                if (this.snippetManager) {
                    this.snippetManager.reloadCustomSnippets();
                }
                await this.renderSidebarContent();
                notificationManager.success(i18n.t('snippets.delete') + ' ✓');
            }
        } catch (error) {
            console.error('Error deleting snippet:', error);
            notificationManager.error(error.message);
        }
    }

    showCustomSnippetDialog(snippetToEdit = null) {
        this.editingSnippet = snippetToEdit;

        if (this.customSnippetDialog) {
            this.customSnippetDialog.remove();
        }

        const isEdit = !!snippetToEdit;
        const dialog = document.createElement('div');
        dialog.id = 'custom-snippet-dialog';
        dialog.className = 'template-dialog';
        dialog.innerHTML = `
            <div class="template-dialog-content">
                <div class="template-dialog-header">
                    <h2>${isEdit ? i18n.t('snippets.edit') : i18n.t('snippets.create')}</h2>
                    <button class="template-dialog-close" id="snippet-dialog-close">✕</button>
                </div>
                <div class="template-dialog-body">
                    <form id="custom-snippet-form">
                        <div class="form-group">
                            <label for="snippet-trigger">${i18n.t('snippets.trigger')}:</label>
                            <input type="text" id="snippet-trigger" required 
                                placeholder="${i18n.t('snippets.triggerPlaceholder')}"
                                value="${isEdit ? snippetToEdit.trigger : ''}"
                                ${isEdit ? 'readonly' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="snippet-description">${i18n.t('snippets.description')}:</label>
                            <input type="text" id="snippet-description" 
                                placeholder="${i18n.t('snippets.descriptionPlaceholder')}"
                                value="${isEdit ? (snippetToEdit.description || '') : ''}">
                        </div>
                        <div class="form-group">
                            <label for="snippet-content">${i18n.t('snippets.content')}:</label>
                            <textarea id="snippet-content" required rows="8" 
                                placeholder="${i18n.t('snippets.contentPlaceholder')}">${isEdit ? snippetToEdit.content : ''}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" id="snippet-cancel" class="button-secondary">${i18n.t('actions.cancel')}</button>
                            <button type="submit" class="button-primary">${i18n.t('actions.save')}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        dialog.querySelector('#snippet-dialog-close').addEventListener('click', () => this.hideCustomSnippetDialog());
        dialog.querySelector('#snippet-cancel').addEventListener('click', () => this.hideCustomSnippetDialog());
        dialog.querySelector('#custom-snippet-form').addEventListener('submit', (e) => this.handleSnippetSubmit(e));
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) this.hideCustomSnippetDialog();
        });

        this.customSnippetDialog = dialog;
    }

    hideCustomSnippetDialog() {
        if (this.customSnippetDialog) {
            this.customSnippetDialog.remove();
            this.customSnippetDialog = null;
        }
        this.editingSnippet = null;
    }

    async handleSnippetSubmit(e) {
        e.preventDefault();

        const trigger = this.customSnippetDialog.querySelector('#snippet-trigger').value.trim();
        const description = this.customSnippetDialog.querySelector('#snippet-description').value.trim();
        const content = this.customSnippetDialog.querySelector('#snippet-content').value;

        if (!trigger || !content) {
            notificationManager.warning(i18n.t('templates.nameAndContentRequired'));
            return;
        }

        try {
            if (this.editingSnippet) {
                const result = await window.electronAPI.updateCustomSnippet(trigger, { content, description });
                if (result.success) {
                    notificationManager.success(i18n.t('snippets.edit') + ' ✓');
                }
            } else {
                const result = await window.electronAPI.saveCustomSnippet(trigger, content, description);
                if (result.success) {
                    notificationManager.success(i18n.t('snippets.create') + ' ✓');
                }
            }

            if (this.snippetManager) {
                this.snippetManager.reloadCustomSnippets();
            }
            this.hideCustomSnippetDialog();
            await this.renderSidebarContent();
        } catch (error) {
            console.error('Error saving snippet:', error);
            notificationManager.error(`Error saving snippet: ${error.message}`);
        }
    }

    onInsert(callback) {
        this.onInsertCallback = callback;
    }
}

module.exports = SnippetUI;
