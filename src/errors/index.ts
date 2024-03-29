import { FSErrorName } from './base';
import { FSUnknownError } from './unknown';

export * from './api';
export { FSErrorName } from './base';
export * from './parser';
export * from './timeout';
export * from './unknown';

export interface FSError extends Error {
    discriminator: 'FSError';
    name: FSErrorName;
    [key: string]: any;

    chain: (newError: Error) => FSError;
    canRetry(): boolean;
    getRetryAfter(): number; // in ms
}

export function isFSError(o: any): o is FSError {
    return 'discriminator' in o && o.discriminator === 'FSError';
}

// helper function to create a new error with chained stacktrace
export function chainedFSError(e: any): FSError {
    if (isFSError(e)) {
        // chain the stack trace if is already FSError
        return e.chain(new Error());
    }
    return new FSUnknownError(`${e?.message || e}`, e);
}
