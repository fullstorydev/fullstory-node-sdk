import { FSInvalidArgumentError } from './errors/invalidArgument';
import { FullStoryClient, FullStoryImpl } from './fullstory';
import { FullStoryOptions } from './http';

export function init(opts: FullStoryOptions): FullStoryClient {
    if (!opts.apiKey) {
        throw new FSInvalidArgumentError('The apiKey is required in opts.');
    }
    const apiKey = opts.apiKey.indexOf(' ') < 0 ? `Basic ${opts.apiKey}` : opts.apiKey;
    return new FullStoryImpl({ ...opts, apiKey });
}

export { BatchJobOptions } from './batch';
export { FSError, FSErrorName, isFSError } from './errors';
export { IBatchEventsJob as BatchEventsJob, IEvents as Events } from './events';
export { FullStoryClient } from './fullstory';
export { FullStoryOptions } from './http';
export { IBatchUsersJob as BatchUsersJob, IUsers as Users } from './users';
export * from '@api/index';
export * from '@model/index';
