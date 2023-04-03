
////////////////////////////////////
//  Batch Imports
////////////////////////////////////

import { JobMetadata, JobStatus } from './model';

export interface IBatchJobOptions {
    pullInterval?: number; // ms, defaults to every 2 seconds
    // TODO(sabrina): add a timeout and onTimeout to clean up everything
}

export const DefaultBatchJobOpts: Required<IBatchJobOptions> = {
    pullInterval: 2000,
};


type BatchTypeNames = 'users' | 'events';

export interface IBatchJob<K extends BatchTypeNames, R, I, F> {
    readonly options: Required<IBatchJobOptions>;
    requests: R[];

    readonly metadata?: JobMetadata;
    readonly imports: I[];
    readonly failedImports: F[];
    errors: Error[];

    /*
    * Add more request objects in the requests before the job executes.
    * @throws An error if job is already executed, or max number of items reached.
    */
    add(requests: R[]): IBatchJob<K, R, I, F>;

    // TODO(sabrina): allow removal of a specific request?

    /*
    * Starts to execute the job by invoking the create batch import API.
    * Listen to the "error" event to be notified if any error occurs while creating the job.
    */
    execute(): void;

    /*
    * Get the current job Id.
    * @returns The string job Id, or undefined if not yet executed.
    */
    getId(): string | undefined;

    /*
    * Get the current job status.
    * @returns The current JobStatus, or undefined if not yet executed.
    */
    getStatus(): JobStatus | undefined;

    /*
    * Retrieve successful imports if the job is done.
    * @returns An array of batch items successfully imported.
    */
    getImports(): R[];

    /*
    * Retrieve failed items imports if the job has errors.
    * @returns An array of batch items failed to be imported.
    */
    getFailedImports(): F[];

    /*
    * Fires when a poll to get latest job status is completed after each poll interval,
    * while the job is still processing (job status == PROCESSING).
    * @param job The current job.
    */
    on(type: 'processing', callback: (job: IBatchJob<K, R, I, F>) => void): IBatchJob<K, R, I, F>;

    /*
    * Fires when job status becomes COMPLETED or FAILED.
    * It will automatically call /<resource_root>/batch/{job_id}/imports and
    * /<resource_root>/batch/{job_id}/errors endpoints,
    * to get imported and failed responses.
    * @param imported An array of batch items successfully imported.
    * @returns failed An array of batch items failed to be imported.
    */
    on(type: 'done', callback: (imported: I[], failed: F[]) => void): IBatchJob<K, R, I, F>;

    /*
    * Fires when any errors during the import jobs, may be called more than once.
    * - Failures when making API requests, including any network, http errors, etc.
    * - When job status is COMPLETED or FAILED, but unable to retrieve imported/failed items.
    * @param error The error encountered.
    */
    on(type: 'error', callback: (error: Error) => void): IBatchJob<K, R, I, F>;
}
