/**
 * Handler functions for renderer process actions.
 * Manages file operations, menu actions, tab management, keyboard shortcuts,
 * drag-and-drop, sidebar integration, and other user-facing operations.
 *
 * @module handlers
 */

const notificationManager = require('./ui/notification.js');
const i18n = require('./i18n/index.js');
const eventBus = require('./core/event-bus.js');

// Module-level references set by init()
let registry = null;
let state = null;

/**
 * Initialize the handlers module with registry and shared state.
 * @param {ComponentRegistry} reg - The component registry
 * @param {Object} st - Shared document state object with currentFilePath, isDirty, lastSavedContent, currentTabId
 */
function init(reg, st) {
    registry = reg;
    state = st;
}

/**
 * Handle menu actions from the main process
 */
async function handleMenuAction(action, data) {
    const editor = registry.get('editor');
    const searchManager = registry.get('searchManager');
    const themeSelector = registry.get('themeSelector');
    const themeManager = registry.get('themeManager');
    const viewModeManager = registry.get('viewModeManager');
    const focusMode = registry.get('focusMode');
    const templateUI = registry.get('templateUI');
    const activityBar = registry.get('activityBar');
    const globalSearchUI = registry.get('globalSearchUI');
    const statisticsCalculator = registry.get('statisticsCalculator');
    const autoSaveManager = registry.get('autoSaveManager');
    const autoSaveSettingsUI = registry.get('autoSaveSettingsUI');
    const keyboardShortcutsUI = registry.get('keyboardShortcutsUI');
    const advancedMarkdownSettingsUI = registry.get('advancedMarkdownSettingsUI');
    const imagePasteSettingsUI = registry.get('imagePasteSettingsUI');
    const whatsNewModal = registry.get('whatsNewModal');
    const commandPalette = registry.get('commandPalette');
    const tableEditor = registry.get('tableEditor');

    try {
        switch (action) {
            case 'new': await handleNewFile(); break;
            case 'open': await handleOpenFile(); break;
            case 'open-recent': if (data) await handleOpenRecentFile(data); break;
            case 'save': await handleSaveFile(); break;
            case 'save-as': await handleSaveFileAs(); break;
            case 'save-all': await handleSaveAll(); break;
            case 'export-html': await handleExportHTML(); break;
            case 'export-pdf': await handleExportPDF(); break;
            case 'undo': editor.undo(); break;
            case 'redo': editor.redo(); break;
            case 'find': searchManager.show(); break;
            case 'find-in-files': if (globalSearchUI) globalSearchUI.show(); break;
            case 'select-theme': if (themeSelector) themeSelector.open(); break;
            case 'toggle-theme': await themeManager.toggleTheme(); break;
            case 'view-mode-editor': await viewModeManager.setViewMode('editor'); break;
            case 'view-mode-preview': await viewModeManager.setViewMode('preview'); break;
            case 'view-mode-split': await viewModeManager.setViewMode('split'); break;
            case 'focus-mode': if (focusMode) focusMode.toggle(); break;
            case 'insert-template': if (templateUI) templateUI.showTemplateMenu(); break;
            case 'toggle-sidebar': if (activityBar) activityBar.toggleView('files'); break;
            case 'toggle-outline': if (activityBar) activityBar.toggleView('outline'); break;
            case 'toggle-typewriter': await toggleTypewriterScrolling(); break;
            case 'toggle-statistics': if (statisticsCalculator) await statisticsCalculator.toggleVisibility(); break;
            case 'toggle-line-numbers': await handleToggleLineNumbers(); break;
            case 'toggle-auto-save':
                if (autoSaveManager) {
                    if (autoSaveManager.isEnabled()) await autoSaveManager.disable();
                    else await autoSaveManager.enable();
                }
                break;
            case 'auto-save-settings': if (autoSaveSettingsUI) await autoSaveSettingsUI.show(); break;
            case 'open-keyboard-shortcuts': if (keyboardShortcutsUI) await keyboardShortcutsUI.show(); break;
            case 'advanced-markdown-settings': if (advancedMarkdownSettingsUI) await advancedMarkdownSettingsUI.show(); break;
            case 'image-paste-settings': if (imagePasteSettingsUI) await imagePasteSettingsUI.show(); break;
            case 'open-folder': await handleOpenFolder(); break;
            case 'close-folder': await handleCloseFolder(); break;
            case 'about': showAboutDialog(); break;
            case 'whats-new': if (whatsNewModal) await whatsNewModal.show(); break;
            case 'command-palette': if (commandPalette) commandPalette.show(); break;
            case 'edit-table':
                if (tableEditor) {
                    if (!tableEditor.openAtCursor()) notificationManager.info(i18n.t('tableEditor.noTableFound'));
                }
                break;
            default: console.warn('Unknown menu action:', action);
        }
    } catch (error) {
        console.error('Error handling menu action:', error);
        notificationManager.error('Error: ' + error.message);
    }
}

