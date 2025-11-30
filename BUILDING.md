# Building MD Editor Pro

This document provides detailed instructions for building MD Editor Pro for distribution across Windows, Linux, and macOS platforms.

## Prerequisites

### All Platforms
- Node.js v18 or higher
- npm v9 or higher
- Git

### Platform-Specific Requirements

#### Windows
- Windows 7 or higher (for building)
- No additional requirements for building Windows targets

#### macOS
- macOS 10.13 or higher
- Xcode Command Line Tools (for building macOS targets)
- Apple Developer account (for code signing, optional)

#### Linux
- Ubuntu 18.04 or higher (or equivalent)
- Required packages: `icnsutils`, `graphicsmagick`, `rpm` (for RPM builds)

```bash
# Ubuntu/Debian
sudo apt-get install icnsutils graphicsmagick rpm

# Fedora/RHEL
sudo dnf install libicns-utils GraphicsMagick rpm-build
```

## Icon Files

Before building, you must provide icon files in the `build/` directory:

- **icon.ico** - Windows icon (256x256, multiple sizes)
- **icon.icns** - macOS icon (1024x1024, multiple sizes)
- **icon.png** - Linux icon (512x512)

See `build/README.md` for detailed instructions on creating these icons.

## Build Commands

### Build for Current Platform

```bash
npm run build
```

This will build for your current operating system.

### Build for Specific Platforms

```bash
# Windows (NSIS installer + portable)
npm run build:win

# macOS (DMG + ZIP for Intel and Apple Silicon)
npm run build:mac

# Linux (AppImage, DEB, RPM)
npm run build:linux
```

### Cross-Platform Building

electron-builder supports cross-platform builds with some limitations:

- **From macOS**: Can build for macOS, Windows, and Linux
- **From Linux**: Can build for Linux and Windows (macOS requires macOS)
- **From Windows**: Can build for Windows and Linux (macOS requires macOS)

## Build Outputs

All build artifacts are placed in the `dist/` directory:

### Windows
- `MD Editor Pro-{version}-x64.exe` - NSIS installer (64-bit)
- `MD Editor Pro-{version}-ia32.exe` - NSIS installer (32-bit)
- `MD Editor Pro-{version}-x64.exe` - Portable executable

### macOS
- `MD Editor Pro-{version}-x64.dmg` - DMG installer (Intel)
- `MD Editor Pro-{version}-arm64.dmg` - DMG installer (Apple Silicon)
- `MD Editor Pro-{version}-x64.zip` - ZIP archive (Intel)
- `MD Editor Pro-{version}-arm64.zip` - ZIP archive (Apple Silicon)

### Linux
- `MD Editor Pro-{version}-x64.AppImage` - AppImage (universal)
- `md-editor-pro_{version}_amd64.deb` - Debian package
- `md-editor-pro-{version}.x86_64.rpm` - RPM package

## Configuration Details

### Application ID
- **App ID**: `com.mdeditorpro.app`
- **Product Name**: MD Editor Pro

### File Associations
The application registers as the default handler for:
- `.md` files
- `.markdown` files

### Auto-Updates
Auto-updates are configured via GitHub releases:

1. **Setup GitHub Repository**
   - Create a GitHub repository for the project
   - Enable GitHub Releases

2. **Configure GitHub Token**
   ```bash
   export GH_TOKEN="your-github-token"
   ```

3. **Publish Release**
   ```bash
   npm version patch  # or minor, major
   npm run build
   # Upload artifacts from dist/ to GitHub Release
   ```

### Code Signing

#### Windows
Code signing is optional but recommended for production releases:

```bash
export CSC_LINK="path/to/certificate.pfx"
export CSC_KEY_PASSWORD="certificate-password"
npm run build:win
```

#### macOS
Code signing requires an Apple Developer account:

```bash
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"
npm run build:mac
```

For notarization (required for macOS 10.15+):
```bash
export APPLE_TEAM_ID="your-team-id"
```

#### Linux
No code signing required for Linux builds.

## Build Optimization

### Reducing Build Size

The configuration already excludes:
- Test files (`*.test.js`)
- Documentation files in node_modules
- TypeScript definition files
- Unnecessary node_modules subdirectories

### Build Performance

To speed up builds:
1. Use `--dir` flag for directory output (faster, no compression)
2. Build for specific architectures only
3. Use local caching

```bash
# Fast build for testing (directory output)
electron-builder --dir

# Build for specific architecture
electron-builder --win --x64
```

## Troubleshooting

### "Icon file not found"
Ensure icon files exist in `build/` directory with correct names and formats.

### "Cannot build for macOS on Windows/Linux"
macOS builds require macOS. Use a macOS machine or CI service like GitHub Actions.

### "NSIS error"
Ensure you have write permissions to the output directory and sufficient disk space.

### "Code signing failed"
Verify certificate paths and passwords are correct. For testing, you can disable code signing:
```json
"win": {
  "signingHashAlgorithms": ["sha256"],
  "sign": null
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      - run: npm test
      - run: npm run build
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: dist/*
```

## Additional Resources

- [electron-builder Documentation](https://www.electron.build/)
- [Electron Security Guidelines](https://www.electronjs.org/docs/latest/tutorial/security)
- [Code Signing Guide](https://www.electron.build/code-signing)
