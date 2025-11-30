# Design Document - Editor de Markdown Electron

## Overview

Este documento descreve o design técnico de um editor de markdown multiplataforma construído com Electron. O aplicativo seguirá a arquitetura multi-processo do Electron, com um processo principal (main) gerenciando o ciclo de vida da aplicação e processos de renderização (renderer) exibindo a interface do usuário. A comunicação entre processos será feita via IPC (Inter-Process Communication).

O editor implementará suporte completo à especificação CommonMark e extensões GFM (GitHub Flavored Markdown), incluindo tabelas, strikethrough e task lists. Utilizaremos markdown-it como parser principal devido à sua conformidade com CommonMark, extensibilidade via plugins e alto desempenho.

## Architecture

### Multi-Process Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Main Process                         │
│  - Gerenciamento de janelas                            │
│  - Menu da aplicação                                    │
│  - Operações de arquivo (abrir/salvar)                 │
│  - Exportação (HTML/PDF)                                │
│  - Persistência de configurações                        │
└────────────┬────────────────────────────┬───────────────┘
             │         IPC                │
             │    (invoke/handle)         │
┌────────────▼────────────────┐  ┌───────▼────────────────┐
│   Renderer Process          │  │   Preload Script       │
│  - Editor de texto          │  │  - Context Bridge      │
│  - Preview markdown         │  │  - API segura          │
│  - UI/UX                    │  │                        │
│  - Busca/Substituição       │  │                        │
└─────────────────────────────┘  └────────────────────────┘
```

### Technology Stack

- **Electron** (latest stable version): Framework principal para aplicação desktop
- **markdown-it**: Parser markdown (CommonMark + plugins GFM)
- **CodeMirror 6**: Editor de código com suporte a markdown
- **highlight.js**: Syntax highlighting para blocos de código
- **electron-store**: Persistência de configurações do usuário
- **HTML/CSS/JavaScript**: Interface do usuário
- **Vitest**: Framework de testes unitários
- **fast-check**: Biblioteca de property-based testing

### Directory Structure

```
markdown-editor/
├── src/
│   ├── main/
│   │   ├── index.js              # Entry point do main process
│   │   ├── window.js             # Gerenciamento de janelas
│   │   ├── menu.js               # Menu da aplicação
│   │   ├── file-manager.js       # Operações de arquivo
│   │   ├── exporter.js           # Exportação HTML/PDF
│   │   └── config-store.js       # Persistência de configurações
│   ├── renderer/
│   │   ├── index.html            # HTML principal
│   │   ├── index.js              # Entry point do renderer
│   │   ├── editor.js             # Lógica do editor
│   │   ├── preview.js            # Renderização do preview
│   │   ├── search.js             # Busca e substituição
│   │   ├── theme.js              # Gerenciamento de temas
│   │   └── styles/
│   │       ├── main.css
│   │       ├── editor.css
│   │       ├── preview.css
│   │       ├── theme-light.css
│   │       └── theme-dark.css
│   └── preload/
│       └── index.js              # Preload script com contextBridge
├── package.json
└── README.md
```

## Components and Interfaces

### 1. Main Process Components

#### WindowManager
Responsável por criar e gerenciar a janela principal da aplicação.

```javascript
class WindowManager {
  createMainWindow(): BrowserWindow
  getMainWindow(): BrowserWindow | null
  closeWindow(): void
}
```

#### FileManager
Gerencia operações de leitura e escrita de arquivos markdown.

```javascript
class FileManager {
  openFile(): Promise<{filePath: string, content: string}>
  saveFile(filePath: string, content: string): Promise<void>
  saveFileAs(content: string): Promise<string>
  showUnsavedChangesDialog(): Promise<number>
}
```

#### Exporter
Exporta documentos markdown para HTML e PDF.

```javascript
class Exporter {
  exportToHTML(content: string, filePath: string): Promise<void>
  exportToPDF(htmlContent: string, filePath: string): Promise<void>
}
```

#### ConfigStore
Persiste configurações do usuário usando electron-store.

```javascript
class ConfigStore {
  get(key: string): any
  set(key: string, value: any): void
  getTheme(): 'light' | 'dark'
  setTheme(theme: 'light' | 'dark'): void
  getViewMode(): 'editor' | 'preview' | 'split'
  setViewMode(mode: string): void
}
```

### 2. Renderer Process Components

#### Editor
Gerencia o editor de texto usando CodeMirror 6.

```javascript
class Editor {
  initialize(element: HTMLElement): void
  getValue(): string
  setValue(content: string): void
  insertText(text: string): void
  applyFormatting(format: 'bold' | 'italic' | 'code'): void
  undo(): void
  redo(): void
  onContentChange(callback: (content: string) => void): void
  getScrollPosition(): number
  setScrollPosition(position: number): void
}
```

#### Preview
Renderiza o markdown em HTML usando markdown-it.

```javascript
class Preview {
  initialize(element: HTMLElement): void
  render(markdown: string): void
  getScrollPosition(): number
  setScrollPosition(position: number): void
  syncScroll(editorScrollPercent: number): void
}
```

#### SearchManager
Implementa busca e substituição de texto.

```javascript
class SearchManager {
  show(): void
  hide(): void
  search(query: string): SearchResult[]
  navigateNext(): void
  navigatePrevious(): void
  replace(replacement: string): void
  replaceAll(replacement: string): void
}

