import { ErrorResponse } from '@model/events.index';

import { FSError } from '.';

export enum FSErrorName {
    ERROR_UNKNOWN = 'FS_UNKNOWN',
    ERROR_TIMEOUT = 'FS_TIMEOUT',
    // for non-2xx responses
    ERROR_FULLSTORY = 'FS_FULLSTORY_API',
    // for 2xx responses but unable to parse body into response object
    ERROR_PARSE_RESPONSE = 'FS_ERROR_PARSE_RESPONSE'
}

export class FSBaseError extends Error implements FSError {
    discriminator: 'FSError';
    public readonly name: FSErrorName;
    public readonly httpStatusCode?: number;
    public readonly cause?: Error;
    // if server responded with ErrorResponse, fallback to raw string response
    public fsErrorPayload?: ErrorResponse | string;
    [key: string]: any;

    constructor(
        name: FSErrorName,
        message: string,
        cause?: any,
        httpStatusCode?: number,
        fsErrorPayload?: ErrorResponse | string,
    ) {
        super(message);
        this.discriminator = 'FSError';
        this.name = name;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
        this.cause = toError(cause);
        this.fsErrorPayload = fsErrorPayload;
    }

    public chain(err: Error) {
        this.prependStackTrace(err.stack);
        return this;
    }

    private prependStackTrace(additionalStack?: string) {
        if (additionalStack) {
            this.stack = additionalStack + '\nFrom previous:\n' + this.stack;
        }
    }

    protected setFSErrorPayload(payload: ErrorResponse | string) {
        this.fsErrorPayload = payload;
    }

    protected addAdditionalProperties(additionalProps?: { [key: string]: any; }) {
        // add all additional data, ignore if already set.
        for (const key in additionalProps) {
            if (!Object.prototype.hasOwnProperty.call(this, key)) {
                this[key] = additionalProps[key];
            }
        }
    }
}

export function toError(e: any): Error | undefined {
    if (!e) return;
    return e instanceof Error ? e : new Error(`${e}`);
}
