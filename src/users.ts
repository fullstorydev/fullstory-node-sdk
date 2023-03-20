import { BatchUserImportRequest, BatchUserImportResponse, CreateUserRequest, CreateUserResponse, FailedUserImport, GetBatchUserImportStatusResponse, GetUserResponse, JobMetadata, JobStatus, ListUsersResponse, UpdateUserRequest, UpdateUserResponse } from '@model/index';

import { UsersApi as FSUsersApi, UsersBatchImportApi as FSUsersBatchApi } from './api';
import { FSError, FSRequestOptions, FSResponse, FullStoryOptions } from './http';

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
    //TODO(sabrina): add a timeout to clean up everything
}

export interface IBatchUsersJob {
    options: Required<IBatchJobOptions>;
    requests: BatchUserImportRequest[];

    // when the job had been created
    readonly metadata?: JobMetadata;
    readonly imports?: BatchUserImportResponse[];
    readonly errors?: FailedUserImport[];

    // add more users in the request before the job executes
    // throws error if job is already executed, or max number of users reached
    add(requests: Array<BatchUserImportRequest>): IBatchUsersJob;

    // start to execute the job by invoking the create batch import api
    execute(): Promise<void>;

    // get the ID anytime, undefined if not yet executed
    getId(): string | undefined;

    // callback is called at each pull interval while the job is still processing (job status == PROCESSING)
    on(type: 'processing', callback: () => void): IBatchUsersJob;

    // when job status becomes COMPLETED or FAILED
    // automatically call /users/batch/{job_id}/imports and
    // /users/batch/{job_id}/errors
    // to get importedUsers and failedUsers
    on(type: 'done', callback: (imported: BatchUserImportResponse[], failed: FailedUserImport[]) => void): IBatchUsersJob;

    // Any other errors, may include but not limit to:
    // - failures when making API requests, i.e. network, http errors
    // - when job status is COMPLETED or FAILED, but unable to retrieve imported/failed users, etc.
    on(type: 'error', callback: (errors: FSError[]) => void): IBatchUsersJob;

    // get the current job status, undefined if not yet executed
    getStatus(): JobStatus | undefined;

    // retrieve imports or errors, undefined if job not done yet
    getImports(): BatchUserImportResponse[] | undefined;
    getImportErrors(): FailedUserImport[] | undefined;
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
    static readonly defaultOpts: Required<IBatchJobOptions> = {
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
    private _processingCallbacks: (() => void)[] = [];
    private _doneCallbacks: ((imported: BatchUserImportResponse[], failed: FailedUserImport[]) => void)[] = [];
    private _errorCallbacks: ((errors: FSError[]) => void)[] = [];

    constructor(private fsOpts: FullStoryOptions, requests: BatchUserImportRequest[] = [], opts = BatchUsersJob.defaultOpts) {
        this.requests.push(...requests);
        this.options = opts;
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

    async execute(): Promise<void> {
        // only excute once
        if (this._executedAt) return;
        this._executedAt = new Date();
        const response = await this.batchUsersImpl.createBatchUserImportJob(this);
        // make sure job id presents
        if (!response.body?.job?.id) {
            throw new Error(`Unable to get job ID after creating job, server status: ${response.httpStatusCode}`);
        }
        this.setMetadata(response.body?.job);
        this.startPolling();
    }

    on(type: 'processing', callback: () => void): IBatchUsersJob;
    on(type: 'done', callback: (imported: BatchUserImportResponse[], failed: FailedUserImport[]) => void): IBatchUsersJob;
    on(type: 'error', callback: (errors: FSError[]) => void): IBatchUsersJob;
    on(type: string, callback: any): IBatchUsersJob {
        switch (type) {
            case 'processing':
                this._processingCallbacks.push(callback);
                break;
            case 'done':
                this._doneCallbacks.push(callback);
                this.stopPolling();
                break;
            case 'error':
                this._errorCallbacks.push(callback);
                this.stopPolling();
                break;
            default:
                throw new Error('Unknown event type');
        }
        return this;
    }

    private setMetadata(job?: JobMetadata) {
        // job can only be set once
        if (this.metadata) return;
        this.metadata = job;
    }

    private startPolling() {
        const id = this.getId();
        if (!id) {
            throw new Error('Current job ID is unknown, make sure the job had been executed');
        }

        this._interval = setInterval(() => {
            // if last poll is not resolved before next pull, ignore
            // TODO(sabrina): resolve lingering promises/ races properly
            if (this._currentPromise) {
                return;
            }

            this._currentPromise = this.batchUsersImpl.getBatchUserImportStatus(id);
            this._currentPromise
                .then(res => {
                    // TODO(sabrina): dispatch this as events rather than mutating/calling sync handlers
                    this.setMetadata(res.body?.job);

                    switch (res.body?.job?.status) {
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
                            throw new Error('Unknown job stats');
                    }
                }).catch(err => {
                    // for now, just callback and retry at next poll
                    // TODO(sabrina): better handle error and maybe retry
                    this.handleError(err);
                }).finally(() => {
                    // clean up the current promise
                    delete this._currentPromise;
                });
        }, this.options.pullInterval);
    }

    private stopPolling() {
        clearInterval(this._interval);
    }

    //TODO(sabrina): invoke callbacks when triggered
    private handleProcessing() {
        throw new Error('Method handleProcessing not implemented.');
    }

    private handleCompleted() {
        throw new Error('Method handleCompleted not implemented.');
    }

    private handleFailed() {
        throw new Error('Method handleFailed not implemented.');
    }

    private handleError(err: any) {
        throw new Error('Method handleError not implemented.');
    }
}
