# Changelog

All notable changes to MD Editor Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.10.0] - 2026-04-30

### ✨ Added

#### Structured Logger
- New centralized `Logger` class (`src/main/utils/logger.js`) replacing scattered `console.log`/`console.error` calls
- Level-aware logging: `debug`, `info`, `warn`, `error`, `fatal`
- Child loggers with preset category labels (e.g., `logger.child('IPC')`)
- Multiple sink support: console sink (default) and file sink
- Safe JSON serialization with circular reference detection
- Auto-detects production vs. development mode to set default log level

#### Log File Sink
- Persistent log file writer (`src/main/utils/log-file-sink.js`) with rotation and retention
- Writes newline-delimited JSON (NDJSON) to date-based log files in the user data directory
- Rotates when a file exceeds 5 MB; retains up to 7 log files
- Falls back to console-only output on write failure

#### IPC Error Codes
- New `src/main/utils/ipc-error-codes.js` mapping system errors (`ENOENT`, `EACCES`, `ENOSPC`, etc.) to structured IPC error codes
- Error codes: `FILE_NOT_FOUND`, `PERMISSION_DENIED`, `DISK_FULL`, `READ_ONLY_FS`, `VALIDATION_ERROR`, `INTERNAL_ERROR`
- `createIPCHandler` now enriches thrown errors with `errorCode` for structured error handling in the renderer

#### Main Process Error Boundary
- New `MainErrorBoundary` class (`src/main/error-boundary.js`) registered at startup
- Catches `uncaughtException` (fatal — shows native error dialog and exits) and `unhandledRejection` (non-fatal — logs and continues)
- Attaches `render-process-gone` listener to the main window to detect renderer crashes and offer a reload dialog

#### Renderer Error Boundary
- New `RendererErrorBoundary` (`src/renderer/error-boundary.js`) registered before component initialization
- Catches unhandled errors and promise rejections in the renderer process

#### Metrics Collector
- New `MetricsCollector` class (`src/main/metrics-collector.js`) collecting runtime health snapshots every 30 seconds
- Tracks heap memory usage (`heapUsed`, `heapTotal`, `rss`, `external`) and active window count
- Exposes `getLatest()` for on-demand snapshot access

#### Observability IPC Handlers
- New `src/main/ipc/observability-handlers.js` exposing `log:error` and `get-health-metrics` IPC channels
- Renderer can forward errors to the main process logger via `window.electronAPI.logError()`
- Renderer can query current health metrics via `window.electronAPI.getHealthMetrics()`

### 🔧 Changed

#### IPC Utilities
- `createIPCHandler` now uses the structured logger instead of `console.error`
- Added duration tracking: logs a warning for IPC calls that take longer than 1 second
- Errors are now enriched with `errorCode` before being re-thrown

#### Renderer Error Logging
- Replaced `console.error` calls in `src/renderer/index.js` with `logErrorToMain()`, forwarding errors to the main process logger via IPC

#### What's New Modal
- Now reads from `RELEASE-NOTES.md` (user-facing release notes) instead of `CHANGELOG.md` (developer changelog)

### 🧪 Tests

- Added comprehensive tests for `Logger`, `LogFileSink`, `IPC_ERROR_CODES`, `MainErrorBoundary`, `RendererErrorBoundary`, and `MetricsCollector`
- Updated `ipc-utils.test.js` with coverage for duration tracking, structured error codes, and slow-call warnings

---

## [1.9.0] - 2026-04-30

### 🏗️ Refactored

#### Main Process Architecture
- Extracted IPC handlers from `src/main/index.js` into domain-specific modules under `src/main/ipc/`
  - `file-handlers.js`, `export-handlers.js`, `config-handlers.js`, `tab-handlers.js`, `template-handlers.js`, `shortcut-handlers.js`, `workspace-handlers.js`, `search-handlers.js`, `ai-handlers.js`, `advanced-markdown-handlers.js`, `updater-handlers.js`, `whats-new-handlers.js`, `link-analyzer-handlers.js`, `issue-reporter-handlers.js`, `image-handlers.js`, `snippet-handlers.js`
