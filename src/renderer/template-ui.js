/**
 * Template UI Components
 * Manages template menu, insertion dialog, and custom template creation
 * Requirements: 6.1, 6.2, 6.5
 */

class TemplateUI {
    constructor() {
        this.templates = [];
        this.categories = [];
        this.onInsertCallback = null;
        this.onCreateCallback = null;
        this.createUI();
    }

    /**
     * Create the template UI elements
     */
    createUI() {
        // Create template menu dialog
        this.createTemplateMenuDialog();

        // Create custom template creation dialog
        this.createCustomTemplateDialog();
    }

    /**
     * Create the template menu dialog
     */
    createTemplateMenuDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'template-menu-dialog';
        dialog.className = 'template-dialog hidden';
        dialog.innerHTML = `
            <div class="template-dialog-content">
                <div class="template-dialog-header">
                    <h2>Insert Template</h2>
                    <button class="template-dialog-close" id="template-menu-close">✕</button>
                </div>
                <div class="template-dialog-body">
                    <div class="template-actions">
                        <button id="template-insert-mode" class="template-mode-button active">Insert at Cursor</button>
                        <button id="template-replace-mode" class="template-mode-button">Replace Document</button>
                        <button id="template-create-custom" class="template-create-button">+ Create Custom</button>
                    </div>
                    <div class="template-categories" id="template-categories"></div>
                    <div class="template-list" id="template-list"></div>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        // Event listeners
        dialog.querySelector('#template-menu-close').addEventListener('click', () => this.hideTemplateMenu());
        dialog.querySelector('#template-insert-mode').addEventListener('click', (e) => this.setInsertMode('insert', e.target));
        dialog.querySelector('#template-replace-mode').addEventListener('click', (e) => this.setInsertMode('replace', e.target));
        dialog.querySelector('#template-create-custom').addEventListener('click', () => this.showCustomTemplateDialog());

        // Close on background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                this.hideTemplateMenu();
            }
        });

        this.templateMenuDialog = dialog;
        this.insertMode = 'insert';
    }

    /**
     * Create the custom template creation dialog
     */
    createCustomTemplateDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'custom-template-dialog';
        dialog.className = 'template-dialog hidden';
        dialog.innerHTML = `
            <div class="template-dialog-content">
                <div class="template-dialog-header">
                    <h2>Create Custom Template</h2>
                    <button class="template-dialog-close" id="custom-template-close">✕</button>
                </div>
                <div class="template-dialog-body">
                    <form id="custom-template-form">
                        <div class="form-group">
                            <label for="template-name">Template Name:</label>
                            <input type="text" id="template-name" required placeholder="My Template">
                        </div>
                        <div class="form-group">
                            <label for="template-category">Category:</label>
                            <input type="text" id="template-category" placeholder="custom" value="custom">
                        </div>
                        <div class="form-group">
                            <label for="template-description">Description:</label>
                            <input type="text" id="template-description" placeholder="Template description">
                        </div>
                        <div class="form-group">
                            <label for="template-content">Content:</label>
                            <textarea id="template-content" required rows="10" placeholder="Enter template content. Use {{placeholder}} for placeholders."></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" id="custom-template-cancel" class="button-secondary">Cancel</button>
                            <button type="submit" class="button-primary">Save Template</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        // Event listeners
        dialog.querySelector('#custom-template-close').addEventListener('click', () => this.hideCustomTemplateDialog());
        dialog.querySelector('#custom-template-cancel').addEventListener('click', () => this.hideCustomTemplateDialog());
        dialog.querySelector('#custom-template-form').addEventListener('submit', (e) => this.handleCustomTemplateSubmit(e));

