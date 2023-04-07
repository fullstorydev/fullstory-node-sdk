import { BatchUserImportRequest, BatchUserImportResponse, CreateUserRequest, CreateUserResponse, FailedUserImport, GetBatchUserImportStatusResponse, GetUserResponse, JobMetadata, JobStatus, ListUsersResponse, UpdateUserRequest, UpdateUserResponse } from '@model/index';

import { UsersApi as FSUsersApi, UsersBatchImportApi as FSUsersBatchApi } from './api';
import { DefaultBatchJobOpts, IBatchJob, IBatchJobOptions } from './batch';
import { toError } from './errors/base';
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

export interface IBatchUsersApi {
    batchCreate(
        requests?: Array<BatchUserImportRequest>,
        jobOptions?: IBatchJobOptions
    ): BatchUsersJob;
}

class BatchUsersJob implements IBatchJob<'users', BatchUserImportRequest, BatchUserImportResponse, FailedUserImport> {
    requests: BatchUserImportRequest[] = [];
    readonly options: Required<IBatchJobOptions>;

    metadata?: JobMetadata;
    imports: BatchUserImportResponse[] = [];
    failedImports: FailedUserImport[] = [];
    errors: Error[] = [];

    protected readonly batchUsersImpl: FSUsersBatchApi;

    private _executedAt: Date | undefined;
    private _interval: NodeJS.Timer | undefined;
    private _currentPromise: Promise<FSResponse<GetBatchUserImportStatusResponse>> | undefined;
    private _processingCallbacks: ((job: BatchUsersJob) => void)[] = [];
    private _doneCallbacks: ((imported: BatchUserImportResponse[], failed: FailedUserImport[]) => void)[] = [];
    private _errorCallbacks: ((error: Error) => void)[] = [];

    constructor(fsOpts: FullStoryOptions, requests: BatchUserImportRequest[] = [], opts: IBatchJobOptions = {}) {
        this.requests.push(...requests);
        this.options = Object.assign({}, DefaultBatchJobOpts, opts);
        this.batchUsersImpl = new FSUsersBatchApi(fsOpts);
    }

    getId(): string | undefined {
        return this.metadata?.id;
    }

    getStatus() {
        return this.metadata?.status;
    }

    add(requests: BatchUserImportRequest[]): BatchUsersJob {
        // TODO(sabrina): throw if job is already executed, or max number of users reached
        this.requests.push(...requests);
        return this;
    }

    getImports(): BatchUserImportResponse[] {
        return this.imports;
    }

    getFailedImports(): FailedUserImport[] {
        return this.failedImports;
    }

    execute(): void {
        // only execute once
        // TODO(sabrina): allow retry execution i.e. if transient error
        if (this._executedAt) return;
        this._executedAt = new Date();

        this.batchUsersImpl.createBatchUserImportJob(this)
            .then(response => {
                // make sure job id exist
                if (!response.body?.job?.id) {
                    throw new Error(`Unable to get job ID after creating the job, server status: ${response.httpStatusCode}`);
                }
                this.setMetadata(response.body?.job);

                this.startPolling();
            }).catch(err => {
                this.handleError(err);
            });
    }

    on(type: 'processing', callback: (job: BatchUsersJob) => void): BatchUsersJob;
    on(type: 'done', callback: (imported: BatchUserImportResponse[], failed: FailedUserImport[]) => void): BatchUsersJob;
    on(type: 'error', callback: (error: Error) => void): BatchUsersJob;
    on(type: string, callback: any) {
        // TODO(sabrina): move these shared logic into batch.ts
        switch (type) {
            case 'processing':
                this._processingCallbacks.push(callback);
                break;
            case 'done':
                // if the job is already done, immediately invoke with current values
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
            } catch (e) {
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
        // TODO(sabrina): if next_page_token
        // we'd have to invoke /users/batch/{job_id}/imports more than once
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
                this.imports.push(...results);
                for (const cb of this._doneCallbacks) {
                    cb(this.imports, this.failedImports);
                }
            }).catch((e: Error) => {
                throw e;
            });
    }

    private handleFailed() {
        // TODO(sabrina): if result has next_page_token
        // we'd have to invoke /users/batch/{job_id}/errors more than once
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
                this.failedImports.push(...results);
                for (const cb of this._doneCallbacks) {
                    cb([], results);
                }
            }).catch((e: Error) => {
                throw e;
            });
    }

    private handleError(err: unknown) {
        const error = toError(err);
        if (!error) return;
        // TODO(sabrina): check for FSError
        this.errors.push(error);
        for (const cb of this._errorCallbacks) {
            cb(error);
        }
    }
}

////////////////////////////////////
//  Exported User Interface
////////////////////////////////////
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

    batchCreate(requests: BatchUserImportRequest[] = [], jobOptions?: IBatchJobOptions): BatchUsersJob {
        return new BatchUsersJob(this.opts, requests, jobOptions);
    }
}
