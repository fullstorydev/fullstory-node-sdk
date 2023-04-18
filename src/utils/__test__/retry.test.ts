import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import { FSApiError } from '../../errors';
import { FSMaxRetryError } from '../../errors/maxRetry';
import { withDelay, withRetry } from '../retry';

beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
});

describe('withDelay function', () => {
    test('should call func after delay', async () => {
        const func = jest.fn(async () => true);

        withDelay(func, 10);
        jest.advanceTimersByTime(5);
        expect(func).toBeCalledTimes(0);
        jest.advanceTimersByTime(5);
        expect(func).toBeCalledTimes(1);
    });

    test('should reject if not retry-able error', async () => {
        const e = new Error('a bad error');
        const func = jest.fn(async () => { throw e; });
        const promise = withDelay(func, 0);
        jest.runAllTimers();
        await expect(promise).rejects.toEqual(e);
    });

    test('should reject if with retry-in', async () => {
        const e = new FSApiError('a transient error', 429, { 'retry-after': '1' });
        const func = jest.fn(async () => { throw e; });
        const promise = withDelay(func, 20);
        jest.runAllTimers();
        await expect(promise).rejects.toEqual(e);
    });
});

describe('withRetry function', () => {
    const retryableError = new FSApiError('retry test', 429, { 'retry-after': '1' });

    test('should resolve if success', async () => {
        const func = jest.fn(async () => true);
        const onError = jest.fn();

        const promise = withRetry(func, onError, 3, 500);
        jest.runAllTimers();

        await expect(promise).resolves.toBe(true);
        expect(func).toBeCalledTimes(1);
        expect(onError).toBeCalledTimes(0);
    });

    test('should reject if all retries failed', async () => {
        const func = jest.fn(async () => { throw retryableError; });
        const onError = jest.fn();

        // without this wrapper will risk uncaught error while running all timers
        const promise = withRetry(func, onError, 2, 0);

        // 1st try
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 0);
        await jest.runOnlyPendingTimersAsync();
        expect(func).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenLastCalledWith(retryableError);

        // 2nd try
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000); //retry-after 1sec
        jest.runOnlyPendingTimers();
        await expect(promise).rejects.toBeInstanceOf(FSMaxRetryError);
        expect(func).toHaveBeenCalledTimes(2);
        expect(onError).toHaveBeenCalledTimes(2);
        expect(onError).toHaveBeenLastCalledWith(retryableError);
    });
});