interface SearchResult {
  line: number
  column: number
  text: string
}
```

#### ThemeManager
Gerencia temas claro e escuro.

```javascript
class ThemeManager {
  initialize(): void
  setTheme(theme: 'light' | 'dark'): void
  getCurrentTheme(): 'light' | 'dark'
  toggleTheme(): void
}
```

### 3. IPC Communication

#### IPC Channels (Following Best Practices)

**Preload Script (src/preload/index.js):**

```javascript
const { contextBridge, ipcRenderer } = require('electron')

// Expose secure API via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations - using invoke for async request-response
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (filePath, content) => ipcRenderer.invoke('file:save', filePath, content),
  saveFileAs: (content) => ipcRenderer.invoke('file:save-as', content),
  
  // Export operations
  exportHTML: (content) => ipcRenderer.invoke('export:html', content),
  exportPDF: (content) => ipcRenderer.invoke('export:pdf', content),
  
  // Config operations
  getConfig: (key) => ipcRenderer.invoke('config:get', key),
  setConfig: (key, value) => ipcRenderer.invoke('config:set', key, value),
  
  // Event listeners - wrapped to prevent direct ipcRenderer exposure
  onFileDropped: (callback) => {
    const subscription = (event, filePath) => callback(filePath)
    ipcRenderer.on('file:dropped', subscription)
    // Return cleanup function
    return () => ipcRenderer.removeListener('file:dropped', subscription)
  },
  
  onMenuAction: (callback) => {
    const subscription = (event, action) => callback(action)
    ipcRenderer.on('menu:action', subscription)
    return () => ipcRenderer.removeListener('menu:action', subscription)
  }
})
```

**Main Process IPC Handlers (src/main/index.js):**

```javascript
const { ipcMain } = require('electron')

// Register IPC handlers
function registerIPCHandlers(fileManager, exporter, configStore) {
  // File operations
  ipcMain.handle('file:open', async () => {
    return await fileManager.openFile()
  })
  
  ipcMain.handle('file:save', async (event, filePath, content) => {
    return await fileManager.saveFile(filePath, content)
  })
  
  ipcMain.handle('file:save-as', async (event, content) => {
    return await fileManager.saveFileAs(content)
  })
  
  // Export operations
  ipcMain.handle('export:html', async (event, content) => {
    return await exporter.exportToHTML(content)
  })
  
  ipcMain.handle('export:pdf', async (event, content) => {
    return await exporter.exportToPDF(content)
  })
  
  // Config operations
  ipcMain.handle('config:get', async (event, key) => {
    return configStore.get(key)
  })
  
  ipcMain.handle('config:set', async (event, key, value) => {
    configStore.set(key, value)
  })
}
```

**Renderer Process Usage (src/renderer/index.js):**

```javascript
// Access exposed API via window.electronAPI
async function openFile() {
  try {
    const { filePath, content } = await window.electronAPI.openFile()
    editor.setValue(content)
    currentFilePath = filePath
  } catch (error) {
    console.error('Failed to open file:', error)
  }
}

