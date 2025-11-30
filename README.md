# MD Editor Pro

A cross-platform markdown editor built with Electron, supporting CommonMark and GitHub Flavored Markdown (GFM).

## Features

- Real-time markdown editing and preview
- CommonMark and GFM support (tables, strikethrough, task lists)
- Syntax highlighting for code blocks
- Export to HTML and PDF
- Light and dark themes
- Cross-platform (Windows, Linux, macOS)
- Find and replace functionality

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
npm install
```

### Running in Development

```bash
npm start
```

### Running Tests

```bash
npm test
```

### Building

Before building, ensure you have icon files in the `build/` directory:
- `icon.ico` for Windows
- `icon.icns` for macOS  
- `icon.png` for Linux

See `build/README.md` for instructions on creating icons.

```bash
# Build for all platforms
npm run build

# Build for specific platform
npm run build:win    # Windows (NSIS installer + portable)
npm run build:mac    # macOS (DMG + ZIP for x64 and ARM64)
npm run build:linux  # Linux (AppImage, DEB, RPM)
```

Build outputs will be in the `dist/` directory.

#### Build Targets

- **Windows**: NSIS installer (x64, ia32) and portable executable (x64)
- **macOS**: DMG and ZIP archives (x64 and ARM64/Apple Silicon)
- **Linux**: AppImage, DEB, and RPM packages (x64)

#### Auto-Updates

The application is configured for auto-updates via GitHub releases. To enable:
1. Set up a GitHub repository
2. Configure GitHub token in environment
3. Publish releases using `npm run build` with proper version tags

## Project Structure

```
markdown-editor/
├── src/
│   ├── main/          # Main process (Electron)
│   ├── renderer/      # Renderer process (UI)
│   └── preload/       # Preload scripts (IPC bridge)
├── package.json
└── README.md
```

## License

ISC
