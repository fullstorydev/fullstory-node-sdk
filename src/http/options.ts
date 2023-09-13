/**
 * RequestOptions provide additional options to be applied when calling FullStory APIs.
 */
export interface FSRequestOptions {
    /** An optional Integration-Source string denoting the origin of the requests. */
    readonly integrationSource?: string;
}

/**
 * FullStoryOptions provide additional options for instantiating the FullStory Client.
 */
export interface FullStoryOptions extends FSRequestOptions {
    readonly apiKey: string;
}

export interface WithOptions<T> {
    withOptions(opts: Partial<FullStoryOptions>): T;
}
