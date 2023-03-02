import { UsersApi, UsersBatchImportApi } from './api';
import { FullStoryOptions } from './options';

// TODO(sabrina): create the interface
export interface FullStoryClient {
    users: UsersApi & UsersBatchImportApi;
}

// TODO(sabrina): create the implementation
class FullStoryImpl implements FullStoryClient {
    constructor(private opts: FullStoryOptions) { }
}

export function init(opts: FullStoryOptions): FullStoryClient {
}
