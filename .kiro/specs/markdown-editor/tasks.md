# Implementation Plan

- [x] 1. Setup project structure and dependencies





  - Initialize npm project with Electron
  - Install dependencies: electron, markdown-it, markdown-it-task-lists, highlight.js, electron-store, codemirror
  - Install dev dependencies: vitest, fast-check, electron-builder
  - Create directory structure (src/main, src/renderer, src/preload)
  - Setup package.json scripts for dev and build
  - _Requirements: 8.4, 8.5_

- [x] 2. Implement main process core with security best practices





  - [x] 2.1 Create main process entry point with sandbox enabled


    - Implement app.enableSandbox() before app.whenReady()
    - Setup app lifecycle handlers (ready, window-all-closed, activate)
    - _Requirements: 4.1, 4.2, 4.3, 8.4_
  
  - [x] 2.2 Implement WindowManager with secure BrowserWindow configuration


    - Create BrowserWindow with contextIsolation: true, nodeIntegration: false, sandbox: true
    - Implement ready-to-show event for graceful window display
    - Setup window state management
    - _Requirements: 4.1, 4.2, 4.3, 8.4_
  
  - [x] 2.3 Write property test for window creation






    - **Property 10: Keyboard shortcuts adapt to platform**
    - **Validates: Requirements 4.4**

- [x] 3. Implement secure preload script with contextBridge





  - [x] 3.1 Create preload script with contextBridge API exposure


    - Expose file operations (openFile, saveFile, saveFileAs) via contextBridge
    - Expose export operations (exportHTML, exportPDF)
    - Expose config operations (getConfig, setConfig)
    - Expose event listeners with cleanup functions (onFileDropped, onMenuAction)
    - Never expose full ipcRenderer module
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 6.3, 8.4_
  
  - [x] 3.2 Write unit tests for preload API exposure






    - Test that contextBridge exposes correct API shape
    - Test that ipcRenderer is not directly accessible
    - _Requirements: 8.4_

- [x] 4. Implement FileManager for file operations




  - [x] 4.1 Create FileManager class with open/save/saveAs methods


    - Implement openFile() with dialog.showOpenDialog
    - Implement saveFile() with fs.writeFile
    - Implement saveFileAs() with dialog.showSaveDialog
    - Implement showUnsavedChangesDialog() with dialog.showMessageBox
    - Sanitize and validate all file paths for security
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.5_
  
  - [x] 4.2 Write property test for file operations






    - **Property 8: File save-load round trip**
    - **Validates: Requirements 3.2**
  
  - [ ]* 4.3 Write property test for unsaved changes
    - **Property 9: Unsaved changes trigger warning**
    - **Validates: Requirements 3.4**
  
  - [ ]* 4.4 Write property test for cross-platform paths
    - **Property 11: File paths are cross-platform compatible**
    - **Validates: Requirements 4.5**
  
  - [ ]* 4.5 Write unit tests for FileManager
    - Test openFile with mock dialog
    - Test saveFile with mock fs
    - Test error handling for permission denied
    - Test error handling for disk full
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Implement ConfigStore for settings persistence




  - [x] 5.1 Create ConfigStore class using electron-store


    - Implement get/set methods
    - Implement getTheme/setTheme methods
    - Implement getViewMode/setViewMode methods
    - Setup default configuration values
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 5.2 Write property test for config persistence
    - **Property 16: Theme persistence round trip**
    - **Validates: Requirements 6.3, 6.4**
  
  - [ ]* 5.3 Write unit tests for ConfigStore
    - Test get/set operations
    - Test default values
    - Test corrupted config handling
    - _Requirements: 6.3, 6.4_

- [x] 6. Implement Exporter for HTML and PDF export




  - [x] 6.1 Create Exporter class with exportToHTML and exportToPDF methods


    - Implement exportToHTML() using markdown-it to generate standalone HTML
    - Implement exportToPDF() using Electron's printToPDF API
    - Include CSS styling in HTML exports
    - Handle export errors gracefully
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 6.2 Write property test for HTML export
    - **Property 12: HTML export preserves content**
    - **Validates: Requirements 5.1, 5.3**
  
  - [ ]* 6.3 Write property test for PDF export
    - **Property 13: PDF export produces valid PDF**
    - **Validates: Requirements 5.2, 5.3**
  
  - [ ]* 6.4 Write unit tests for Exporter
    - Test HTML generation with sample markdown
    - Test PDF generation
    - Test error handling
    - _Requirements: 5.1, 5.2_

