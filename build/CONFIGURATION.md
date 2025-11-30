# electron-builder Configuration Summary

This document summarizes the electron-builder configuration for MD Editor Pro.

## Configuration Location
The build configuration is located in `package.json` under the `"build"` key.

## Build Targets

### Windows
- **NSIS Installer**: Full installer with options for installation directory, desktop shortcut, start menu shortcut
  - Architectures: x64, ia32
  - One-click: Disabled (allows user to choose installation directory)
  - Per-machine: Disabled (installs for current user)
- **Portable**: Standalone executable that doesn't require installation
  - Architecture: x64 only

### macOS
- **DMG**: Disk image installer with drag-to-Applications interface
  - Architectures: x64 (Intel), arm64 (Apple Silicon)
  - Hardened runtime enabled for security
  - Entitlements configured for JIT and code execution
- **ZIP**: Compressed archive for manual installation
  - Architectures: x64, arm64

### Linux
- **AppImage**: Universal Linux package that runs on most distributions
  - Architecture: x64
  - No installation required
- **DEB**: Debian/Ubuntu package
  - Architecture: x64
  - Integrates with system package manager
- **RPM**: Fedora/RHEL package
  - Architecture: x64
  - Integrates with system package manager

## File Associations
The application registers as a handler for:
- `.md` files (Markdown Document)
- `.markdown` files (Markdown Document)

When users double-click these files, they will open in MD Editor Pro.

## Auto-Updates
- **Provider**: GitHub Releases
- **Release Type**: release (stable releases only)
- **Update Check**: Automatic on app launch
- **Download**: Background download with user notification

To publish updates:
1. Create a new version: `npm version patch|minor|major`
2. Build: `npm run build`
3. Create GitHub release with version tag
4. Upload build artifacts from `dist/` to the release

## Security Features

### Electron Security
- Context isolation enabled
- Node integration disabled in renderer
- Sandbox enabled for all renderers
- Secure IPC via contextBridge

### macOS Security
- Hardened runtime enabled
- Entitlements configured for:
  - JIT compilation (required for V8)
  - Unsigned executable memory (required for Electron)
  - DYLD environment variables
  - Library validation disabled (for native modules)

### Code Signing
- Windows: Optional (recommended for production)
- macOS: Required for distribution outside App Store
- Linux: Not required

## Build Optimization

### Excluded Files
The build excludes unnecessary files to reduce package size:
- Test files (`*.test.js`)
- Documentation in node_modules
- TypeScript definition files
- Test directories in dependencies
- `.bin` directories

### Artifact Naming
All artifacts follow the pattern:
```
${productName}-${version}-${arch}.${ext}
```

Example: `MD Editor Pro-1.0.0-x64.exe`

## Directory Structure

```
build/
├── README.md                    # Icon creation instructions
├── CONFIGURATION.md            # This file
├── entitlements.mac.plist      # macOS entitlements
├── icon.ico                    # Windows icon (user-provided)
├── icon.icns                   # macOS icon (user-provided)
├── icon.png                    # Linux icon (user-provided)
└── icon-template.svg           # SVG template for creating icons
```

## Platform-Specific Notes

### Windows
- NSIS installer includes uninstaller
- Desktop and Start Menu shortcuts created by default
- User can choose installation directory
- Portable version requires no installation

### macOS
- Universal builds support both Intel and Apple Silicon
- DMG includes drag-to-Applications interface
- Gatekeeper assessment disabled for development
- Requires notarization for macOS 10.15+ (production)

### Linux
- Desktop file created with proper MIME types
- Categorized as "Office" and "TextEditor"
- AppImage is the most compatible format
- DEB and RPM integrate with system package managers

## Testing Builds

To test builds without creating installers:

```bash
# Build unpacked directory (fast)
npx electron-builder --dir

# Test the unpacked app
# Windows: dist/win-unpacked/MD Editor Pro.exe
# macOS: dist/mac/MD Editor Pro.app
# Linux: dist/linux-unpacked/md-editor-pro
```

## Troubleshooting

### Missing Icons
If icons are missing, electron-builder will use default Electron icons. Create proper icons using the instructions in `build/README.md`.

### Build Failures
- Check Node.js version (v18+ required)
- Ensure all dependencies are installed: `npm install`
- Check disk space (builds can be large)
- Review error messages for missing dependencies

### Platform-Specific Issues
- **macOS**: Requires Xcode Command Line Tools
- **Linux**: May require additional packages (see BUILDING.md)
- **Windows**: Ensure NSIS is accessible (installed via electron-builder)

## Next Steps

1. **Create Icons**: Follow instructions in `build/README.md`
2. **Test Build**: Run `npm run build` to test the configuration
3. **Setup CI/CD**: Configure GitHub Actions for automated builds
4. **Code Signing**: Setup certificates for production releases
5. **Publish**: Create GitHub releases for distribution

## References

- [electron-builder Documentation](https://www.electron.build/)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Code Signing](https://www.electron.build/code-signing)
- [Auto Updates](https://www.electron.build/auto-update)