async function handleNewFile() {
    try { await createNewTab(); }
    catch (error) {
        console.error('Failed to create new file:', error);
        notificationManager.error(i18n.t('notifications.failedToCreateFile') + ' ' + i18n.t('notifications.tryAgain'));
    }
}

async function handleOpenFile() {
    try {
        const result = await window.electronAPI.openFile();
        if (result && result.filePath && result.content !== undefined) {
            await createNewTab(result.filePath, result.content);
            eventBus.emit('file:opened', { filePath: result.filePath, content: result.content });
        }
    } catch (error) {
        console.error('Error opening file:', error);
        notificationManager.error(i18n.t('notifications.failedToOpenFile') + ': ' + error.message);
    }
}

async function handleOpenRecentFile(filePath) {
    try {
        const result = await window.electronAPI.openRecentFile(filePath);
        if (result && result.filePath && result.content !== undefined) await createNewTab(result.filePath, result.content);
    } catch (error) {
        console.error('Error opening recent file:', error);
        notificationManager.error(i18n.t('notifications.failedToOpenFile') + ': ' + error.message);
    }
}

async function handleOpenFolder() {
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    const backlinksPanel = registry.get('backlinksPanel');
    if (!fileTreeSidebar) return;
    try {
        const result = await window.electronAPI.openWorkspace();
        if (result.success && result.tree) {
            await fileTreeSidebar.loadWorkspace(result.tree);
            await fileTreeSidebar.setVisibility(true);
            if (backlinksPanel) backlinksPanel.invalidateCache();
        }
    } catch (error) {
        console.error('Error opening folder:', error);
        notificationManager.error(i18n.t('notifications.failedToOpenFolder') + ': ' + error.message);
    }
}

async function handleCloseFolder() {
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    const connectionGraphPanel = registry.get('connectionGraphPanel');
    if (!fileTreeSidebar) return;
    try {
        const result = await window.electronAPI.closeWorkspace();
        if (result.success) {
            fileTreeSidebar.clearWorkspace();
            if (connectionGraphPanel) connectionGraphPanel.clear();
        }
    } catch (error) {
        console.error('Error closing folder:', error);
        notificationManager.error(i18n.t('notifications.failedToCloseFolder') + ': ' + error.message);
    }
}

async function toggleOutlinePanel() {
    const outlinePanel = registry.get('outlinePanel');
    if (!outlinePanel) return;
    try {
        outlinePanel.toggle();
        await window.electronAPI.setConfig('outline.visible', outlinePanel.isVisible);
    } catch (error) {
        console.error('Error toggling outline panel:', error);
    }
}

async function toggleTypewriterScrolling() {
    const typewriterScrolling = registry.get('typewriterScrolling');
    if (!typewriterScrolling) return;
    try {
        typewriterScrolling.toggle();
        await window.electronAPI.setConfig('typewriter.enabled', typewriterScrolling.isEnabled());
    } catch (error) {
        console.error('Error toggling typewriter scrolling:', error);
    }
}

