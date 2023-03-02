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
