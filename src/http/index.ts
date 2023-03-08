export * from './error';
export * from './options';

import { IncomingMessage } from 'node:http';
import * as https from 'node:https';
import { RequestOptions } from 'node:https';

import { FSErrorImpl } from './error';
import { FSRequestOptions, FullStoryOptions } from './options';

const defaultHttpsAgent = new https.Agent({ keepAlive: true });

export class FSHttpClient {
    // TODO(sabrina): allow passing in a node https agent?
    constructor(
        private opts: FullStoryOptions,
    ) { }

    request<REQ, RSP>(httpOpts: RequestOptions, fsOpts?: FSRequestOptions, body?: REQ): Promise<RSP> {
        return new Promise<RSP>((resolve, reject) => {
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
        res: IncomingMessage,
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let responseData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.once('end', () => {
                if (!res.statusCode) {
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
                        reject(FSErrorImpl.newParserError(res, responseData));
                        return;
                    }
                }

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(response);
                    return;
                } else {
                    reject(FSErrorImpl.newFSError(res, response));
                }
            });
        });
    }
}
