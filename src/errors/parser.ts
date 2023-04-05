import { IncomingHttpHeaders } from 'node:http';

import { FSBaseError, FSErrorName } from './base';

/*
    FSParserError returned when server API returns a 2xx code but
    the response data can not be parsed correctly.
*/
export class FSParserError extends FSBaseError {
    // if received a http status code
    httpStatusCode: number;
    // if received a http headers
    headers: IncomingHttpHeaders;
    // API response body
    fsErrorPayload: string;

    constructor(msg: string, httpStatusCode: number, headers: IncomingHttpHeaders, rawResponse: string, cause?: any, additionalProps?: any) {
        super(
            FSErrorName.ERROR_PARSE_RESPONSE,
            msg,
            cause,
        );
        this.httpStatusCode = httpStatusCode;
        this.headers = headers;
        this.fsErrorPayload = rawResponse;

        this.addAdditionalProperties(additionalProps);
    }
}
