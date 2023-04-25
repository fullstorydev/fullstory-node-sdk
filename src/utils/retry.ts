import { isFSError } from '../errors';
import { FSMaxRetryError } from '../errors/maxRetry';

/*
 * withDelay wraps func to be invoked with a delay.
 * Resolves if func resolves.
 * If func rejects with retry-able error, resolves with the error and retryIn milliseconds.
 */
export async function withDelay<T>(func: () => Promise<T>, delay = 0): Promise<T> {
    return new Promise((res, rej) => {
        setTimeout(() => {
            func()
                .then(res)
                .catch(rej);
        }, delay);
    });
}

export async function withRetry<T>(func: () => Promise<T>, onError: (err: unknown) => void, limit = 3, initialDelay = 0): Promise<T> {
    let tries = 0;
    let delay = initialDelay;
    while (limit > tries) {
        tries++;
        try {
            return await withDelay(func, delay);
        } catch (err: unknown) {
            onError(err);
            if (!isFSError(err) || !err.canRetry()) {
                throw err;
            }
            /*
             * TODO(sabrina):
             * Minimal effort to reasonably retry with exponential back-off and
             * at least wait for retry after. This could be an issue if there are
             * multiple jobs/nodes running all at once. Consider allowing custom
             * delay calculation using something more reasonable like distributed cache.
             * Should eventually allow custom retry strategies
             */
            delay = err.getRetryAfter() + delay * 2;
        }
    }
    throw new FSMaxRetryError(`max number of retry ${limit} reached`);
}
