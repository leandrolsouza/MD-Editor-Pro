/**
 * ConfigStore Tests
 * Tests for configuration persistence and validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ConfigStore from './config-store.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('ConfigStore', () => {
    let configStore;
    let configPath;

    beforeEach(() => {
        // Create a new ConfigStore instance for each test
        configStore = new ConfigStore();
        // Get the config file path to clean up after tests
        configPath = path.join(os.homedir(), '.config', 'md-editor-pro', 'config.json');
    });

    afterEach(() => {
        // Clean up: reset config to defaults
        configStore.reset();
    });

    describe('Auto-Save Configuration', () => {
        it('should get default auto-save enabled status', () => {
            expect(configStore.getAutoSaveEnabled()).toBe(true);
        });

        it('should set auto-save enabled status', () => {
            configStore.setAutoSaveEnabled(false);
            expect(configStore.getAutoSaveEnabled()).toBe(false);
        });

        it('should throw error for invalid auto-save enabled value', () => {
            expect(() => configStore.setAutoSaveEnabled('true')).toThrow();
            expect(() => configStore.setAutoSaveEnabled(1)).toThrow();
        });

        it('should get default auto-save delay', () => {
            expect(configStore.getAutoSaveDelay()).toBe(5);
        });

        it('should set auto-save delay within valid range', () => {
            configStore.setAutoSaveDelay(30);
            expect(configStore.getAutoSaveDelay()).toBe(30);
        });

        it('should accept minimum auto-save delay of 1 second', () => {
            configStore.setAutoSaveDelay(1);
            expect(configStore.getAutoSaveDelay()).toBe(1);
        });

        it('should accept maximum auto-save delay of 60 seconds', () => {
            configStore.setAutoSaveDelay(60);
            expect(configStore.getAutoSaveDelay()).toBe(60);
        });

        it('should throw error for auto-save delay below 1 second', () => {
            expect(() => configStore.setAutoSaveDelay(0)).toThrow('Must be between 1 and 60 seconds');
        });

        it('should throw error for auto-save delay above 60 seconds', () => {
            expect(() => configStore.setAutoSaveDelay(61)).toThrow('Must be between 1 and 60 seconds');
        });

        it('should throw error for non-integer auto-save delay', () => {
            expect(() => configStore.setAutoSaveDelay(5.5)).toThrow('Must be an integer');
            expect(() => configStore.setAutoSaveDelay('5')).toThrow('Must be an integer');
        });

        it('should get complete auto-save config', () => {
            const config = configStore.getAutoSaveConfig();
            expect(config).toEqual({ enabled: true, delay: 5 });
        });

        it('should set complete auto-save config', () => {
            configStore.setAutoSaveConfig({ enabled: false, delay: 10 });
            expect(configStore.getAutoSaveEnabled()).toBe(false);
            expect(configStore.getAutoSaveDelay()).toBe(10);
        });
    });

    describe('Statistics Configuration', () => {
        it('should get default statistics visible status', () => {
            expect(configStore.getStatisticsVisible()).toBe(true);
        });

        it('should set statistics visible status', () => {
            configStore.setStatisticsVisible(false);
            expect(configStore.getStatisticsVisible()).toBe(false);
        });

        it('should throw error for invalid statistics visible value', () => {
            expect(() => configStore.setStatisticsVisible('false')).toThrow();
        });

        it('should get default words per minute', () => {
            expect(configStore.getWordsPerMinute()).toBe(200);
        });

        it('should set words per minute', () => {
            configStore.setWordsPerMinute(250);
            expect(configStore.getWordsPerMinute()).toBe(250);
        });

        it('should throw error for invalid words per minute', () => {
            expect(() => configStore.setWordsPerMinute(0)).toThrow();
            expect(() => configStore.setWordsPerMinute(-100)).toThrow();
            expect(() => configStore.setWordsPerMinute('200')).toThrow();
        });

        it('should get complete statistics config', () => {
            const config = configStore.getStatisticsConfig();
            expect(config).toEqual({ visible: true, wordsPerMinute: 200 });
        });
    });

    describe('Focus Mode Configuration', () => {
        it('should get default focus mode last used status', () => {
            expect(configStore.getFocusModeLastUsed()).toBe(false);
        });

        it('should set focus mode last used status', () => {
            configStore.setFocusModeLastUsed(true);
            expect(configStore.getFocusModeLastUsed()).toBe(true);
        });

        it('should throw error for invalid focus mode last used value', () => {
            expect(() => configStore.setFocusModeLastUsed('true')).toThrow();
        });
    });

    describe('Keyboard Shortcuts Configuration', () => {
        it('should get undefined for non-existent shortcut', () => {
            expect(configStore.getKeyboardShortcut('save')).toBeUndefined();
        });

        it('should set and get keyboard shortcut', () => {
            configStore.setKeyboardShortcut('save', 'Ctrl-S');
            expect(configStore.getKeyboardShortcut('save')).toBe('Ctrl-S');
        });

        it('should throw error for invalid action ID', () => {
            expect(() => configStore.setKeyboardShortcut('', 'Ctrl-S')).toThrow();
            expect(() => configStore.setKeyboardShortcut(123, 'Ctrl-S')).toThrow();
        });

        it('should throw error for invalid key binding', () => {
            expect(() => configStore.setKeyboardShortcut('save', '')).toThrow();
            expect(() => configStore.setKeyboardShortcut('save', 123)).toThrow();
        });

        it('should get all keyboard shortcuts', () => {
            configStore.setKeyboardShortcut('save', 'Ctrl-S');
            configStore.setKeyboardShortcut('open', 'Ctrl-O');
            const shortcuts = configStore.getAllKeyboardShortcuts();
            expect(shortcuts).toEqual({ save: 'Ctrl-S', open: 'Ctrl-O' });
        });

        it('should set all keyboard shortcuts', () => {
            const shortcuts = { save: 'Ctrl-S', open: 'Ctrl-O' };
            configStore.setAllKeyboardShortcuts(shortcuts);
            expect(configStore.getAllKeyboardShortcuts()).toEqual(shortcuts);
        });

        it('should throw error for invalid shortcuts object', () => {
            expect(() => configStore.setAllKeyboardShortcuts(null)).toThrow();
            expect(() => configStore.setAllKeyboardShortcuts('shortcuts')).toThrow();
        });

        it('should delete keyboard shortcut', () => {
            configStore.setKeyboardShortcut('save', 'Ctrl-S');
            configStore.deleteKeyboardShortcut('save');
            expect(configStore.getKeyboardShortcut('save')).toBeUndefined();
        });
    });

    describe('Custom Templates Configuration', () => {
        it('should get empty array for default custom templates', () => {
            expect(configStore.getCustomTemplates()).toEqual([]);
        });

        it('should add custom template', () => {
            const template = {
                id: 'test-template',
                name: 'Test Template',
                category: 'test',
                content: '# Test\n\n{{content}}',
                createdAt: Date.now()
            };
            configStore.addCustomTemplate(template);
            expect(configStore.getCustomTemplates()).toHaveLength(1);
            expect(configStore.getCustomTemplate('test-template')).toEqual(template);
        });

        it('should throw error for invalid template', () => {
            expect(() => configStore.addCustomTemplate(null)).toThrow();
            expect(() => configStore.addCustomTemplate({})).toThrow('Must have a string id');
            expect(() => configStore.addCustomTemplate({ id: 'test' })).toThrow('Must have a string name');
            expect(() => configStore.addCustomTemplate({ id: 'test', name: 'Test' })).toThrow('Must have string content');
        });

        it('should throw error for duplicate template ID', () => {
            const template = {
                id: 'test-template',
                name: 'Test Template',
                content: '# Test'
            };
            configStore.addCustomTemplate(template);
            expect(() => configStore.addCustomTemplate(template)).toThrow('already exists');
        });

        it('should update custom template', () => {
            const template = {
                id: 'test-template',
                name: 'Test Template',
                content: '# Test'
            };
            configStore.addCustomTemplate(template);
            configStore.updateCustomTemplate('test-template', { name: 'Updated Template' });
            expect(configStore.getCustomTemplate('test-template').name).toBe('Updated Template');
        });

        it('should throw error when updating non-existent template', () => {
            expect(() => configStore.updateCustomTemplate('non-existent', { name: 'Test' })).toThrow('not found');
        });

        it('should delete custom template', () => {
            const template = {
                id: 'test-template',
                name: 'Test Template',
                content: '# Test'
            };
            configStore.addCustomTemplate(template);
            configStore.deleteCustomTemplate('test-template');
            expect(configStore.getCustomTemplates()).toHaveLength(0);
        });

        it('should throw error when deleting non-existent template', () => {
            expect(() => configStore.deleteCustomTemplate('non-existent')).toThrow('not found');
        });
    });

    describe('Custom Snippets Configuration', () => {
        it('should get empty array for default custom snippets', () => {
            expect(configStore.getCustomSnippets()).toEqual([]);
        });

        it('should add custom snippet', () => {
            const snippet = {
                trigger: 'test',
                content: 'Test content',
                description: 'Test snippet',
                createdAt: Date.now()
            };
            configStore.addCustomSnippet(snippet);
            expect(configStore.getCustomSnippets()).toHaveLength(1);
            expect(configStore.getCustomSnippet('test')).toEqual(snippet);
        });

        it('should throw error for invalid snippet', () => {
            expect(() => configStore.addCustomSnippet(null)).toThrow();
            expect(() => configStore.addCustomSnippet({})).toThrow('Must have a string trigger');
            expect(() => configStore.addCustomSnippet({ trigger: 'test' })).toThrow('Must have string content');
        });

        it('should throw error for duplicate snippet trigger', () => {
            const snippet = {
                trigger: 'test',
                content: 'Test content'
            };
            configStore.addCustomSnippet(snippet);
            expect(() => configStore.addCustomSnippet(snippet)).toThrow('already exists');
        });

        it('should update custom snippet', () => {
            const snippet = {
                trigger: 'test',
                content: 'Test content'
            };
            configStore.addCustomSnippet(snippet);
            configStore.updateCustomSnippet('test', { content: 'Updated content' });
            expect(configStore.getCustomSnippet('test').content).toBe('Updated content');
        });

        it('should throw error when updating non-existent snippet', () => {
            expect(() => configStore.updateCustomSnippet('non-existent', { content: 'Test' })).toThrow('not found');
        });

        it('should delete custom snippet', () => {
            const snippet = {
                trigger: 'test',
                content: 'Test content'
            };
            configStore.addCustomSnippet(snippet);
            configStore.deleteCustomSnippet('test');
            expect(configStore.getCustomSnippets()).toHaveLength(0);
        });

        it('should throw error when deleting non-existent snippet', () => {
            expect(() => configStore.deleteCustomSnippet('non-existent')).toThrow('not found');
        });
    });

    describe('Tab Management Configuration', () => {
        it('should get empty array for default last open tabs', () => {
            expect(configStore.getLastOpenTabs()).toEqual([]);
        });

        it('should set last open tabs', () => {
            const tabIds = ['tab1', 'tab2', 'tab3'];
            configStore.setLastOpenTabs(tabIds);
            expect(configStore.getLastOpenTabs()).toEqual(tabIds);
        });

        it('should throw error for invalid tab IDs', () => {
            expect(() => configStore.setLastOpenTabs('tab1')).toThrow('Must be an array');
            expect(() => configStore.setLastOpenTabs(null)).toThrow('Must be an array');
        });

        it('should get null for default active tab ID', () => {
            expect(configStore.getActiveTabId()).toBeNull();
        });

        it('should set active tab ID', () => {
            configStore.setActiveTabId('tab1');
            expect(configStore.getActiveTabId()).toBe('tab1');
        });

        it('should allow setting active tab ID to null', () => {
            configStore.setActiveTabId('tab1');
            configStore.setActiveTabId(null);
            expect(configStore.getActiveTabId()).toBeNull();
        });

        it('should throw error for invalid active tab ID', () => {
            expect(() => configStore.setActiveTabId(123)).toThrow('Must be a string or null');
        });
    });

    describe('Existing Configuration Methods', () => {
        it('should maintain backward compatibility with theme methods', () => {
            configStore.setTheme('dark');
            expect(configStore.getTheme()).toBe('dark');
        });

        it('should maintain backward compatibility with view mode methods', () => {
            configStore.setViewMode('editor');
            expect(configStore.getViewMode()).toBe('editor');
        });

        it('should maintain backward compatibility with generic get/set', () => {
            configStore.set('fontSize', 16);
            expect(configStore.get('fontSize')).toBe(16);
        });
    });
});
