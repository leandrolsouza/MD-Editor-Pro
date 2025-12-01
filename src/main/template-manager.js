/**
 * TemplateManager - Manages document templates
 * Provides built-in and custom templates for common document types
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Built-in templates for common document types
 */
const BUILT_IN_TEMPLATES = [
    {
        id: 'readme',
        name: 'README',
        category: 'documentation',
        description: 'Standard README structure for projects',
        content: `# Project Name

{{description}}

## Installation

{{installation}}

## Usage

{{usage}}

## Features

{{features}}

## Contributing

{{contributing}}

## License

{{license}}
`,
        placeholders: ['{{description}}', '{{installation}}', '{{usage}}', '{{features}}', '{{contributing}}', '{{license}}'],
        isBuiltIn: true
    },
    {
        id: 'blog-post',
        name: 'Blog Post',
        category: 'blog',
        description: 'Blog post with front matter',
        content: `---
title: {{title}}
date: ${new Date().toISOString().split('T')[0]}
author: {{author}}
tags: {{tags}}
---

# {{title}}

{{content}}

## Conclusion

{{conclusion}}
`,
        placeholders: ['{{title}}', '{{author}}', '{{tags}}', '{{content}}', '{{conclusion}}'],
        isBuiltIn: true
    },
    {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        category: 'notes',
        description: 'Meeting notes template',
        content: `# Meeting Notes - {{date}}

**Date:** ${new Date().toISOString().split('T')[0]}
**Time:** {{time}}
**Attendees:** {{attendees}}

## Agenda

{{agenda}}

## Discussion

{{discussion}}

## Action Items

- [ ] {{action1}}
- [ ] {{action2}}

## Next Meeting

{{next_meeting}}
`,
        placeholders: ['{{date}}', '{{time}}', '{{attendees}}', '{{agenda}}', '{{discussion}}', '{{action1}}', '{{action2}}', '{{next_meeting}}'],
        isBuiltIn: true
    },
    {
        id: 'documentation',
        name: 'Documentation',
        category: 'documentation',
        description: 'Technical documentation template',
        content: `# {{title}}

## Overview

{{overview}}

## Getting Started

### Prerequisites

{{prerequisites}}

### Installation

{{installation}}

## API Reference

### {{api_name}}

{{api_description}}

**Parameters:**

- \`{{param1}}\` - {{param1_description}}
- \`{{param2}}\` - {{param2_description}}

**Returns:**

{{returns}}

**Example:**

\`\`\`javascript
{{example}}
\`\`\`

## Examples

{{examples}}

## Troubleshooting

{{troubleshooting}}

## Additional Resources

{{resources}}
`,
        placeholders: ['{{title}}', '{{overview}}', '{{prerequisites}}', '{{installation}}', '{{api_name}}', '{{api_description}}', '{{param1}}', '{{param1_description}}', '{{param2}}', '{{param2_description}}', '{{returns}}', '{{example}}', '{{examples}}', '{{troubleshooting}}', '{{resources}}'],
        isBuiltIn: true
    }
];

/**
 * TemplateManager class manages document templates
 */
class TemplateManager {
    /**
     * Create a new TemplateManager
     * @param {ConfigStore} configStore - Configuration store instance
     */
    constructor(configStore) {
        if (!configStore) {
            throw new Error('ConfigStore is required');
        }
        this.configStore = configStore;
    }

    /**
     * Get a template by ID (built-in or custom)
     * @param {string} templateId - Template ID
     * @returns {Object|null} Template object or null if not found
     */
    getTemplate(templateId) {
        if (!templateId || typeof templateId !== 'string') {
            throw new Error('Template ID must be a non-empty string');
        }

        // Check built-in templates first
        const builtIn = BUILT_IN_TEMPLATES.find(t => t.id === templateId);

        if (builtIn) {
            return builtIn;
        }

        // Check custom templates
        const custom = this.configStore.getCustomTemplate(templateId);

        return custom || null;
    }

    /**
     * Get all templates (built-in and custom)
     * @returns {Array} Array of all templates
     */
    getAllTemplates() {
        const customTemplates = this.configStore.getCustomTemplates();

        return [...BUILT_IN_TEMPLATES, ...customTemplates];
    }

