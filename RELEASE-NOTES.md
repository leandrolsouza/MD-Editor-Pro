# Release Notes

What's new in MD Editor Pro — written for you, the user.

---

## [1.10.0] - 2026-04-30

### 🏗️ Under the Hood

- Structured logging system: all errors and warnings are now written to dated log files in your user data folder, making it much easier to diagnose issues
- Log files rotate automatically (max 5 MB each, up to 7 files kept)
- Error boundary in both the main and renderer processes: unexpected crashes now show a clear dialog and offer to reload instead of silently failing
- Runtime health metrics collected every 30 seconds (memory usage, active windows) for better stability monitoring
- IPC errors now carry structured error codes so the app can give more specific feedback when something goes wrong (e.g., file not found vs. permission denied)
- "What's New" dialog now reads from the user-facing release notes instead of the developer changelog

---

## [1.9.0] - 2026-04-30

### 🏗️ Under the Hood

- Major internal reorganization for better performance and stability
- Improved error handling across the entire application
- Faster startup and smoother interactions thanks to architectural improvements

---

## [1.8.0] - 2026-04-29

### ✨ New Features

#### Command Palette
- Quickly find and run any command with `Ctrl+Shift+P`
- Search by name, browse by category, and see keyboard shortcuts at a glance

#### Visual Table Editor
- Edit markdown tables visually with `Ctrl+Shift+M`
- Add or remove rows and columns, change alignment, and navigate with Tab/Arrow keys

#### Backlinks Panel
- See which documents link to the one you're editing
- Click any backlink to jump straight to the source document

#### Internal Link Navigation
- Click links to other `.md` files in the preview to open them in a new tab
- External links open in your browser as expected

### 🔧 Improvements

- Better window security to prevent accidental navigation away from the editor
- New keyboard shortcuts for Command Palette, Table Editor, and Find in Files

---

## [1.7.1] - 2026-04-28

### 🐛 Bug Fixes

- Fixed a bug where closing the window could skip the unsaved changes prompt
- Unsaved changes are now checked across all open tabs, not just the active one

### ✨ New Features

- Empty state in the file tree when no folder is open, with a quick "Open Folder" button
- Action buttons in sidebar panel headers for faster access
- Theme selection added to the Settings panel
- Toolbar buttons now scroll horizontally instead of shrinking when space is tight

---

## [1.7.0] - 2026-04-14

### ✨ New Features

#### What's New Dialog
- See release highlights every time the app updates
- Browse notes from any previous version using the version dropdown
- Access anytime from the Help menu

#### Refreshed Interface
- Completely modernized look and feel across the entire application
- 7 polished themes: Light, Dark, Solarized Light/Dark, Dracula, Monokai, and Nord
- Smoother animations, better hover effects, and a more consistent design
- Respects your system's "reduce motion" accessibility setting

---

## [1.6.0] - 2026-04-14

### ✨ New Features

#### Document Connection Map
- Visualize how your documents link to each other with an interactive graph
- See orphan files (no links) and missing link targets at a glance
- Click any node to open the document
- Zoom and pan to explore large workspaces

---

## [1.5.0] - 2026-03-31

### ✨ New Features

#### Issue Reporter
- Report bugs or request features directly from the Help menu
- System info is collected automatically to help with troubleshooting

#### Status Bar
- New status bar showing cursor position, selection info, indentation, and encoding
- Updates in real time as you type and navigate

#### Quick Actions Toolbar
- One-click buttons for New File, Open, Save, and Export
- View mode toggles and Focus Mode button right in the toolbar

#### Manual Update Check
- Check for updates anytime from the Help menu

### 🔧 Improvements

- Menu bar is now auto-hidden by default (press Alt to show)
- Improved sidebar button sizing and icon styling

---

## [1.4.1] - 2026-03-31

### 🔧 Improvements

