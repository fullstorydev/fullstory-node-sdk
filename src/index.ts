import { UsersApi, UsersBatchImportApi } from 'api';

/**
 * RequestOptions provide additional options to be applied when calling FullStory APIs.
*/
export interface RequestOptions {
    /** An optional integration source string denoting the origin of the requests. */
    readonly integration_src?: string;
}

/**
 * FullStoryOptions provide additional options for instantiating the FullStory Client.
*/
export interface FullStoryOptions extends RequestOptions {
    readonly apiKey: string;
}

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
