# Quick Start: Building MD Editor Pro

## Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] npm dependencies installed (`npm install`)
- [ ] Icon files created (see below)

## Create Icons (Required)

You need three icon files in the `build/` directory:

1. **icon.ico** (Windows) - 256x256 pixels, ICO format
2. **icon.icns** (macOS) - 1024x1024 pixels, ICNS format  
3. **icon.png** (Linux) - 512x512 pixels, PNG format

### Quick Icon Creation

Use an online converter or tool:
- Start with a 1024x1024 PNG image
- Convert to ICO: https://cloudconvert.com/png-to-ico
- Convert to ICNS: https://cloudconvert.com/png-to-icns
- Resize to 512x512 for PNG: Use any image editor

Or use the provided SVG template (`icon-template.svg`) as a starting point.

## Build Commands

```bash
# Build for your current platform
npm run build

# Build for specific platforms
npm run build:win      # Windows
npm run build:mac      # macOS
npm run build:linux    # Linux
```

## Output Location

All builds are saved to the `dist/` directory:

- **Windows**: `MD Editor Pro-{version}-{arch}.exe`
- **macOS**: `MD Editor Pro-{version}-{arch}.dmg`
- **Linux**: `MD Editor Pro-{version}-{arch}.AppImage` (and .deb, .rpm)

## Quick Test Build

To test without creating full installers (much faster):

```bash
npx electron-builder --dir
```

This creates an unpacked directory in `dist/` that you can run directly.

## Common Issues

### "Icon file not found"
→ Create the icon files in `build/` directory (see above)

### "Cannot build for macOS on Windows/Linux"  
→ macOS builds require a Mac. Use GitHub Actions or a Mac for macOS builds.

### Build is slow
→ Use `--dir` flag for faster testing builds
→ Build for specific architecture: `--x64` or `--arm64`

## What Was Configured

✅ **Windows**: NSIS installer + portable executable (x64, ia32)  
✅ **macOS**: DMG + ZIP for Intel and Apple Silicon (x64, arm64)  
✅ **Linux**: AppImage, DEB, and RPM packages (x64)  
✅ **File associations**: .md and .markdown files  
✅ **Auto-updates**: Via GitHub releases  
✅ **Security**: Sandbox, context isolation, hardened runtime  

## Next Steps

1. Create icon files (required)
2. Run `npm run build` to test
3. Check `dist/` directory for output
4. Install and test the built application
5. Setup GitHub releases for distribution

## Need More Help?

- Detailed instructions: See `BUILDING.md`
- Configuration details: See `CONFIGURATION.md`
- Icon creation: See `README.md`