async function handleToggleLineNumbers() {
    const editor = registry.get('editor');
    try {
        const result = await window.electronAPI.toggleLineNumbers();
        if (result.success && editor) editor.setLineNumbers(result.enabled);
    } catch (error) {
        console.error('Error toggling line numbers:', error);
    }
}

async function handleSaveFile() {
    const editor = registry.get('editor');
    const tabBar = registry.get('tabBar');
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    const autoSaveManager = registry.get('autoSaveManager');
    const connectionGraphPanel = registry.get('connectionGraphPanel');
    const activityBar = registry.get('activityBar');

    try {
        const content = editor.getValue();
        if (state.currentFilePath) {
            await window.electronAPI.saveFile(state.currentFilePath, content);
            state.lastSavedContent = content;
            state.isDirty = false;
            if (state.currentTabId) {
                await window.electronAPI.markTabModified(state.currentTabId, false);
                tabBar.markTabModified(state.currentTabId, false);
            }
            if (fileTreeSidebar && state.currentFilePath) fileTreeSidebar.markFileModified(state.currentFilePath, false);
            if (autoSaveManager) autoSaveManager.setLastSavedContent(content);
            if (connectionGraphPanel && activityBar && activityBar.getActiveView() === 'connection-graph') {
                connectionGraphPanel.refresh().catch(err => console.error('Error refreshing connection graph after save:', err));
            }
            eventBus.emit('file:saved', { filePath: state.currentFilePath, tabId: state.currentTabId });
        } else {
            await handleSaveFileAs();
        }
    } catch (error) {
        console.error('Error saving file:', error);
        notificationManager.error(i18n.t('notifications.fileSaveFailed') + ': ' + error.message);
    }
}

async function handleSaveFileAs() {
    const editor = registry.get('editor');
    const tabBar = registry.get('tabBar');
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    const autoSaveManager = registry.get('autoSaveManager');

    try {
        const content = editor.getValue();
        const result = await window.electronAPI.saveFileAs(content);
        if (result && result.filePath) {
            state.currentFilePath = result.filePath;
            state.lastSavedContent = content;
            state.isDirty = false;
            if (state.currentTabId) {
                await window.electronAPI.updateTabFilePath(state.currentTabId, result.filePath);
                await window.electronAPI.markTabModified(state.currentTabId, false);
                const tabResult = await window.electronAPI.getTab(state.currentTabId);
                if (tabResult.success && tabResult.tab) {
                    tabBar.updateTabTitle(state.currentTabId, tabResult.tab.title);
                    tabBar.markTabModified(state.currentTabId, false);
                }
            }
            if (fileTreeSidebar && state.currentFilePath) {
                fileTreeSidebar.markFileModified(state.currentFilePath, false);
                fileTreeSidebar.setActiveFile(state.currentFilePath);
            }
            if (autoSaveManager) {
                autoSaveManager.setCurrentFilePath(result.filePath);
                autoSaveManager.setLastSavedContent(content);
            }
            eventBus.emit('file:saved', { filePath: result.filePath, tabId: state.currentTabId });
        }
    } catch (error) {
        console.error('Error saving file as:', error);
        notificationManager.error(i18n.t('notifications.fileSaveFailed') + ': ' + error.message);
    }
}


