import { FSInvalidArgumentError } from './errors/invalidArgument';
import { Events, EventsImpl } from './events';
import { FullStoryOptions, WithOptions } from './http';
import { Users, UsersImpl } from './users';

export interface FullStoryClient {
    readonly users: Users & WithOptions<Users>;
    readonly events: Events & WithOptions<Events>;
}

export class FullStoryImpl implements FullStoryClient {
    readonly users: Users & WithOptions<Users>;
    readonly events: Events & WithOptions<Events>;

    constructor(private opts: FullStoryOptions) {
        this.users = new UsersImpl(opts);
        this.events = new EventsImpl(opts);
    }
}

export function init(opts: FullStoryOptions): FullStoryClient {
    if (!opts.apiKey) {
        throw new FSInvalidArgumentError('The apiKey is required in opts.');
    }
    const apiKey = opts.apiKey.indexOf(' ') < 0 ? `Basic ${opts.apiKey}` : opts.apiKey;
    return new FullStoryImpl({ ...opts, apiKey });
}
