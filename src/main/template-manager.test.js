/**
 * TemplateManager Tests
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import TemplateManager from './template-manager.js';
import ConfigStore from './config-store.js';

describe('TemplateManager', () => {
    let templateManager;
    let configStore;

    beforeEach(() => {
        configStore = new ConfigStore();
        // Clear any existing custom templates
        configStore.set('customTemplates', []);
        templateManager = new TemplateManager(configStore);
    });

    describe('Constructor', () => {
        it('should throw error if ConfigStore is not provided', () => {
            expect(() => new TemplateManager()).toThrow('ConfigStore is required');
        });

        it('should initialize with ConfigStore', () => {
            expect(templateManager).toBeDefined();
            expect(templateManager.configStore).toBe(configStore);
        });
    });

    describe('Built-in Templates', () => {
        it('should have built-in templates', () => {
            const templates = templateManager.getBuiltInTemplates();
            expect(templates.length).toBeGreaterThan(0);
        });

        it('should have README template', () => {
            const template = templateManager.getTemplate('readme');
            expect(template).toBeDefined();
            expect(template.name).toBe('README');
            expect(template.isBuiltIn).toBe(true);
        });

        it('should have blog post template', () => {
            const template = templateManager.getTemplate('blog-post');
            expect(template).toBeDefined();
            expect(template.name).toBe('Blog Post');
            expect(template.isBuiltIn).toBe(true);
        });

        it('should have meeting notes template', () => {
            const template = templateManager.getTemplate('meeting-notes');
            expect(template).toBeDefined();
            expect(template.name).toBe('Meeting Notes');
            expect(template.isBuiltIn).toBe(true);
        });

        it('should have documentation template', () => {
            const template = templateManager.getTemplate('documentation');
            expect(template).toBeDefined();
            expect(template.name).toBe('Documentation');
            expect(template.isBuiltIn).toBe(true);
        });
    });

    describe('getTemplate', () => {
        it('should return built-in template by ID', () => {
            const template = templateManager.getTemplate('readme');
            expect(template).toBeDefined();
            expect(template.id).toBe('readme');
        });

        it('should return null for non-existent template', () => {
            const template = templateManager.getTemplate('non-existent');
            expect(template).toBeNull();
        });

        it('should throw error for invalid template ID', () => {
            expect(() => templateManager.getTemplate('')).toThrow('Template ID must be a non-empty string');
            expect(() => templateManager.getTemplate(null)).toThrow('Template ID must be a non-empty string');
        });
    });

    describe('getAllTemplates', () => {
        it('should return all templates (built-in and custom)', () => {
            const templates = templateManager.getAllTemplates();
            expect(templates.length).toBeGreaterThanOrEqual(4); // At least 4 built-in templates
        });

        it('should include custom templates', () => {
            templateManager.saveCustomTemplate('Test Template', '# Test\n\n{{content}}');
            const templates = templateManager.getAllTemplates();
            const customTemplate = templates.find(t => t.name === 'Test Template');
            expect(customTemplate).toBeDefined();
        });
    });

    describe('saveCustomTemplate', () => {
        it('should save custom template', () => {
            const template = templateManager.saveCustomTemplate('My Template', '# {{title}}\n\n{{content}}', {
                category: 'custom',
                description: 'My custom template'
            });

            expect(template).toBeDefined();
            expect(template.id).toBeDefined();
            expect(template.name).toBe('My Template');
            expect(template.content).toBe('# {{title}}\n\n{{content}}');
            expect(template.category).toBe('custom');
            expect(template.description).toBe('My custom template');
            expect(template.isBuiltIn).toBe(false);
        });

        it('should extract placeholders from content', () => {
            const template = templateManager.saveCustomTemplate('Test', '# {{title}}\n\n{{content}}\n\n{{footer}}');
            expect(template.placeholders).toEqual(['{{title}}', '{{content}}', '{{footer}}']);
        });

        it('should throw error for invalid name', () => {
            expect(() => templateManager.saveCustomTemplate('', 'content')).toThrow('Template name must be a non-empty string');
            expect(() => templateManager.saveCustomTemplate(null, 'content')).toThrow('Template name must be a non-empty string');
        });

        it('should throw error for invalid content', () => {
            expect(() => templateManager.saveCustomTemplate('Test', '')).toThrow('Template content must be a non-empty string');
            expect(() => templateManager.saveCustomTemplate('Test', null)).toThrow('Template content must be a non-empty string');
        });
    });

    describe('deleteCustomTemplate', () => {
        it('should delete custom template', () => {
            const template = templateManager.saveCustomTemplate('Test', 'content');
            const result = templateManager.deleteCustomTemplate(template.id);
            expect(result).toBe(true);

            const retrieved = templateManager.getTemplate(template.id);
            expect(retrieved).toBeNull();
        });

        it('should return false for non-existent template', () => {
            const result = templateManager.deleteCustomTemplate('non-existent');
            expect(result).toBe(false);
        });
    });

    describe('updateCustomTemplate', () => {
        it('should update custom template', () => {
            const template = templateManager.saveCustomTemplate('Test', 'old content');
            const result = templateManager.updateCustomTemplate(template.id, {
                name: 'Updated Test',
                content: 'new content'
            });

            expect(result).toBe(true);

            const updated = templateManager.getTemplate(template.id);
            expect(updated.name).toBe('Updated Test');
            expect(updated.content).toBe('new content');
        });

        it('should recalculate placeholders when content is updated', () => {
            const template = templateManager.saveCustomTemplate('Test', '{{old}}');
            templateManager.updateCustomTemplate(template.id, {
                content: '{{new1}} {{new2}}'
            });

            const updated = templateManager.getTemplate(template.id);
            expect(updated.placeholders).toEqual(['{{new1}}', '{{new2}}']);
        });

        it('should return false for non-existent template', () => {
            const result = templateManager.updateCustomTemplate('non-existent', { name: 'Test' });
            expect(result).toBe(false);
        });
    });

    describe('findPlaceholders', () => {
        it('should find all placeholders in content', () => {
            const placeholders = templateManager.findPlaceholders('# {{title}}\n\n{{content}}\n\n{{footer}}');
            expect(placeholders).toEqual(['{{title}}', '{{content}}', '{{footer}}']);
        });

        it('should return empty array for content without placeholders', () => {
            const placeholders = templateManager.findPlaceholders('# Title\n\nContent');
            expect(placeholders).toEqual([]);
        });

        it('should remove duplicate placeholders', () => {
            const placeholders = templateManager.findPlaceholders('{{title}} {{title}} {{content}}');
            expect(placeholders).toEqual(['{{title}}', '{{content}}']);
        });

        it('should return empty array for empty content', () => {
            const placeholders = templateManager.findPlaceholders('');
            expect(placeholders).toEqual([]);
        });
    });

    describe('getFirstPlaceholderPosition', () => {
        it('should return position of first placeholder', () => {
            const position = templateManager.getFirstPlaceholderPosition('# Title\n\n{{content}}');
            expect(position).toBe(9); // Position after "# Title\n\n"
        });

        it('should return -1 for content without placeholders', () => {
            const position = templateManager.getFirstPlaceholderPosition('# Title\n\nContent');
            expect(position).toBe(-1);
        });

        it('should return -1 for empty content', () => {
            const position = templateManager.getFirstPlaceholderPosition('');
            expect(position).toBe(-1);
        });
    });

    describe('getTemplatesByCategory', () => {
        it('should return templates by category', () => {
            const templates = templateManager.getTemplatesByCategory('documentation');
            expect(templates.length).toBeGreaterThan(0);
            templates.forEach(t => {
                expect(t.category).toBe('documentation');
            });
        });

        it('should return empty array for non-existent category', () => {
            const templates = templateManager.getTemplatesByCategory('non-existent');
            expect(templates).toEqual([]);
        });

        it('should throw error for invalid category', () => {
            expect(() => templateManager.getTemplatesByCategory('')).toThrow('Category must be a non-empty string');
        });
    });

    describe('getCategories', () => {
        it('should return all unique categories', () => {
            const categories = templateManager.getCategories();
            expect(categories.length).toBeGreaterThan(0);
            expect(categories).toContain('documentation');
            expect(categories).toContain('blog');
            expect(categories).toContain('notes');
        });

        it('should include custom categories', () => {
            templateManager.saveCustomTemplate('Test', 'content', { category: 'test-category' });
            const categories = templateManager.getCategories();
            expect(categories).toContain('test-category');
        });

        it('should return sorted categories', () => {
            const categories = templateManager.getCategories();
            const sorted = [...categories].sort();
            expect(categories).toEqual(sorted);
        });
    });

    describe('markTemplateUsed', () => {
        it('should update lastUsed timestamp for custom template', () => {
            const template = templateManager.saveCustomTemplate('Test', 'content');
            expect(template.lastUsed).toBeNull();

            templateManager.markTemplateUsed(template.id);

            const updated = templateManager.getTemplate(template.id);
            expect(updated.lastUsed).toBeGreaterThan(0);
        });

        it('should not throw error for built-in template', () => {
            expect(() => templateManager.markTemplateUsed('readme')).not.toThrow();
        });

        it('should not throw error for non-existent template', () => {
            expect(() => templateManager.markTemplateUsed('non-existent')).not.toThrow();
        });
    });
});
