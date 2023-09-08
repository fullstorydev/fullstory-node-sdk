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
