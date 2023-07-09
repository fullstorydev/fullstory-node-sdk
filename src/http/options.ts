/**
 * RequestOptions provide additional options to be applied when calling FullStory APIs.
 */
export interface FSRequestOptions {
    /** An optional Integration-Source string denoting the origin of the requests. */
    readonly integrationSource?: string;

    /** An optional per-request Idempotency-Key string to be passed as a header
     * to kae non-idempotent HTTP methods such as POST or PATCH idempotent.
     * Please see FullStory's developer doc for methods available and more information */
    readonly idempotencyKey?: string;
}

/**
 * FullStoryOptions provide additional options for instantiating the FullStory Client.
 */
export interface FullStoryOptions extends FSRequestOptions {
    readonly apiKey: string;
}