        // Close on background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                this.hideCustomTemplateDialog();
            }
        });

        this.customTemplateDialog = dialog;
    }

    /**
     * Load templates from the main process
     */
    async loadTemplates() {
        try {
            const result = await window.electronAPI.getAllTemplates();
            if (result.success) {
                this.templates = result.templates;
                this.updateCategories();
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    /**
     * Update the categories list
     */
    updateCategories() {
        const categories = [...new Set(this.templates.map(t => t.category))].sort();
        this.categories = categories;
    }

    /**
     * Show the template menu dialog
     */
    async showTemplateMenu() {
        await this.loadTemplates();
        this.renderCategories();
        this.renderTemplates();
        this.templateMenuDialog.classList.remove('hidden');
    }

    /**
     * Hide the template menu dialog
     */
    hideTemplateMenu() {
        this.templateMenuDialog.classList.add('hidden');
    }

    /**
     * Show the custom template creation dialog
     */
    showCustomTemplateDialog() {
        this.hideTemplateMenu();
        this.customTemplateDialog.classList.remove('hidden');
        // Clear form
        this.customTemplateDialog.querySelector('#custom-template-form').reset();
    }

    /**
     * Hide the custom template creation dialog
     */
    hideCustomTemplateDialog() {
        this.customTemplateDialog.classList.add('hidden');
    }

    /**
     * Set the insert mode (insert or replace)
     * @param {string} mode - 'insert' or 'replace'
     * @param {HTMLElement} button - Button element that was clicked
     */
    setInsertMode(mode, button) {
        this.insertMode = mode;

        // Update button states
        const buttons = this.templateMenuDialog.querySelectorAll('.template-mode-button');
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    }

    /**
     * Render the categories filter
     */
    renderCategories() {
        const container = this.templateMenuDialog.querySelector('#template-categories');
        container.innerHTML = '';

        // Add "All" category
        const allButton = document.createElement('button');
        allButton.className = 'category-button active';
        allButton.textContent = 'All';
        allButton.dataset.category = 'all';
        allButton.addEventListener('click', (e) => this.filterByCategory('all', e.target));
        container.appendChild(allButton);

        // Add category buttons
        this.categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-button';
            button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            button.dataset.category = category;
            button.addEventListener('click', (e) => this.filterByCategory(category, e.target));
            container.appendChild(button);
        });
    }

    /**
     * Filter templates by category
     * @param {string} category - Category to filter by
     * @param {HTMLElement} button - Button element that was clicked
     */
    filterByCategory(category, button) {
        // Update button states
        const buttons = this.templateMenuDialog.querySelectorAll('.category-button');
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Filter and render templates
        this.renderTemplates(category === 'all' ? null : category);
    }

    /**
     * Render the template list
     * @param {string|null} filterCategory - Category to filter by, or null for all
     */
    renderTemplates(filterCategory = null) {
        const container = this.templateMenuDialog.querySelector('#template-list');
        container.innerHTML = '';

        const filteredTemplates = filterCategory
            ? this.templates.filter(t => t.category === filterCategory)
            : this.templates;

        if (filteredTemplates.length === 0) {
            container.innerHTML = '<p class="no-templates">No templates found</p>';
            return;
        }

        filteredTemplates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'template-item';
            item.innerHTML = `
                <div class="template-item-header">
                    <h3>${template.name}</h3>
                    ${!template.isBuiltIn ? '<button class="template-delete-button" title="Delete">🗑️</button>' : ''}
                </div>
                <p class="template-description">${template.description || 'No description'}</p>
                <div class="template-meta">
                    <span class="template-category">${template.category}</span>
                    ${template.placeholders && template.placeholders.length > 0 ? `<span class="template-placeholders">${template.placeholders.length} placeholders</span>` : ''}
                </div>
            `;

            // Insert button
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('template-delete-button')) {
                    this.insertTemplate(template);
                }
            });

            // Delete button for custom templates
            if (!template.isBuiltIn) {
                const deleteButton = item.querySelector('.template-delete-button');
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteTemplate(template.id);
                });
            }

            container.appendChild(item);
        });
    }

    /**
     * Insert a template
     * @param {Object} template - Template object
     */
    async insertTemplate(template) {
        if (this.onInsertCallback) {
            await this.onInsertCallback(template, this.insertMode);
        }
        this.hideTemplateMenu();
    }

    /**
     * Delete a custom template
     * @param {string} templateId - Template ID
     */
    async deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template?')) {
            return;
        }

        try {
            const result = await window.electronAPI.deleteCustomTemplate(templateId);
            if (result.success) {
                await this.loadTemplates();
                this.renderTemplates();
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template');
        }
    }

    /**
     * Handle custom template form submission
     * @param {Event} e - Form submit event
     */
    async handleCustomTemplateSubmit(e) {
        e.preventDefault();

        const name = this.customTemplateDialog.querySelector('#template-name').value.trim();
        const category = this.customTemplateDialog.querySelector('#template-category').value.trim() || 'custom';
        const description = this.customTemplateDialog.querySelector('#template-description').value.trim();
        const content = this.customTemplateDialog.querySelector('#template-content').value;

        if (!name || !content) {
            alert('Name and content are required');
            return;
        }

        try {
            const result = await window.electronAPI.saveCustomTemplate(name, content, {
                category,
                description
            });

            if (result.success) {
                this.hideCustomTemplateDialog();
                alert('Template created successfully!');
            }
        } catch (error) {
            console.error('Error creating template:', error);
            alert('Failed to create template: ' + error.message);
        }
    }

    /**
     * Register callback for template insertion
     * @param {Function} callback - Callback function (template, mode) => void
     */
    onInsert(callback) {
        this.onInsertCallback = callback;
    }
}

module.exports = TemplateUI;
