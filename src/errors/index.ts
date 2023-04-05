export * from './api';
export { FSErrorName } from './base';
export * from './parser';
export * from './timeout';
export * from './unknown';

import { FSErrorName } from './base';
import { FSUnknownError } from './unknown';

export interface FSError extends Error {
    discriminator: 'FSError';
    name: FSErrorName;
    [key: string]: any;

    chain: (newError: Error) => FSError;
}

export function isFSError(o: any): o is FSError {
    return 'discriminator' in o && o.discriminator === 'FSError';
}

// helper function to create a new error with chained stacktrace
export function newAsyncError(e: any): FSError {
    if (isFSError(e)) {
        // chain the stack trace if is already FSError
        return e.chain(new Error());
    }
    return new FSUnknownError(`${e?.message || e}`, e);
}
