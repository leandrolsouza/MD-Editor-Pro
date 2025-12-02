# Changelog

All notable changes to MD Editor Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.7] - 2025-12-01

### Changed
- **Documentation**: Comprehensive README update for official publication
  - Added professional header with badges (version, license, platform)
  - Expanded features section with detailed categorization
  - Added complete installation instructions for all platforms
  - Added usage guide with quick start and keyboard shortcuts table
  - Improved project structure documentation
  - Added contributing guidelines and issue reporting template
  - Added acknowledgments and author information
  - Enhanced visual formatting with better organization

### Improved
- README now follows best practices for open-source projects
- Better presentation for GitHub repository
- More accessible information for new users
- Clearer development and building instructions

---

## [1.0.6] - 2025-12-01

### Added
- **Auto-Update System**: Automatic update checking and installation
  - Checks for updates on GitHub Releases on app start
  - Visual notifications for available updates with version details
  - Download progress indicator with percentage and speed
  - One-click install and restart functionality
  - Support for delta updates on Windows (smaller downloads)
  - Background download without interrupting work
  - Manual check for updates via Help menu

### Technical
- Added `electron-updater` dependency (v6.6.2)
- Created `AutoUpdater` manager class in main process
- Added update notification UI component in renderer
- Implemented IPC handlers for update operations (`check-for-updates`, `download-update`, `install-update`)
- Configured GitHub repository URL for auto-update in package.json
- Added update event listeners and error handling

## [1.0.5] - 2025-12-01

### Added
- **Auto-Update System**: Implemented automatic update checking and installation
  - Checks for updates on GitHub Releases automatically on app start
  - Visual notifications for available updates
  - Download progress indicator
  - One-click install and restart
  - Support for delta updates on Windows
  - Background download without interrupting work

### Fixed
- Fixed application not closing when clicking X or using Exit menu
- Replaced problematic `beforeunload` event with proper Electron close handler
- Added native dialog for unsaved changes confirmation on window close

### Technical
- Added `electron-updater` dependency
- Created `AutoUpdater` manager in main process
- Added update notification UI component in renderer
- Implemented IPC handlers for update operations
- Added comprehensive documentation in `AUTO_UPDATE.md`

## [1.0.4] - 2025-12-01

### Fixed
- Added author email to package.json for Linux DEB/RPM package builds
- Fixed icon files not being included in CI builds
- Resolved GitHub Actions release asset conflicts

### Changed
- Updated .gitignore to include icon files in repository

## [1.0.3] - 2025-12-01

### Fixed
- Improved release workflow with fail-fast disabled
- Fixed GitHub Actions build cancellation issues
- Removed deprecated create-release action
- Simplified workflow to use electron-builder's built-in release creation

### Changed
- Streamlined release process for better reliability

## [1.0.2] - 2025-12-01

### Fixed
- Log corrections

### Changed
- Minor changes

## [1.0.1] - 2025-12-01

### Added
- Auto-update configuration via GitHub releases
- Environment variable support for GitHub token

### Changed
- Updated build configuration for automated releases

### Fixed
- Initial release fixes

## [1.0.0] - 2025-12-01

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
- Vitest 4.0.14 for testing
- Custom ESLint rules for code quality
- Comprehensive test suite with property-based testing
