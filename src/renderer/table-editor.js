/**
 * Visual Table Editor - Inline visual editor for markdown tables
 * Detects when cursor is inside a markdown table and provides a visual editing overlay
 */

const i18n = require('./i18n/index.js');
const { getIcon } = require('./icons.js');

/**
 * Parse a markdown table string into a structured object
 * @param {string} tableText - Raw markdown table text
 * @returns {{headers: string[], alignments: string[], rows: string[][], startLine: number, endLine: number}|null}
 */
function parseMarkdownTable(tableText) {
    const lines = tableText.split('\n').filter(l => l.trim());
    if (lines.length < 2) return null;

    const parseLine = (line) => {
        // Remove leading/trailing pipes and split
        let trimmed = line.trim();
        if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
        if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
        return trimmed.split('|').map(cell => cell.trim());
    };

    const headers = parseLine(lines[0]);

    // Validate separator line
    const separatorCells = parseLine(lines[1]);
    const isSeparator = separatorCells.every(cell => /^:?-+:?$/.test(cell.trim()));
    if (!isSeparator) return null;

    // Parse alignments from separator
    const alignments = separatorCells.map(cell => {
        const trimmed = cell.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
        if (trimmed.endsWith(':')) return 'right';
        return 'left';
    });

    // Parse data rows
    const rows = [];
    for (let i = 2; i < lines.length; i++) {
        const cells = parseLine(lines[i]);
        // Pad or trim to match header count
        while (cells.length < headers.length) cells.push('');
        rows.push(cells.slice(0, headers.length));
    }

    return { headers, alignments, rows };
}

/**
 * Serialize a table object back to markdown
 * @param {{headers: string[], alignments: string[], rows: string[][]}} table
 * @returns {string}
 */
function serializeTable(table) {
    const { headers, alignments, rows } = table;
    const colCount = headers.length;

    // Calculate column widths
    const widths = new Array(colCount).fill(3);
    headers.forEach((h, i) => { widths[i] = Math.max(widths[i], h.length); });
    rows.forEach(row => {
        row.forEach((cell, i) => {
            if (i < colCount) widths[i] = Math.max(widths[i], cell.length);
        });
    });

    const padCell = (text, width, align) => {
        const diff = width - text.length;
        if (diff <= 0) return text;
        if (align === 'center') {
            const left = Math.floor(diff / 2);
            return ' '.repeat(left) + text + ' '.repeat(diff - left);
        }
        if (align === 'right') return ' '.repeat(diff) + text;
        return text + ' '.repeat(diff);
    };

    const formatRow = (cells) => {
        const formatted = cells.map((cell, i) => {
            return ' ' + padCell(cell, widths[i], alignments[i]) + ' ';
        });
        return '|' + formatted.join('|') + '|';
    };

    // Header row
    const headerLine = formatRow(headers);

    // Separator row
    const separatorCells = alignments.map((align, i) => {
        const w = widths[i];
        if (align === 'center') return ':' + '-'.repeat(w) + ':';
        if (align === 'right') return '-'.repeat(w) + ':';
        return '-'.repeat(w + 1) + '-';
    });
    const separatorLine = '|' + separatorCells.map(c => ' ' + c + ' ').join('|') + '|';

    // Data rows
    const dataLines = rows.map(row => formatRow(row));

    return [headerLine, separatorLine, ...dataLines].join('\n');
}

/**
 * Find the markdown table surrounding the given line in the editor content
 * @param {string} content - Full editor content
 * @param {number} cursorLine - 0-based line number
 * @returns {{table: Object, startLine: number, endLine: number, rawText: string}|null}
 */
