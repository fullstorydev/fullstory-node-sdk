import { UsersApi as FSUsersApi, UsersBatchImportApi as FSUsersBatchApi } from '@api/index';
import { BatchUserImportRequest, BatchUserImportResponse, CreateBatchUserImportJobRequest, CreateBatchUserImportJobResponse, CreateUserRequest, CreateUserResponse, FailedUserImport, GetBatchEventsImportErrorsResponse, GetBatchUserImportErrorsResponse, GetBatchUserImportsResponse, GetUserResponse, JobStatusResponse, ListUsersResponse, UpdateUserRequest, UpdateUserResponse } from '@model/index';

import { BatchJob, BatchJobImpl, BatchJobOptions, BatchRequester } from './batch';
import { FSInvalidArgumentError } from './errors/invalidArgument';
import { FSRequestOptions, FSResponse, FullStoryOptions } from './http';
import { WithJobOptions, WithRequestOptions } from './options';

////////////////////////////////////
//  CRUD operations
////////////////////////////////////

/**
 * @interface UsersApi - single CRUD operations for a user.
*/
export interface UsersApi {
    get(
        id: string,
        includeSchema?: boolean,
    ): Promise<FSResponse<GetUserResponse>>;

    create(
        body: CreateUserRequest,
    ): Promise<FSResponse<CreateUserResponse>>;

    list(
        uid?: string,
        email?: string,
        displayName?: string,
        isIdentified?: boolean,
        pageToken?: string,
        includeSchema?: boolean,
    ): Promise<FSResponse<ListUsersResponse>>;

    delete(
        id?: string,
        uid?: string,
    ): Promise<FSResponse<void>>;

    update(
        id: string,
        body: UpdateUserRequest,
    ): Promise<FSResponse<UpdateUserResponse>>;
}

////////////////////////////////////
//  Batch Imports
////////////////////////////////////

/**
 * @interface BatchUsersApi - batch import users.
*/
export interface BatchUsersApi {
    batchCreate(
        body?: CreateBatchUserImportJobRequest,
        includeSchema?: boolean,
    ): BatchUsersJob;
}

/**
 * @interface BatchUsersJob - a job for batch import users, providing job management and callbacks.
*/
export type BatchUsersJob = BatchJob<CreateBatchUserImportJobRequest, BatchUserImportRequest, BatchUserImportResponse, FailedUserImport>;

/**
 * @interface Users - CRUD operations or batch import users.
*/
export type Users = BatchUsersApi & UsersApi & WithRequestOptions<UsersApi> & WithJobOptions<BatchUsersApi>;

class BatchUsersJobImpl extends BatchJobImpl<CreateBatchUserImportJobRequest, BatchUserImportRequest, CreateBatchUserImportJobResponse, JobStatusResponse, BatchUserImportResponse, FailedUserImport> {
    constructor(fsOpts: FullStoryOptions, request: CreateBatchUserImportJobRequest = { requests: [] }, opts: BatchJobOptions = {}, includeSchema = false) {
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

    async requestCreateJob(req: CreateBatchUserImportJobRequest): Promise<CreateBatchUserImportJobResponse> {
        const rsp = await this.batchUsersImpl.createBatchUserImportJob(req, this.fsOpts);
        // make sure job metadata and id exist
        const job = rsp.body;
        if (!job?.job?.id) {
            throw new Error(`Unable to get job ID after creating job, server status: ${rsp.httpStatusCode}`);
        }
        return job;
    }

    async requestImports(id: string, pageToken?: string): Promise<GetBatchUserImportsResponse> {
        const res = await this.batchUsersImpl.getBatchUserImports(id, pageToken, this.includeSchema, this.fsOpts);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with any expected body');
        }
        return results;
    }

    async requestImportErrors(id: string, pageToken?: string): Promise<GetBatchUserImportErrorsResponse> {
        const res = await this.batchUsersImpl.getBatchUserImportErrors(id, pageToken, this.fsOpts);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with any results');
        }
        return results;
    }

    async requestJobStatus(id: string): Promise<JobStatusResponse> {
        const rsp = await this.batchUsersImpl.getBatchUserImportStatus(id, this.fsOpts);
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

    constructor(protected opts: FullStoryOptions, protected jobOptions: BatchJobOptions = {}) {
        this.usersImpl = new FSUsersApi(opts);
    }

    withRequestOptions(ro: FSRequestOptions) {
        return new UsersImpl(Object.assign({}, this.opts, ro));
    }

    withBatchJobOptions(bo: BatchJobOptions) {
        return new UsersImpl(Object.assign({}, this.opts), bo);
    }

    async get(id: string, includeSchema?: boolean,): Promise<FSResponse<GetUserResponse>> {
        return this.usersImpl.getUser(id, includeSchema, this.opts);
    }

    async create(body: CreateUserRequest): Promise<FSResponse<CreateUserResponse>> {
        return this.usersImpl.createUser(body, this.opts);
    }

    async list(uid?: string, email?: string, displayName?: string, isIdentified?: boolean, pageToken?: string, includeSchema?: boolean): Promise<FSResponse<ListUsersResponse>> {
        return this.usersImpl.listUsers(uid, email, displayName, isIdentified, pageToken, includeSchema, this.opts);
    }

    async delete(id?: string, uid?: string): Promise<FSResponse<void>> {
        if (id && !uid) {
            return this.usersImpl.deleteUser(id, this.opts);
        }
        if (uid && !id) {
            return this.usersImpl.deleteUserByUid(uid, this.opts);
        }
        throw new FSInvalidArgumentError('At least one and only one of id or uid is required.');
    }

    async update(id: string, body: UpdateUserRequest): Promise<FSResponse<UpdateUserResponse>> {
        return this.usersImpl.updateUser(id, body, this.opts);
    }

    batchCreate(body?: CreateBatchUserImportJobRequest, includeSchema?: boolean): BatchUsersJob {
        return new BatchUsersJobImpl(this.opts, body, this.jobOptions, includeSchema);
    }
}