// Setup event listeners with cleanup
let removeFileDroppedListener = null

function setupEventListeners() {
  removeFileDroppedListener = window.electronAPI.onFileDropped((filePath) => {
    loadFile(filePath)
  })
}

function cleanup() {
  if (removeFileDroppedListener) {
    removeFileDroppedListener()
  }
}
```

## Data Models

### Document State

```javascript
interface DocumentState {
  filePath: string | null      // Caminho do arquivo atual
  content: string              // Conteúdo markdown
  isDirty: boolean             // Indica se há alterações não salvas
  lastSaved: Date | null       // Timestamp do último salvamento
}
```

### Editor Configuration

```javascript
interface EditorConfig {
  theme: 'light' | 'dark'
  viewMode: 'editor' | 'preview' | 'split'
  fontSize: number
  lineNumbers: boolean
  lineWrapping: boolean
}
```

### Export Options

```javascript
interface ExportOptions {
  format: 'html' | 'pdf'
  includeCSS: boolean
  cssTheme: 'github' | 'default'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

Após revisar todas as propriedades identificadas no prework, identifiquei as seguintes redundâncias:

- **Propriedades 6.3 e 6.4** são redundantes: ambas testam persistência de configurações de tema entre sessões. Vou consolidar em uma única propriedade de round-trip.
- **Propriedades 2.2 e 2.3** podem ser combinadas: ambas testam renderização de markdown, apenas com diferentes conjuntos de sintaxe. Vou criar uma propriedade mais abrangente.

### Property 1: Paste inserts at cursor position
*For any* text content and cursor position in the editor, pasting text should insert the content exactly at the cursor position without affecting text before or after.
**Validates: Requirements 1.2**

### Property 2: Formatting shortcuts apply correct markdown syntax
*For any* selected text in the editor, applying bold (Ctrl+B) should wrap the text with `**`, and applying italic (Ctrl+I) should wrap the text with `*`.
**Validates: Requirements 1.3**

### Property 3: Undo reverts last modification
*For any* document state and modification, applying undo should restore the document to its previous state before the modification.
**Validates: Requirements 1.4**

### Property 4: Undo-redo round trip preserves state
*For any* document modification, the sequence modify → undo → redo should result in the same state as just modify.
**Validates: Requirements 1.5**

### Property 5: Markdown rendering completeness
*For any* valid CommonMark or GFM markdown document, the rendered HTML should contain all elements specified in the markdown (headings, lists, links, images, code blocks, tables, strikethrough, task lists).
**Validates: Requirements 2.2, 2.3**

### Property 6: Code blocks have syntax highlighting
*For any* code block with a specified language, the rendered HTML should include syntax highlighting classes for that language.
**Validates: Requirements 2.4**

### Property 7: Scroll synchronization
*For any* scroll position in the editor (expressed as percentage), the preview scroll position should be synchronized to approximately the same percentage.
**Validates: Requirements 2.5**

### Property 8: File save-load round trip
*For any* markdown content, the sequence save → close → open should result in the same content being loaded back into the editor.
**Validates: Requirements 3.2**

### Property 9: Unsaved changes trigger warning
*For any* document with unsaved modifications, attempting to close the document should trigger a warning dialog.
**Validates: Requirements 3.4**

### Property 10: Keyboard shortcuts adapt to platform
*For any* platform (Windows/Linux/macOS), keyboard shortcuts should use the platform's convention (Ctrl on Windows/Linux, Cmd on macOS).
**Validates: Requirements 4.4**

### Property 11: File paths are cross-platform compatible
*For any* file path string, the path normalization function should produce a valid path format for the current operating system.
**Validates: Requirements 4.5**

### Property 12: HTML export preserves content
*For any* markdown document, exporting to HTML should produce valid HTML that contains all the content from the original markdown.
**Validates: Requirements 5.1, 5.3**

### Property 13: PDF export produces valid PDF
*For any* markdown document, exporting to PDF should produce a valid PDF file that can be opened by standard PDF readers.
**Validates: Requirements 5.2, 5.3**

### Property 14: Theme application affects all components
*For any* theme selection (light/dark), applying the theme should update CSS classes on both the editor and preview components.
**Validates: Requirements 6.1**

### Property 15: View mode controls visibility
*For any* view mode selection (editor/preview/split), the correct components should be visible and others hidden according to the mode.
**Validates: Requirements 6.2**

### Property 16: Theme persistence round trip
*For any* theme preference, the sequence set theme → close app → reopen app should result in the same theme being applied.
**Validates: Requirements 6.3, 6.4**

### Property 17: Search navigation visits all occurrences
*For any* document and search term with N occurrences, navigating through results should visit all N occurrences in sequential order.
**Validates: Requirements 7.3**

### Property 18: Replace current occurrence
*For any* document, search term, and replacement text, the replace operation should change only the current occurrence to the replacement text.
**Validates: Requirements 7.4**

### Property 19: Replace all occurrences
*For any* document with N occurrences of a search term, replace all should change all N occurrences to the replacement text.
**Validates: Requirements 7.5**

## Error Handling

### File Operations Errors

1. **File Not Found**: When attempting to open a non-existent file, display error dialog with clear message
2. **Permission Denied**: When lacking read/write permissions, show appropriate error and suggest solutions
3. **Invalid File Format**: When opening non-text files, warn user and prevent loading
4. **Disk Full**: When saving fails due to disk space, notify user and preserve unsaved content in memory

### Export Errors

1. **Export Path Invalid**: Validate export path before attempting export
2. **PDF Generation Failure**: Catch PDF generation errors and display user-friendly message
3. **HTML Generation Failure**: Handle markdown parsing errors gracefully

### Configuration Errors

1. **Corrupted Config**: If electron-store data is corrupted, reset to defaults and notify user
2. **Invalid Theme**: If theme files are missing, fall back to default theme

### IPC Communication Errors

1. **Channel Not Found**: Log error and show generic error message to user
2. **Timeout**: Implement timeouts for IPC calls and handle gracefully
3. **Invalid Data**: Validate all data passed through IPC channels

## Testing Strategy

### Unit Testing

Utilizaremos **Vitest** como framework de testes unitários devido à sua velocidade e compatibilidade com Electron.

**Unit tests will cover:**

- FileManager: Test file read/write operations with mock filesystem
- Exporter: Test HTML/PDF generation with sample markdown
- ConfigStore: Test get/set operations with mock electron-store
- Editor: Test text manipulation functions
- Preview: Test markdown rendering with known inputs
- SearchManager: Test search algorithm with sample documents

**Example unit tests:**

```javascript
// Test specific example: opening a file
test('FileManager opens existing file', async () => {
  const content = await fileManager.openFile('test.md')
  expect(content).toBeDefined()
})

// Test edge case: empty document
test('Preview renders empty document', () => {
  const html = preview.render('')
  expect(html).toBe('')
})
```

### Property-Based Testing

Utilizaremos **fast-check** como biblioteca de property-based testing para JavaScript/TypeScript.

**Configuration:**
- Each property test will run a minimum of 100 iterations
- Each test will be tagged with a comment referencing the design document property
- Format: `// Feature: markdown-editor, Property N: <property text>`

**Property tests will cover:**

- Text editing operations (paste, format, undo/redo)
- Markdown rendering completeness
- File operations round-trips
- Configuration persistence
- Search and replace operations

**Example property test:**

```javascript
import fc from 'fast-check'

// Feature: markdown-editor, Property 4: Undo-redo round trip preserves state
test('undo-redo round trip', () => {
  fc.assert(
    fc.property(
      fc.string(), // initial content
      fc.string(), // modification
      (initial, modification) => {
        editor.setValue(initial)
        editor.insertText(modification)
        const afterModify = editor.getValue()
        
        editor.undo()
        editor.redo()
        const afterRedo = editor.getValue()
        
        expect(afterRedo).toBe(afterModify)
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Testing

Integration tests will verify:

- Main process ↔ Renderer process IPC communication
- Editor ↔ Preview synchronization
- File operations end-to-end
- Export functionality end-to-end

### Manual Testing

Manual testing will be required for:

- Cross-platform compatibility (Windows, Linux, macOS)
- UI/UX responsiveness
- Theme visual appearance
- Keyboard shortcuts on different platforms

## Implementation Notes

### Markdown Parser Configuration

```javascript
import markdownit from 'markdown-it'
import markdownitTaskLists from 'markdown-it-task-lists'

const md = markdownit({
  html: false,          // Disable HTML tags for security
  linkify: true,        // Auto-convert URLs to links
  typographer: true,    // Enable smart quotes
  breaks: false,        // Don't convert \n to <br>
  highlight: (str, lang) => {
    // Use highlight.js for syntax highlighting
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(str, { language: lang }).value
    }
    return ''
  }
})
  .enable(['table', 'strikethrough'])  // Enable GFM extensions
  .use(markdownitTaskLists)            // Enable task lists

