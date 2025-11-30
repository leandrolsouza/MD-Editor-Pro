# Build Resources

This directory contains resources needed for building the application with electron-builder.

## Required Icon Files

To build the application for all platforms, you need to provide the following icon files:

### Windows
- **icon.ico** - Windows icon file (256x256 pixels recommended)
  - Should contain multiple sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

### macOS
- **icon.icns** - macOS icon file
  - Should contain multiple sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
  - Can be generated from a 1024x1024 PNG using tools like `iconutil` or online converters

### Linux
- **icon.png** - Linux icon file (512x512 pixels recommended)
  - PNG format with transparency support

## Creating Icons

You can create these icons from a single high-resolution source image (1024x1024 PNG):

### Using electron-icon-builder (recommended)
```bash
npm install -g electron-icon-builder
electron-icon-builder --input=./source-icon.png --output=./build
```

### Using online tools
- https://cloudconvert.com/png-to-ico (for .ico)
- https://cloudconvert.com/png-to-icns (for .icns)

### Manual creation
- **Windows**: Use tools like GIMP or IcoFX
- **macOS**: Use `iconutil` command-line tool
- **Linux**: Simply use a 512x512 PNG file

## Entitlements

The `entitlements.mac.plist` file is required for macOS builds and contains security entitlements needed for the application to run properly on macOS with hardened runtime enabled.

## Note

If icon files are missing, electron-builder will use default Electron icons, but it's recommended to provide custom icons for a professional appearance.
