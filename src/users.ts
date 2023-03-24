import { BatchUserImportRequest, BatchUserImportResponse, CreateUserRequest, CreateUserResponse, FailedUserImport, GetBatchUserImportStatusResponse, GetUserResponse, JobMetadata, JobStatus, ListUsersResponse, UpdateUserRequest, UpdateUserResponse } from '@model/index';

import { UsersApi as FSUsersApi, UsersBatchImportApi as FSUsersBatchApi } from './api';
import { FSRequestOptions, FSResponse, FullStoryOptions } from './http';

////////////////////////////////////
//  CRUD operations
////////////////////////////////////

export interface IUsersApi {
    get(...req: Parameters<typeof FSUsersApi.prototype.getUser>): Promise<FSResponse<GetUserResponse>>;

    create(...req: Parameters<typeof FSUsersApi.prototype.createUser>): Promise<FSResponse<CreateUserResponse>>;

    list(...req: Parameters<typeof FSUsersApi.prototype.listUsers>): Promise<FSResponse<ListUsersResponse>>;

    delete(...req: Parameters<typeof FSUsersApi.prototype.deleteUser>): Promise<FSResponse<void>>;

    update(...req: Parameters<typeof FSUsersApi.prototype.updateUser>): Promise<FSResponse<UpdateUserResponse>>;
}

////////////////////////////////////
//  Batch Imports
////////////////////////////////////

export interface IBatchJobOptions {
    pullInterval?: number; // ms, defaults to every 2 seconds
    // TODO(sabrina): add a timeout and onTimeout to clean up everything
}

export interface IBatchUsersJob {
    readonly options: Required<IBatchJobOptions>;
    requests: BatchUserImportRequest[];

    readonly metadata?: JobMetadata;
    readonly imports?: BatchUserImportResponse[];
    readonly errors?: FailedUserImport[];

    // add more users in the request before the job executes
    // throws error if job is already executed, or max number of users reached
    add(requests: Array<BatchUserImportRequest>): IBatchUsersJob;

    // TODO(sabrina): allow removal of a specific request?

    // start to execute the job by invoking the create batch import API
    // resolves API responses
    execute(): void;

    // get the job ID anytime, undefined if not yet executed
    getId(): string | undefined;

    // get the current job status, undefined if not yet executed
    getStatus(): JobStatus | undefined;

    // retrieve imports or errors if the job is done, undefined if job is not done yet
    getImports(): BatchUserImportResponse[] | undefined;
    getImportErrors(): FailedUserImport[] | undefined;

    // callback is invoked at each pull interval while the job is still processing (job status == PROCESSING)
    on(type: 'processing', callback: (job: IBatchUsersJob) => void): IBatchUsersJob;

    // when job status becomes COMPLETED or FAILED
    // automatically call /users/batch/{job_id}/imports and
    // /users/batch/{job_id}/errors
    // to get importedUsers and failedUsers, then the callback is invoked
    on(type: 'done', callback: (imported: BatchUserImportResponse[], failed: FailedUserImport[]) => void): IBatchUsersJob;

    // Any errors during the import jobs, may be called more than once
    // - failures when making API requests, including any network, http errors, etc.
    // - when job status is COMPLETED or FAILED, but unable to retrieve imported/failed users, etc.
    on(type: 'error', callback: (error: Error) => void): IBatchUsersJob;
}

export interface IBatchUsersApi {
    batchCreate(
        requests?: Array<BatchUserImportRequest>,
        jobOptions?: IBatchJobOptions
    ): IBatchUsersJob;
}

export class Users implements IUsersApi, IBatchUsersApi {
    protected readonly usersImpl: FSUsersApi;

    constructor(private opts: FullStoryOptions) {
        this.usersImpl = new FSUsersApi(opts);
    }

    async get(id: string, options?: FSRequestOptions | undefined): Promise<FSResponse<GetUserResponse>> {
        return this.usersImpl.getUser(id, options);
    }