```

### Security Considerations (Electron Best Practices)

Seguindo as recomendações oficiais de segurança do Electron:

1. **Enable Context Isolation**: MUST set `contextIsolation: true` in webPreferences (default in latest Electron)
2. **Enable Process Sandboxing**: MUST call `app.enableSandbox()` before app.whenReady() to sandbox all renderers
3. **Disable Node Integration**: MUST set `nodeIntegration: false` in webPreferences (default)
4. **Use contextBridge**: MUST use `contextBridge.exposeInMainWorld()` to expose APIs from preload to renderer
5. **Never Expose Full ipcRenderer**: Only expose specific, wrapped IPC functions via contextBridge
6. **Content Security Policy**: Implement strict CSP for renderer process
7. **Sanitize File Paths**: Validate all file paths to prevent directory traversal attacks
8. **Use Current Electron Version**: Keep Electron updated to latest stable version for security patches
9. **Disable Experimental Features**: Do not enable experimental Electron features in production
10. **Limit Navigation**: Restrict navigation to prevent loading untrusted content

**BrowserWindow Configuration (Best Practices):**

```javascript
const win = new BrowserWindow({
  width: 1200,
  height: 800,
  show: false, // Use ready-to-show event for graceful display
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,        // REQUIRED: Isolate preload context
    nodeIntegration: false,         // REQUIRED: Disable Node in renderer
    sandbox: true,                  // REQUIRED: Enable sandbox
    webSecurity: true,              // REQUIRED: Enable web security
    allowRunningInsecureContent: false,
    experimentalFeatures: false
  }
})