function findTableAtCursor(content, cursorLine) {
    const lines = content.split('\n');
    if (cursorLine < 0 || cursorLine >= lines.length) return null;

    // Check if current line looks like a table row
    const isTableRow = (line) => {
        const trimmed = line.trim();
        return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1;
    };

    if (!isTableRow(lines[cursorLine])) return null;

    // Find table boundaries
    let startLine = cursorLine;
    while (startLine > 0 && isTableRow(lines[startLine - 1])) {
        startLine--;
    }

    let endLine = cursorLine;
    while (endLine < lines.length - 1 && isTableRow(lines[endLine + 1])) {
        endLine++;
    }

    const tableLines = lines.slice(startLine, endLine + 1);
    const rawText = tableLines.join('\n');
    const table = parseMarkdownTable(rawText);

    if (!table) return null;

    return { table, startLine, endLine, rawText };
}

class TableEditor {
    /**
     * @param {Object} editor - Editor instance
     */
    constructor(editor) {
        this.editor = editor;
        this.modal = null;
        this.floatingBtn = null;
        this.currentTable = null;
        this.startLine = -1;
        this.endLine = -1;
        this.isVisible = false;
        this._cursorInTable = false;
        this._onKeyDown = this._onKeyDown.bind(this);
    }

    /**
     * Initialize the table editor
     */
    initialize() {
        this._createModal();
        this._createFloatingButton();
        this._setupCursorTracking();
    }

    /**
     * Open the table editor for the table at the current cursor position
     * @returns {boolean} true if a table was found and opened
     */
    openAtCursor() {
        const content = this.editor.getValue();
        const cursorOffset = this.editor.getCursorPosition();

        if (cursorOffset == null) return false;

        // Convert absolute offset to 0-based line number
        const textBeforeCursor = content.substring(0, cursorOffset);
        const cursorLine = textBeforeCursor.split('\n').length - 1;

        const result = findTableAtCursor(content, cursorLine);
        if (!result) return false;

        this.currentTable = result.table;
        this.startLine = result.startLine;
        this.endLine = result.endLine;

        this._renderTable();
        this.show();
        return true;
    }

    /**
     * Open the table editor with a new empty table
     * @param {number} rows - Number of data rows
     * @param {number} cols - Number of columns
     */
    openNew(rows = 3, cols = 3) {
        this.currentTable = {
            headers: Array.from({ length: cols }, (_, i) => i18n.t('tableEditor.header') + ' ' + (i + 1)),
            alignments: new Array(cols).fill('left'),
            rows: Array.from({ length: rows }, () => new Array(cols).fill(''))
        };
        this.startLine = -1;
        this.endLine = -1;

        this._renderTable();
        this.show();
    }

    /**
     * Show the modal
     */
    show() {
        if (this.isVisible) return;
        this.isVisible = true;
        this._hideFloatingButton();
        this.modal.classList.add('visible');
        document.addEventListener('keydown', this._onKeyDown);

        // Focus first cell
        const firstInput = this.modal.querySelector('.table-editor__cell-input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 50);
        }
    }

    /**
     * Hide the modal
     */
    hide() {
        if (!this.isVisible) return;
        this.isVisible = false;
        this.modal.classList.remove('visible');
        document.removeEventListener('keydown', this._onKeyDown);
    }

    /**
     * Create the floating edit button that appears when cursor is in a table
     * @private
     */
    _createFloatingButton() {
        this.floatingBtn = document.createElement('button');
        this.floatingBtn.className = 'table-editor-float-btn';
        this.floatingBtn.innerHTML = `${getIcon('edit')}<span>${i18n.t('tableEditor.editTable')}</span>`;
        this.floatingBtn.title = i18n.t('tableEditor.editTable');
        this.floatingBtn.setAttribute('aria-label', i18n.t('tableEditor.editTable'));
        this.floatingBtn.addEventListener('click', () => this.openAtCursor());
        document.body.appendChild(this.floatingBtn);
    }

