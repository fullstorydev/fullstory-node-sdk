import { IncomingHttpHeaders } from 'node:http';

import { ErrorResponse } from '@model/events.index';

import { FSBaseError, FSErrorName } from './base';

/*
    FSApiError represents when server API returns a non-2xx code.
*/
export class FSApiError extends FSBaseError {
    // if received a http status code
    httpStatusCode?: number;
    // if received a http headers
    headers?: IncomingHttpHeaders;
    // API response body
    fsErrorPayload?: ErrorResponse | string;

    constructor(errMsg: string, httpStatusCode: number, headers?: IncomingHttpHeaders, rawResponse?: string, cause?: any) {
        const name = httpStatusCode === 429 ? FSErrorName.ERROR_RATE_LIMITED : FSErrorName.ERROR_FULLSTORY;
        super(
            name,
            errMsg,
            cause,
        );
        this.httpStatusCode = httpStatusCode;
        this.headers = headers;

        const maybeRspObj = this.maybeParseObject(rawResponse);
        if (maybeRspObj) {
            const fsTypedResponse = this.getErrorResponse(maybeRspObj);
            this.fsErrorPayload = fsTypedResponse;
            this.message += ` Error message: ${fsTypedResponse?.message}`;
        }

        // couldn't parse the response, just pass on the string value
        if (!this.fsErrorPayload) {
            this.fsErrorPayload = rawResponse;
        }

        // add any additional properties from the response object
        this.addAdditionalProperties(maybeRspObj);
    }

    private maybeParseObject(rspStr?: string) {
        if (!rspStr) return;
        try {
            return JSON.parse(rspStr);
        } catch (e) {
            // throw away any error here and just return undefined
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
}
