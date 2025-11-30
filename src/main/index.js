// Main process entry point
// This file will be implemented in subsequent tasks

const { app } = require('electron');

app.whenReady().then(() => {
    console.log('Electron app is ready');
    // Window creation will be implemented in task 2
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
