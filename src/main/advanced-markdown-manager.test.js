/**
 * Tests for AdvancedMarkdownManager
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import AdvancedMarkdownManager from './advanced-markdown-manager.js';

describe('AdvancedMarkdownManager', () => {
    let mockConfigStore;
    let manager;

    beforeEach(() => {
        // Create a mock ConfigStore
        mockConfigStore = {
            data: {},
            get(key) {
                return this.data[key];
            },
            set(key, value) {
                this.data[key] = value;
            }
        };
    });

    describe('Constructor and Initialization', () => {
        it('should throw error if ConfigStore is not provided', () => {
            expect(() => new AdvancedMarkdownManager()).toThrow('ConfigStore is required');
        });

        it('should initialize with default features when no saved config exists', () => {
            manager = new AdvancedMarkdownManager(mockConfigStore);

            expect(manager.isFeatureEnabled('mermaid')).toBe(true);
            expect(manager.isFeatureEnabled('katex')).toBe(true);
            expect(manager.isFeatureEnabled('callouts')).toBe(true);
        });

        it('should load saved configuration from ConfigStore', () => {
            mockConfigStore.data.advancedMarkdown = {
                features: {
                    mermaid: false,
                    katex: true,
                    callouts: false
                }
            };

            manager = new AdvancedMarkdownManager(mockConfigStore);

            expect(manager.isFeatureEnabled('mermaid')).toBe(false);
            expect(manager.isFeatureEnabled('katex')).toBe(true);
            expect(manager.isFeatureEnabled('callouts')).toBe(false);
        });

        it('should save default configuration to store on first initialization', () => {
            manager = new AdvancedMarkdownManager(mockConfigStore);

            expect(mockConfigStore.data.advancedMarkdown).toEqual({
                features: {
                    mermaid: true,
                    katex: true,
                    callouts: true
                }
            });
        });
    });

    describe('isFeatureEnabled', () => {
        beforeEach(() => {
            manager = new AdvancedMarkdownManager(mockConfigStore);
        });

        it('should return true for enabled features', () => {
            expect(manager.isFeatureEnabled('mermaid')).toBe(true);
            expect(manager.isFeatureEnabled('katex')).toBe(true);
            expect(manager.isFeatureEnabled('callouts')).toBe(true);
        });

        it('should throw error for unknown feature names', () => {
            expect(() => manager.isFeatureEnabled('unknown')).toThrow('Unknown feature: unknown');
        });
    });

    describe('toggleFeature', () => {
        beforeEach(() => {
            manager = new AdvancedMarkdownManager(mockConfigStore);
        });

        it('should disable a feature when set to false', () => {
            manager.toggleFeature('mermaid', false);

            expect(manager.isFeatureEnabled('mermaid')).toBe(false);
        });

        it('should enable a feature when set to true', () => {
            manager.toggleFeature('mermaid', false);
            manager.toggleFeature('mermaid', true);

            expect(manager.isFeatureEnabled('mermaid')).toBe(true);
        });

        it('should persist changes to ConfigStore', () => {
            manager.toggleFeature('katex', false);

            expect(mockConfigStore.data.advancedMarkdown.features.katex).toBe(false);
        });

        it('should throw error for unknown feature names', () => {
            expect(() => manager.toggleFeature('unknown', true)).toThrow('Unknown feature: unknown');
        });

        it('should throw error for non-boolean enabled values', () => {
            expect(() => manager.toggleFeature('mermaid', 'yes')).toThrow('Invalid enabled value');
            expect(() => manager.toggleFeature('mermaid', 1)).toThrow('Invalid enabled value');
            expect(() => manager.toggleFeature('mermaid', null)).toThrow('Invalid enabled value');
        });
    });

    describe('getEnabledFeatures', () => {
        beforeEach(() => {
            manager = new AdvancedMarkdownManager(mockConfigStore);
        });

        it('should return all enabled features by default', () => {
            const enabled = manager.getEnabledFeatures();

            expect(enabled).toEqual(['mermaid', 'katex', 'callouts']);
        });

        it('should return only enabled features after toggling', () => {
            manager.toggleFeature('mermaid', false);
            manager.toggleFeature('callouts', false);

            const enabled = manager.getEnabledFeatures();

            expect(enabled).toEqual(['katex']);
        });

        it('should return empty array when all features are disabled', () => {
            manager.toggleFeature('mermaid', false);
            manager.toggleFeature('katex', false);
            manager.toggleFeature('callouts', false);

            const enabled = manager.getEnabledFeatures();

            expect(enabled).toEqual([]);
        });
    });

    describe('getAllFeatures', () => {
        beforeEach(() => {
            manager = new AdvancedMarkdownManager(mockConfigStore);
        });

        it('should return all features with their status', () => {
            const features = manager.getAllFeatures();

            expect(features).toEqual({
                mermaid: true,
                katex: true,
                callouts: true
            });
        });

        it('should return updated status after toggling', () => {
            manager.toggleFeature('mermaid', false);

            const features = manager.getAllFeatures();

            expect(features).toEqual({
                mermaid: false,
                katex: true,
                callouts: true
            });
        });

        it('should return a copy of features object', () => {
            const features = manager.getAllFeatures();
            features.mermaid = false;

            // Original should not be modified
            expect(manager.isFeatureEnabled('mermaid')).toBe(true);
        });
    });

    describe('saveConfig', () => {
        beforeEach(() => {
            manager = new AdvancedMarkdownManager(mockConfigStore);
        });

        it('should save current configuration to ConfigStore', () => {
            manager.features.mermaid = false;
            manager.saveConfig();

            expect(mockConfigStore.data.advancedMarkdown.features.mermaid).toBe(false);
        });
    });

    describe('resetToDefaults', () => {
        beforeEach(() => {
            manager = new AdvancedMarkdownManager(mockConfigStore);
        });

        it('should reset all features to default values', () => {
            manager.toggleFeature('mermaid', false);
            manager.toggleFeature('katex', false);
            manager.toggleFeature('callouts', false);

            manager.resetToDefaults();

            expect(manager.isFeatureEnabled('mermaid')).toBe(true);
            expect(manager.isFeatureEnabled('katex')).toBe(true);
            expect(manager.isFeatureEnabled('callouts')).toBe(true);
        });

        it('should persist reset configuration to ConfigStore', () => {
            manager.toggleFeature('mermaid', false);
            manager.resetToDefaults();

            expect(mockConfigStore.data.advancedMarkdown.features.mermaid).toBe(true);
        });
    });

    describe('Configuration Persistence (Requirement 6.4)', () => {
        it('should persist configuration across manager instances', () => {
            const manager1 = new AdvancedMarkdownManager(mockConfigStore);
            manager1.toggleFeature('mermaid', false);
            manager1.toggleFeature('callouts', false);

            // Create new instance with same store
            const manager2 = new AdvancedMarkdownManager(mockConfigStore);

            expect(manager2.isFeatureEnabled('mermaid')).toBe(false);
            expect(manager2.isFeatureEnabled('katex')).toBe(true);
            expect(manager2.isFeatureEnabled('callouts')).toBe(false);
        });
    });
});
