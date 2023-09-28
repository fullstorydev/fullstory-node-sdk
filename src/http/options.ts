/**
 * RequestOptions provide additional options to be applied when calling FullStory APIs.
 */
export interface FSRequestOptions {
    /** An optional Integration-Source string denoting the origin of the requests.
     * the integrationSource is generally intended for FullStory developers
     * or FullStory partners while building integrations.
     * Generally it should be left empty.
    */
    readonly integrationSource?: string;
}

/**
 * FullStoryOptions provide additional options for instantiating the FullStory Client.
 */
export interface FullStoryOptions extends FSRequestOptions {
    readonly apiKey: string;
}

export interface WithOptions<T> {
    /**
     * withOptions allows per request overriding for FullStoryOptions.
     * It is recommended to provide all options during `init`
     * and avoid using withOptions.
    */
    withOptions(opts: Partial<FullStoryOptions>): T;
}
