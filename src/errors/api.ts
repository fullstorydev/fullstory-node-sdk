import { ErrorResponse } from '@model/events.index';

import { FSBaseError, FSErrorName } from './base';

export class FSApiError extends FSBaseError {
    constructor(errMsg: string, httpStatusCode: number, rawResponse?: string, cause?: any) {
        super(
            FSErrorName.ERROR_FULLSTORY,
            errMsg,
            cause,
            httpStatusCode,
        );

        const maybeRspObj = this.maybeParseObject(rawResponse);
        if (maybeRspObj) {
            const fsTypedResponse = this.getErrorResponse(maybeRspObj);
            this.fsErrorPayload = fsTypedResponse;
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