- Created `src/main/utils/ipc-utils.js` with `createIPCHandler` for standardized handler wrapping with try-catch and contextual logging
- Extracted `SnippetManager` into `src/main/snippet-manager.js` as a standalone class
- Reduced `src/main/index.js` from ~800 lines to under 200 effective lines

#### Renderer Reorganization
- Reorganized renderer directory structure into responsibility-based subfolders:
  - `src/renderer/core/` — Editor, Preview, Search, TabBar, MarkdownParser
  - `src/renderer/panels/` — FileTreeSidebar, OutlinePanel, BacklinksPanel, ConnectionGraphPanel, GlobalSearchUI
  - `src/renderer/ai/` — AIChatPanel, AIAutocomplete, AIEditCommands, AIAutocompleteSettingsUI
  - `src/renderer/settings/` — SettingsPanel, ThemeSelector, KeyboardShortcutsUI, LanguageSelector
  - `src/renderer/features/` — FocusMode, SnippetManager, TemplateUI, AutoSave, ImagePaste, HtmlToMarkdown, Statistics, TableEditor, TypewriterScrolling
  - `src/renderer/ui/` — ActivityBar, FormattingToolbar, ContextMenu, Tooltip, Notification, CommandPalette, PanelResizer, StatusBarInfo, Icons
  - `src/renderer/managers/` — Theme, ViewMode, AdvancedMarkdownManagerClient

#### Component Registry & Event Bus
- Created `ComponentRegistry` (`src/renderer/core/component-registry.js`) for centralized component management, replacing ~40 global variables in `index.js`
- Created `EventBus` (`src/renderer/core/event-bus.js`) for decoupled inter-component communication
  - Events: `editor:content-changed`, `editor:cursor-changed`, `tab:switched`, `tab:closed`, `theme:changed`, `view-mode:changed`, `file:saved`, `file:opened`
- Created domain-specific initialization modules: `init-core.js`, `init-panels.js`, `init-ai.js`, `init-settings.js`, `init-features.js`, `init-ui.js`, `init-managers.js`, `init-activity-bar.js`
- Reduced `src/renderer/index.js` from ~1200 lines to under 300 effective lines

#### Error Handling Standardization
- Migrated `GlobalSearchManager` and `WorkspaceManager` to throw pattern (instead of `return { success: false }`)
- Migrated all IPC handlers to use `createIPCHandler`
- Added try-catch to `window.electronAPI.*` calls in the renderer with contextual error notifications

#### Duplication Elimination
- Unified `keyboard-shortcuts-manager.js` and `keyboard-shortcuts-integration.js` into a single module
- Extracted `keyword-matcher.js` from `mermaid-codemirror-lang.js` for generic keyword matching
- Extracted `katex-renderer.js` from `post-processor.js` for shared KaTeX rendering
- Extracted CSS from `exporter.js` into `src/main/export-styles.js`
- Extracted shared find/findNext/findPrevious logic in `search.js`

### 🧪 Tests

- Added tests for EventBus, ComponentRegistry, and createIPCHandler
- Added tests for all extracted IPC modules (`src/main/ipc/*.test.js`)
- Added tests for SnippetManager, keyword-matcher, and katex-renderer
- Updated integration tests for new import paths

---

## [1.8.0] - 2026-04-29

### ✨ Added

#### Command Palette
- VS Code-style command palette accessible via `Ctrl+Shift+P`
- Fuzzy search across all application commands
- Commands organized by category (File, Edit, View, Insert, Tools, Help)
- Keyboard navigation (Arrow keys, Enter, Escape)
- Shortcut badges displayed alongside each command
- Icon support for visual command identification
- Full i18n support (EN and PT-BR)