- Better-looking tables in preview and exports with rounded borders and alternating row colors
- Wide tables now scroll horizontally instead of overflowing
- Tables no longer break across pages in PDF exports

### 🐛 Bug Fixes

- Fixed tables with blank lines between rows not rendering correctly

---

## [1.4.0] - 2026-03-25

### ✨ New Features

#### AI Settings Redesign
- New card-based layout for configuring AI providers
- Status indicators showing which providers are ready
- Test button to validate your API keys before use

---

## [1.3.6] - 2026-03-25

### 🐛 Bug Fixes

- Fixed an issue that could cause update downloads to fail

---

## [1.3.5] - 2026-03-25

### 🐛 Bug Fixes

- Fixed update downloads failing on some systems

---

## [1.3.4] - 2026-03-25

### 🐛 Bug Fixes

- Fixed build and release pipeline issues

---

## [1.3.3] - 2026-03-25

### 🐛 Bug Fixes

- Fixed slow or failing release uploads

---

## [1.3.2] - 2026-03-25

### 🐛 Bug Fixes

- Clearer error messages when an update isn't available yet or the network is down
- Update error notifications now stay visible longer so you can read them

---

## [1.3.0] - 2026-03-24

### ✨ New Features

#### Templates Panel
- Browse, filter, and insert templates from the sidebar
- Create and delete custom templates without leaving the editor

#### Snippets Panel
- Browse, preview, and insert snippets from the sidebar
- Create, edit, and delete custom snippets with ease

#### New Icon System
- Fresh, professional SVG icons throughout the application replacing the old emoji icons

---

## [1.2.0] - 2026-03-24

### ✨ New Features

#### Multi-Language Support
- Full English and Portuguese (Brazil) translations
- Automatic system language detection
- Switch languages anytime in Settings

#### AI Assistant
- Built-in AI chat for writing help (supports OpenAI, Anthropic, Ollama, LM Studio)
- AI autocomplete as you type
- Right-click AI actions: rewrite, fix grammar, summarize, expand, translate, and more

#### Context Menu
- Rich right-click menu with formatting, insert, and AI options

#### Settings Panel
- Centralized settings for language, auto-save, shortcuts, AI, and more

#### Resizable Panels
- Drag to resize the sidebar and chat panels to your liking

---

## [1.1.0] - 2025-12-02

### ✨ New Features

#### Smart HTML Paste
- Paste content from websites and it's automatically converted to clean Markdown
- Preserves formatting, links, images, tables, and code blocks
- Strips scripts and styles for safety

---

## [1.0.0] - 2025-12-02

### 🎉 First Release

Welcome to MD Editor Pro! Here's what you get out of the box:

- **Modern Editor** — Fast markdown editing powered by CodeMirror 6 with syntax highlighting, multiple cursors, and typewriter scrolling
- **Live Preview** — See your formatted document update in real time as you type
- **Multi-Tab Editing** — Work on multiple documents at once with session persistence
- **Markdown Power** — Full CommonMark and GitHub Flavored Markdown support, plus Mermaid diagrams, LaTeX math formulas, and callout blocks
- **Find Anything** — Search within a file or across your entire workspace
- **Document Outline** — Navigate your document structure with a collapsible header tree
- **File Explorer** — Browse and manage your markdown files in a sidebar tree
- **Templates & Snippets** — Jumpstart your writing with built-in templates and reusable text blocks
- **Image Paste** — Paste images from your clipboard directly into your document
- **7 Themes** — Light, Dark, Solarized, Dracula, Monokai, and Nord
- **Focus Mode** — Distraction-free writing at the press of F11
- **Export** — Save your work as HTML or PDF with all formatting preserved
- **Custom Shortcuts** — Remap any keyboard shortcut to your preference
- **Auto-Save** — Never lose your work with configurable automatic saving
- **Auto-Update** — Get notified when a new version is available and update with one click
- **Cross-Platform** — Available on Windows, macOS, and Linux