async function handleSaveAll() {
    const tabBar = registry.get('tabBar');
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    const autoSaveManager = registry.get('autoSaveManager');

    try {
        const result = await window.electronAPI.getModifiedTabs();
        if (!result.success || !result.tabs || result.tabs.length === 0) {
            notificationManager.info(i18n.t('notifications.noModifiedFiles'));
            return;
        }
        let savedCount = 0, errorCount = 0;
        const errors = [];
        for (const tab of result.tabs) {
            try {
                if (tab.filePath) {
                    await window.electronAPI.saveFile(tab.filePath, tab.content);
                    await window.electronAPI.markTabModified(tab.id, false);
                    tabBar.markTabModified(tab.id, false);
                    if (fileTreeSidebar && tab.filePath) fileTreeSidebar.markFileModified(tab.filePath, false);
                    savedCount++;
                    if (tab.id === state.currentTabId) {
                        state.lastSavedContent = tab.content;
                        state.isDirty = false;
                        if (autoSaveManager) autoSaveManager.setLastSavedContent(tab.content);
                    }
                } else {
                    errors.push(`"${tab.title}" has not been saved yet. Use Save As first.`);
                    errorCount++;
                }
            } catch (error) {
                errors.push(`Failed to save "${tab.title}": ${error.message}`);
                errorCount++;
            }
        }
        if (savedCount > 0 && errorCount === 0) notificationManager.success(i18n.t('notifications.successfullySavedFiles', { count: savedCount }));
        else if (savedCount > 0) notificationManager.warning(i18n.t('notifications.savedWithErrors', { count: savedCount, errors: errors.join('\n') }));
        else notificationManager.error(i18n.t('notifications.failedToSaveFiles') + ':\n' + errors.join('\n'));
    } catch (error) {
        console.error('Error in save all:', error);
        notificationManager.error(i18n.t('notifications.failedToSaveFiles') + ': ' + error.message);
    }
}

async function handleExportHTML() {
    try {
        const content = registry.get('editor').getValue();
        const result = await window.electronAPI.exportHTML(content);
        if (result && result.success) notificationManager.success(i18n.t('notifications.successfullyExportedHTML') + ': ' + result.filePath);
    } catch (error) {
        console.error('Error exporting to HTML:', error);
        notificationManager.error(i18n.t('notifications.failedToExportHTML') + ': ' + error.message);
    }
}

async function handleExportPDF() {
    try {
        const content = registry.get('editor').getValue();
        const result = await window.electronAPI.exportPDF(content);
        if (result && result.success) notificationManager.success(i18n.t('notifications.successfullyExportedPDF') + ': ' + result.filePath);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        notificationManager.error(i18n.t('notifications.failedToExportPDF') + ': ' + error.message);
    }
}

function updateDirtyState(content) {
    state.isDirty = content !== state.lastSavedContent;
    const tabBar = registry.get('tabBar');
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    if (state.currentTabId) {
        window.electronAPI.markTabModified(state.currentTabId, state.isDirty).catch(err => console.error('Error marking tab modified:', err));
        tabBar.markTabModified(state.currentTabId, state.isDirty);
        if (fileTreeSidebar && state.currentFilePath) fileTreeSidebar.markFileModified(state.currentFilePath, state.isDirty);
    }
}

async function handleTemplateInsert(template, mode) {
    const editor = registry.get('editor');
    try {
        editor.insertTemplate(template.content, mode);
        await window.electronAPI.markTemplateUsed(template.id);
        updateDirtyState(editor.getValue());
    } catch (error) {
        console.error('Error inserting template:', error);
        notificationManager.error(i18n.t('notifications.failedToInsertTemplate') + ': ' + error.message);
    }
}

/**
 * Create a new tab
 */
async function createNewTab(filePath = null, content = '') {
    const editor = registry.get('editor');
    const tabBar = registry.get('tabBar');
    const preview = registry.get('preview');
    const autoSaveManager = registry.get('autoSaveManager');
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    const markdownParser = registry.get('markdownParser');
    const tooltipManager = registry.get('tooltipManager');

    try {
        const result = await window.electronAPI.createTab(filePath, content);
        if (result.success && result.tab) {
            const tab = result.tab;
            tabBar.addTab(tab.id, tab.title, true, tab.isModified);
            state.currentTabId = tab.id;
            attachTooltipToTabCloseButton(tab.id, tab.title);
            editor.setValue(content);
            state.currentFilePath = filePath;
            state.isDirty = false;
            state.lastSavedContent = content;
            if (autoSaveManager) { autoSaveManager.setCurrentFilePath(filePath); autoSaveManager.setLastSavedContent(content); }
            if (fileTreeSidebar && filePath) fileTreeSidebar.setActiveFile(filePath);
            if (markdownParser && filePath) markdownParser.setCurrentFilePath(filePath);
            preview.render(content);
            document.body.classList.add('has-tabs');
            if (filePath) {
                eventBus.emit('file:opened', { filePath, content });
            }
        }
    } catch (error) {
        console.error('Error creating tab:', error);
        notificationManager.error(i18n.t('notifications.failedToCreateTab') + ': ' + error.message);
    }
}

