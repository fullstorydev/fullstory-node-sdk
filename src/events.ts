import { CreateEventsRequest, CreateEventsResponse, FailedEventsImport, GetBatchEventsImportStatusResponse, JobMetadata, JobStatus } from '@model/index';

import { EventsApi as FSEventsApi, EventsBatchImportApi as FSBatchEventsApi } from './api';
import { DefaultBatchJobOpts, IBatchJob, IBatchJobOptions } from './batch';
import { FSRequestOptions, FSResponse, FullStoryOptions } from './http';

////////////////////////////////////
//  CRUD operations
////////////////////////////////////

export interface IEventsApi {
    create(...req: Parameters<typeof FSEventsApi.prototype.createEvents>): Promise<FSResponse<CreateEventsResponse>>;
}


////////////////////////////////////
//  Batch Imports
////////////////////////////////////

interface IBatchEventsApi {
    batchCreate(
        requests?: CreateEventsRequest[],
        jobOptions?: IBatchJobOptions
    ): BatchEventsJob;
}

// TODO(sabrina): move the common polling logic betwee users and events into a base batch class
class BatchEventsJob implements IBatchJob<'events', CreateEventsRequest, CreateEventsResponse, FailedEventsImport> {
    requests: CreateEventsRequest[] = [];
    readonly options: Required<IBatchJobOptions>;

    metadata?: JobMetadata;
    imports: CreateEventsResponse[] = [];
    failedImports: FailedEventsImport[] = [];
    errors: Error[] = [];

    protected readonly batchEventsImpl: FSBatchEventsApi;

    private _executedAt: Date | undefined;
    private _interval: NodeJS.Timer | undefined;
    private _currentPromise: Promise<FSResponse<GetBatchEventsImportStatusResponse>> | undefined;
    private _processingCallbacks: ((job: BatchEventsJob) => void)[] = [];
    private _doneCallbacks: ((imported: CreateEventsResponse[], failed: FailedEventsImport[]) => void)[] = [];
    private _errorCallbacks: ((error: Error) => void)[] = [];

    constructor(fsOpts: FullStoryOptions, requests: CreateEventsRequest[] = [], opts: IBatchJobOptions = {}) {
        this.requests.push(...requests);
        this.options = Object.assign({}, DefaultBatchJobOpts, opts);
        this.batchEventsImpl = new FSBatchEventsApi(fsOpts);
    }

    getId(): string | undefined {
        return this.metadata?.id;
    }

    getStatus() {
        return this.metadata?.status;
    }

    add(requests: CreateEventsRequest[]): BatchEventsJob {
        // TODO(sabrina): throw if job is already executed, or max number of users reached
        this.requests.push(...requests);
        return this;
    }

    getImports(): CreateEventsResponse[] {
        return this.imports;
    }

    getFailedImports(): FailedEventsImport[] {
        return this.errors;
    }

    execute(): void {
        // only excute once
        if (this._executedAt) return;
        this._executedAt = new Date();

        this.batchEventsImpl.createBatchEventsImportJob(this)
            .then(response => {
                // make sure job id exist
                if (!response.body?.job?.id) {
                    throw new Error(`Unable to get job ID after creating job, server status: ${response.httpStatusCode}`);
                }
                this.setMetadata(response.body?.job);
                this.startPolling();
            }).catch(err => {
                this.handleError(err);
            });
    }

    on(type: 'processing', callback: (job: BatchEventsJob) => void): BatchEventsJob;
    on(type: 'done', callback: (imported: CreateEventsResponse[], failed: FailedEventsImport[]) => void): BatchEventsJob;
    on(type: 'error', callback: (error: Error) => void): BatchEventsJob;
    on(type: string, callback: any) {
        // TODO(sabrina): move these shared logic into batch.ts
        switch (type) {
            case 'processing':
                this._processingCallbacks.push(callback);
                break;
            case 'done':
                if (this.imports.length || this.failedImports.length) {
                    callback(this.imports, this.failedImports);
                }
                this._doneCallbacks.push(callback);
                break;
            case 'error':
                // if there's already errors, immediately invoke with current values
                if (this.errors.length) {
                    callback(this.errors);
                }
                this._errorCallbacks.push(callback);
                break;
            default:
                throw new Error('Unknown event type');
        }
        return this;
    }


