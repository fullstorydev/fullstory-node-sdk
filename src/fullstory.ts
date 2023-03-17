import { FullStoryOptions } from './http';
import { IBatchUsersApi, IUsersApi, Users } from './users';

export interface FullStoryClient {
    users: IBatchUsersApi & IUsersApi;
}

export class FullStoryImpl implements FullStoryClient {
    users: IBatchUsersApi & IUsersApi;

    constructor(private opts: FullStoryOptions) {
        this.users = new Users(opts);
    }
}
