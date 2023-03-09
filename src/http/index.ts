export * from './error';
export * from './options';

import { IncomingHttpHeaders, IncomingMessage } from 'node:http';
import * as https from 'node:https';
import { RequestOptions } from 'node:https';

import { FSErrorImpl } from './error';
import { FSRequestOptions, FullStoryOptions } from './options';

const defaultHttpsAgent = new https.Agent({ keepAlive: true });

export interface FSResponse<T> {
    httpStatusCode?: number;
    httpHeaders?: IncomingHttpHeaders & {
        'x-fullstory-data-realm:'?: string;
        // TODO(sabrina): any other custom headers from fullstory?
    };
    body: T;
}

export class FSHttpClient {
    // TODO(sabrina): allow passing in a node https agent?
    constructor(
        private opts: FullStoryOptions,
    ) { }

    request<REQ, RSP>(httpOpts: RequestOptions, fsOpts?: FSRequestOptions, body?: REQ): Promise<FSResponse<RSP>> {
        return new Promise<FSResponse<RSP>>((resolve, reject) => {
            if (!httpOpts.agent) {
                httpOpts.agent = defaultHttpsAgent;
            }
            // TODO(sabrina): add integration_src to the request

            const req = https.request(httpOpts);
            req.setHeader('Authorization', this.opts.apiKey);

            req.once('socket', (socket) => {
                if (socket.connecting) {
                    socket.once('secureConnect', //always use https
                        () => {
                            body && req.write(JSON.stringify(body));
                            req.end();
                        }
                    );
                } else {
                    // already connected, send body
                    body && req.write(JSON.stringify(body));
                    req.end();
                }
            });

            req.on('response', res => {
                this.handleResponse<RSP>(res)
                    .then(res => resolve(res))
                    .catch(err => reject(err));
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                const err = FSErrorImpl.newTimeoutError();
                req.destroy(err);
            });
        });
    }

    handleResponse<T>(
        msg: IncomingMessage,
    ): Promise<FSResponse<T>> {
        return new Promise<FSResponse<T>>((resolve, reject) => {
            let responseData = '';
            msg.setEncoding('utf8');
            msg.on('data', (chunk) => {
                responseData += chunk;
            });

            msg.once('end', () => {
                if (!msg.statusCode) {
                    // TODO(sabrina): better handle unknown status code error
                    reject(new Error('Unknown error occurred, did not receive HTTP status code.'));
                    return;
                }

                let response: any = {};
                if (responseData) {
                    try {
                        response = JSON.parse(responseData);
                    } catch (e) {
                        // It's possible that response is invalid json
                        // return parse error regardless of response code
                        if (e instanceof Error) {
                            reject(FSErrorImpl.newParserError(msg, responseData, e));
                            return;
                        }
                        reject(FSErrorImpl.newParserError(msg, responseData, new Error(`Unknown Error: ${e}`)));
                    }
                }

                if (msg.statusCode >= 200 && msg.statusCode < 300) {
                    const resolved: FSResponse<T> = {
                        httpStatusCode: msg.statusCode,
                        httpHeaders: msg.headers,
                        body: response,
                    };
                    resolve(resolved);
                    return;
                } else {
                    reject(FSErrorImpl.newFSError(msg, response));
                }
            });
        });
    }
}