    /**
     * Get all built-in templates
     * @returns {Array} Array of built-in templates
     */
    getBuiltInTemplates() {
        return [...BUILT_IN_TEMPLATES];
    }

    /**
     * Get all custom templates
     * @returns {Array} Array of custom templates
     */
    getCustomTemplates() {
        return this.configStore.getCustomTemplates();
    }

    /**
     * Save a custom template
     * @param {string} name - Template name
     * @param {string} content - Template content
     * @param {Object} metadata - Additional metadata (category, description)
     * @returns {Object} The created template
     */
    saveCustomTemplate(name, content, metadata = {}) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Template name must be a non-empty string');
        }
        if (!content || typeof content !== 'string') {
            throw new Error('Template content must be a non-empty string');
        }

        const template = {
            id: uuidv4(),
            name: name.trim(),
            category: metadata.category || 'custom',
            description: metadata.description || '',
            content: content,
            placeholders: this.findPlaceholders(content),
            isBuiltIn: false,
            createdAt: Date.now(),
            lastUsed: null
        };

        this.configStore.addCustomTemplate(template);
        return template;
    }

    /**
     * Delete a custom template
     * @param {string} templateId - Template ID
     * @returns {boolean} True if deleted, false if not found
     */
    deleteCustomTemplate(templateId) {
        if (!templateId || typeof templateId !== 'string') {
            throw new Error('Template ID must be a non-empty string');
        }

        try {
            this.configStore.deleteCustomTemplate(templateId);
            return true;
        } catch (error) {
            if (error.message.includes('not found')) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Update a custom template
     * @param {string} templateId - Template ID
     * @param {Object} updates - Template updates
     * @returns {boolean} True if updated, false if not found
     */
    updateCustomTemplate(templateId, updates) {
        if (!templateId || typeof templateId !== 'string') {
            throw new Error('Template ID must be a non-empty string');
        }
        if (!updates || typeof updates !== 'object') {
            throw new Error('Updates must be an object');
        }

        // If content is being updated, recalculate placeholders
        if (updates.content) {
            updates.placeholders = this.findPlaceholders(updates.content);
        }

        try {
            this.configStore.updateCustomTemplate(templateId, updates);
            return true;
        } catch (error) {
            if (error.message.includes('not found')) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Find all placeholders in template content
     * Placeholders are in the format {{placeholder_name}}
     * @param {string} content - Template content
     * @returns {Array<string>} Array of placeholder strings
     */
    findPlaceholders(content) {
        if (!content || typeof content !== 'string') {
            return [];
        }

        const placeholderRegex = /\{\{[^}]+\}\}/g;
        const matches = content.match(placeholderRegex);

        if (!matches) {
            return [];
        }

        // Remove duplicates and return
        return [...new Set(matches)];
    }

    /**
     * Get the position of the first placeholder in content
     * @param {string} content - Template content
     * @returns {number} Position of first placeholder, or -1 if none found
     */
    getFirstPlaceholderPosition(content) {
        if (!content || typeof content !== 'string') {
            return -1;
        }

        const placeholderRegex = /\{\{[^}]+\}\}/;
        const match = content.match(placeholderRegex);

        if (!match) {
            return -1;
        }

        return content.indexOf(match[0]);
    }

    /**
     * Update the last used timestamp for a template
     * @param {string} templateId - Template ID
     */
    markTemplateUsed(templateId) {
        if (!templateId || typeof templateId !== 'string') {
            return;
        }

        // Only update custom templates (built-in templates don't track usage)
        const template = this.configStore.getCustomTemplate(templateId);

        if (template) {
            this.configStore.updateCustomTemplate(templateId, {
                lastUsed: Date.now()
            });
        }
    }

    /**
     * Get templates by category
     * @param {string} category - Category name
     * @returns {Array} Array of templates in the category
     */
    getTemplatesByCategory(category) {
        if (!category || typeof category !== 'string') {
            throw new Error('Category must be a non-empty string');
        }

        const allTemplates = this.getAllTemplates();

        return allTemplates.filter(t => t.category === category);
    }

    /**
     * Get all unique categories
     * @returns {Array<string>} Array of category names
     */
    getCategories() {
        const allTemplates = this.getAllTemplates();
        const categories = allTemplates.map(t => t.category);

        return [...new Set(categories)].sort();
    }
}

module.exports = TemplateManager;