    /**
     * Setup cursor tracking to show/hide the floating button
     * @private
     */
    _setupCursorTracking() {
        this.editor.onCursorChange((offset) => {
            if (this.isVisible) return; // Don't update while modal is open

            const content = this.editor.getValue();
            const textBefore = content.substring(0, offset);
            const cursorLine = textBefore.split('\n').length - 1;
            const result = findTableAtCursor(content, cursorLine);

            if (result) {
                if (!this._cursorInTable) {
                    this._cursorInTable = true;
                    this._positionFloatingButton(result.startLine);
                }
            } else {
                if (this._cursorInTable) {
                    this._cursorInTable = false;
                    this._hideFloatingButton();
                }
            }
        });
    }

    /**
     * Position and show the floating button near the table
     * @param {number} tableLine - 0-based start line of the table
     * @private
     */
    _positionFloatingButton(tableLine) {
        if (!this.floatingBtn || !this.editor.view) return;

        try {
            // Get the position of the first character of the table line
            const doc = this.editor.view.state.doc;
            const lineInfo = doc.line(tableLine + 1); // CodeMirror is 1-based
            const coords = this.editor.view.coordsAtPos(lineInfo.from);

            if (coords) {
                // Position to the right of the editor area
                const editorRect = this.editor.view.dom.getBoundingClientRect();
                this.floatingBtn.style.top = `${coords.top}px`;
                this.floatingBtn.style.left = `${editorRect.right - this.floatingBtn.offsetWidth - 12}px`;
                this.floatingBtn.classList.add('visible');
            }
        } catch (e) {
            // Silently fail if coordinates can't be computed
            this._hideFloatingButton();
        }
    }

    /**
     * Hide the floating button
     * @private
     */
    _hideFloatingButton() {
        if (this.floatingBtn) {
            this.floatingBtn.classList.remove('visible');
        }
    }

