/**
 * Tests for ComponentRegistry
 * Validates: Requirements 3.1, 3.2
 */

const ComponentRegistry = require('./component-registry');

let registry;

describe('ComponentRegistry', () => {
    beforeEach(() => {
        registry = new ComponentRegistry();
    });

    describe('register() and get()', () => {
        it('stores a component accessible via get()', () => {
            const instance = { name: 'editor' };
            registry.register('editor', instance);

            expect(registry.get('editor')).toBe(instance);
        });

        it('stores multiple components independently', () => {
            const editor = { type: 'editor' };
            const preview = { type: 'preview' };
            registry.register('editor', editor);
            registry.register('preview', preview);

            expect(registry.get('editor')).toBe(editor);
            expect(registry.get('preview')).toBe(preview);
        });
    });

    describe('get()', () => {
        it('returns null for a component that has not been registered', () => {
            expect(registry.get('nonexistent')).toBeNull();
        });

        it('returns null after the registry is cleared', () => {
            registry.register('editor', {});
            registry.clear();

            expect(registry.get('editor')).toBeNull();
        });
    });

    describe('getAll()', () => {
        it('returns a Map containing all registered components', () => {
            const editor = { type: 'editor' };
            const preview = { type: 'preview' };
            registry.register('editor', editor);
            registry.register('preview', preview);

            const all = registry.getAll();
            expect(all).toBeInstanceOf(Map);
            expect(all.get('editor')).toBe(editor);
            expect(all.get('preview')).toBe(preview);
            expect(all.size).toBe(2);
        });

        it('returns a copy of the internal Map (not the same reference)', () => {
            registry.register('editor', {});
            const all = registry.getAll();

            // Mutating the returned map should not affect the registry
            all.set('injected', {});
            expect(registry.get('injected')).toBeNull();
        });

        it('returns an empty Map when no components are registered', () => {
            const all = registry.getAll();
            expect(all.size).toBe(0);
        });
    });

    describe('register() with duplicate name', () => {
        it('overwrites the existing component', () => {
            const original = { version: 1 };
            const replacement = { version: 2 };
            registry.register('editor', original);
            registry.register('editor', replacement);

            expect(registry.get('editor')).toBe(replacement);
        });

        it('emits a console.warn when overwriting an existing component', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            registry.register('editor', {});
            registry.register('editor', {});

            expect(warnSpy).toHaveBeenCalledOnce();
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining("Component 'editor' already registered")
            );

            warnSpy.mockRestore();
        });

        it('does not warn on first registration', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            registry.register('editor', {});

            expect(warnSpy).not.toHaveBeenCalled();
            warnSpy.mockRestore();
        });
    });

    describe('clear()', () => {
        it('removes all registered components', () => {
            registry.register('editor', {});
            registry.register('preview', {});
            registry.register('tabBar', {});

            registry.clear();

            expect(registry.get('editor')).toBeNull();
            expect(registry.get('preview')).toBeNull();
            expect(registry.get('tabBar')).toBeNull();
            expect(registry.getAll().size).toBe(0);
        });

        it('does not throw when called on an empty registry', () => {
            expect(() => registry.clear()).not.toThrow();
        });
    });
});
