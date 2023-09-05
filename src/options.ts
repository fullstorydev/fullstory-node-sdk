import { BatchJobOptions } from './batch';
import { FSRequestOptions } from './http';

export interface WithRequestOptions<T> {
    withRequestOptions(opts: FSRequestOptions): T;
}

export interface WithJobOptions<T> {
    withBatchJobOptions(bo: BatchJobOptions): T & WithRequestOptions<T>;
}