    async create(body: CreateUserRequest, options?: FSRequestOptions | undefined): Promise<FSResponse<CreateUserResponse>> {
        return this.usersImpl.createUser(body, options);
    }
    async list(uid?: string | undefined, email?: string | undefined, displayName?: string | undefined, isIdentified?: boolean | undefined, pageToken?: string | undefined, options?: FSRequestOptions | undefined): Promise<FSResponse<ListUsersResponse>> {
        return this.usersImpl.listUsers(uid, email, displayName, isIdentified, pageToken, options);
    }
    async delete(id: string, options?: FSRequestOptions | undefined): Promise<FSResponse<void>> {
        return this.usersImpl.deleteUser(id, options);
    }
    async update(id: string, body: UpdateUserRequest, options?: FSRequestOptions | undefined): Promise<FSResponse<UpdateUserResponse>> {
        return this.usersImpl.updateUser(id, body, options);
    }

    batchCreate(requests: BatchUserImportRequest[] = [], jobOptions?: IBatchJobOptions): IBatchUsersJob {
        return new BatchUsersJob(this.opts, requests, jobOptions);
    }
}

class BatchUsersJob implements IBatchUsersJob {
    static readonly DefaultBatchJobOpts: Required<IBatchJobOptions> = {
        pullInterval: 2000,
    };

    requests: BatchUserImportRequest[] = [];
    readonly options: Required<IBatchJobOptions>;

    metadata?: JobMetadata | undefined;
    imports?: BatchUserImportResponse[] | undefined;
    errors?: FailedUserImport[] | undefined;

    protected readonly batchUsersImpl: FSUsersBatchApi;

    private _executedAt: Date | undefined;
    private _interval: NodeJS.Timer | undefined;
    private _currentPromise: Promise<FSResponse<GetBatchUserImportStatusResponse>> | undefined;
    private _processingCallbacks: ((job: BatchUsersJob) => void)[] = [];
    private _doneCallbacks: ((imported: BatchUserImportResponse[], failed: FailedUserImport[]) => void)[] = [];
    private _errorCallbacks: ((error: Error) => void)[] = [];

    constructor(fsOpts: FullStoryOptions, requests: BatchUserImportRequest[] = [], opts: IBatchJobOptions = {}) {
        this.requests.push(...requests);
        this.options = Object.assign({}, BatchUsersJob.DefaultBatchJobOpts, opts);
        this.batchUsersImpl = new FSUsersBatchApi(fsOpts);
    }

    getId(): string | undefined {
        return this.metadata?.id;
    }

    getStatus() {
        return this.metadata?.status;
    }

    add(requests: BatchUserImportRequest[]): IBatchUsersJob {
        this.requests.push(...requests);
        return this;
    }

    getImports(): BatchUserImportResponse[] | undefined {
        return this.imports;
    }

    getImportErrors(): FailedUserImport[] | undefined {
        return this.errors;
    }

    execute(): void {
        // only excute once
        if (this._executedAt) return;
        this._executedAt = new Date();

        this.batchUsersImpl.createBatchUserImportJob(this)
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

    on(type: 'processing', callback: (job: IBatchUsersJob) => void): IBatchUsersJob;
    on(type: 'done', callback: (imported: BatchUserImportResponse[], failed: FailedUserImport[]) => void): IBatchUsersJob;
    on(type: 'error', callback: (error: Error) => void): IBatchUsersJob;
    on(type: string, callback: any) {
        switch (type) {
            case 'processing':
                this._processingCallbacks.push(callback);
                break;
            case 'done':
                this._doneCallbacks.push(callback);
                break;
            case 'error':
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
            this._currentPromise = this.batchUsersImpl.getBatchUserImportStatus(id);
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
        this.batchUsersImpl.getBatchUserImports(jobId)
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
        this.batchUsersImpl.getBatchUserImportErrors(jobId)
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
