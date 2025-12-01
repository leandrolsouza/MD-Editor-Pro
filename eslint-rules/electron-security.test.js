/**
 * Tests for Electron Security ESLint Rules
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect } from 'vitest';
import { RuleTester } from 'eslint';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ipcHandlerPattern = require('./ipc-handler-pattern');
const contextbridgeUsage = require('./contextbridge-usage');
const rendererNodeApi = require('./renderer-node-api');
const electronapiInterface = require('./electronapi-interface');

const ruleTester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'commonjs'
    }
});

describe('Electron Security Rules', () => {
    describe('ipc-handler-pattern', () => {
        it('should detect async handlers using ipcMain.on', () => {
            ruleTester.run('ipc-handler-pattern', ipcHandlerPattern, {
                valid: [
                    {
                        code: `
                            const { ipcMain } = require('electron');
                            ipcMain.handle('test', async () => {
                                return { success: true };
                            });
                        `
                    },
                    {
                        code: `
                            const { ipcMain } = require('electron');
                            ipcMain.on('test', (event) => {
                                event.reply('response', 'data');
                            });
                        `
                    }
                ],
                invalid: [
                    {
                        code: `
                            const { ipcMain } = require('electron');
                            ipcMain.on('test', async () => {
                                return { success: true };
                            });
                        `,
                        errors: [{ messageId: 'useHandleForAsync' }]
                    }
                ]
            });
        });
    });

    describe('contextbridge-usage', () => {
        it('should warn about direct window assignment in preload', () => {
            ruleTester.run('contextbridge-usage', contextbridgeUsage, {
                valid: [
                    {
                        code: `
                            const { contextBridge } = require('electron');
                            contextBridge.exposeInMainWorld('api', {});
                        `,
                        filename: 'src/preload/index.js'
                    }
                ],
                invalid: [
                    {
                        code: `
                            window.electronAPI = {};
                        `,
                        filename: 'src/preload/index.js',
                        errors: [{ messageId: 'useContextBridge' }]
                    },
                    {
                        code: `
                            const { ipcRenderer } = require('electron');
                            window.api = { ipcRenderer };
                        `,
                        filename: 'src/preload/index.js',
                        errors: [{ messageId: 'noDirectIpcRenderer' }]
                    }
                ]
            });
        });
    });

    describe('renderer-node-api', () => {
        it('should detect Node.js API usage in renderer', () => {
            ruleTester.run('renderer-node-api', rendererNodeApi, {
                valid: [
                    {
                        code: `
                            const myModule = require('./my-module');
                            const lodash = require('lodash');
                        `,
                        filename: 'src/renderer/index.js'
                    }
                ],
                invalid: [
                    {
                        code: `
                            const fs = require('fs');
                        `,
                        filename: 'src/renderer/index.js',
                        errors: [{ messageId: 'noNodeModule' }]
                    },
                    {
                        code: `
                            const electron = require('electron');
                        `,
                        filename: 'src/renderer/index.js',
                        errors: [{ messageId: 'noNodeModule' }]
                    },
                    {
                        code: `
                            console.log(process.versions);
                        `,
                        filename: 'src/renderer/index.js',
                        errors: [{ messageId: 'noNodeGlobal' }]
                    }
                ]
            });
        });
    });

    describe('electronapi-interface', () => {
        it('should detect direct ipcRenderer usage in renderer', () => {
            ruleTester.run('electronapi-interface', electronapiInterface, {
                valid: [
                    {
                        code: `
                            window.electronAPI.openFile();
                        `,
                        filename: 'src/renderer/index.js'
                    }
                ],
                invalid: [
                    {
                        code: `
                            const { ipcRenderer } = require('electron');
                            ipcRenderer.invoke('test');
                        `,
                        filename: 'src/renderer/index.js',
                        errors: [{ messageId: 'noDirectIpcRenderer' }]
                    }
                ]
            });
        });
    });
});
