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
        category: 'content',
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
    },
    {
        id: 'changelog',
        name: 'Changelog',
        category: 'documentation',
        description: 'Version history following Keep a Changelog format',
        content: `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- {{new_feature}}

### Changed
- {{change}}

### Fixed
- {{fix}}

## [{{version}}] - ${new Date().toISOString().split('T')[0]}

### Added
- {{added_item}}

### Changed
- {{changed_item}}

### Deprecated
- {{deprecated_item}}

### Removed
- {{removed_item}}

### Fixed
- {{fixed_item}}

### Security
- {{security_item}}
`,
        placeholders: ['{{new_feature}}', '{{change}}', '{{fix}}', '{{version}}', '{{added_item}}', '{{changed_item}}', '{{deprecated_item}}', '{{removed_item}}', '{{fixed_item}}', '{{security_item}}'],
        isBuiltIn: true
    },
    {
        id: 'api-endpoint',
        name: 'API Endpoint',
        category: 'documentation',
        description: 'REST API endpoint documentation',
        content: `# {{endpoint_name}}

## Endpoint

\`{{method}} {{path}}\`

## Description

{{description}}

## Authentication

{{authentication}}

## Request

### Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| {{header_name}} | {{header_type}} | {{required}} | {{header_description}} |

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| {{param_name}} | {{param_type}} | {{param_required}} | {{param_description}} |

### Body

\`\`\`json
{{request_body}}
\`\`\`

## Response

### Success ({{success_code}})

\`\`\`json
{{success_response}}
\`\`\`

### Error ({{error_code}})

\`\`\`json
{{error_response}}
\`\`\`

## Example

\`\`\`bash
curl -X {{method}} "{{base_url}}{{path}}" \\
  -H "Content-Type: application/json" \\
  -d '{{example_body}}'
\`\`\`
`,
        placeholders: ['{{endpoint_name}}', '{{method}}', '{{path}}', '{{description}}', '{{authentication}}', '{{header_name}}', '{{header_type}}', '{{required}}', '{{header_description}}', '{{param_name}}', '{{param_type}}', '{{param_required}}', '{{param_description}}', '{{request_body}}', '{{success_code}}', '{{success_response}}', '{{error_code}}', '{{error_response}}', '{{base_url}}', '{{example_body}}'],
        isBuiltIn: true
    },
    {
        id: 'contributing',
        name: 'Contributing Guide',
        category: 'documentation',
        description: 'CONTRIBUTING.md for open source projects',
        content: `# Contributing to {{project_name}}

Thank you for your interest in contributing! This document provides guidelines and steps for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct]({{code_of_conduct_link}}).

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- Clear and descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

### Suggesting Features

Feature suggestions are welcome! Please include:

- Clear use case description
- Proposed solution
- Alternative solutions considered

### Pull Requests

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/{{feature_name}}\`)
3. Make your changes
4. Run tests (\`{{test_command}}\`)
5. Commit your changes (\`git commit -m '{{commit_message}}'\`)
6. Push to the branch (\`git push origin feature/{{feature_name}}\`)
7. Open a Pull Request

## Development Setup

\`\`\`bash
{{setup_commands}}
\`\`\`

## Style Guide

{{style_guide}}

## Questions?

{{contact_info}}
`,
        placeholders: ['{{project_name}}', '{{code_of_conduct_link}}', '{{feature_name}}', '{{test_command}}', '{{commit_message}}', '{{setup_commands}}', '{{style_guide}}', '{{contact_info}}'],
        isBuiltIn: true
    },
    {
        id: 'todo-list',
        name: 'Task List',
        category: 'notes',
        description: 'To-do list with priorities',
        content: `# Tasks - {{date}}

## 🔴 High Priority

- [ ] {{high_task_1}}
- [ ] {{high_task_2}}

## 🟡 Medium Priority

- [ ] {{medium_task_1}}
- [ ] {{medium_task_2}}

## 🟢 Low Priority

- [ ] {{low_task_1}}
- [ ] {{low_task_2}}

## ✅ Completed

- [x] {{completed_task}}

## Notes

{{notes}}
`,
        placeholders: ['{{date}}', '{{high_task_1}}', '{{high_task_2}}', '{{medium_task_1}}', '{{medium_task_2}}', '{{low_task_1}}', '{{low_task_2}}', '{{completed_task}}', '{{notes}}'],
        isBuiltIn: true
    },
    {
        id: 'daily-notes',
        name: 'Daily Notes',
        category: 'notes',
        description: 'Daily journal/notes template',
        content: `# ${new Date().toISOString().split('T')[0]} - {{day_title}}

## 🎯 Goals for Today

- [ ] {{goal_1}}
- [ ] {{goal_2}}
- [ ] {{goal_3}}

## 📝 Notes

{{notes}}

## 💡 Ideas

{{ideas}}

## 📚 Learned Today

{{learned}}

## 🙏 Gratitude

{{gratitude}}

## 📊 Review

**What went well:** {{went_well}}

**What could improve:** {{could_improve}}

**Tomorrow's focus:** {{tomorrow_focus}}
`,
        placeholders: ['{{day_title}}', '{{goal_1}}', '{{goal_2}}', '{{goal_3}}', '{{notes}}', '{{ideas}}', '{{learned}}', '{{gratitude}}', '{{went_well}}', '{{could_improve}}', '{{tomorrow_focus}}'],
        isBuiltIn: true
    },
    {
        id: 'pull-request',
        name: 'Pull Request',
        category: 'development',
        description: 'Pull request description template',
        content: `## Description

{{description}}

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Related Issues

Closes #{{issue_number}}

## Changes Made

- {{change_1}}
- {{change_2}}
- {{change_3}}

## Screenshots (if applicable)

{{screenshots}}

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

### Test Instructions

{{test_instructions}}

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] All tests pass locally

## Additional Notes

{{additional_notes}}
`,
        placeholders: ['{{description}}', '{{issue_number}}', '{{change_1}}', '{{change_2}}', '{{change_3}}', '{{screenshots}}', '{{test_instructions}}', '{{additional_notes}}'],
        isBuiltIn: true
    },
    {
        id: 'bug-report',
        name: 'Bug Report',
        category: 'development',
        description: 'Bug report template for issues',
        content: `## Bug Description

{{description}}

## Steps to Reproduce

1. {{step_1}}
2. {{step_2}}
3. {{step_3}}

## Expected Behavior

{{expected}}

## Actual Behavior

{{actual}}

## Screenshots

{{screenshots}}

## Environment

- **OS:** {{os}}
- **Browser/Version:** {{browser}}
- **App Version:** {{app_version}}

## Additional Context

{{context}}

## Possible Solution (optional)

{{solution}}
`,
        placeholders: ['{{description}}', '{{step_1}}', '{{step_2}}', '{{step_3}}', '{{expected}}', '{{actual}}', '{{screenshots}}', '{{os}}', '{{browser}}', '{{app_version}}', '{{context}}', '{{solution}}'],
        isBuiltIn: true
    },
    {
        id: 'feature-request',
        name: 'Feature Request',
        category: 'development',
        description: 'Feature request template for issues',
        content: `## Feature Summary

{{summary}}

## Problem Statement

{{problem}}

## Proposed Solution

{{solution}}

## Alternatives Considered

{{alternatives}}

## Use Cases

1. {{use_case_1}}
2. {{use_case_2}}

## Acceptance Criteria

- [ ] {{criteria_1}}
- [ ] {{criteria_2}}
- [ ] {{criteria_3}}

## Mockups/Examples (optional)

{{mockups}}

## Additional Context

{{context}}

## Priority

- [ ] Critical
- [ ] High
- [ ] Medium
- [ ] Low
`,
        placeholders: ['{{summary}}', '{{problem}}', '{{solution}}', '{{alternatives}}', '{{use_case_1}}', '{{use_case_2}}', '{{criteria_1}}', '{{criteria_2}}', '{{criteria_3}}', '{{mockups}}', '{{context}}'],
        isBuiltIn: true
    },
    {
        id: 'tutorial',
        name: 'Tutorial',
        category: 'content',
        description: 'Step-by-step tutorial/how-to guide',
        content: `# {{title}}

## Introduction

{{introduction}}

## Prerequisites

- {{prerequisite_1}}
- {{prerequisite_2}}

## What You'll Learn

- {{learning_1}}
- {{learning_2}}

---

## Step 1: {{step_1_title}}

{{step_1_content}}

\`\`\`{{language}}
{{step_1_code}}
\`\`\`

## Step 2: {{step_2_title}}

{{step_2_content}}

\`\`\`{{language}}
{{step_2_code}}
\`\`\`

## Step 3: {{step_3_title}}

{{step_3_content}}

\`\`\`{{language}}
{{step_3_code}}
\`\`\`

---

## Summary

{{summary}}

## Next Steps

- {{next_step_1}}
- {{next_step_2}}

## Resources

- [{{resource_1_name}}]({{resource_1_url}})
- [{{resource_2_name}}]({{resource_2_url}})
`,
        placeholders: ['{{title}}', '{{introduction}}', '{{prerequisite_1}}', '{{prerequisite_2}}', '{{learning_1}}', '{{learning_2}}', '{{step_1_title}}', '{{step_1_content}}', '{{language}}', '{{step_1_code}}', '{{step_2_title}}', '{{step_2_content}}', '{{step_2_code}}', '{{step_3_title}}', '{{step_3_content}}', '{{step_3_code}}', '{{summary}}', '{{next_step_1}}', '{{next_step_2}}', '{{resource_1_name}}', '{{resource_1_url}}', '{{resource_2_name}}', '{{resource_2_url}}'],
        isBuiltIn: true
    },
    {
        id: 'comparison',
        name: 'Comparison Table',
        category: 'content',
        description: 'Compare multiple options in a table',
        content: `# {{title}}

## Overview

{{overview}}

## Comparison

| Feature | {{option_1}} | {{option_2}} | {{option_3}} |
|---------|--------------|--------------|--------------|
| {{feature_1}} | {{opt1_feat1}} | {{opt2_feat1}} | {{opt3_feat1}} |
| {{feature_2}} | {{opt1_feat2}} | {{opt2_feat2}} | {{opt3_feat2}} |
| {{feature_3}} | {{opt1_feat3}} | {{opt2_feat3}} | {{opt3_feat3}} |
| {{feature_4}} | {{opt1_feat4}} | {{opt2_feat4}} | {{opt3_feat4}} |
| **Price** | {{opt1_price}} | {{opt2_price}} | {{opt3_price}} |

## {{option_1}}

### Pros
- {{opt1_pro_1}}
- {{opt1_pro_2}}

### Cons
- {{opt1_con_1}}
- {{opt1_con_2}}

## {{option_2}}

### Pros
- {{opt2_pro_1}}
- {{opt2_pro_2}}

### Cons
- {{opt2_con_1}}
- {{opt2_con_2}}

## {{option_3}}

### Pros
- {{opt3_pro_1}}
- {{opt3_pro_2}}

### Cons
- {{opt3_con_1}}
- {{opt3_con_2}}

## Recommendation

{{recommendation}}

## Conclusion

{{conclusion}}
`,
        placeholders: ['{{title}}', '{{overview}}', '{{option_1}}', '{{option_2}}', '{{option_3}}', '{{feature_1}}', '{{opt1_feat1}}', '{{opt2_feat1}}', '{{opt3_feat1}}', '{{feature_2}}', '{{opt1_feat2}}', '{{opt2_feat2}}', '{{opt3_feat2}}', '{{feature_3}}', '{{opt1_feat3}}', '{{opt2_feat3}}', '{{opt3_feat3}}', '{{feature_4}}', '{{opt1_feat4}}', '{{opt2_feat4}}', '{{opt3_feat4}}', '{{opt1_price}}', '{{opt2_price}}', '{{opt3_price}}', '{{opt1_pro_1}}', '{{opt1_pro_2}}', '{{opt1_con_1}}', '{{opt1_con_2}}', '{{opt2_pro_1}}', '{{opt2_pro_2}}', '{{opt2_con_1}}', '{{opt2_con_2}}', '{{opt3_pro_1}}', '{{opt3_pro_2}}', '{{opt3_con_1}}', '{{opt3_con_2}}', '{{recommendation}}', '{{conclusion}}'],
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
