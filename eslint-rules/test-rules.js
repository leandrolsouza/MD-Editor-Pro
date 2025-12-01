/**
 * Simple test file to verify custom ESLint rules are working
 * This file intentionally contains violations to test the rules
 */

// Test 1: async-error-handling rule
// This should trigger an error - async function without try-catch
async function testAsyncWithoutTryCatch() {
    const result = await someAsyncOperation();

    return result;
}

// Test 2: ipc-error-format rule
// This should trigger an error - IPC handler without try-catch
const { ipcMain } = require('electron');

ipcMain.handle('test:channel', async (event, data) => {
    const result = await processData(data);

    return { success: true, result };
});

// Test 3: error-logging rule
// This should trigger a warning - catch block without logging
function testCatchWithoutLogging() {
    try {
        riskyOperation();
    } catch (error) {
        // No logging here - should trigger warning
    }
}

// Test 4: promise-rejection-handler rule
// This should trigger a warning - promise without catch
function testPromiseWithoutCatch() {
    someAsyncOperation()
        .then(result => {
            console.log(result);
        });
    // Missing .catch() - should trigger warning
}

// Dummy functions to make the code valid
function someAsyncOperation() {
    return Promise.resolve('test');
}

function processData(data) {
    return Promise.resolve(data);
}

function riskyOperation() {
    throw new Error('test');
}
