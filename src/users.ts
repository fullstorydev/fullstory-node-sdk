import { BatchUserImportRequest, BatchUserImportResponse, CreateUserRequest, CreateUserResponse, FailedUserImport, GetUserResponse, JobMetadata, JobStatus, ListUsersResponse, UpdateUserRequest, UpdateUserResponse } from '@model/index';

import { UsersApi as FSUsersApi } from './api';
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
    pullInterval?: number; // ms, defaults to 10 seconds
}

export interface IBatchUsersJob {
    options: IBatchJobOptions;
    requests: Array<BatchUserImportRequest>;

    // when the job had been created
    readonly job?: JobMetadata;
    readonly imports?: number;
    readonly errors?: number;

    // add more users in the request before the job executes
    // throws error if job is already executed, or max number of users reached
    add(requests: Array<BatchUserImportRequest>): IBatchUsersJob;

    // start to execute the job by invoking the create batch import api
    execute(): void;

    // get the ID anytime, undefined if not yet executed
    getId(): string | undefined;

    // callback is called at each pull interval while the job is still processing (job status == PROCESSING)
    on(type: 'processing', callback: () => void): IBatchUsersJob;

    // when job status becomes COMPLETED or FAILED
    // automatically call /users/batch/{job_id}/imports and
    // /users/batch/{job_id}/errors
    // to get importedUsers and failedUsers
    on(type: 'done',
        importedCB: (imported: BatchUserImportResponse[]) => void,
        failedCB: (failed: FailedUserImport[]) => void
    ): IBatchUsersJob;

    // Any other errors, may include but not limit to:
    // - failures when making API requests, i.e. network, http errors
    // - when job status is COMPLETED or FAILED, but unable to retrieve imported/failed users, etc.
    on(type: 'error', callback: (errors: FSError[]) => void): IBatchUsersJob;

    // get the current job status, undefined if not yet executed
    getStatus(): Promise<JobStatus> | undefined;

    // retrieve imports or errors, undefined if job not done yet
    getImports(): Promise<BatchUserImportResponse[]> | undefined;
    getImportErrors(): Promise<FailedUserImport[]> | undefined;
}

export interface IBatchUsersApi {
    batchCreate(
        requests?: Array<BatchUserImportRequest>,
        jobOptions?: IBatchJobOptions
    ): IBatchUsersJob;
}

export class Users implements IUsersApi, IBatchUsersApi {
    protected readonly usersImpl: FSUsersApi;

    constructor(opts: FullStoryOptions) {
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

    batchCreate(requests: BatchUserImportRequest[], jobOptions: IBatchJobOptions): IBatchUsersJob {
        return new BatchUsersJob(requests, jobOptions);
    }
}

class BatchUsersJob implements IBatchUsersJob {
    defaultOpts: IBatchJobOptions = {
        pullInterval: 20000
    };

    options: IBatchJobOptions = {};
    requests: BatchUserImportRequest[] = [];
    job?: JobMetadata | undefined;
    imports?: number | undefined;
    errors?: number | undefined;

    constructor(requests?: BatchUserImportRequest[], opts?: IBatchJobOptions) {
        if (requests) {
            this.requests.push(...requests);
        }
        if (opts) {
            Object.assign(this.options, opts);
        }
    }
    getId(): string | undefined {
        return this.job?.id;
    }

    on(type: 'processing', callback: () => void): IBatchUsersJob;
    on(type: 'done', importedCB: (imported: BatchUserImportResponse[]) => void, failedCB: (failed: FailedUserImport[]) => void): IBatchUsersJob;
    on(type: 'error', callback: (errors: FSError[]) => void): IBatchUsersJob;
    on(type: unknown, importedCB: unknown, failedCB?: unknown): IBatchUsersJob {
        throw new Error('Method not implemented.');
    }

    getStatus(): Promise<JobStatus> | undefined {
        throw new Error('Method not implemented.');
    }

    add(requests: BatchUserImportRequest[]): IBatchUsersJob {
        this.requests.push(...requests);
        return this;
    }

    execute(): void {
        throw new Error('Method not implemented.');
    }

    getImports(): Promise<BatchUserImportResponse[]> | undefined {
        throw new Error('Method not implemented.');
    }
    getImportErrors(): Promise<FailedUserImport[]> | undefined {
        throw new Error('Method not implemented.');
    }
}
