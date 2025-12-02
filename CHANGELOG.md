# Changelog

All notable changes to this project will be documented in this file.

## [1.0.6] - 2025-12-01

### Added
- **Auto-Update System**: Implemented automatic update checking and installation
  - Checks for updates on GitHub Releases automatically on app start
  - Visual notifications for available updates
  - Download progress indicator
  - One-click install and restart
  - Support for delta updates on Windows
  - Background download without interrupting work

### Technical
- Added `electron-updater` dependency (v6.6.2)
- Created `AutoUpdater` manager in main process
- Added update notification UI component in renderer
- Implemented IPC handlers for update operations
- Added comprehensive documentation in `AUTO_UPDATE.md`
- Configured GitHub repository URL for auto-update

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

### Added
- Initial release
- Real-time markdown editing and preview
- CommonMark and GFM support
- Mermaid diagrams support
- Mathematical formulas with KaTeX
- Callout blocks
- Export to HTML and PDF
- Light and dark themes
- Multi-tab document management
- Find and replace functionality
- Focus mode
- Template system
- Snippet manager
- Auto-save functionality
- Document statistics
- Customizable keyboard shortcuts