    private setMetadata(job?: JobMetadata) {
        if (this.getId() && this.getId() != job?.id) {
            throw new Error(`can not set existing job metadata ${this.getId()} to a different job ${job?.id}`);
        }
        this.metadata = job;
    }

    private startPolling() {
        const id = this.getId();
        if (!id) {
            throw new Error('Current job ID is unknown, make sure the job had been executed');
        }

        this._interval = setInterval(async () => {
            // if last poll is not resolved before next pull, ignore
            // TODO(sabrina): resolve lingering promises/ races properly
            if (this._currentPromise) {
                return;
            }

            // start a new poll and set the new promise
            this._currentPromise = this.batchEventsImpl.getBatchEventsImportStatus(id);
            try {
                const pollResult = await this._currentPromise;
                // TODO(sabrina): maybe dispatch this as events rather than mutating/calling sync handlers
                // work around for https://fullstory.atlassian.net/browse/ECO-8192
                const metadata = pollResult.body?.job || {};
                metadata.id = this.getId();

                this.setMetadata(metadata);
                switch (metadata.status) {
                    case JobStatus.Processing:
                        this.handleProcessing();
                        break;
                    case JobStatus.Completed:
                        this.stopPolling();
                        this.handleCompleted();
                        break;
                    case JobStatus.Failed:
                        this.stopPolling();
                        this.handleFailed();
                        break;
                    default:
                        throw new Error('Unknown job stats received: ' + this.metadata?.status);
                }
            } catch (e: any) {
                this.handleError(e);
            } finally {
                // clean up the current promise
                delete this._currentPromise;
            }
        }, this.options.pullInterval);
    }

    private stopPolling() {
        clearInterval(this._interval);
    }

    private handleProcessing() {
        for (const cb of this._processingCallbacks) {
            cb(this);
        }
    }

    private handleCompleted() {
        // TODO(sabrina): start poll on /users/batch/{job_id}/imports
        // with handling next_page_token
        const jobId = this.getId();
        if (!jobId) {
            throw new Error('unable to retrieve job ID');
        }
        this.batchEventsImpl.getBatchEventsImports(jobId)
            .then(res => {
                const results = res.body?.results;
                if (!results) {
                    throw new Error('API did not response with any results');
                }
                for (const cb of this._doneCallbacks) {
                    cb(results, []);
                }
            }).catch((e: Error) => {
                throw e;
            });
    }

    private handleFailed() {
        // TODO(sabrina): start polling on /users/batch/{job_id}/errors
        // with handling next_page_token
        const jobId = this.getId();
        if (!jobId) {
            throw new Error('unable to retrieve job ID');
        }
        this.batchEventsImpl.getBatchEventsImportErrors(jobId)
            .then(res => {
                const results = res.body?.results;
                if (!results) {
                    throw new Error('API did not response with any results');
                }
                for (const cb of this._doneCallbacks) {
                    cb([], results);
                }
            }).catch((e: Error) => {
                throw e;
            });
    }

    private handleError(err: Error) {
        // TODO(sabrina): check for FSError
        for (const cb of this._errorCallbacks) {
            cb(err);
        }
    }
}

////////////////////////////////////
//  Exported User Interface
////////////////////////////////////
export class Events implements IEventsApi, IBatchEventsApi {
    protected readonly eventsImpl: FSEventsApi;

    constructor(private opts: FullStoryOptions) {
        this.eventsImpl = new FSEventsApi(opts);
    }

    async create(body: CreateEventsRequest, options?: FSRequestOptions | undefined): Promise<FSResponse<CreateEventsResponse>> {
        return this.eventsImpl.createEvents(body, options);
    }

    batchCreate(requests?: CreateEventsRequest[] | undefined, jobOptions?: IBatchJobOptions | undefined): BatchEventsJob {
        return new BatchEventsJob(this.opts, requests, jobOptions);
    }
}