/**
 * Switch to a different tab
 */
async function switchToTab(tabId) {
    const editor = registry.get('editor');
    const tabBar = registry.get('tabBar');
    const preview = registry.get('preview');
    const autoSaveManager = registry.get('autoSaveManager');
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    const markdownParser = registry.get('markdownParser');
    const connectionGraphPanel = registry.get('connectionGraphPanel');
    const activityBar = registry.get('activityBar');
    const backlinksPanel = registry.get('backlinksPanel');

    try {
        if (state.currentTabId) {
            const scrollPos = editor.getScrollPosition();
            await window.electronAPI.updateTabScroll(state.currentTabId, scrollPos);
        }
        const result = await window.electronAPI.switchTab(tabId);
        if (result.success && result.tab) {
            const tab = result.tab;
            tabBar.setActiveTab(tabId);
            state.currentTabId = tabId;
            editor.setValue(tab.content);
            state.currentFilePath = tab.filePath;
            state.isDirty = tab.isModified;
            state.lastSavedContent = tab.isModified ? '' : tab.content;
            if (autoSaveManager) { autoSaveManager.setCurrentFilePath(tab.filePath); autoSaveManager.setLastSavedContent(tab.isModified ? '' : tab.content); }
            if (fileTreeSidebar && tab.filePath) fileTreeSidebar.setActiveFile(tab.filePath);
            if (markdownParser && tab.filePath) markdownParser.setCurrentFilePath(tab.filePath);
            if (connectionGraphPanel && activityBar && activityBar.getActiveView() === 'connection-graph') connectionGraphPanel.setActiveDocument(tab.filePath);
            if (backlinksPanel && tab.filePath) {
                const wpResult = await window.electronAPI.getWorkspacePath();
                const workspacePath = wpResult && wpResult.success ? wpResult.workspacePath : null;
                backlinksPanel.setActiveDocument(tab.filePath, workspacePath);
            }
            if (tab.scrollPosition) editor.setScrollPosition(tab.scrollPosition);
            preview.render(tab.content, true);
        }
    } catch (error) {
        console.error('Error switching tab:', error);
        notificationManager.error(i18n.t('notifications.failedToSwitchTab') + ': ' + error.message);
    }
}

/**
 * Close a tab
 */
async function closeTab(tabId) {
    const tabBar = registry.get('tabBar');
    const fileTreeSidebar = registry.get('fileTreeSidebar');

    try {
        const tabResult = await window.electronAPI.getTab(tabId);
        if (tabResult.success && tabResult.tab && tabResult.tab.isModified) {
            const confirmed = await tabBar.showCloseConfirmation(tabResult.tab.title);
            if (!confirmed) return;
        }
        const closedFilePath = tabResult.success && tabResult.tab ? tabResult.tab.filePath : null;
        const result = await window.electronAPI.closeTab(tabId);
        if (result.success) {
            tabBar.removeTab(tabId);
            if (fileTreeSidebar && closedFilePath) fileTreeSidebar.markFileModified(closedFilePath, false);
            if (state.currentTabId === tabId) {
                const activeResult = await window.electronAPI.getActiveTab();
                if (activeResult.success && activeResult.tab) await switchToTab(activeResult.tab.id);
                else await createNewTab();
            }
            await window.electronAPI.saveTabs();
        }
    } catch (error) {
        console.error('Error closing tab:', error);
        notificationManager.error(i18n.t('notifications.failedToCloseTab') + ': ' + error.message);
    }
}

function attachTooltipToTabCloseButton(tabId, tabTitle) {
    const tooltipManager = registry.get('tooltipManager');
    if (!tooltipManager) return;
    const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
    if (!tabElement) return;
    const closeButton = tabElement.querySelector('.tab-close-button');
    if (!closeButton) return;
    tooltipManager.attach(closeButton, `Close ${tabTitle} <span class="tooltip-shortcut">Ctrl+W</span>`);
}

