import { ErrorResponse } from '@model/index';

export interface FSError extends Error {
    discriminator: 'FSError';
    name: FSErrorName;
    // if recieved a http status code
    httpStatusCode?: number;
    // API response body
    fsErrorResponse?: ErrorResponse | string;

    chain: (newError: Error) => FSError;
    // Any additional payload
    [key: string]: any;
}

export function isFSError(o: any): o is FSError {
    return 'discriminator' in o && o.discriminator === 'FSError';
}

export enum FSErrorName {
    ERROR_UNKNOWN = 'FS_UNKNOWN',
    ERROR_TIMEOUT = 'FS_TIMEOUT',
    // for non-2xx responses
    ERROR_FULLSTORY = 'FS_FULLSTORY_API',
    // for 2xx responses but unable to parse body into response object
    ERROR_PARSE_RESPONSE = 'FS_ERROR_PARSE_RESPONSE'
}

export class FSErrorImpl extends Error implements FSError {
    discriminator: 'FSError';
    public readonly name: FSErrorName;

    public readonly httpStatusCode?: number;
    public readonly fsErrorResponse?: ErrorResponse | string;
    public readonly cause?: Error;
    [key: string]: any;

    constructor(
        name: FSErrorName,
        message: string,
        cause?: Error,
        httpStatusCode?: number,
        rawResponse?: string,
    ) {
        super(message);
        this.discriminator = 'FSError';
        this.name = name;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
        this.cause = cause;

        const maybeRspObj = this.parseResponse(rawResponse);
        if (maybeRspObj) {
            const fsTypedResponse = this.getErrorResponse(maybeRspObj);
            this.fsErrorResponse = fsTypedResponse;
        }
        // couldn't parse the response, just pass on the string value
        if (!this.fsErrorResponse) {
            this.fsErrorResponse = rawResponse;
        }

        // add all other data, ignore if already set.
        for (const key in maybeRspObj) {
            if (!Object.prototype.hasOwnProperty.call(this, key)) {
                this[key] = maybeRspObj[key];
            }
        }
    }


    private parseResponse(rspStr?: string): any {
        if (!rspStr) return;
        try {
            return JSON.parse(rspStr);
        } catch (e) {
            // throw away any error here and return undefined
            return;
        }
    }

    private getErrorResponse(obj: any): ErrorResponse | undefined {
        // ErrorResponse requires both code and message fields to present
        if (obj?.code && obj?.message) {
            return {
                code: obj.code,
                message: obj.message,
            };
        }
        return;
    }

    static newAsyncError(e: any): FSError {
        if (isFSError(e)) {
            // chain the stack trace if is already FSError
            return e.chain(new Error());
        }
        return FSErrorImpl.newUnknownError(`${e?.message || e}`, toError(e));
    }


    static newUnknownError(msg: string, cause?: any): FSError {
        return new FSErrorImpl(
            FSErrorName.ERROR_UNKNOWN,
            msg,
            toError(cause)
        );
    }

    static newTimeoutError(msg: string, cause?: any): FSError {
        return new FSErrorImpl(
            FSErrorName.ERROR_TIMEOUT,
            msg,
            toError(cause)
        );
    }

    static newParseResponseError(msg: string, httpStatusCode: number, rspData: string, cause?: any): FSError {
        return new FSErrorImpl(
            FSErrorName.ERROR_PARSE_RESPONSE,
            msg,
            toError(cause),
            httpStatusCode,
            rspData,
        );
    }

    static newApiError(errMsg: string, httpStatusCode: number, rawResponse?: string, cause?: any): FSError {
        return new FSErrorImpl(
            FSErrorName.ERROR_FULLSTORY,
            errMsg,
            toError(cause),
            httpStatusCode,
            rawResponse,
        );
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
}

function toError(e: any): Error | undefined {
    if (!e) return;
    return e instanceof Error ? e : new Error(`${e}`);
}