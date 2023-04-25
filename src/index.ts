import { FSUnknownError } from './errors';
import { FullStoryClient, FullStoryImpl } from './fullstory';
import { FullStoryOptions } from './http';

export function init(opts: FullStoryOptions): FullStoryClient {
    if (!opts.apiKey) {
        throw new FSUnknownError('apiKey is required in opts');
    }
    const apiKey = opts.apiKey.indexOf(' ') < 0 ? `Basic ${opts.apiKey}` : opts.apiKey;
    return new FullStoryImpl({ ...opts, apiKey });
}

export { BatchJobOptions, IBatchJob } from './batch';
export { FSError, FSErrorName, isFSError } from './errors';
export { IBatchEventsApi, IEventsApi } from './events';
export { IBatchUsersApi, IUsersApi } from './users';
export * from '@api/index';
export * from '@model/index';