/**
 * Show About dialog
 */
async function showAboutDialog() {
    let appVersion = '1.0.5';
    try {
        const result = await window.electronAPI.getAppVersion();
        if (result.success) appVersion = result.version;
    } catch (error) { console.error('Failed to get app version:', error); }

    const overlay = document.createElement('div');
    overlay.className = 'about-dialog-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';

    const dialog = document.createElement('div');
    dialog.className = 'about-dialog';
    dialog.style.cssText = 'background:var(--bg-primary,#fff);color:var(--text-primary,#000);border-radius:8px;padding:32px;max-width:400px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,0.3);text-align:center;';
    dialog.innerHTML = `
        <h2 style="margin:0 0 16px 0;font-size:24px;">MD Editor Pro</h2>
        <p style="margin:0 0 8px 0;font-size:18px;color:var(--text-secondary,#666);">Version ${appVersion}</p>
        <p style="margin:0 0 24px 0;font-size:14px;color:var(--text-secondary,#666);">A cross-platform markdown editor built with Electron</p>
        <div style="margin:24px 0;padding:16px;background:var(--bg-secondary,#f5f5f5);border-radius:4px;">
            <p style="margin:0 0 8px 0;font-size:12px;color:var(--text-secondary,#666);"><strong>Electron:</strong> ${window.electronAPI.getVersions().electron}</p>
            <p style="margin:0 0 8px 0;font-size:12px;color:var(--text-secondary,#666);"><strong>Chrome:</strong> ${window.electronAPI.getVersions().chrome}</p>
            <p style="margin:0;font-size:12px;color:var(--text-secondary,#666);"><strong>Node.js:</strong> ${window.electronAPI.getVersions().node}</p>
        </div>
        <div style="margin:0 0 24px 0;">
            <p style="margin:0 0 12px 0;font-size:12px;color:var(--text-secondary,#666);">© 2026 MD Editor Pro. All rights reserved.</p>
            <div style="display:flex;gap:16px;justify-content:center;align-items:center;">
                <a id="github-link" href="#" style="color:var(--accent-color,#007acc);text-decoration:none;font-size:13px;display:flex;align-items:center;gap:4px;">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                    GitHub
                </a>
                <span style="color:var(--text-secondary,#666);">•</span>
                <a id="linkedin-link" href="#" style="color:var(--accent-color,#007acc);text-decoration:none;font-size:13px;display:flex;align-items:center;gap:4px;">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>
                    Author
                </a>
            </div>
        </div>
        <button id="about-close-btn" style="background:var(--accent-color,#007acc);color:white;border:none;border-radius:4px;padding:10px 24px;font-size:14px;cursor:pointer;">Close</button>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const closeDialog = () => document.body.removeChild(overlay);
    document.getElementById('about-close-btn').addEventListener('click', closeDialog);
    document.getElementById('github-link').addEventListener('click', async (e) => {
        try { e.preventDefault(); await window.electronAPI.openExternal('https://github.com/leandrolsouza/MD-Editor-Pro'); }
        catch (error) { console.error('Failed to open external link:', error); }
    });
    document.getElementById('linkedin-link').addEventListener('click', async (e) => {
        try { e.preventDefault(); await window.electronAPI.openExternal('https://www.linkedin.com/in/leandrolsouza/'); }
        catch (error) { console.error('Failed to open external link:', error); }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDialog(); });
    const handleEscape = (e) => { if (e.key === 'Escape') { closeDialog(); document.removeEventListener('keydown', handleEscape); } };
    document.addEventListener('keydown', handleEscape);
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    const editor = registry.get('editor');
    const searchManager = registry.get('searchManager');
    const focusMode = registry.get('focusMode');
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    const activityBar = registry.get('activityBar');
    const commandPalette = registry.get('commandPalette');

    document.addEventListener('keydown', async (e) => {
        try {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifier = isMac ? e.metaKey : e.ctrlKey;

            if (modifier && e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                const result = await window.electronAPI.getNextTab();
                if (result.success && result.tabId) await switchToTab(result.tabId);
            }
            if (modifier && e.shiftKey && e.key === 'Tab') {
                e.preventDefault();
                const result = await window.electronAPI.getPreviousTab();
                if (result.success && result.tabId) await switchToTab(result.tabId);
            }
            if (modifier && e.key === 'w') { e.preventDefault(); if (state.currentTabId) await closeTab(state.currentTabId); }
            if (modifier && e.key === 'b' && !e.shiftKey) { e.preventDefault(); editor.applyFormatting('bold'); }
            if (modifier && e.key === 'i') { e.preventDefault(); editor.applyFormatting('italic'); }
            if (modifier && e.key === '`') { e.preventDefault(); editor.applyFormatting('code'); }
            if (modifier && e.key === 'f' && !e.shiftKey) { e.preventDefault(); searchManager.show(); }
            if (modifier && e.shiftKey && e.key === 'F') { e.preventDefault(); if (activityBar) activityBar.toggleView('search'); }
            if (modifier && e.shiftKey && e.key === 'E') { e.preventDefault(); if (activityBar) activityBar.toggleView('files'); }
            if (modifier && e.shiftKey && e.key === 'O') { e.preventDefault(); if (activityBar) activityBar.toggleView('outline'); }
            if (modifier && e.key === 's') { e.preventDefault(); await handleSaveFile(); }
            if (modifier && e.key === 'o' && !e.shiftKey) { e.preventDefault(); await handleOpenFile(); }
            if (modifier && e.key === 'n') { e.preventDefault(); await handleNewFile(); }
            if (e.key === 'Escape') { if (searchManager.isVisible()) { e.preventDefault(); searchManager.hide(); } }
            if (e.key === 'F11') { e.preventDefault(); if (focusMode) focusMode.toggle(); }
            if (modifier && e.key === 'B' && e.shiftKey && fileTreeSidebar) { e.preventDefault(); await fileTreeSidebar.toggleVisibility(); }
            if (modifier && e.key === 'O' && e.shiftKey) { e.preventDefault(); await toggleOutlinePanel(); }
            if (modifier && e.key === 'T' && e.shiftKey) { e.preventDefault(); await toggleTypewriterScrolling(); }
            if (modifier && e.key === 'P' && e.shiftKey) { e.preventDefault(); if (commandPalette) commandPalette.show(); }
        } catch (error) {
            console.error('Keyboard shortcut error:', error);
        }
    });
}

