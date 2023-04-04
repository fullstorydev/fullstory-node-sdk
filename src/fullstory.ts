import { Events, IBatchEventsApi, IEventsApi } from './events';
import { FullStoryOptions } from './http';
import { IBatchUsersApi, IUsersApi, Users } from './users';

export interface FullStoryClient {
    readonly users: IBatchUsersApi & IUsersApi;
    readonly events: IBatchEventsApi & IEventsApi;
}

export class FullStoryImpl implements FullStoryClient {
    readonly users: IBatchUsersApi & IUsersApi;
    readonly events: IBatchEventsApi & IEventsApi;

    constructor(private opts: FullStoryOptions) {
        this.users = new Users(opts);
        this.events = new Events(opts);
    }
}
