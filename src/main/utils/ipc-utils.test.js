/**
 * Tests for createIPCHandler
 * Validates: Requirements 5.5
 */

const { createIPCHandler } = require('./ipc-utils');

describe('createIPCHandler', () => {
    it('executes the original handler function and returns its result', async () => {
        const handlerFn = vi.fn().mockResolvedValue({ success: true, data: 42 });
        const wrapped = createIPCHandler(handlerFn, 'test operation');

        const result = await wrapped({}, 'arg1');

        expect(result).toEqual({ success: true, data: 42 });
        expect(handlerFn).toHaveBeenCalledOnce();
    });

    it('passes event and all args correctly to the original function', async () => {
        const handlerFn = vi.fn().mockResolvedValue(null);
        const wrapped = createIPCHandler(handlerFn, 'test operation');

        const fakeEvent = { sender: 'renderer' };
        await wrapped(fakeEvent, 'arg1', 'arg2', 123);

        expect(handlerFn).toHaveBeenCalledWith(fakeEvent, 'arg1', 'arg2', 123);
    });

    it('re-throws the error when the handler function throws', async () => {
        const originalError = new Error('something went wrong');
        const handlerFn = vi.fn().mockRejectedValue(originalError);
        const wrapped = createIPCHandler(handlerFn, 'doing something');

        await expect(wrapped({})).rejects.toThrow('something went wrong');
    });

    it('logs the error with context when the handler throws', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const originalError = new Error('disk full');
        const handlerFn = vi.fn().mockRejectedValue(originalError);
        const wrapped = createIPCHandler(handlerFn, 'saving file');

        await expect(wrapped({})).rejects.toThrow();

        expect(errorSpy).toHaveBeenCalledOnce();
        expect(errorSpy).toHaveBeenCalledWith('Error saving file:', originalError);

        errorSpy.mockRestore();
    });

    it('re-throws the exact same error object (not a wrapped one)', async () => {
        const originalError = new Error('original');
        const handlerFn = vi.fn().mockRejectedValue(originalError);
        const wrapped = createIPCHandler(handlerFn, 'context');

        let caughtError;
        try {
            await wrapped({});
        } catch (e) {
            caughtError = e;
        }

        expect(caughtError).toBe(originalError);
    });

    it('returns a function (the wrapped handler)', () => {
        const handlerFn = vi.fn();
        const wrapped = createIPCHandler(handlerFn, 'context');

        expect(typeof wrapped).toBe('function');
    });

    it('works with handlers that receive no extra args beyond event', async () => {
        const handlerFn = vi.fn().mockResolvedValue('result');
        const wrapped = createIPCHandler(handlerFn, 'no-args operation');

        const result = await wrapped({ sender: 'test' });

        expect(result).toBe('result');
        expect(handlerFn).toHaveBeenCalledWith({ sender: 'test' });
    });
});