/**
 * Setup drag-and-drop file handling
 */
function setupDragAndDrop() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    appContainer.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); appContainer.classList.add('drag-over'); });
    appContainer.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); appContainer.classList.remove('drag-over'); });
    appContainer.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        appContainer.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try { await createNewTab(file.path, event.target.result); }
                    catch (error) { notificationManager.error(i18n.t('notifications.failedToLoadFile') + ' ' + i18n.t('notifications.tryAgain')); }
                };
                reader.readAsText(file);
            } else {
                notificationManager.warning(i18n.t('notifications.pleaseDropMarkdown'));
            }
        }
    });
}

/**
 * Setup tab bar event handlers
 */
function setupTabBarHandlers() {
    const tabBar = registry.get('tabBar');
    tabBar.onTabClick(async (tabId) => await switchToTab(tabId));
    tabBar.onTabClose(async (tabId) => await closeTab(tabId));
}

/**
 * Setup sidebar integration with tab system
 */
function setupSidebarIntegration() {
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    if (!fileTreeSidebar) return;

    fileTreeSidebar.onFileClick(async (filePath) => {
        try {
            const allTabsResult = await window.electronAPI.getAllTabs();
            if (allTabsResult.success && allTabsResult.tabs) {
                const existingTab = allTabsResult.tabs.find(tab => tab.filePath === filePath);
                if (existingTab) { await switchToTab(existingTab.id); return; }
            }
            const result = await window.electronAPI.readFile(filePath);
            if (result && result.success) await createNewTab(filePath, result.content);
            else throw new Error('Failed to read file');
        } catch (error) {
            console.error('Error opening file from sidebar:', error);
            notificationManager.error(i18n.t('notifications.failedToOpenFile') + ': ' + error.message);
        }
    });

    fileTreeSidebar.onFolderToggle(async (folderPath, isExpanded) => {
        try {
            const result = await window.electronAPI.getConfig('workspace.expandedFolders');
            const expandedFolders = result?.value || [];
            if (isExpanded) { if (!expandedFolders.includes(folderPath)) expandedFolders.push(folderPath); }
            else { const index = expandedFolders.indexOf(folderPath); if (index !== -1) expandedFolders.splice(index, 1); }
            await window.electronAPI.setConfig('workspace.expandedFolders', expandedFolders);
        } catch (error) {
            console.error('Error persisting folder expansion state:', error);
        }
    });
}

