/**
 * Features initialization module
 * Initializes feature components: FocusMode, SnippetManager, SnippetUI, TemplateUI,
 * AutoSaveManager, StatisticsCalculator, ImagePaste, TypewriterScrolling, TableEditor
 *
 * @module init-features
 * Requirements: 3.3, 3.4
 */

const FocusMode = require('./features/focus-mode.js');
const SnippetManager = require('./features/snippet-manager.js');
const SnippetUI = require('./features/snippet-ui.js');
const TemplateUI = require('./features/template-ui.js');
const AutoSaveManager = require('./features/auto-save.js');
const StatisticsCalculator = require('./features/statistics.js');
const ImagePaste = require('./features/image-paste.js');
const TypewriterScrolling = require('./features/typewriter-scrolling.js');
const { TableEditor } = require('./features/table-editor.js');

/**
 * Initializes feature components and registers them in the ComponentRegistry.
 * Depends on core components (editor) being registered first.
 *
 * @param {ComponentRegistry} registry - The component registry to register instances in
 * @param {EventBus} eventBus - The event bus for inter-component communication
 */
async function initialize(registry, eventBus) {
    const editor = registry.get('editor');

    // Initialize FocusMode
    const focusMode = new FocusMode(editor);
    registry.register('focusMode', focusMode);
    console.log('FocusMode created');

    // Initialize TemplateUI
    const templateUI = new TemplateUI();
    registry.register('templateUI', templateUI);
    console.log('TemplateUI created');

    // Initialize SnippetManager
    const snippetManager = new SnippetManager(editor, {
        getCustomSnippets: async () => {
            try {
                const result = await window.electronAPI.getConfig('customSnippets');
                return result?.value || [];
            } catch (error) {
                console.error('Failed to get custom snippets:', error);
                return [];
            }
        },
        addCustomSnippet: async (snippet) => {
            try {
                const result = await window.electronAPI.getConfig('customSnippets');
                const snippets = result?.value || [];
                snippets.push(snippet);
                await window.electronAPI.setConfig('customSnippets', snippets);
            } catch (error) {
                console.error('Failed to add custom snippet:', error);
                throw error;
            }
        },
        deleteCustomSnippet: async (trigger) => {
            try {
                const result = await window.electronAPI.getConfig('customSnippets');
                const snippets = result?.value || [];
                const filtered = snippets.filter(s => s.trigger !== trigger);
                await window.electronAPI.setConfig('customSnippets', filtered);
            } catch (error) {
                console.error('Failed to delete custom snippet:', error);
                throw error;
            }
        },
        updateCustomSnippet: async (trigger, updates) => {
            try {
                const result = await window.electronAPI.getConfig('customSnippets');
                const snippets = result?.value || [];
                const index = snippets.findIndex(s => s.trigger === trigger);
                if (index !== -1) {
                    snippets[index] = { ...snippets[index], ...updates };
                    await window.electronAPI.setConfig('customSnippets', snippets);
                }
            } catch (error) {
                console.error('Failed to update custom snippet:', error);
                throw error;
            }
        }
    });
    registry.register('snippetManager', snippetManager);
    console.log('SnippetManager created');

    // Initialize SnippetUI
    const snippetUI = new SnippetUI(snippetManager);
    registry.register('snippetUI', snippetUI);
    console.log('SnippetUI created');

    // Initialize AutoSaveManager
    const autoSaveManager = new AutoSaveManager(editor);
    registry.register('autoSaveManager', autoSaveManager);
    console.log('AutoSaveManager created');

    // Initialize StatisticsCalculator
    const statisticsCalculator = new StatisticsCalculator(editor);
    registry.register('statisticsCalculator', statisticsCalculator);
    console.log('StatisticsCalculator created');

    // Initialize ImagePaste
    const imagePaste = new ImagePaste(editor);
    registry.register('imagePaste', imagePaste);
    console.log('ImagePaste created');

    // Initialize TypewriterScrolling
    const typewriterScrolling = new TypewriterScrolling(editor);
    registry.register('typewriterScrolling', typewriterScrolling);
    console.log('TypewriterScrolling created');

    // Initialize TableEditor
    const tableEditor = new TableEditor(editor);
    registry.register('tableEditor', tableEditor);
    console.log('TableEditor created');
}

module.exports = { initialize };
