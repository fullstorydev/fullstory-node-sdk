import { FSBaseError, FSErrorName } from './base';

export class FSParserError extends FSBaseError {
    constructor(msg: string, httpStatusCode: number, rspData: string, cause?: any) {
        super(
            FSErrorName.ERROR_PARSE_RESPONSE,
            msg,
            cause,
            httpStatusCode,
            rspData
        );
    }
}
