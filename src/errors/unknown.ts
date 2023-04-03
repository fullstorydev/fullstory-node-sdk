import { FSBaseError, FSErrorName } from './base';


export class FSUnknownError extends FSBaseError {
    constructor(msg: string, cause?: any) {
        super(
            FSErrorName.ERROR_UNKNOWN,
            msg,
            cause,
        );
    }
}