// Show window gracefully when ready
win.once('ready-to-show', () => {
  win.show()
})
```

**Preload Script (Best Practices):**

```javascript
const { contextBridge, ipcRenderer } = require('electron')

// CORRECT: Expose only specific, wrapped functions
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations - wrapped to prevent arbitrary IPC
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (filePath, content) => ipcRenderer.invoke('file:save', filePath, content),
  
  // Event listeners - wrapped to prevent direct ipcRenderer access
  onFileDropped: (callback) => {
    ipcRenderer.on('file:dropped', (event, filePath) => callback(filePath))
  },
  
  // Remove listener when done
  removeFileDroppedListener: () => {
    ipcRenderer.removeAllListeners('file:dropped')
  }
})

// INCORRECT: Never do this - exposes entire ipcRenderer
// contextBridge.exposeInMainWorld('electronAPI', {
//   ipcRenderer: ipcRenderer  // SECURITY RISK!
// })
```

**Main Process Security:**

```javascript
const { app } = require('electron')

// Enable sandbox for all renderers BEFORE app.whenReady()
app.enableSandbox()

app.whenReady().then(() => {
  // Create windows after app is ready
  createWindow()
})
```

### Performance Optimizations

1. **Debounce Preview Updates**: Debounce markdown rendering to avoid excessive re-renders (300ms delay)
2. **Virtual Scrolling**: For very large documents, implement virtual scrolling in editor
3. **Lazy Loading**: Load syntax highlighting languages on demand
4. **Caching**: Cache rendered HTML for unchanged content

### Accessibility

1. **Keyboard Navigation**: All features accessible via keyboard
2. **Screen Reader Support**: Proper ARIA labels on all interactive elements
3. **High Contrast**: Themes should support high contrast mode
4. **Focus Indicators**: Clear focus indicators for keyboard navigation
