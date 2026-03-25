# Changelog

All notable changes to MD Editor Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
