import { FSBaseError, FSErrorName } from './base';

export class FSInvalidArgumentError extends FSBaseError {
    constructor(msg: string, cause?: any) {
        super(
            FSErrorName.ERROR_INVALID_ARGUMENT,
            msg,
            cause,
        );
    }
}
