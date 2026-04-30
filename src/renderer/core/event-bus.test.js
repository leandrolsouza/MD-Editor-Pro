/**
 * Tests for EventBus
 * Validates: Requirements 4.1, 4.2, 4.3
 */

// The module exports a singleton instance. We get the class from the instance's constructor
// so we can create fresh, isolated instances for each test.
const singleton = require('./event-bus');
const EventBusClass = singleton.constructor;

let eventBus;

describe('EventBus', () => {
    beforeEach(() => {
        eventBus = new EventBusClass();
    });

    describe('on()', () => {
        it('registers a listener and returns a cleanup function', () => {
            const callback = vi.fn();
            const cleanup = eventBus.on('test-event', callback);

            expect(typeof cleanup).toBe('function');
        });

        it('listener is called when the event is emitted', () => {
            const callback = vi.fn();
            eventBus.on('test-event', callback);
            eventBus.emit('test-event', 'payload');

            expect(callback).toHaveBeenCalledOnce();
            expect(callback).toHaveBeenCalledWith('payload');
        });

        it('multiple listeners for the same event are all called', () => {
            const cb1 = vi.fn();
            const cb2 = vi.fn();
            eventBus.on('test-event', cb1);
            eventBus.on('test-event', cb2);
            eventBus.emit('test-event');

            expect(cb1).toHaveBeenCalledOnce();
            expect(cb2).toHaveBeenCalledOnce();
        });
    });

    describe('emit()', () => {
        it('calls all registered listeners for the event', () => {
            const cb1 = vi.fn();
            const cb2 = vi.fn();
            eventBus.on('my-event', cb1);
            eventBus.on('my-event', cb2);
            eventBus.emit('my-event', 1, 2);

            expect(cb1).toHaveBeenCalledWith(1, 2);
            expect(cb2).toHaveBeenCalledWith(1, 2);
        });

        it('does not call listeners for other events', () => {
            const cb = vi.fn();
            eventBus.on('other-event', cb);
            eventBus.emit('my-event');

            expect(cb).not.toHaveBeenCalled();
        });

        it('does not throw when no listeners are registered for the event', () => {
            expect(() => eventBus.emit('nonexistent-event')).not.toThrow();
        });

        it('does not fail if a listener throws an exception (error isolation)', () => {
            const throwingCb = vi.fn(() => { throw new Error('listener error'); });
            const normalCb = vi.fn();

            eventBus.on('test-event', throwingCb);
            eventBus.on('test-event', normalCb);

            expect(() => eventBus.emit('test-event')).not.toThrow();
            expect(throwingCb).toHaveBeenCalledOnce();
            expect(normalCb).toHaveBeenCalledOnce();
        });
    });

    describe('off()', () => {
        it('removes a specific listener', () => {
            const cb = vi.fn();
            eventBus.on('test-event', cb);
            eventBus.off('test-event', cb);
            eventBus.emit('test-event');

            expect(cb).not.toHaveBeenCalled();
        });

        it('only removes the specified listener, leaving others intact', () => {
            const cb1 = vi.fn();
            const cb2 = vi.fn();
            eventBus.on('test-event', cb1);
            eventBus.on('test-event', cb2);
            eventBus.off('test-event', cb1);
            eventBus.emit('test-event');

            expect(cb1).not.toHaveBeenCalled();
            expect(cb2).toHaveBeenCalledOnce();
        });

        it('does not throw when removing a listener for an event with no listeners', () => {
            const cb = vi.fn();
            expect(() => eventBus.off('nonexistent-event', cb)).not.toThrow();
        });
    });

    describe('once()', () => {
        it('executes the callback only once', () => {
            const cb = vi.fn();
            eventBus.once('test-event', cb);
            eventBus.emit('test-event');
            eventBus.emit('test-event');
            eventBus.emit('test-event');

            expect(cb).toHaveBeenCalledOnce();
        });

        it('passes arguments to the callback', () => {
            const cb = vi.fn();
            eventBus.once('test-event', cb);
            eventBus.emit('test-event', 'arg1', 'arg2');

            expect(cb).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('returns a cleanup function', () => {
            const cb = vi.fn();
            const cleanup = eventBus.once('test-event', cb);

            expect(typeof cleanup).toBe('function');
        });
    });

    describe('cleanup function returned by on()', () => {
        it('removes the listener when called', () => {
            const cb = vi.fn();
            const cleanup = eventBus.on('test-event', cb);

            cleanup();
            eventBus.emit('test-event');

            expect(cb).not.toHaveBeenCalled();
        });

        it('can be called multiple times without error', () => {
            const cb = vi.fn();
            const cleanup = eventBus.on('test-event', cb);

            expect(() => {
                cleanup();
                cleanup();
            }).not.toThrow();
        });
    });

    describe('clear()', () => {
        it('removes all listeners', () => {
            const cb1 = vi.fn();
            const cb2 = vi.fn();
            eventBus.on('event-a', cb1);
            eventBus.on('event-b', cb2);

            eventBus.clear();
            eventBus.emit('event-a');
            eventBus.emit('event-b');

            expect(cb1).not.toHaveBeenCalled();
            expect(cb2).not.toHaveBeenCalled();
        });

        it('does not throw when called on an empty bus', () => {
            expect(() => eventBus.clear()).not.toThrow();
        });
    });
});