#### Visual Table Editor
- Inline visual editor for markdown tables (`Ctrl+Shift+M`)
- Floating "Edit Table" button appears when cursor is inside a table
- Add/remove rows and columns with toolbar buttons
- Column alignment toggle (left, center, right)
- Tab and arrow key navigation between cells
- Enter on last row automatically adds a new row
- Apply changes back to the editor with proper markdown formatting
- Full i18n support (EN and PT-BR)

#### Backlinks Panel
- New "Backlinks" panel in the activity bar sidebar
- Shows which documents link to the currently active document
- Displays link count per source document
- Click a backlink to open the source document
- Refresh button to re-scan workspace links
- Cache invalidation when workspace changes
- Full keyboard navigation and accessibility support
- Full i18n support (EN and PT-BR)

#### Internal Link Navigation
- Clicking `.md` / `.markdown` links in the preview now opens the target document in a new tab
- External links (`http://`, `https://`) open in the system browser
- Anchor links (`#`) scroll within the preview
- Prevents accidental navigation away from the app (white screen protection)

### 🔧 Changed

#### Window Security
- Blocked `will-navigate` events to prevent the app from navigating away from the renderer
- Blocked `window.open` calls from the renderer (e.g., `target="_blank"` links)

#### Editor
- Added cursor change callback support (`onCursorChange`) for plugins that need cursor tracking

#### Config Store
- `set()` now deletes the key when value is `undefined` or `null` instead of storing null values
- `setActiveTabId(null)` and `setWorkspacePath(null)` now properly delete the stored key

#### Keyboard Shortcuts
- Added new default shortcuts: Command Palette (`Ctrl+Shift+P`), Edit Table (`Ctrl+Shift+M`), Find in Files (`Ctrl+Shift+F`)

#### Themes
- Added `--hover-bg` CSS variable to all 7 themes for consistent hover styling

---

## [1.7.1] - 2026-04-28

### 🐛 Fixed

#### Window Close Behavior
- Fixed window close handler calling `preventDefault()` synchronously to prevent Electron from closing the window before async unsaved-changes check completes
- Window now properly destroys when there are no unsaved changes
- Added fallback `destroy()` on error to avoid trapping the user in an unclosable window

#### Unsaved Changes Detection
- `hasUnsavedChanges` now checks all open tabs (not just the active one) for unsaved modifications
- `saveBeforeClose` now calls `saveAll` instead of saving only the current file

### ✨ Added

#### File Tree Empty State
- New empty state UI in the file tree sidebar when no workspace is open
- "Abrir Pasta" button to open a folder directly from the empty state
- Empty state is automatically replaced when a workspace is loaded

#### Activity Bar View Actions
- `registerView` now supports optional action buttons in the sidebar panel header
- Explorer view includes an "Abrir Pasta" action button in the header

#### Settings Panel - Theme Section
- Added theme selection section to the settings panel
- Button to open the theme selector directly from settings

#### Toolbar Overflow Scrolling
- Formatting toolbar and main toolbar now support horizontal scrolling when buttons overflow
- Thin scrollbar styling for both Webkit and Firefox browsers
- Toolbar buttons no longer shrink; they scroll instead

---

## [1.7.0] - 2026-04-14

### ✨ Added

#### What's New Modal
- New "What's New" modal that displays release notes on app launch when a new version is detected
- Parses CHANGELOG.md automatically to extract version entries
- Version dropdown to browse release notes from any previous version
- Rendered markdown content with full formatting support (headings, lists, code blocks, etc.)
- "What's New" menu item in Help menu for manual access
- Persists last seen version via electron-store to avoid showing repeatedly
- Full accessibility: focus trap, Escape to close, click outside to dismiss, ARIA attributes
- Full i18n support (EN and PT-BR)

