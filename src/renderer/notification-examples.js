/**
 * Examples of how to use the notification system
 * Replace all alert(), confirm(), and prompt() calls with these methods
 */

const notificationManager = require('./notification.js');

// ============================================
// REPLACING alert()
// ============================================

// OLD WAY:
// alert('File saved successfully!');

// NEW WAY - Success notification:
notificationManager.success('File saved successfully!');

// NEW WAY - Error notification:
notificationManager.error('Failed to save file. Please try again.');

// NEW WAY - Warning notification:
notificationManager.warning('Unsaved changes will be lost.');

// NEW WAY - Info notification:
notificationManager.info('Press Ctrl+S to save your work.');

// ============================================
// REPLACING confirm()
// ============================================

// OLD WAY:
// if (confirm('Are you sure you want to delete this file?')) {
//   deleteFile();
// }

// NEW WAY:
async function handleDelete() {
    const confirmed = await notificationManager.confirm(
        'Are you sure you want to delete this file?',
        {
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'warning'
        }
    );

    if (confirmed) {
        deleteFile();
    }
}

// ============================================
// REPLACING prompt()
// ============================================

// OLD WAY:
// const filename = prompt('Enter filename:', 'untitled.md');
// if (filename) {
//   saveAs(filename);
// }

// NEW WAY:
async function handleSaveAs() {
    const filename = await notificationManager.prompt(
        'Enter filename:',
        'untitled.md',
        {
            confirmText: 'Save',
            cancelText: 'Cancel',
            placeholder: 'filename.md',
            type: 'info'
        }
    );

    if (filename) {
        saveAs(filename);
    }
}

// ============================================
// ADVANCED USAGE
// ============================================

// Persistent notification (doesn't auto-dismiss)
const notificationId = notificationManager.show(
    'Processing large file...',
    'info',
    0 // 0 = persistent
);

// Later, dismiss it manually:
notificationManager.dismiss(notificationId);

// Custom duration
notificationManager.success('Quick message!', 2000); // 2 seconds

// Chaining notifications
async function saveWorkflow() {
    try {
        notificationManager.info('Saving file...');
        await saveFile();
        notificationManager.success('File saved successfully!');
    } catch (error) {
        notificationManager.error(`Failed to save: ${error.message}`);
    }
}

// ============================================
// MIGRATION GUIDE
// ============================================

/*
1. Find all alert() calls:
   - Replace with notificationManager.success/error/warning/info()
   - Choose appropriate type based on context

2. Find all confirm() calls:
   - Replace with await notificationManager.confirm()
   - Make function async if needed
   - Update conditional logic to use returned boolean

3. Find all prompt() calls:
   - Replace with await notificationManager.prompt()
   - Make function async if needed
   - Check for null (cancelled) vs empty string

4. Test all replacements:
   - Verify user experience is improved
   - Check that async/await doesn't break flow
   - Ensure error handling still works
*/

module.exports = {
    handleDelete,
    handleSaveAs,
    saveWorkflow
};