/**
 * Restore workspace from previous session
 */
async function restoreWorkspace() {
    const fileTreeSidebar = registry.get('fileTreeSidebar');
    if (!fileTreeSidebar) return;
    try {
        const result = await window.electronAPI.restoreWorkspace();
        if (result.success && result.tree && result.tree.length > 0) {
            await fileTreeSidebar.loadWorkspace(result.tree);
            const sidebarVisibleResult = await window.electronAPI.getConfig('workspace.sidebarVisible');
            if (sidebarVisibleResult?.value !== false) await fileTreeSidebar.setVisibility(true);
        }
    } catch (error) {
        console.error('Error restoring workspace:', error);
    }
}

/**
 * Restore tabs from previous session
 */
async function restoreTabsFromSession() {
    const tabBar = registry.get('tabBar');
    try {
        const result = await window.electronAPI.restoreTabs();
        if (result.success) {
            const tabsResult = await window.electronAPI.getAllTabs();
            if (tabsResult.success && tabsResult.tabs.length > 0) {
                for (const tab of tabsResult.tabs) {
                    tabBar.addTab(tab.id, tab.title, false, tab.isModified);
                    attachTooltipToTabCloseButton(tab.id, tab.title);
                }
                const activeResult = await window.electronAPI.getActiveTab();
                if (activeResult.success && activeResult.tab) await switchToTab(activeResult.tab.id);
                document.body.classList.add('has-tabs');
                return;
            }
        }
        await createNewTab();
    } catch (error) {
        console.error('Error restoring tabs:', error);
        await createNewTab();
    }
}

module.exports = {
    init,
    handleMenuAction,
    handleNewFile,
    handleOpenFile,
    handleOpenRecentFile,
    handleOpenFolder,
    handleCloseFolder,
    handleSaveFile,
    handleSaveFileAs,
    handleSaveAll,
    handleExportHTML,
    handleExportPDF,
    handleTemplateInsert,
    handleToggleLineNumbers,
    toggleOutlinePanel,
    toggleTypewriterScrolling,
    updateDirtyState,
    createNewTab,
    switchToTab,
    closeTab,
    showAboutDialog,
    setupKeyboardShortcuts,
    setupDragAndDrop,
    setupTabBarHandlers,
    setupSidebarIntegration,
    restoreWorkspace,
    restoreTabsFromSession,
    attachTooltipToTabCloseButton,
    setupIPCListeners: function setupIPCListeners() {
        const editor = registry.get('editor');
        removeFileDroppedListener = window.electronAPI.onFileDropped(async (filePath) => {
            const result = await window.electronAPI.readFile(filePath);
            if (result && result.success) {
                state.currentFilePath = filePath;
                editor.setContent(result.content);
            }
        });
        removeMenuActionListener = window.electronAPI.onMenuAction(async (action, data) => {
            await handleMenuAction(action, data);
        });
    },
    getCleanupRefs: () => ({ removeFileDroppedListener, removeMenuActionListener })
};

// Module-level listener refs for cleanup
let removeFileDroppedListener = null;
let removeMenuActionListener = null;