#### UI Modernization (DaisyUI + Tailwind CSS)
- Migrated entire UI styling from custom CSS to Tailwind CSS + DaisyUI component library
- 7 custom DaisyUI themes matching existing themes (light, dark, solarized-light, solarized-dark, dracula, monokai, nord)
- Theme variable bridge for backward compatibility with legacy CSS variables
- Modernized Activity Bar with consistent icon sizing, hover transitions, and active indicators
- Modernized Sidebar Panel with VS Code-style headers, file selection highlighting, and folder animations
- Modernized Tab Bar with active tab indicators, hover effects, close button opacity transitions, and scroll support
- Modernized Status Bar with compact layout and smooth status transitions
- Modernized Formatting Toolbar with DaisyUI button components, grouped separators, and click feedback
- Modernized Editor/Preview panes with Tailwind Typography plugin for consistent markdown rendering
- Modernized Modals with DaisyUI modal component, overlay, and entry/exit animations
- Modernized Context Menu with DaisyUI menu component, shadow, rounded borders, and fade-in animation
- Modernized Notification System with DaisyUI alert variants (success, warning, error, info) and slide animations
- Modernized form inputs with DaisyUI input, select, toggle, and checkbox components
- `prefers-reduced-motion` support disabling all animations for accessibility
- Preserved all existing ARIA attributes and keyboard navigation across migrated components
- CSS build pipeline with automatic purging of unused classes

---

## [1.6.0] - 2026-04-14

### ✨ Added

#### Document Connection Map
- New "Connection Map" panel in the activity bar sidebar
- Interactive force-directed graph visualization of document links
- Scans all markdown files in the workspace for internal links (standard `[text](path.md)` and wiki-style `[[filename]]`)
- Visual node types: normal (blue), active document (orange), orphan (gray dashed), missing target (red dashed)
- Directed edges with arrowheads showing link direction between documents
- Hover tooltip showing document path, inbound/outbound link counts, and orphan/missing status
- Click a node to open the corresponding document
- Zoom (mouse wheel) and pan (click + drag) controls
- Refresh button to re-scan workspace links
- Active document highlighting synced with the current editor tab
- Full i18n support (EN and PT-BR)

---

## [1.5.0] - 2026-03-31

### ✨ Added

#### Issue Reporter
- New "Report Issue..." option in Help menu
- Dedicated issue reporter window for submitting bug reports and feature requests
- Auto-collects system information (OS, Electron, Node, Chrome versions)
- Opens pre-filled GitHub issue in browser with proper labels

#### Status Bar Info
- VS Code-style status bar showing cursor position (Ln/Col)
- Selection info display (characters and lines selected)
- Indentation detection (Spaces/Tab size) from document content
- Encoding (UTF-8) and line ending (LF/CRLF) indicators
- Real-time updates as cursor moves

#### Quick Actions Toolbar
- New quick action buttons in the formatting toolbar: New File, Open, Save, Export HTML/PDF
- View mode toggle buttons (Editor, Split, Preview) with active state highlighting
- Focus Mode toggle button
- Full i18n support for all quick action labels (EN and PT-BR)

#### Manual Update Check
- "Check for Updates..." option in Help menu for manual update verification
- User feedback when no updates are available

### 🔧 Changed

#### Window
- Menu bar is now auto-hidden by default (press Alt to show)

#### UI Improvements
- Sidebar panel action buttons resized for better click targets
- Improved SVG icon styling in sidebar panels
- Removed duplicate CSS rules for sidebar close button

---

## [1.4.1] - 2026-03-31

### 🔧 Changed

#### Table Rendering
- Improved table styling in preview and exports with rounded borders, better spacing, and alternating row colors
- Added responsive table wrapper with horizontal scroll for wide tables
- Auto font-size adjustment for tables with many columns in HTML export
- Added `preferCSSPageSize` for better PDF table rendering
- Tables no longer break across pages in PDF exports (header group repeats)

### 🐛 Fixed

#### Table Parsing
- Fixed tables with blank lines between rows not rendering correctly in preview and exports
- Added markdown pre-processing to strip blank lines inside table blocks

#### Layout
- Fixed horizontal overflow in preview panel and editor container

---

## [1.4.0] - 2026-03-25

### ✨ Added

