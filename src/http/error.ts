import { IncomingMessage, OutgoingHttpHeaders } from 'node:http';

import { ErrorResponse } from '@model/index';

export interface FSError extends Error {
    httpCode?: number;
    code: string;
    message: string;

    // any additional payload
    [key: string]: any;
}

export enum FSErrorName {
    ERROR_UNKNOWN = 'UNKNOWN',
    ERROR_TIMEOUT = 'TIMEOUT',
    ERROR_PARSE_RESPONSE = 'PARSE_RESPONSE',
    ERROR_FULLSTORY = 'FULLSTORY_API'
}

export class FSErrorImpl extends Error implements FSError {
    name: string;
    httpCode?: number;
    headers?: OutgoingHttpHeaders;
    code: string; // fullstory error code
    message: string; // fullstory error message
    cause?: Error;

    [key: string]: any; // additional data from error response

    constructor(
        name: string,
        res?: IncomingMessage,
        data?: any,
        cause?: Error
    ) {
        super(name);
        this.name = name;
        this.httpCode = res?.statusCode;
        this.headers = res?.headers;
        this.cause = cause;
        this.code = data?.code || 'unknown';
        this.message = data?.message || 'unknown';

        // add all other data, ignore if already set.
        for (const key in data) {
            if (!Object.prototype.hasOwnProperty.call(this, key)) {
                this[key] = data[key];
            }
        }
    }

    static newTimeoutError(): FSError {
        return new FSErrorImpl(
            FSErrorName.ERROR_TIMEOUT
        );
    }

    static newParserError(msg: IncomingMessage, resData: string, cause?: Error): FSError {
        const parseError = new FSErrorImpl(
            FSErrorName.ERROR_PARSE_RESPONSE,
            msg,
            { resDataStr: resData },
            cause
        );
        parseError.code = 'parse_error_response_failed';
        parseError.message = 'Unable to parse response body into error object';
        return parseError;
    }

    static newFSError(msg: IncomingMessage, response: ErrorResponse, cause?: Error): FSError {
        return new FSErrorImpl(
            FSErrorName.ERROR_FULLSTORY,
            msg,
            response,
            cause
        );
    }
}

export function rethrowChainedError(err: any) {
    // add the current stack to the async error if any
    const newErrorWithStack = new Error('failed to make request: ' + err);
    err.stack = newErrorWithStack.stack + '\nFrom previous:\n' + err.stack;
    throw err;
}