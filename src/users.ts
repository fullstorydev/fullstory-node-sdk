import { UsersApi as FSUsersApi, UsersBatchImportApi as FSUsersBatchApi } from '@api/index';
import { BatchUserImportRequest, BatchUserImportResponse, CreateBatchUserImportJobRequest, CreateBatchUserImportJobResponse, CreateUserRequest, CreateUserResponse, FailedUserImport, GetBatchEventsImportErrorsResponse, GetBatchUserImportErrorsResponse, GetBatchUserImportsResponse, GetUserResponse, JobStatusResponse, ListUsersResponse, UpdateUserRequest, UpdateUserResponse } from '@model/index';

import { BatchJob, BatchJobImpl, BatchJobOptions, BatchRequester } from './batch';
import { FSInvalidArgumentError } from './errors/invalidArgument';
import { FSRequestOptions, FSResponse, FullStoryOptions } from './http';

////////////////////////////////////
//  CRUD operations
////////////////////////////////////

/**
 * @interface UsersApi - single CRUD operations for a user.
*/
export interface UsersApi {
    get(...req: Parameters<typeof FSUsersApi.prototype.getUser>): Promise<FSResponse<GetUserResponse>>;

    create(...req: Parameters<typeof FSUsersApi.prototype.createUser>): Promise<FSResponse<CreateUserResponse>>;

    list(...req: Parameters<typeof FSUsersApi.prototype.listUsers>): Promise<FSResponse<ListUsersResponse>>;

    delete(request: { id?: string, uid?: string; }, options?: FSRequestOptions): Promise<FSResponse<void>>;

    update(...req: Parameters<typeof FSUsersApi.prototype.updateUser>): Promise<FSResponse<UpdateUserResponse>>;
}

////////////////////////////////////
//  Batch Imports
////////////////////////////////////

/**
 * @interface BatchUsersApi - batch import users.
*/
export interface BatchUsersApi {
    batchCreate(
        request?: CreateBatchUserImportJobRequest,
        jobOptions?: BatchJobOptions
    ): BatchUsersJob;
}

/**
 * @interface BatchUsersJob - a job for batch import users, providing job management and callbacks.
*/
export type BatchUsersJob = BatchJob<CreateBatchUserImportJobRequest, BatchUserImportRequest, BatchUserImportResponse, FailedUserImport>;

/**
 * @interface Users - CRUD operations or batch import users.
*/
export type Users = BatchUsersApi & UsersApi;

class BatchUsersJobImpl extends BatchJobImpl<CreateBatchUserImportJobRequest, BatchUserImportRequest, CreateBatchUserImportJobResponse, JobStatusResponse, BatchUserImportResponse, FailedUserImport> {
    constructor(fsOpts: FullStoryOptions, request: CreateBatchUserImportJobRequest, opts: BatchJobOptions = {}, includeSchema = false) {
        super(request, new BatchUsersRequesterImpl(fsOpts, includeSchema), opts);
    }
}
export type BatchUsersRequester = BatchRequester<CreateBatchUserImportJobRequest, CreateBatchUserImportJobResponse, JobStatusResponse, GetBatchUserImportsResponse, GetBatchEventsImportErrorsResponse>;

class BatchUsersRequesterImpl implements BatchUsersRequester {
    protected readonly batchUsersImpl: FSUsersBatchApi;
    protected readonly fsOpts: FullStoryOptions;
    protected readonly includeSchema: boolean;

    constructor(fsOpts: FullStoryOptions, includeSchema: boolean) {
        this.fsOpts = fsOpts;
        this.includeSchema = includeSchema;
        this.batchUsersImpl = new FSUsersBatchApi(fsOpts);
    }

    async requestCreateJob(request: { body: CreateBatchUserImportJobRequest, idempotencyKey?: string; }): Promise<CreateBatchUserImportJobResponse> {
        const rsp = await this.batchUsersImpl.createBatchUserImportJob(request, this.fsOpts);
        // make sure job metadata and id exist
        const job = rsp.body;
        if (!job?.job?.id) {
            throw new Error(`Unable to get job ID after creating job, server status: ${rsp.httpStatusCode}`);
        }
        return job;
    }

    async requestImports(jobId: string, pageToken?: string): Promise<GetBatchUserImportsResponse> {
        const res = await this.batchUsersImpl.getBatchUserImports({ jobId, pageToken, includeSchema: this.includeSchema }, this.fsOpts);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with any expected body');
        }
        return results;
    }

    async requestImportErrors(jobId: string, pageToken?: string): Promise<GetBatchUserImportErrorsResponse> {
        const res = await this.batchUsersImpl.getBatchUserImportErrors({ jobId, pageToken }, this.fsOpts);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with any results');
        }
        return results;
    }

    async requestJobStatus(jobId: string): Promise<JobStatusResponse> {
        const rsp = await this.batchUsersImpl.getBatchUserImportStatus({ jobId }, this.fsOpts);
        const body = rsp.body;
        if (!body) {
            throw new Error('API did not response with any results');
        }
        return body;
    }
}

////////////////////////////////////
//  Exported User Interface
////////////////////////////////////

export class UsersImpl implements Users {
    protected readonly usersImpl: FSUsersApi;

    constructor(private opts: FullStoryOptions) {
        this.usersImpl = new FSUsersApi(opts);
    }

    //TODO(sabrina): move options or make query param a typed object, to make call signature backward compatible when adding query params
    async get(request: { id: string, includeSchema?: boolean; }, options?: FSRequestOptions | undefined): Promise<FSResponse<GetUserResponse>> {
        return this.usersImpl.getUser(request, options);
    }

    async create(request: { body: CreateUserRequest; }, options?: FSRequestOptions | undefined): Promise<FSResponse<CreateUserResponse>> {
        return this.usersImpl.createUser(request, options);
    }

    async list(request: { uid?: string | undefined, email?: string | undefined, displayName?: string | undefined, isIdentified?: boolean | undefined, pageToken?: string | undefined, includeSchema?: boolean; }, options?: FSRequestOptions | undefined): Promise<FSResponse<ListUsersResponse>> {
        return this.usersImpl.listUsers(request, options);
    }

    async delete(request: { id?: string, uid?: string; }, options?: FSRequestOptions | undefined): Promise<FSResponse<void>> {
        const { id, uid } = request;
        if (id && !uid) {
            return this.usersImpl.deleteUser({ id }, options);
        }
        if (uid && !id) {
            return this.usersImpl.deleteUserByUid({ uid }, options);
        }
        throw new FSInvalidArgumentError('At least one and only one of id or uid is required.');
    }

    async update(request: { id: string, body: UpdateUserRequest; }, options?: FSRequestOptions | undefined): Promise<FSResponse<UpdateUserResponse>> {
        return this.usersImpl.updateUser(request, options);
    }

    batchCreate(request: CreateBatchUserImportJobRequest = { requests: [] }, jobOptions?: BatchJobOptions, includeSchema?: boolean): BatchUsersJob {
        return new BatchUsersJobImpl(this.opts, request, jobOptions, includeSchema);
    }
}
