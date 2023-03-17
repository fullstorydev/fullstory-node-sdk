import { FullStoryClient, FullStoryImpl } from './fullstory';
import { FullStoryOptions } from './http';

export function init(opts: FullStoryOptions): FullStoryClient {
    return new FullStoryImpl(opts);
}
