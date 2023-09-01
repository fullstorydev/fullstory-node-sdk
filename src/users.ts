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
    get(
        request: {
            id: string,
            includeSchema?: boolean,
        },
        options?: FSRequestOptions,
    ): Promise<FSResponse<GetUserResponse>>;

    create(
        request: {
            body: CreateUserRequest,
        },
        options?: FSRequestOptions,
    ): Promise<FSResponse<CreateUserResponse>>;

    list(
        request: {
            uid?: string,
            email?: string,
            displayName?: string,
            isIdentified?: boolean,
            pageToken?: string,
            includeSchema?: boolean,
        },
        options?: FSRequestOptions,
    ): Promise<FSResponse<ListUsersResponse>>;

    delete(
        request: {
            id?: string,
            uid?: string,
        },
        options?: FSRequestOptions,
    ): Promise<FSResponse<void>>;

    update(
        request: {
            id: string,
            body: UpdateUserRequest,
        },
        options?: FSRequestOptions,
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
        request: {
            body?: CreateBatchUserImportJobRequest,
            includeSchema?: boolean,
        },
        jobOptions?: BatchJobOptions,
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

    constructor(private opts: FullStoryOptions) {
        this.usersImpl = new FSUsersApi(opts);
    }

    async get(request: { id: string; includeSchema?: boolean; }, options?: FSRequestOptions): Promise<FSResponse<GetUserResponse>> {
        const { id, includeSchema } = request;
        return this.usersImpl.getUser(id, includeSchema, options);
    }

    async create(request: { body: CreateUserRequest; }, options?: FSRequestOptions): Promise<FSResponse<CreateUserResponse>> {
        const { body } = request;
        return this.usersImpl.createUser(body, options);
    }

    async list(request: { uid?: string; email?: string; displayName?: string; isIdentified?: boolean; pageToken?: string; includeSchema?: boolean; }, options?: FSRequestOptions): Promise<FSResponse<ListUsersResponse>> {
        const { uid, email, displayName, isIdentified, pageToken, includeSchema } = request;
        return this.usersImpl.listUsers(uid, email, displayName, isIdentified, pageToken, includeSchema, options);
    }

    async delete(request: { id?: string; uid?: string; }, options?: FSRequestOptions): Promise<FSResponse<void>> {
        const { id, uid } = request;
        if (id && !uid) {
            return this.usersImpl.deleteUser(id, options);
        }
        if (uid && !id) {
            return this.usersImpl.deleteUserByUid(uid, options);
        }
        throw new FSInvalidArgumentError('At least one and only one of id or uid is required.');
    }

    async update(request: { id: string; body: UpdateUserRequest; }, options?: FSRequestOptions): Promise<FSResponse<UpdateUserResponse>> {
        const { id, body } = request;
        return this.usersImpl.updateUser(id, body, options);
    }

    batchCreate(request: { body?: CreateBatchUserImportJobRequest, includeSchema?: boolean; }, jobOptions?: BatchJobOptions): BatchUsersJob {
        const { body, includeSchema } = request;
        return new BatchUsersJobImpl(this.opts, body, jobOptions, includeSchema);
    }
}
