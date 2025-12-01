/**
 * Tests for AdvancedMarkdownSettingsUI
 * Requirements: 6.1, 6.2, 6.3
 */

const { JSDOM } = require('jsdom');
const AdvancedMarkdownSettingsUI = require('./advanced-markdown-settings-ui.js');

describe('AdvancedMarkdownSettingsUI', () => {
    let dom;
    let settingsUI;

    beforeEach(() => {
        // Create a DOM environment
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        global.document = dom.window.document;
        global.window = dom.window;

        // Mock electronAPI
        global.window.electronAPI = {
            getAdvancedMarkdownSettings: vi.fn().mockResolvedValue({
                success: true,
                features: {
                    mermaid: true,
                    katex: true,
                    callouts: true
                }
            }),
            toggleAdvancedMarkdownFeature: vi.fn().mockResolvedValue({
                success: true
            })
        };

        settingsUI = new AdvancedMarkdownSettingsUI();
    });

    afterEach(() => {
        if (settingsUI && settingsUI.dialog) {
            settingsUI.dialog.remove();
        }
        delete global.document;
        delete global.window;
    });

    describe('Initialization', () => {
        it('should create instance with default features', () => {
            expect(settingsUI).toBeDefined();
            expect(settingsUI.features).toEqual({
                mermaid: true,
                katex: true,
                callouts: true
            });
        });

        it('should not have dialog initially', () => {
            expect(settingsUI.dialog).toBeNull();
        });
    });

    describe('Dialog Creation', () => {
        it('should create dialog on first show', async () => {
            await settingsUI.show();
            expect(settingsUI.dialog).not.toBeNull();
            expect(settingsUI.dialog.className).toBe('settings-dialog-overlay');
        });

        it('should create dialog with correct structure', async () => {
            await settingsUI.show();

            const header = settingsUI.dialog.querySelector('.settings-dialog-header');
            const body = settingsUI.dialog.querySelector('.settings-dialog-body');
            const footer = settingsUI.dialog.querySelector('.settings-dialog-footer');

            expect(header).not.toBeNull();
            expect(body).not.toBeNull();
            expect(footer).not.toBeNull();
        });

        it('should create checkboxes for all features', async () => {
            await settingsUI.show();

            const mermaidCheckbox = settingsUI.dialog.querySelector('#feature-mermaid');
            const katexCheckbox = settingsUI.dialog.querySelector('#feature-katex');
            const calloutsCheckbox = settingsUI.dialog.querySelector('#feature-callouts');

            expect(mermaidCheckbox).not.toBeNull();
            expect(katexCheckbox).not.toBeNull();
            expect(calloutsCheckbox).not.toBeNull();
        });
    });

    describe('Loading Settings', () => {
        it('should load settings from main process', async () => {
            await settingsUI.show();

            expect(window.electronAPI.getAdvancedMarkdownSettings).toHaveBeenCalled();
            expect(settingsUI.features).toEqual({
                mermaid: true,
                katex: true,
                callouts: true
            });
        });

        it('should update checkboxes with loaded settings', async () => {
            window.electronAPI.getAdvancedMarkdownSettings.mockResolvedValue({
                success: true,
                features: {
                    mermaid: false,
                    katex: true,
                    callouts: false
                }
            });

            await settingsUI.show();

            const mermaidCheckbox = settingsUI.dialog.querySelector('#feature-mermaid');
            const katexCheckbox = settingsUI.dialog.querySelector('#feature-katex');
            const calloutsCheckbox = settingsUI.dialog.querySelector('#feature-callouts');

            expect(mermaidCheckbox.checked).toBe(false);
            expect(katexCheckbox.checked).toBe(true);
            expect(calloutsCheckbox.checked).toBe(false);
        });

        it('should handle loading errors gracefully', async () => {
            window.electronAPI.getAdvancedMarkdownSettings.mockRejectedValue(
                new Error('Load failed')
            );

            await settingsUI.show();

            // Should still show dialog
            expect(settingsUI.dialog).not.toBeNull();
        });
    });

    describe('Feature Toggle', () => {
        it('should toggle feature when checkbox changes', async () => {
            await settingsUI.show();

            const mermaidCheckbox = settingsUI.dialog.querySelector('#feature-mermaid');

            mermaidCheckbox.checked = false;
            mermaidCheckbox.dispatchEvent(new dom.window.Event('change'));

            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(window.electronAPI.toggleAdvancedMarkdownFeature).toHaveBeenCalledWith(
                'mermaid',
                false
            );
        });

        it('should update local state after toggle', async () => {
            await settingsUI.show();

            const katexCheckbox = settingsUI.dialog.querySelector('#feature-katex');

            katexCheckbox.checked = false;
            katexCheckbox.dispatchEvent(new dom.window.Event('change'));

            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(settingsUI.features.katex).toBe(false);
        });

        it('should call onChange callback when feature toggles', async () => {
            const onChangeSpy = vi.fn();

            settingsUI.onChange(onChangeSpy);

            await settingsUI.show();

            const calloutsCheckbox = settingsUI.dialog.querySelector('#feature-callouts');

            calloutsCheckbox.checked = false;
            calloutsCheckbox.dispatchEvent(new dom.window.Event('change'));

            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(onChangeSpy).toHaveBeenCalledWith('callouts', false);
        });

        it('should handle toggle errors gracefully', async () => {
            window.electronAPI.toggleAdvancedMarkdownFeature.mockRejectedValue(
                new Error('Toggle failed')
            );

            await settingsUI.show();

            const mermaidCheckbox = settingsUI.dialog.querySelector('#feature-mermaid');
            const originalChecked = mermaidCheckbox.checked;

            mermaidCheckbox.checked = !originalChecked;
            mermaidCheckbox.dispatchEvent(new dom.window.Event('change'));

            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should revert checkbox state on error
            expect(mermaidCheckbox.checked).toBe(originalChecked);
        });
    });

    describe('Dialog Visibility', () => {
        it('should show dialog when show() is called', async () => {
            await settingsUI.show();
            expect(settingsUI.dialog.style.display).toBe('flex');
        });

        it('should hide dialog when hide() is called', async () => {
            await settingsUI.show();
            settingsUI.hide();
            expect(settingsUI.dialog.style.display).toBe('none');
        });

        it('should hide dialog when close button is clicked', async () => {
            await settingsUI.show();

            const closeBtn = settingsUI.dialog.querySelector('.settings-close-btn');

            closeBtn.click();

            expect(settingsUI.dialog.style.display).toBe('none');
        });

        it('should hide dialog when done button is clicked', async () => {
            await settingsUI.show();

            const doneBtn = settingsUI.dialog.querySelector('.settings-done-btn');

            doneBtn.click();

            expect(settingsUI.dialog.style.display).toBe('none');
        });

        it('should hide dialog when clicking overlay', async () => {
            await settingsUI.show();

            settingsUI.dialog.dispatchEvent(new dom.window.MouseEvent('click', {
                target: settingsUI.dialog
            }));

            expect(settingsUI.dialog.style.display).toBe('none');
        });

        it('should hide dialog on Escape key', async () => {
            await settingsUI.show();

            const escapeEvent = new dom.window.KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true
            });

            document.dispatchEvent(escapeEvent);

            expect(settingsUI.dialog.style.display).toBe('none');
        });
    });

    describe('Callback Registration', () => {
        it('should register onChange callback', () => {
            const callback = vi.fn();

            settingsUI.onChange(callback);
            expect(settingsUI.onSettingsChanged).toBe(callback);
        });
    });
});
