import { FSBaseError, FSErrorName } from './base';

export class FSTimeoutError extends FSBaseError {
    constructor(msg: string, cause?: any) {
        super(
            FSErrorName.ERROR_TIMEOUT,
            msg,
            cause,
        );
    }
}