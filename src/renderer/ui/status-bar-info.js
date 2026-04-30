/**
 * StatusBarInfo - VS Code style status bar information
 * Shows: Line/Column, Spaces/Tab size, Encoding, Line Ending
 */

const i18n = require('../i18n/index.js');

class StatusBarInfo {
    constructor(editor) {
        this.editor = editor;
        this.container = null;
        this.cursorInfoEl = null;
        this.indentInfoEl = null;
        this.encodingEl = null;
        this.eolEl = null;
        this.selectionInfoEl = null;
        this._updateListener = null;
    }

    initialize() {
        this._createElements();
        this._attachToStatusBar();
        this._setupEditorListener();
        this._update();
    }

    _createElements() {
        this.container = document.createElement('div');
        this.container.className = 'status-bar-info';

        // Cursor position: Ln X, Col Y
        this.cursorInfoEl = document.createElement('span');
        this.cursorInfoEl.className = 'status-bar-info__item status-bar-info__cursor';
        this.cursorInfoEl.textContent = 'Ln 1, Col 1';

        // Selection info (shown when text is selected)
        this.selectionInfoEl = document.createElement('span');
        this.selectionInfoEl.className = 'status-bar-info__item status-bar-info__selection';
        this.selectionInfoEl.style.display = 'none';

        // Indent: Spaces: 4
        this.indentInfoEl = document.createElement('span');
        this.indentInfoEl.className = 'status-bar-info__item status-bar-info__indent';
        this.indentInfoEl.textContent = i18n.t('statusBarInfo.spaces', { size: 4 });

        // Encoding
        this.encodingEl = document.createElement('span');
        this.encodingEl.className = 'status-bar-info__item status-bar-info__encoding';
        this.encodingEl.textContent = 'UTF-8';

        // Line ending
        this.eolEl = document.createElement('span');
        this.eolEl.className = 'status-bar-info__item status-bar-info__eol';
        this.eolEl.textContent = 'LF';

        this.container.appendChild(this.cursorInfoEl);
        this.container.appendChild(this.selectionInfoEl);
        this.container.appendChild(this.indentInfoEl);
        this.container.appendChild(this.encodingEl);
        this.container.appendChild(this.eolEl);
    }

    _attachToStatusBar() {
        const statusBar = document.getElementById('status-bar');
        if (statusBar) {
            // Insert at the beginning (left side) of the status bar
            statusBar.insertBefore(this.container, statusBar.firstChild);
        }
    }

    _setupEditorListener() {
        if (!this.editor || !this.editor.view) return;

        // Use CodeMirror's update listener to track cursor changes
        const { EditorView } = require('@codemirror/view');
        const updateExtension = EditorView.updateListener.of((update) => {
            if (update.selectionSet || update.docChanged) {
                this._update();
            }
        });

        this.editor.view.dispatch({
            effects: require('@codemirror/state').StateEffect.appendConfig.of(updateExtension)
        });
    }

    _update() {
        if (!this.editor || !this.editor.view) return;

        const state = this.editor.view.state;
        const sel = state.selection.main;

        // Line and column (1-based)
        const line = state.doc.lineAt(sel.head);
        const lineNumber = line.number;
        const col = sel.head - line.from + 1;

        this.cursorInfoEl.textContent = `Ln ${lineNumber}, Col ${col}`;

        // Selection info
        if (sel.from !== sel.to) {
            const selectedText = state.sliceDoc(sel.from, sel.to);
            const selectedLines = selectedText.split('\n').length;
            const selectedChars = selectedText.length;

            if (selectedLines > 1) {
                this.selectionInfoEl.textContent = `(${selectedLines} ${i18n.t('statusBarInfo.linesSelected')}, ${selectedChars} ${i18n.t('statusBarInfo.selected')})`;
            } else {
                this.selectionInfoEl.textContent = `(${selectedChars} ${i18n.t('statusBarInfo.selected')})`;
            }
            this.selectionInfoEl.style.display = '';
        } else {
            this.selectionInfoEl.style.display = 'none';
        }

        // Detect indentation from document content
        this._detectIndentation(state);

        // Detect line ending from document content
        this._detectEol(state);
    }

    _detectIndentation(state) {
        const doc = state.doc;
        let tabCount = 0;
        let spaceCount = 0;
        let spaceSize = 4;
        const linesToCheck = Math.min(doc.lines, 100);

        for (let i = 1; i <= linesToCheck; i++) {
            const lineText = doc.line(i).text;
            if (lineText.startsWith('\t')) {
                tabCount++;
            } else if (lineText.match(/^ {2,}/)) {
                spaceCount++;
                const match = lineText.match(/^( +)/);
                if (match) {
                    const len = match[1].length;
                    if (len === 2 || len === 4) {
                        spaceSize = len;
                    }
                }
            }
        }

        if (tabCount > spaceCount) {
            this.indentInfoEl.textContent = i18n.t('statusBarInfo.tabSize', { size: spaceSize });
        } else {
            this.indentInfoEl.textContent = i18n.t('statusBarInfo.spaces', { size: spaceSize });
        }
    }

    _detectEol(state) {
        const text = state.doc.toString();
        if (text.includes('\r\n')) {
            this.eolEl.textContent = 'CRLF';
        } else {
            this.eolEl.textContent = 'LF';
        }
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

module.exports = StatusBarInfo;