#### AI Settings
- New card-based layout for AI provider configuration
- Status indicators showing which providers are configured (✓/○)
- Toggle button to show/hide API keys
- Test button for each cloud provider to validate API keys
- Improved visual hierarchy with Cloud Providers and Local Server sections

### 🔧 Changed

#### AI Settings
- Wider modal (900px) for better readability
- Reorganized layout with 2x2 grid for cloud providers
- More compact vertical spacing to fit content without scrolling

---

## [1.3.6] - 2026-03-25

### 🐛 Fixed

#### Auto-Update
- Removed portable build to fix checksum mismatch (NSIS and portable had same filename)

---

## [1.3.5] - 2026-03-25

### 🐛 Fixed

#### Auto-Update
- Fixed artifact naming to use `md-editor-pro` instead of `MD Editor Pro` (spaces caused 404 errors)

---

## [1.3.4] - 2026-03-25

### 🐛 Fixed

#### Build Pipeline
- Added `--publish never` to prevent electron-builder from uploading during build
- Fixed Linux upload pattern (no blockmap files for AppImage/deb/rpm)

---

## [1.3.3] - 2026-03-25

### 🐛 Fixed

#### Build Pipeline
- Fixed GitHub Actions timeout issues by separating build and upload steps
- Using `gh release upload` instead of electron-builder's built-in publish

---

## [1.3.2] - 2026-03-25

### 🐛 Fixed

#### Auto-Update Error Messages
- Improved error messages for auto-update failures
  - User-friendly message when update files are not yet available (404 errors)
  - Specific message for network connection issues
  - Specific message for server unavailability
- Error notification now stays visible for 8 seconds (was 5) to give users time to read

#### Build Improvements
- Increased upload timeout for GitHub releases
- Removed 32-bit (ia32) Windows build to speed up releases

---

## [1.3.1] - 2026-03-25

(Skipped due to build issues)

---

## [1.3.0] - 2026-03-24

### ✨ Added

#### Activity Bar Enhancements
- **Templates Panel**: New sidebar panel for templates in the activity bar
  - Browse and filter templates by category
  - Insert or replace mode selection
  - Create custom templates directly from sidebar
  - Delete custom templates with one click

- **Snippets Panel**: New sidebar panel for snippets in the activity bar
  - Browse all snippets (built-in and custom)
  - Filter by type (all, built-in, custom)
  - Create, edit, and delete custom snippets
  - Preview snippet content before insertion
  - Click to insert snippet at cursor position

#### Custom SVG Icon System
- **New Icon Library**: Replaced emoji icons with custom SVG icons
  - Consistent, scalable vector icons across the application
  - Professional look with proper stroke widths
  - Icons for: files, folders, search, settings, templates, snippets, AI, formatting, and more
  - Better accessibility and theme compatibility

### 🔧 Changed
- Activity bar now uses SVG icons instead of emojis for a more professional appearance
- Improved template and snippet management UX with dedicated sidebar panels
- Updated CSS styles for new icon system and sidebar panels

### 🐛 Fixed
- Various ESLint rule improvements for better code quality
- Test file updates for improved coverage

---

## [1.2.0] - 2026-03-24

### ✨ Added

#### Internationalization (i18n)
- **Multi-language Support**: Full internationalization system with English and Portuguese (Brazil)
  - Automatic system language detection
  - Language selector in settings panel
  - All UI elements translated
  - Persistent language preference

#### AI Integration
- **AI Chat Panel**: Integrated AI assistant for writing help
  - Support for multiple AI providers (OpenAI, Anthropic, Ollama, LM Studio)
  - Configurable models per provider
  - Apply AI suggestions directly to editor
  - Code block syntax highlighting in responses
  - Copy code functionality
  - Chat history within session

- **AI Autocomplete**: Intelligent text completion while typing
  - Configurable trigger delay
  - Multiple provider support
  - Enable/disable via settings

