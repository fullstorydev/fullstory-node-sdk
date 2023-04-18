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

export * from '@api/index';
export * from '@model/index';
