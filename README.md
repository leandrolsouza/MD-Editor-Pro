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

```bash
# Build for all platforms
npm run build

# Build for specific platform
npm run build:win
npm run build:mac
npm run build:linux
```

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