- **AI Edit Commands**: Context menu AI actions for selected text
  - Rewrite text
  - Fix grammar
  - Summarize
  - Expand content
  - Make formal/casual
  - Translate
  - Custom prompts

#### Enhanced UI
- **Context Menu**: Rich right-click menu with formatting options
  - Cut, Copy, Paste, Undo, Redo, Select All
  - Markdown formatting (Bold, Italic, Strikethrough)
  - Insert elements (Link, Image, Table, Code Block)
  - AI edit commands submenu

- **Settings Panel**: Centralized settings management
  - Language selection
  - Auto-save configuration
  - Keyboard shortcuts
  - Advanced markdown settings
  - Image paste settings
  - AI autocomplete settings

- **Panel Resizer**: Adjustable panel widths
  - Drag to resize sidebar and chat panels
  - Persistent panel sizes

#### Activity Bar Improvements
- New Settings view in activity bar
- AI Chat view integration
- Improved panel switching

### 🔧 Changed
- Improved theme CSS with AI chat and context menu styles
- Enhanced formatting toolbar with i18n support
- Updated all UI components to use translation system
- Improved template UI with translations

---

## [1.1.0] - 2025-12-02

### ✨ Added

#### Smart HTML to Markdown Paste
- **Intelligent HTML Conversion**: Automatically converts HTML content from websites to Markdown when pasting
  - Detects HTML in clipboard and converts on-the-fly
  - Preserves formatting: bold, italic, strikethrough, inline code
  - Converts structure: headings (H1-H6), paragraphs, lists (ordered/unordered/nested)
  - Handles links and images with proper Markdown syntax
  - Converts code blocks with language detection
  - Preserves blockquotes and nested blockquotes
  - Converts HTML tables to Markdown tables
  - Security: Automatically strips `<script>`, `<style>` tags and HTML comments
  - Smart detection: Only converts meaningful HTML, ignores simple fragments
  - Post-processing: Cleans up excessive whitespace and ensures proper formatting
  - Powered by Turndown library with custom rules
  - Full test coverage (40 tests)
  - Documentation: `docs/HTML_TO_MARKDOWN_PASTE.md`

### 📦 Dependencies
- Added `turndown` (2.0.0) for HTML to Markdown conversion

---

## [1.0.0] - 2025-12-02

### 🎉 Initial Release

#### Core Editor Features
- **CodeMirror 6 Integration**: Modern, extensible code editor with full markdown support
- **Real-time Preview**: Live markdown rendering with synchronized scrolling
- **Multiple Cursors**: Edit multiple locations simultaneously (Ctrl+Click, Ctrl+D)
- **Typewriter Scrolling**: Keep active line centered for comfortable writing (Ctrl+Shift+T)
- **Syntax Highlighting**: Code blocks with highlight.js support for 190+ languages
- **Line Numbers**: Toggle line numbers via View menu
- **Drag and Drop**: Drop markdown files directly into the editor
- **Undo/Redo**: Full history support with Ctrl+Z/Ctrl+Y

#### Markdown Support
- **CommonMark & GFM**: Full support for tables, strikethrough, task lists
- **Mermaid Diagrams**: Flowcharts, sequence diagrams, class diagrams, ER diagrams, Gantt charts, pie charts, git graphs
- **Mathematical Formulas**: LaTeX expressions with KaTeX (inline and display mode)
- **Callout Blocks**: Styled callouts (NOTE, TIP, IMPORTANT, WARNING, CAUTION)
- **Configurable Features**: Enable/disable advanced features individually for performance

#### Navigation & Search
- **Global Search**: Search across all files in workspace (Ctrl+Shift+F)
  - Case sensitive, whole word, and regex options
  - Results organized by file with line numbers
  - Click to navigate to match
- **Outline Panel**: Navigate document structure with hierarchical header view (Ctrl+Shift+O)
  - Automatic header detection (H1-H6)
  - Active section highlighting
  - Expand/collapse sections
  - Full keyboard navigation
