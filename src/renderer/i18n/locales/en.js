/**
 * English translations
 */

module.exports = {
    meta: {
        name: 'English',
        nativeName: 'English',
        code: 'en'
    },

    // Context Menu
    contextMenu: {
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        undo: 'Undo',
        redo: 'Redo',
        selectAll: 'Select All',
        bold: 'Bold',
        italic: 'Italic',
        strikethrough: 'Strikethrough',
        insert: 'Insert',
        insertLink: 'Insert Link',
        insertImage: 'Insert Image',
        insertTable: 'Insert Table',
        codeBlock: 'Code Block'
    },

    // Menu Bar
    menu: {
        file: 'File',
        edit: 'Edit',
        view: 'View',
        format: 'Format',
        help: 'Help',
        newFile: 'New File',
        open: 'Open',
        openFolder: 'Open Folder',
        openRecent: 'Open Recent',
        save: 'Save',
        saveAs: 'Save As',
        saveAll: 'Save All',
        export: 'Export',
        exportHTML: 'Export as HTML',
        exportPDF: 'Export as PDF',
        close: 'Close',
        closeFolder: 'Close Folder',
        exit: 'Exit'
    },

    // Editor
    editor: {
        untitled: 'Untitled',
        modified: 'Modified',
        lineNumber: 'Line {line}',
        columnNumber: 'Column {column}'
    },

    // Search
    search: {
        find: 'Find',
        replace: 'Replace',
        findPlaceholder: 'Find...',
        replacePlaceholder: 'Replace...',
        replaceAll: 'Replace All',
        matchCase: 'Match Case',
        wholeWord: 'Whole Word',
        useRegex: 'Use Regex',
        noResults: 'No results',
        resultsCount: '{current} of {total}',
        previous: 'Previous',
        next: 'Next'
    },

    // Tabs
    tabs: {
        closeTab: 'Close tab',
        closeOthers: 'Close Others',
        closeAll: 'Close All',
        closeSaved: 'Close Saved'
    },

    // Dialogs
    dialogs: {
        unsavedChanges: 'Unsaved Changes',
        unsavedMessage: 'Do you want to save changes to "{filename}"?',
        save: 'Save',
        dontSave: "Don't Save",
        cancel: 'Cancel',
        ok: 'OK',
        yes: 'Yes',
        no: 'No',
        close: 'Close'
    },

    // Statistics / Status Bar
    statistics: {
        words: 'Words',
        characters: 'Characters',
        readingTime: 'Reading time',
        minutes: '{count} min'
    },

    // Status Bar Info
    statusBarInfo: {
        spaces: 'Spaces: {size}',
        tabSize: 'Tab Size: {size}',
        linesSelected: 'lines selected',
        selected: 'selected'
    },

    // Settings
    settings: {
        title: 'Settings',
        general: 'General',
        editor: 'Editor',
        appearance: 'Appearance',
        language: 'Language',
        theme: 'Theme',
        fontSize: 'Font Size',
        lineNumbers: 'Show Line Numbers',
        wordWrap: 'Word Wrap',
        autoSave: 'Auto Save',
        autoSaveInterval: 'Auto Save Interval',
        aiAutocomplete: {
            title: 'AI Autocomplete',
            configure: 'Configure Autocomplete',
            enabled: 'Enable AI Autocomplete',
            enabledDescription: 'Suggests text continuation while you type using AI',
            debounce: 'Delay (ms)',
            debounceDescription: 'Wait time after you stop typing before requesting a suggestion',
            minChars: 'Minimum characters',
            minCharsDescription: 'Minimum amount of text before activating autocomplete',
            tabHint: 'Accept suggestion',
            escHint: 'Dismiss suggestion',
            notice: 'Note',
            noticeText: 'Autocomplete uses the same AI configuration as the chat panel (OpenAI or local server).',
            failedToSave: 'Failed to save settings'
        }
    },

    // Templates
    templates: {
        title: 'Templates',
        insert: 'Insert Template',
        create: 'Create Template',
        edit: 'Edit Template',
        delete: 'Delete',
        name: 'Template Name',
        namePlaceholder: 'My Template',
        content: 'Template Content',
        contentPlaceholder: 'Enter template content. Use {{placeholder}} for placeholders.',
        category: 'Category',
        categoryPlaceholder: 'custom',
        description: 'Description',
        descriptionPlaceholder: 'Template description',
        noTemplates: 'No templates found',
        noDescription: 'No description',
        all: 'All',
        saveTemplate: 'Save Template',
        insertMode: 'Insert Mode',
        replaceMode: 'Replace Mode',
        createdSuccessfully: 'Template created successfully!',
        failedToCreate: 'Failed to create template',
        failedToDelete: 'Failed to delete template',
        nameAndContentRequired: 'Name and content are required'
    },

    // Theme Selector
    themeSelector: {
        title: 'Select Theme',
        close: 'Close theme selector'
    },

    // Notifications
    notifications: {
        fileSaved: 'File saved successfully',
        fileSaveFailed: 'Failed to save file',
        exportSuccess: 'Export completed successfully',
        exportFailed: 'Export failed',
        copySuccess: 'Copied to clipboard',
        error: 'An error occurred',
        // File operations
        failedToOpenFile: 'Failed to open file',
        failedToCreateFile: 'Failed to create new file',
        failedToSaveFiles: 'Failed to save files',
        failedToLoadFile: 'Failed to load file',
        noModifiedFiles: 'No modified files to save.',
        successfullySavedFiles: 'Successfully saved {count} file(s).',
        savedWithErrors: 'Saved {count} file(s).\n\nErrors:\n{errors}',
        // Export
        successfullyExportedHTML: 'Successfully exported to HTML',
        successfullyExportedPDF: 'Successfully exported to PDF',
        failedToExportHTML: 'Failed to export to HTML',
        failedToExportPDF: 'Failed to export to PDF',
        // Folder operations
        failedToOpenFolder: 'Failed to open folder',
        failedToCloseFolder: 'Failed to close folder',
        // Other
        failedToToggleOutline: 'Failed to toggle outline panel',
        failedToToggleTypewriter: 'Failed to toggle typewriter scrolling',
        failedToToggleLineNumbers: 'Failed to toggle line numbers',
        failedToCreateTab: 'Failed to create tab',
        failedToSwitchTab: 'Failed to switch tab',
        failedToCloseTab: 'Failed to close tab',
        failedToInsertTemplate: 'Failed to insert template',
        failedToInitialize: 'Failed to initialize application',
        pleaseDropMarkdown: 'Please drop a markdown file (.md or .markdown)',
        tryAgain: 'Please try again.'
    },

    // Update Notifications
    updates: {
        available: 'Update Available',
        newVersion: 'A new version ({version}) is available!',
        downloading: 'Downloading Update',
        downloadProgress: 'Downloading... {percent}%',
        ready: 'Update Ready',
        readyMessage: 'Update downloaded. Restart to apply.',
        restartNow: 'Restart Now',
        later: 'Later',
        download: 'Download',
        dismiss: 'Dismiss',
        error: 'Update Error',
        errorMessage: 'Failed to download update. Please try again later.',
        errorNotFound: 'Update files not available yet. The release may still be processing. Please try again in a few minutes.',
        errorNetwork: 'Could not connect to the update server. Check your internet connection.',
        errorServer: 'Update server is temporarily unavailable. Please try again later.',
        upToDate: 'Up to Date',
        upToDateMessage: 'You are using the latest version.'
    },

    // Quick Actions (toolbar)
    quickActions: {
        newFile: 'New File',
        openFile: 'Open File',
        save: 'Save',
        exportHTML: 'Export HTML',
        exportPDF: 'Export PDF',
        editorView: 'Editor View',
        splitView: 'Split View',
        previewView: 'Preview',
        focusMode: 'Focus Mode',
    },

    // Focus Mode
    focusMode: {
        enabled: 'Focus mode enabled',
        disabled: 'Focus mode disabled',
        exitHint: 'Press <kbd>Esc</kbd> to exit focus mode'
    },

    // Formatting Toolbar
    formatting: {
        bold: 'Bold',
        italic: 'Italic',
        strikethrough: 'Strikethrough',
        heading: 'Heading {level}',
        bulletList: 'Bullet List',
        numberedList: 'Numbered List',
        taskList: 'Task List',
        blockquote: 'Blockquote',
        code: 'Inline Code',
        codeBlock: 'Code Block',
        link: 'Insert Link',
        image: 'Insert Image',
        table: 'Insert Table',
        horizontalRule: 'Horizontal Rule',
        indent: 'Indent',
        outdent: 'Outdent',
        clearFormat: 'Clear Formatting'
    },

    // File Tree
    fileTree: {
        openFolder: 'Open Folder',
        newFile: 'New File',
        newFolder: 'New Folder',
        rename: 'Rename',
        delete: 'Delete',
        refresh: 'Refresh',
        collapseAll: 'Collapse All',
        noFolder: 'No folder open'
    },

    // Outline Panel
    outline: {
        title: 'Outline',
        noHeadings: 'No headings found'
    },

    // Global Search
    globalSearch: {
        title: 'Search in Files',
        placeholder: 'Search...',
        noResults: 'No results found',
        searching: 'Searching...',
        searchError: 'Search error',
        enterSearchTerm: 'Enter a search term',
        resultsInFiles: '{matches} result(s) in {files} file(s)',
        results: '{count} result(s)'
    },

    // About
    about: {
        title: 'About MD Editor Pro',
        version: 'Version {version}',
        description: 'A modern markdown editor'
    },

    // Common Actions
    actions: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        close: 'Close',
        apply: 'Apply',
        reset: 'Reset',
        confirm: 'Confirm',
        done: 'Done',
        test: 'Test',
        refresh: 'Refresh',
        loading: 'Loading...'
    },

    // Activity Bar
    activityBar: {
        explorer: 'Explorer',
        search: 'Search',
        outline: 'Outline',
        templates: 'Templates',
        snippets: 'Snippets',
        settings: 'Settings',
        aiAssistant: 'AI Assistant',
        closeSidebar: 'Close Sidebar',
        connectionGraph: 'Connection Map',
        backlinks: 'Backlinks'
    },

    // Connection Graph
    connectionGraph: {
        title: 'Connection Map',
        noWorkspace: 'Open a folder to view the connection map.',
        loading: 'Loading connection map...',
        refresh: 'Refresh',
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        zoomReset: 'Reset Zoom',
        connections: '{count} connection(s)',
        inbound: 'Inbound: {count}',
        outbound: 'Outbound: {count}',
        orphanDocument: 'Orphan document',
        missingDocument: 'Missing document',
        errorLoading: 'Error loading connection map'
    },

    // Keyboard Shortcuts
    shortcuts: {
        title: 'Keyboard Shortcuts',
        searchPlaceholder: 'Search shortcuts...',
        resetAll: 'Reset All to Defaults',
        reset: 'Reset',
        pressKeys: 'Press keys...',
        reassign: 'Reassign',
        conflictMessage: 'The shortcut "{shortcut}" is already assigned to "{action}".\n\nDo you want to reassign it?',
        resetAllConfirm: 'Are you sure you want to reset all keyboard shortcuts to their default values?'
    },

    // Auto-Save Settings
    autoSaveSettings: {
        title: 'Auto-Save Settings',
        enable: 'Enable Auto-Save',
        enableDescription: 'Automatically save your document after a period of inactivity',
        delay: 'Auto-Save Delay',
        delayDescription: 'Time to wait after you stop typing before auto-saving (1-60 seconds)',
        seconds: 'seconds',
        info: 'Auto-save only works when a file has been saved at least once. Unsaved new documents must be manually saved first.',
        invalidDelay: 'Invalid delay. Please enter a number between 1 and 60.'
    },

    // Image Paste Settings
    imagePasteSettings: {
        title: 'Image Paste Settings',
        enable: 'Enable automatic image paste',
        enableDescription: 'When enabled, pasting images from clipboard (Ctrl+V) will automatically save them to the assets folder and insert markdown links.',
        assetsFolder: 'Assets Folder Path:',
        assetsFolderDescription: 'Relative path from the markdown file where images will be saved. The folder will be created automatically if it doesn\'t exist.',
        failedToSave: 'Failed to save settings'
    },

    // Advanced Markdown Settings
    advancedMarkdown: {
        title: 'Advanced Markdown Features',
        description: 'Enable or disable advanced markdown features. Changes take effect immediately.',
        mermaid: 'Mermaid Diagrams',
        mermaidDescription: 'Render diagrams using Mermaid syntax in fenced code blocks',
        katex: 'Mathematical Formulas (KaTeX)',
        katexDescription: 'Render LaTeX math expressions using $ delimiters',
        callouts: 'Callout Blocks',
        calloutsDescription: 'Display styled callout blocks for notes, warnings, and tips'
    },

    // Snippets
    snippets: {
        title: 'Snippets',
        trigger: 'Trigger',
        description: 'Description',
        content: 'Content',
        builtIn: 'Built-in',
        custom: 'Custom',
        create: 'Create Snippet',
        edit: 'Edit Snippet',
        delete: 'Delete Snippet',
        noSnippets: 'No snippets found',
        triggerPlaceholder: 'e.g., code',
        descriptionPlaceholder: 'Snippet description',
        contentPlaceholder: 'Snippet content with {{placeholders}}'
    },

    // Preview
    preview: {
        error: 'Preview Error',
        unknownError: 'Unknown error occurred'
    },

    // Auto-Save Status
    autoSaveStatus: {
        saving: 'Saving...',
        savingTitle: 'Auto-saving document',
        saved: 'Saved',
        savedTitle: 'Document saved successfully',
        error: 'Save Error',
        errorTitle: 'Failed to save document'
    },

    // Code Block Dialog
    codeBlock: {
        selectLanguage: 'Select Code Language',
        insert: 'Insert'
    },

    // AI Chat
    aiChat: {
        title: 'AI Assistant',
        placeholder: 'Ask something...',
        send: 'Send',
        clear: 'Clear chat',
        settings: 'Settings',
        thinking: 'Thinking...',
        welcome: "Hi! I'm your AI writing assistant.",
        welcomeHint: 'Ask me anything about your document, or request help with writing, formatting, or ideas. You can also ask me to edit or generate content directly!',
        error: 'An error occurred. Please try again.',
        apiKeyMissing: 'Please configure your API key in settings.',
        copy: 'Copy',
        copied: 'Copied!',
        // Content generation
        contentGenerated: 'Content generated',
        applyToEditor: 'Apply to editor',
        apply: 'Apply',
        applied: 'Applied!',
        dismiss: 'Dismiss',
        contentApplied: 'Content applied to editor',
        applyReplace: 'Replace document',
        applyInsert: 'Insert at cursor',
        applyAppend: 'Append to document',
        applySelection: 'Replace selection'
    },

    // AI Settings
    aiSettings: {
        title: 'AI Settings',
        hint: 'Configure your API keys here. Switch provider/model directly in the chat.',
        cloudProviders: 'Cloud Providers',
        localServer: 'Local Server (LM Studio, Ollama)',
        provider: 'Provider',
        providerOpenAI: 'OpenAI',
        providerLocal: 'Local Server (LM Studio, Ollama, etc.)',
        openaiApiKey: 'OpenAI API Key',
        openaiApiKeyHint: 'Your API key is stored locally and never shared.',
        model: 'Model',
        serverUrl: 'Server URL',
        apiKeyOptional: 'API Key (optional)',
        apiKeyOptionalHint: 'Required if your server has authentication enabled.',
        testingConnection: 'Testing...',
        connectedSuccessfully: 'Connected successfully!',
        connectionFailed: 'Connection failed',
        defaultModel: 'Default Model',
        defaultModelFromServer: 'Default Model (from server)',
        refreshModels: 'Refresh Models',
        gpt4oMini: 'GPT-4o Mini (Fast & Affordable)',
        gpt4o: 'GPT-4o (Most Capable)',
        gpt4Turbo: 'GPT-4 Turbo',
        gpt35Turbo: 'GPT-3.5 Turbo (Legacy)',
        configured: 'Configured',
        notConfigured: 'Not configured',
        toggleVisibility: 'Show/hide',
        getApiKey: 'Get API Key',
        free: 'Free',
        enterKeyFirst: 'Enter a key first',
        keyValid: 'Key valid',
        keyInvalid: 'Key invalid',
        testFailed: 'Test failed'
    },

    // Panels
    panels: {
        templateComingSoon: 'Template panel coming soon...',
        snippetComingSoon: 'Snippet panel coming soon...'
    },

    // Typewriter Scrolling
    typewriter: {
        enabled: 'Typewriter scrolling enabled',
        disabled: 'Typewriter scrolling disabled'
    },

    // AI Edit Commands
    aiEdit: {
        title: 'AI Edit',
        textTransformed: 'Text transformed successfully',
        failedToTransform: 'Failed to transform text',
        processing: 'Processing...',
        // Commands
        rewrite: 'Rewrite',
        rewriteHint: 'Improve clarity',
        fixGrammar: 'Fix Grammar',
        fixGrammarHint: 'Correct errors',
        summarize: 'Summarize',
        summarizeHint: 'Make shorter',
        expand: 'Expand',
        expandHint: 'Add details',
        makeFormal: 'Make Formal',
        makeFormalHint: 'Professional tone',
        makeCasual: 'Make Casual',
        makeCasualHint: 'Friendly tone',
        translate: 'Translate',
        translateHint: 'To another language',
        custom: 'Custom...',
        customHint: 'Your instruction',
        // Dialogs
        translateTo: 'Translate to',
        customInstruction: 'Custom Instruction',
        customPlaceholder: 'Enter your instruction for the AI...',
        cancel: 'Cancel',
        apply: 'Apply'
    },

    // Command Palette
    commandPalette: {
        title: 'Command Palette',
        placeholder: 'Type a command...',
        noResults: 'No matching commands',
        categoryFile: 'File',
        categoryEdit: 'Edit',
        categoryView: 'View',
        categoryInsert: 'Insert',
        categoryTools: 'Tools',
        categoryHelp: 'Help'
    },

    // Table Editor
    tableEditor: {
        title: 'Table Editor',
        header: 'Header',
        cell: 'Cell',
        addColumn: 'Add Column',
        removeColumn: 'Remove Column',
        addRow: 'Add Row',
        removeRow: 'Remove Row',
        alignment: 'Toggle Alignment',
        editTable: 'Edit Table',
        noTableFound: 'No table found at cursor position'
    },

    // Backlinks
    backlinks: {
        title: 'Backlinks',
        noDocument: 'Open a document to see backlinks.',
        noBacklinks: 'No documents link to this file.',
        count: '{count} document(s) link here',
        link: 'link',
        links: 'links',
        error: 'Error loading backlinks.',
        refresh: 'Refresh Backlinks'
    },

    // What's New
    whatsNew: {
        title: "What's New",
        version: 'Version',
        versionDate: '{version} — {date}',
        close: 'Close',
        menuLabel: "What's New"
    }
};
