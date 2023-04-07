export * from './options';

import { IncomingHttpHeaders, IncomingMessage } from 'node:http';
import * as https from 'node:https';
import { RequestOptions } from 'node:https';

import { FSApiError, FSParserError, FSTimeoutError } from '../errors';
import { FSRequestOptions, FullStoryOptions } from './options';

const defaultHttpsAgent = new https.Agent({ keepAlive: true });

export interface FSResponse<T> {
    httpStatusCode?: number;
    httpHeaders?: IncomingHttpHeaders & {
        'x-fullstory-data-realm:'?: string;
        // TODO(sabrina): any other custom headers from fullstory?
    };
    body?: T;
}

export interface IFSHttpClient {
    request: <REQ, RSP> (
        opts: RequestOptions,
        body?: REQ,
        // TODO(sabrina): wrap this to allow injecting more generic request function
        fsReq?: FSRequestOptions,
    ) => Promise<FSResponse<RSP>>;
}

// TODO(sabrina): separate out the error handling stuff out from the http client
export class FSHttpClient implements IFSHttpClient {
    // TODO(sabrina): allow passing in a node https agent?
    constructor(
        private opts: FullStoryOptions,
    ) { }

    request<REQ, RSP>(
        opts: RequestOptions,
        body?: REQ,
        fsReq?: FSRequestOptions,
    ): Promise<FSResponse<RSP>> {
        return new Promise<FSResponse<RSP>>((resolve, reject) => {
            // TODO(sabrina): add fsReq.integration_src to the request
            if (!opts.agent) {
                opts.agent = defaultHttpsAgent;
            }

            const req = https.request(opts);
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

            req.on('response', inMsg => {
                this.handleResponse<RSP>(inMsg)
                    .then(rsp => {
                        resolve({
                            httpHeaders: inMsg.headers,
                            httpStatusCode: inMsg.statusCode,
                            body: rsp
                        });
                    })
                    .catch(err => reject(err));
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                const err = new FSTimeoutError(`Request ${req.path} timed out.`);
                req.destroy(err);
            });
        });
    }

    async handleResponse<T>(
        msg: IncomingMessage
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let responseDataStr = '';
            msg.setEncoding('utf8');
            msg.on('data', (chunk) => {
                responseDataStr += chunk;
            });

            msg.once('end', () => {
                if (!msg.statusCode) {
                    // TODO(sabrina): better handle unknown status code error
                    reject(new Error('Unknown error occurred, did not receive HTTP status code.'));
                    return;
                }

                if (msg.statusCode === 204) {
                    resolve({} as T);
                    return;
                }

                if (msg.statusCode < 200 || msg.statusCode >= 300) {
                    reject(new FSApiError(`HTTP error status ${msg.statusCode} received.`, msg.statusCode, msg.headers, responseDataStr));
                    return;
                }

                let responseData;
                if (responseDataStr) {
                    try {
                        responseData = JSON.parse(responseDataStr);
                    } catch (e) {
                        // It's possible that response is invalid json
                        // return parse error regardless of response status
                        if (e instanceof SyntaxError) {
                            reject(new FSParserError('Invalid JSON response', msg.statusCode, msg.headers, responseDataStr, e));
                        } else {
                            reject(new FSParserError('Unknown error while parsing JSON response', msg.statusCode, msg.headers, responseDataStr, e));
                        }
                        return;
                    }
                }

                resolve(<T>responseData);
            });
        });
    }
}