- **File Tree Sidebar**: Browse and manage markdown files (Ctrl+Shift+E)
  - Lazy loading for performance
  - Automatic markdown file filtering
  - Visual indicators for active and modified files
  - Persistent state across sessions
- **Activity Bar**: VS Code-style sidebar with Explorer, Search, and Outline views
- **Find & Replace**: Search and replace within current document (Ctrl+F, Ctrl+H)

#### Document Management
- **Multi-tab Interface**: Work on multiple documents simultaneously
- **Session Persistence**: Restore tabs, cursor position, and scroll on restart
- **Tab Navigation**: Ctrl+Tab, Ctrl+Shift+Tab, Ctrl+W shortcuts
- **Unsaved Changes**: Visual indicators and confirmation dialogs
- **Auto-save**: Configurable automatic saving with adjustable delay
- **File Associations**: Open .md and .markdown files directly in the app

#### Productivity Tools
- **Template System**: Built-in and custom templates with categories
  - Placeholder navigation with Tab key
  - Usage history tracking
  - Quick insert via menu or shortcuts
- **Snippet Manager**: Reusable text blocks with custom triggers
  - Built-in snippets for common markdown elements
  - Custom snippet creation and management
  - Trigger-based insertion
- **Image Paste**: Paste images from clipboard
  - Automatic saving to configurable assets folder
  - Relative markdown link insertion
  - Settings UI for configuration
- **Document Statistics**: Word count, character count, line count, reading time
  - Expandable/collapsible panel
  - Real-time updates

#### Themes & Appearance
- **7 Professional Themes**:
  - Light - Clean default light theme
  - Dark - Modern dark theme
  - Solarized Light/Dark - Scientifically balanced color palette
  - Dracula - Vibrant dark theme
  - Monokai - Classic editor theme
  - Nord - Arctic-inspired minimal theme
- **Theme Selector**: Visual theme picker with live preview (Ctrl+K Ctrl+T)
- **Quick Toggle**: Switch between light/dark modes (Ctrl+T)
- **Focus Mode**: Distraction-free writing (F11)
- **View Modes**: Editor only, Preview only, or Split view

#### Export & Sharing
- **HTML Export**: Export with all advanced features preserved
  - Rendered Mermaid diagrams as SVG
  - KaTeX formulas
  - Styled callout blocks
  - Syntax-highlighted code blocks
- **PDF Export**: Generate PDFs with all visual elements intact
  - Diagrams, formulas, and styling preserved
  - Professional formatting

#### Customization
- **Keyboard Shortcuts**: Fully customizable shortcuts
  - Visual editor for viewing and editing shortcuts
  - Reset to defaults option
  - Conflict detection
- **Settings Persistence**: All preferences saved via electron-store
  - Theme preferences
  - View mode
  - Auto-save settings
  - Custom snippets and shortcuts
  - Tab state and content
- **Auto-Update System**: Automatic update checking and installation
  - Checks for updates on GitHub Releases on app start
  - Visual notifications for available updates with version details
  - Download progress indicator with percentage and speed
  - One-click install and restart functionality
  - Support for delta updates on Windows (smaller downloads)
  - Background download without interrupting work
  - Manual check for updates via Help menu

#### Accessibility
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support for all components
- **Screen Reader Announcements**: Mode changes and important actions announced

#### Platform Support
- **Windows**: NSIS installer (x64, ia32) and portable executable (x64)
- **macOS**: DMG and ZIP for Intel (x64) and Apple Silicon (arm64)
- **Linux**: AppImage, DEB, and RPM packages (x64)
- **File Associations**: Automatic association with .md and .markdown files

#### Technical
- Electron 39.2.4
- CodeMirror 6.0.2
- markdown-it 14.1.0
- Mermaid 11.12.1
- KaTeX 0.16.25
- highlight.js 11.11.1
- electron-store 11.0.2
- electron-updater 6.6.2
- Vitest 4.0.14 for testing
- Custom ESLint rules for code quality
- Comprehensive test suite with property-based testing