    /**
     * Create the modal DOM
     * @private
     */
    _createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'table-editor-modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-label', i18n.t('tableEditor.title'));

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'table-editor-modal__overlay';
        overlay.addEventListener('click', () => this.hide());

        // Content
        const content = document.createElement('div');
        content.className = 'table-editor-modal__content';

        // Header
        const header = document.createElement('div');
        header.className = 'table-editor-modal__header';

        const title = document.createElement('h3');
        title.className = 'table-editor-modal__title';
        title.textContent = i18n.t('tableEditor.title');

        const closeBtn = document.createElement('button');
        closeBtn.className = 'table-editor-modal__close';
        closeBtn.innerHTML = getIcon('close');
        closeBtn.title = i18n.t('actions.close');
        closeBtn.addEventListener('click', () => this.hide());

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'table-editor-modal__toolbar';
        toolbar.id = 'table-editor-toolbar';

        // Table container
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-editor-modal__table-container';
        tableContainer.id = 'table-editor-table';

        // Footer
        const footer = document.createElement('div');
        footer.className = 'table-editor-modal__footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'table-editor-modal__btn table-editor-modal__btn--cancel';
        cancelBtn.textContent = i18n.t('actions.cancel');
        cancelBtn.addEventListener('click', () => this.hide());

        const applyBtn = document.createElement('button');
        applyBtn.className = 'table-editor-modal__btn table-editor-modal__btn--apply';
        applyBtn.textContent = i18n.t('actions.apply');
        applyBtn.addEventListener('click', () => this._applyChanges());

        footer.appendChild(cancelBtn);
        footer.appendChild(applyBtn);

        content.appendChild(header);
        content.appendChild(toolbar);
        content.appendChild(tableContainer);
        content.appendChild(footer);

        this.modal.appendChild(overlay);
        this.modal.appendChild(content);

        document.body.appendChild(this.modal);
    }

    /**
     * Render the toolbar buttons
     * @private
     */
    _renderToolbar() {
        const toolbar = this.modal.querySelector('#table-editor-toolbar');
        toolbar.innerHTML = '';

        const actions = [
            { label: i18n.t('tableEditor.addColumn'), icon: 'plus', action: () => this._addColumn() },
            { label: i18n.t('tableEditor.removeColumn'), icon: 'trash', action: () => this._removeColumn() },
            { label: i18n.t('tableEditor.addRow'), icon: 'plus', action: () => this._addRow() },
            { label: i18n.t('tableEditor.removeRow'), icon: 'trash', action: () => this._removeRow() },
        ];

        actions.forEach(({ label, icon, action }) => {
            const btn = document.createElement('button');
            btn.className = 'table-editor-modal__toolbar-btn';
            btn.title = label;
            btn.innerHTML = `<span class="table-editor-modal__toolbar-icon">${getIcon(icon)}</span><span>${label}</span>`;
            btn.addEventListener('click', action);
            toolbar.appendChild(btn);
        });
    }

    /**
     * Render the table grid
     * @private
     */
    _renderTable() {
        this._renderToolbar();

        const container = this.modal.querySelector('#table-editor-table');
        container.innerHTML = '';

        if (!this.currentTable) return;

        const { headers, alignments, rows } = this.currentTable;
        const table = document.createElement('table');
        table.className = 'table-editor__table';

        // Header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        headers.forEach((header, colIdx) => {
            const th = document.createElement('th');
            th.className = 'table-editor__cell table-editor__cell--header';

            const input = document.createElement('input');
            input.className = 'table-editor__cell-input table-editor__cell-input--header';
            input.type = 'text';
            input.value = header;
            input.setAttribute('data-row', '-1');
            input.setAttribute('data-col', colIdx.toString());
            input.setAttribute('aria-label', `${i18n.t('tableEditor.header')} ${colIdx + 1}`);
            input.addEventListener('input', (e) => {
                this.currentTable.headers[colIdx] = e.target.value;
            });
            input.addEventListener('keydown', (e) => this._handleCellKeydown(e, -1, colIdx));

            // Alignment selector
            const alignBtn = document.createElement('button');
            alignBtn.className = 'table-editor__align-btn';
            alignBtn.title = i18n.t('tableEditor.alignment');
            alignBtn.textContent = alignments[colIdx] === 'center' ? '≡' : alignments[colIdx] === 'right' ? '▸' : '◂';
            alignBtn.addEventListener('click', () => {
                const cycle = { left: 'center', center: 'right', right: 'left' };
                this.currentTable.alignments[colIdx] = cycle[this.currentTable.alignments[colIdx]];
                alignBtn.textContent = this.currentTable.alignments[colIdx] === 'center' ? '≡' : this.currentTable.alignments[colIdx] === 'right' ? '▸' : '◂';
            });

            th.appendChild(input);
            th.appendChild(alignBtn);
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Data rows
        const tbody = document.createElement('tbody');

        rows.forEach((row, rowIdx) => {
            const tr = document.createElement('tr');

            row.forEach((cell, colIdx) => {
                const td = document.createElement('td');
                td.className = 'table-editor__cell';

                const input = document.createElement('input');
                input.className = 'table-editor__cell-input';
                input.type = 'text';
                input.value = cell;
                input.setAttribute('data-row', rowIdx.toString());
                input.setAttribute('data-col', colIdx.toString());
                input.setAttribute('aria-label', `${i18n.t('tableEditor.cell')} ${rowIdx + 1},${colIdx + 1}`);
                input.addEventListener('input', (e) => {
                    this.currentTable.rows[rowIdx][colIdx] = e.target.value;
                });
                input.addEventListener('keydown', (e) => this._handleCellKeydown(e, rowIdx, colIdx));

                td.appendChild(input);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        container.appendChild(table);
    }

    /**
     * Handle keyboard navigation between cells
     * @param {KeyboardEvent} e
     * @param {number} row - Current row (-1 for header)
     * @param {number} col - Current column
     * @private
     */
    _handleCellKeydown(e, row, col) {
        const { headers, rows } = this.currentTable;
        const maxRow = rows.length - 1;
        const maxCol = headers.length - 1;

        let targetRow = row;
        let targetCol = col;

        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                targetCol--;
                if (targetCol < 0) {
                    targetCol = maxCol;
                    targetRow--;
                }
            } else {
                targetCol++;
                if (targetCol > maxCol) {
                    targetCol = 0;
                    targetRow++;
                }
            }
        } else if (e.key === 'ArrowDown' && e.altKey) {
            e.preventDefault();
            targetRow++;
        } else if (e.key === 'ArrowUp' && e.altKey) {
            e.preventDefault();
            targetRow--;
        } else if (e.key === 'Enter') {
            e.preventDefault();
            targetRow++;
            if (targetRow > maxRow) {
                // Add a new row when pressing Enter on the last row
                this._addRow();
                targetRow = rows.length - 1;
            }
        } else {
            return;
        }

        // Clamp
        if (targetRow < -1) targetRow = -1;
        if (targetRow > rows.length - 1) targetRow = rows.length - 1;
        if (targetCol < 0) targetCol = 0;
        if (targetCol > maxCol) targetCol = maxCol;

        const selector = `[data-row="${targetRow}"][data-col="${targetCol}"]`;
        const targetInput = this.modal.querySelector(selector);
        if (targetInput) {
            targetInput.focus();
            targetInput.select();
        }
    }

    /**
     * Add a column to the end
     * @private
     */
    _addColumn() {
        if (!this.currentTable) return;
        this.currentTable.headers.push(i18n.t('tableEditor.header') + ' ' + (this.currentTable.headers.length + 1));
        this.currentTable.alignments.push('left');
        this.currentTable.rows.forEach(row => row.push(''));
        this._renderTable();
    }

    /**
     * Remove the last column
     * @private
     */
    _removeColumn() {
        if (!this.currentTable || this.currentTable.headers.length <= 1) return;
        this.currentTable.headers.pop();
        this.currentTable.alignments.pop();
        this.currentTable.rows.forEach(row => row.pop());
        this._renderTable();
    }

    /**
     * Add a row to the end
     * @private
     */
    _addRow() {
        if (!this.currentTable) return;
        this.currentTable.rows.push(new Array(this.currentTable.headers.length).fill(''));
        this._renderTable();
    }

    /**
     * Remove the last row
     * @private
     */
    _removeRow() {
        if (!this.currentTable || this.currentTable.rows.length <= 1) return;
        this.currentTable.rows.pop();
        this._renderTable();
    }

    /**
     * Apply changes back to the editor
     * @private
     */
    _applyChanges() {
        if (!this.currentTable) return;

        const markdown = serializeTable(this.currentTable);

        if (this.startLine >= 0 && this.endLine >= 0) {
            // Replace existing table using precise range replacement
            const doc = this.editor.view.state.doc;
            const from = doc.line(this.startLine + 1).from; // CodeMirror lines are 1-based
            const to = doc.line(this.endLine + 1).to;

            this.editor.view.dispatch({
                changes: { from, to, insert: markdown }
            });
        } else {
            // Insert new table at cursor
            this.editor.insertText('\n' + markdown + '\n');
        }

        this.hide();
    }

    /**
     * Handle global keyboard events
     * @param {KeyboardEvent} e
     * @private
     */
    _onKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        }
    }

    /**
     * Update translations
     */
    updateTranslations() {
        if (this.modal) {
            const title = this.modal.querySelector('.table-editor-modal__title');
            if (title) title.textContent = i18n.t('tableEditor.title');
        }
    }

    /**
     * Destroy and clean up
     */
    destroy() {
        document.removeEventListener('keydown', this._onKeyDown);
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        if (this.floatingBtn && this.floatingBtn.parentNode) {
            this.floatingBtn.parentNode.removeChild(this.floatingBtn);
        }
    }
}

module.exports = { TableEditor, parseMarkdownTable, serializeTable, findTableAtCursor };