- [x] 7. Register IPC handlers in main process




  - [x] 7.1 Create IPC handler registration function

    - Register handlers for file:open, file:save, file:save-as
    - Register handlers for export:html, export:pdf
    - Register handlers for config:get, config:set
    - Implement proper error handling for all handlers
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 6.3, 8.4_
  
  - [ ]* 7.2 Write integration tests for IPC communication
    - Test main-to-renderer communication
    - Test renderer-to-main communication
    - Test error propagation through IPC
    - _Requirements: 8.4_

- [ ] 8. Implement application menu
  - [ ] 8.1 Create Menu with File, Edit, View, and Help menus
    - Implement File menu (New, Open, Save, Save As, Export)
    - Implement Edit menu (Undo, Redo, Cut, Copy, Paste, Find)
    - Implement View menu (Toggle Theme, View Mode)
    - Implement platform-specific menu items (macOS app menu)
    - Setup keyboard accelerators with platform detection
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 6.1, 6.2, 7.1, 4.4_
  
  - [ ]* 8.2 Write unit tests for menu creation
    - Test menu structure
    - Test platform-specific accelerators
    - _Requirements: 4.4_

- [ ] 9. Checkpoint - Ensure main process tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Setup renderer HTML structure
  - [ ] 10.1 Create index.html with editor and preview containers
    - Create HTML structure with editor pane, preview pane, and search UI
    - Add CSS links for themes
    - Add script tag for renderer.js
    - Setup split view layout with resizable divider
    - _Requirements: 2.1, 6.2, 7.1_
  
  - [ ]* 10.2 Write unit tests for HTML structure
    - Test that required DOM elements exist
    - _Requirements: 2.1_

- [ ] 11. Implement markdown parser with CommonMark and GFM support
  - [ ] 11.1 Configure markdown-it with plugins
    - Initialize markdown-it with CommonMark preset
    - Enable GFM extensions (tables, strikethrough)
    - Add markdown-it-task-lists plugin
    - Configure highlight.js for syntax highlighting
    - Disable HTML tags for security
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [ ]* 11.2 Write property test for markdown rendering
    - **Property 5: Markdown rendering completeness**
    - **Validates: Requirements 2.2, 2.3**
  
  - [ ]* 11.3 Write property test for syntax highlighting
    - **Property 6: Code blocks have syntax highlighting**
    - **Validates: Requirements 2.4**
  
  - [ ]* 11.4 Write unit tests for markdown parser
    - Test CommonMark elements rendering
    - Test GFM extensions rendering
    - Test code block highlighting
    - _Requirements: 2.2, 2.3, 2.4_

- [ ] 12. Implement Editor component with CodeMirror 6
  - [ ] 12.1 Create Editor class with CodeMirror integration
    - Initialize CodeMirror 6 with markdown language support
    - Implement getValue/setValue methods
    - Implement insertText method for paste functionality
    - Implement applyFormatting for bold/italic shortcuts
    - Implement undo/redo methods
    - Setup content change callback
    - Implement scroll position tracking
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.5_
  
  - [ ]* 12.2 Write property test for paste functionality
    - **Property 1: Paste inserts at cursor position**
    - **Validates: Requirements 1.2**
  
  - [ ]* 12.3 Write property test for formatting shortcuts
    - **Property 2: Formatting shortcuts apply correct markdown syntax**
    - **Validates: Requirements 1.3**
  
  - [ ]* 12.4 Write property test for undo functionality
    - **Property 3: Undo reverts last modification**
    - **Validates: Requirements 1.4**
  
  - [ ]* 12.5 Write property test for undo-redo round trip
    - **Property 4: Undo-redo round trip preserves state**
    - **Validates: Requirements 1.5**
  
  - [ ]* 12.6 Write unit tests for Editor
    - Test initialization
    - Test text manipulation methods
    - Test event callbacks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 13. Implement Preview component
  - [ ] 13.1 Create Preview class with markdown rendering
    - Initialize preview container
    - Implement render method using markdown-it
    - Implement scroll position tracking
    - Implement syncScroll method for editor synchronization
    - Debounce rendering to avoid excessive updates (300ms)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 13.2 Write property test for scroll synchronization
    - **Property 7: Scroll synchronization**
    - **Validates: Requirements 2.5**
  
  - [ ]* 13.3 Write unit tests for Preview
    - Test render method
    - Test scroll synchronization
    - Test debouncing
    - _Requirements: 2.1, 2.5_

