/**
 * Tests for Resource Leak Detection Rules
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect } from 'vitest';
import { RuleTester } from 'eslint';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const eventListenerCleanup = require('./event-listener-cleanup');
const timerCleanup = require('./timer-cleanup');
const componentResourceCleanup = require('./component-resource-cleanup');
const fileHandleCleanup = require('./file-handle-cleanup');

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2021,
        sourceType: 'commonjs'
    }
});

describe('Resource Leak Detection Rules', () => {
    describe('event-listener-cleanup', () => {
        it('should detect event listeners without cleanup', () => {
            ruleTester.run('event-listener-cleanup', eventListenerCleanup, {
                valid: [
                    // Listener stored in variable (caller responsible)
                    {
                        code: `
                            const listener = element.addEventListener('click', handler);
                        `
                    },
                    // Listener in class with cleanup method
                    {
                        code: `
                            class Component {
                                init() {
                                    this.element.addEventListener('click', this.handler);
                                }
                                cleanup() {
                                    this.element.removeEventListener('click', this.handler);
                                }
                            }
                        `
                    },
                    // Listener returned (caller responsible)
                    {
                        code: `
                            function setupListener() {
                                return element.addEventListener('click', handler);
                            }
                        `
                    }
                ],
                invalid: [
                    // Listener without cleanup
                    {
                        code: `
                            element.addEventListener('click', handler);
                        `,
                        errors: [{
                            messageId: 'missingCleanup'
                        }]
                    }
                ]
            });
        });
    });

    describe('timer-cleanup', () => {
        it('should detect timers without cleanup', () => {
            ruleTester.run('timer-cleanup', timerCleanup, {
                valid: [
                    // Timer stored in variable
                    {
                        code: `
                            const timerId = setInterval(() => {}, 1000);
                            clearInterval(timerId);
                        `
                    },
                    // Timer returned
                    {
                        code: `
                            function createTimer() {
                                return setInterval(() => {}, 1000);
                            }
                        `
                    }
                ],
                invalid: [
                    // Timer not stored
                    {
                        code: `
                            setInterval(() => {}, 1000);
                        `,
                        errors: [{
                            messageId: 'storeTimerId'
                        }]
                    },
                    // Timer stored but not cleared
                    {
                        code: `
                            const timerId = setInterval(() => {}, 1000);
                        `,
                        errors: [{
                            messageId: 'intervalNotCleared'
                        }]
                    }
                ]
            });
        });
    });

    describe('component-resource-cleanup', () => {
        it('should detect classes with resources but no cleanup', () => {
            ruleTester.run('component-resource-cleanup', componentResourceCleanup, {
                valid: [
                    // Class with cleanup method
                    {
                        code: `
                            class FileHandler {
                                constructor() {
                                    this.stream = fs.createReadStream('file.txt');
                                }
                                cleanup() {
                                    this.stream.close();
                                }
                            }
                        `
                    }
                ],
                invalid: [
                    // Class without cleanup method
                    {
                        code: `
                            class FileHandler {
                                constructor() {
                                    this.stream = fs.createReadStream('file.txt');
                                }
                            }
                        `,
                        errors: [{
                            messageId: 'missingCleanupMethod'
                        }]
                    }
                ]
            });
        });
    });

    describe('file-handle-cleanup', () => {
        it('should detect file handles without cleanup', () => {
            ruleTester.run('file-handle-cleanup', fileHandleCleanup, {
                valid: [
                    // Stream stored and closed
                    {
                        code: `
                            const stream = fs.createReadStream('file.txt');
                            stream.close();
                        `
                    },
                    // Stream piped (auto-closes)
                    {
                        code: `
                            fs.createReadStream('file.txt').pipe(destination);
                        `
                    },
                    // Stream returned
                    {
                        code: `
                            function openFile() {
                                return fs.createReadStream('file.txt');
                            }
                        `
                    }
                ],
                invalid: [
                    // Stream not stored
                    {
                        code: `
                            fs.createReadStream('file.txt');
                        `,
                        errors: [{
                            messageId: 'storeFileHandle'
                        }]
                    },
                    // Stream stored but not closed
                    {
                        code: `
                            const stream = fs.createReadStream('file.txt');
                        `,
                        errors: [{
                            messageId: 'streamNotClosed'
                        }]
                    }
                ]
            });
        });
    });
});
