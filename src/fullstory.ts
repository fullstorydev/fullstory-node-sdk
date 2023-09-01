import { Events, EventsImpl } from './events';
import { FullStoryOptions } from './http';
import { Users, UsersImpl } from './users';

export interface FullStoryClient {
    readonly users: Users;
    readonly events: Events;
}

export class FullStoryImpl implements FullStoryClient {
    readonly users: Users;
    readonly events: Events;

    constructor(private opts: FullStoryOptions) {
        this.users = new UsersImpl(opts);
        this.events = new EventsImpl(opts);
    }
}