- [ ] 14. Implement SearchManager for find and replace
  - [ ] 14.1 Create SearchManager class
    - Implement show/hide methods for search UI
    - Implement search method with highlighting
    - Implement navigateNext/navigatePrevious methods
    - Implement replace and replaceAll methods
    - Integrate with CodeMirror search functionality
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 14.2 Write property test for search navigation
    - **Property 17: Search navigation visits all occurrences**
    - **Validates: Requirements 7.3**
  
  - [ ]* 14.3 Write property test for replace current
    - **Property 18: Replace current occurrence**
    - **Validates: Requirements 7.4**
  
  - [ ]* 14.4 Write property test for replace all
    - **Property 19: Replace all occurrences**
    - **Validates: Requirements 7.5**
  
  - [ ]* 14.5 Write unit tests for SearchManager
    - Test search with multiple occurrences
    - Test navigation
    - Test replace operations
    - _Requirements: 7.1, 7.3, 7.4, 7.5_

- [ ] 15. Implement ThemeManager
  - [ ] 15.1 Create ThemeManager class
    - Implement setTheme method to toggle CSS classes
    - Implement getCurrentTheme method
    - Implement toggleTheme method
    - Load theme preference from ConfigStore on initialization
    - Apply theme to both editor and preview
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [ ]* 15.2 Write property test for theme application
    - **Property 14: Theme application affects all components**
    - **Validates: Requirements 6.1**
  
  - [ ]* 15.3 Write unit tests for ThemeManager
    - Test theme switching
    - Test CSS class application
    - _Requirements: 6.1_

- [ ] 16. Implement ViewModeManager
  - [ ] 16.1 Create ViewModeManager class
    - Implement setViewMode method (editor/preview/split)
    - Show/hide appropriate containers based on mode
    - Save view mode preference to ConfigStore
    - Load view mode preference on initialization
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [ ]* 16.2 Write property test for view mode
    - **Property 15: View mode controls visibility**
    - **Validates: Requirements 6.2**
  
  - [ ]* 16.3 Write unit tests for ViewModeManager
    - Test each view mode
    - Test element visibility
    - _Requirements: 6.2_

- [ ] 17. Implement renderer main application logic
  - [ ] 17.1 Create renderer entry point (index.js)
    - Initialize all components (Editor, Preview, SearchManager, ThemeManager, ViewModeManager)
    - Setup IPC event listeners for file operations
    - Setup IPC event listeners for menu actions
    - Implement file drag-and-drop handler
    - Connect editor changes to preview updates
    - Setup keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+F, Ctrl+Z, Ctrl+Y)
    - Track document dirty state for unsaved changes warning
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 3.4, 3.5, 7.1_
  
  - [ ]* 17.2 Write integration tests for renderer
    - Test editor-preview synchronization
    - Test file operations flow
    - Test keyboard shortcuts
    - _Requirements: 1.1, 2.1, 3.4_

- [ ] 18. Create CSS styles for light and dark themes
  - [ ] 18.1 Implement theme stylesheets
    - Create theme-light.css with light color scheme
    - Create theme-dark.css with dark color scheme
    - Create main.css with layout and common styles
    - Create editor.css for CodeMirror styling
    - Create preview.css for markdown rendering styles
    - Ensure high contrast and accessibility
    - _Requirements: 6.1_
  
  - [ ]* 18.2 Write unit tests for theme CSS
    - Test that theme classes exist
    - _Requirements: 6.1_

- [ ] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Setup electron-builder for packaging
  - [ ] 20.1 Configure electron-builder
    - Create electron-builder configuration in package.json
    - Configure build targets for Windows, Linux, and macOS
    - Setup application icons for each platform
    - Configure auto-update settings
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 20.2 Write build verification tests
    - Test that build produces valid executables
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 21. Final integration testing and polish
  - [ ] 21.1 End-to-end testing
    - Test complete file workflow (open, edit, save, export)
    - Test theme switching across all components
    - Test search and replace functionality
    - Test keyboard shortcuts on different platforms
    - Test drag-and-drop file opening
    - Verify unsaved changes warning
    - _Requirements: All_
  
  - [ ] 21.2 Performance optimization
    - Verify preview debouncing works correctly
    - Test with large markdown files
    - Optimize rendering performance if needed
    - _Requirements: 2.1_
  
  - [ ] 21.3 Error handling verification
    - Test all error scenarios
    - Verify user-friendly error messages
    - Test graceful degradation
    - _Requirements: All_

- [ ] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
