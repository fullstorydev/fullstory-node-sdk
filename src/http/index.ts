import { OutgoingHttpHeaders } from 'node:http';
import { RequestOptions } from 'node:https';

import { ErrorResponse } from '@model/index';

import { FSRequestOptions, FullStoryOptions } from './options';

export interface Response<T> {
    getStatusCode: () => number;
    getHeaders: () => OutgoingHttpHeaders;
    getBody: () => T | ErrorResponse;
}

export class FSHttpClient {
    constructor(private opts: FullStoryOptions) { }

    request<REQ, RSP>(httpOpts: RequestOptions, fsOpts?: FSRequestOptions, body?: REQ): Promise<RSP> {
        return new Promise<RSP>((resolve, reject) => {
            // TODO(sabrina): actually make the http request
            // TODO(sabrina): handle FSError
            resolve({} as RSP);
        });
    }
}

export * from './options';