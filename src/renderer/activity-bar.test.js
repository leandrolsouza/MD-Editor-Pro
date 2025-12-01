/**
 * Activity Bar Tests
 */

const { JSDOM } = require('jsdom');
const ActivityBar = require('./activity-bar.js');

describe('ActivityBar', () => {
    let dom;
    let document;
    let activityBar;

    beforeEach(() => {
        // Setup DOM
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <div id="app-container"></div>
                </body>
            </html>
        `);
        document = dom.window.document;
        global.document = document;
        global.window = dom.window;

        // Create activity bar instance
        activityBar = new ActivityBar();
    });

    afterEach(() => {
        // Cleanup
        if (activityBar.container) {
            activityBar.container.remove();
        }
        if (activityBar.sidebarPanel) {
            activityBar.sidebarPanel.remove();
        }
        delete global.document;
        delete global.window;
    });

    describe('Initialization', () => {
        it('should create activity bar container', () => {
            activityBar.initialize();

            expect(activityBar.container).toBeTruthy();
            expect(activityBar.container.className).toBe('activity-bar');
            expect(document.body.contains(activityBar.container)).toBe(true);
        });

        it('should create sidebar panel', () => {
            activityBar.initialize();

            expect(activityBar.sidebarPanel).toBeTruthy();
            expect(activityBar.sidebarPanel.className).toBe('sidebar-panel');
            expect(document.body.contains(activityBar.sidebarPanel)).toBe(true);
        });

        it('should create all default activity bar items', () => {
            activityBar.initialize();

            const items = activityBar.container.querySelectorAll('.activity-bar__item');
            expect(items.length).toBe(6); // files, search, outline, templates, snippets, settings
        });

        it('should have correct data-view attributes', () => {
            activityBar.initialize();

            const filesBtn = activityBar.container.querySelector('[data-view="files"]');
            const searchBtn = activityBar.container.querySelector('[data-view="search"]');
            const outlineBtn = activityBar.container.querySelector('[data-view="outline"]');
            const settingsBtn = activityBar.container.querySelector('[data-view="settings"]');

            expect(filesBtn).toBeTruthy();
            expect(searchBtn).toBeTruthy();
            expect(outlineBtn).toBeTruthy();
            expect(settingsBtn).toBeTruthy();
        });
    });

    describe('View Registration', () => {
        beforeEach(() => {
            activityBar.initialize();
        });

        it('should register a view', () => {
            const content = document.createElement('div');
            content.textContent = 'Test Content';

            activityBar.registerView('test', 'Test View', content);

            expect(activityBar.views.has('test')).toBe(true);
            expect(activityBar.views.get('test').title).toBe('Test View');
            expect(activityBar.views.get('test').content).toBe(content);
        });

        it('should register multiple views', () => {
            const content1 = document.createElement('div');
            const content2 = document.createElement('div');

            activityBar.registerView('view1', 'View 1', content1);
            activityBar.registerView('view2', 'View 2', content2);

            expect(activityBar.views.size).toBe(2);
            expect(activityBar.views.has('view1')).toBe(true);
            expect(activityBar.views.has('view2')).toBe(true);
        });
    });

    describe('View Display', () => {
        beforeEach(() => {
            activityBar.initialize();
        });

        it('should show a registered view', () => {
            const content = document.createElement('div');
            content.textContent = 'Test Content';
            activityBar.registerView('test', 'Test View', content);

            activityBar.showView('test');

            expect(activityBar.activeView).toBe('test');
            expect(activityBar.sidebarPanel.classList.contains('visible')).toBe(true);
        });

        it('should update sidebar title when showing view', () => {
            const content = document.createElement('div');
            activityBar.registerView('test', 'My Test View', content);

            activityBar.showView('test');

            const title = activityBar.sidebarPanel.querySelector('.sidebar-panel__title');
            expect(title.textContent).toBe('My Test View');
        });

        it('should update sidebar content when showing view', () => {
            const content = document.createElement('div');
            content.id = 'test-content';
            content.textContent = 'Test Content';
            activityBar.registerView('test', 'Test View', content);

            activityBar.showView('test');

            const contentEl = activityBar.sidebarPanel.querySelector('.sidebar-panel__content');
            expect(contentEl.querySelector('#test-content')).toBeTruthy();
        });

        it('should add active class to corresponding activity bar item', () => {
            const content = document.createElement('div');
            activityBar.registerView('files', 'Files', content);

            activityBar.showView('files');

            const filesBtn = activityBar.container.querySelector('[data-view="files"]');
            expect(filesBtn.classList.contains('active')).toBe(true);
        });

        it('should add sidebar-visible class to app container', () => {
            const content = document.createElement('div');
            activityBar.registerView('test', 'Test', content);

            activityBar.showView('test');

            const appContainer = document.getElementById('app-container');
            expect(appContainer.classList.contains('sidebar-visible')).toBe(true);
        });

        it('should warn when showing unregistered view', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            activityBar.showView('nonexistent');

            expect(consoleSpy).toHaveBeenCalledWith("View 'nonexistent' not registered");
            consoleSpy.mockRestore();
        });
    });

    describe('View Toggle', () => {
        beforeEach(() => {
            activityBar.initialize();
        });

        it('should show view when toggling from hidden state', () => {
            const content = document.createElement('div');
            activityBar.registerView('test', 'Test', content);

            activityBar.toggleView('test');

            expect(activityBar.activeView).toBe('test');
            expect(activityBar.sidebarPanel.classList.contains('visible')).toBe(true);
        });

        it('should hide view when toggling from visible state', () => {
            const content = document.createElement('div');
            activityBar.registerView('test', 'Test', content);

            activityBar.showView('test');
            activityBar.toggleView('test');

            expect(activityBar.activeView).toBe(null);
            expect(activityBar.sidebarPanel.classList.contains('visible')).toBe(false);
        });

        it('should switch to different view when toggling another view', () => {
            const content1 = document.createElement('div');
            const content2 = document.createElement('div');
            activityBar.registerView('view1', 'View 1', content1);
            activityBar.registerView('view2', 'View 2', content2);

            activityBar.showView('view1');
            activityBar.toggleView('view2');

            expect(activityBar.activeView).toBe('view2');
            expect(activityBar.sidebarPanel.classList.contains('visible')).toBe(true);
        });
    });

    describe('Hide Functionality', () => {
        beforeEach(() => {
            activityBar.initialize();
        });

        it('should hide sidebar', () => {
            const content = document.createElement('div');
            activityBar.registerView('test', 'Test', content);
            activityBar.showView('test');

            activityBar.hide();

            expect(activityBar.activeView).toBe(null);
            expect(activityBar.sidebarPanel.classList.contains('visible')).toBe(false);
        });

        it('should remove active class from all items', () => {
            const content = document.createElement('div');
            activityBar.registerView('files', 'Files', content);
            activityBar.showView('files');

            activityBar.hide();

            const items = activityBar.container.querySelectorAll('.activity-bar__item');
            items.forEach(item => {
                expect(item.classList.contains('active')).toBe(false);
            });
        });

        it('should remove sidebar-visible class from app container', () => {
            const content = document.createElement('div');
            activityBar.registerView('test', 'Test', content);
            activityBar.showView('test');

            activityBar.hide();

            const appContainer = document.getElementById('app-container');
            expect(appContainer.classList.contains('sidebar-visible')).toBe(false);
        });
    });

    describe('State Queries', () => {
        beforeEach(() => {
            activityBar.initialize();
        });

        it('should return true when sidebar is visible', () => {
            const content = document.createElement('div');
            activityBar.registerView('test', 'Test', content);
            activityBar.showView('test');

            expect(activityBar.isVisible()).toBe(true);
        });

        it('should return false when sidebar is hidden', () => {
            expect(activityBar.isVisible()).toBe(false);
        });

        it('should return active view id', () => {
            const content = document.createElement('div');
            activityBar.registerView('test', 'Test', content);
            activityBar.showView('test');

            expect(activityBar.getActiveView()).toBe('test');
        });

        it('should return null when no view is active', () => {
            expect(activityBar.getActiveView()).toBe(null);
        });
    });

    describe('Event Handling', () => {
        beforeEach(() => {
            activityBar.initialize();
        });

        it('should toggle view when activity bar item is clicked', () => {
            const content = document.createElement('div');
            activityBar.registerView('files', 'Files', content);

            const filesBtn = activityBar.container.querySelector('[data-view="files"]');
            filesBtn.click();

            expect(activityBar.activeView).toBe('files');
            expect(activityBar.sidebarPanel.classList.contains('visible')).toBe(true);
        });

        it('should hide sidebar when close button is clicked', () => {
            const content = document.createElement('div');
            activityBar.registerView('test', 'Test', content);
            activityBar.showView('test');

            const closeBtn = activityBar.sidebarPanel.querySelector('#sidebar-close-btn');
            closeBtn.click();

            expect(activityBar.activeView).toBe(null);
            expect(activityBar.sidebarPanel.classList.contains('visible')).toBe(false);
        });
    });
});
