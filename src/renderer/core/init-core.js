/**
 * Core initialization module
 * Initializes fundamental editor components: Editor, Preview, SearchManager, TabBar, MarkdownParser
 * Also initializes AdvancedMarkdownManagerClient and AdvancedMarkdownPostProcessor as dependencies
 *
 * @module init-core
 * Requirements: 3.3, 3.4
 */

const Editor = require('./editor.js');
const Preview = require('./preview.js');
const SearchManager = require('./search.js');
const { MarkdownParser } = require('./markdown-parser.js');
const AdvancedMarkdownManagerClient = require('../managers/advanced-markdown-manager-client.js');
const AdvancedMarkdownPostProcessor = require('../advanced-markdown/post-processor.js');

/**
 * Initializes core editor components and registers them in the ComponentRegistry.
 * Must run before all other init modules since they depend on editor, preview, etc.
 *
 * @param {ComponentRegistry} registry - The component registry to register instances in
 * @param {EventBus} eventBus - The event bus for inter-component communication
 */
async function initialize(registry, eventBus) {
    // Initialize Advanced Markdown Manager (client-side)
    const advancedMarkdownManager = new AdvancedMarkdownManagerClient();
    await advancedMarkdownManager.loadSettings();
    registry.register('advancedMarkdownManager', advancedMarkdownManager);
    console.log('AdvancedMarkdownManager initialized');

    // Initialize Advanced Markdown Post-Processor
    const advancedMarkdownPostProcessor = new AdvancedMarkdownPostProcessor();
    registry.register('advancedMarkdownPostProcessor', advancedMarkdownPostProcessor);
    console.log('AdvancedMarkdownPostProcessor initialized');

    // Initialize Markdown Parser with advanced features
    const markdownParser = new MarkdownParser(advancedMarkdownManager, advancedMarkdownPostProcessor);
    registry.register('markdownParser', markdownParser);
    console.log('MarkdownParser initialized');

    // Initialize Editor
    const editor = new Editor();
    registry.register('editor', editor);
    console.log('Editor created');

    // Initialize Preview with post-processor and markdown parser
    const preview = new Preview(advancedMarkdownPostProcessor, markdownParser);
    registry.register('preview', preview);
    console.log('Preview created');

    // Initialize SearchManager
    const searchManager = new SearchManager(editor);
    registry.register('searchManager', searchManager);
    console.log('SearchManager created');

    // Note: TabBar is NOT created here because it requires a DOM container element.
    // It is created in index.js after the DOM is available.
    console.log('TabBar deferred to index.js (requires DOM container)');
}

module.exports = { initialize };
