import { FSBaseError, FSErrorName } from './base';

export class FSMaxRetryError extends FSBaseError {
    constructor(msg: string, cause?: any) {
        super(
            FSErrorName.ERROR_MAX_RETRY,
            msg,
            cause,
        );
    }
}
