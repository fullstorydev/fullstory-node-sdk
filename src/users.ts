import { UsersApi as FSUsersApi, UsersBatchImportApi as FSUsersBatchApi } from '@api/index';
import { BatchUserImportRequest, BatchUserImportResponse, CreateBatchUserImportJobRequest, CreateBatchUserImportJobResponse, CreateUserRequest, CreateUserResponse, FailedUserImport, GetBatchEventsImportErrorsResponse, GetBatchUserImportErrorsResponse, GetBatchUserImportsResponse, GetUserResponse, JobStatusResponse, ListUsersResponse, UpdateUserRequest, UpdateUserResponse } from '@model/index';

import { BatchJob, BatchJobOptions, IBatchJob, IBatchRequester } from './batch';
import { FSRequestOptions, FSResponse, FullStoryOptions } from './http';

////////////////////////////////////
//  CRUD operations
////////////////////////////////////

/**
 * @interface IUsersApi - single CRUD operations for a user.
*/
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

/**
 * @interface IBatchUsersApi - batch import users.
*/
export interface IBatchUsersApi {
    batchCreate(
        requests?: Array<BatchUserImportRequest>,
        jobOptions?: BatchJobOptions
    ): BatchUsersJob;
}

/**
 * @interface IBatchUsersJob - a job for batch import users, providing job management and callbacks.
*/
export type IBatchUsersJob = IBatchJob<BatchUserImportRequest, BatchUserImportResponse, FailedUserImport>;

/**
 * @interface IUsers - CRUD operations or batch import users.
*/
export type IUsers = IBatchUsersApi & IUsersApi;

class BatchUsersJob extends BatchJob<BatchUserImportRequest, CreateBatchUserImportJobResponse, JobStatusResponse, BatchUserImportResponse, FailedUserImport> {
    constructor(fsOpts: FullStoryOptions, requests: BatchUserImportRequest[] = [], opts: BatchJobOptions = {}) {
        super(requests, new BatchUsersRequester(fsOpts), opts);
    }
}
export type IBatchUsersRequester = IBatchRequester<CreateBatchUserImportJobRequest, CreateBatchUserImportJobResponse, JobStatusResponse, GetBatchUserImportsResponse, GetBatchEventsImportErrorsResponse>;

class BatchUsersRequester implements IBatchUsersRequester {
    protected readonly batchUsersImpl: FSUsersBatchApi;

    constructor(fsOpts: FullStoryOptions) {
        this.batchUsersImpl = new FSUsersBatchApi(fsOpts);
    }

    async requestCreateJob(request: CreateBatchUserImportJobRequest): Promise<CreateBatchUserImportJobResponse> {
        const rsp = await this.batchUsersImpl.createBatchUserImportJob(request);
        // make sure job metadata and id exist
        const job = rsp.body;
        if (!job?.job?.id) {
            throw new Error(`Unable to get job ID after creating job, server status: ${rsp.httpStatusCode}`);
        }
        return job;
    }

    async requestImports(id: string, nextPageToken?: string): Promise<GetBatchUserImportsResponse> {
        const res = await this.batchUsersImpl.getBatchUserImports(id, nextPageToken);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with any expected body');
        }
        return results;
    }

    async requestImportErrors(id: string, nextPageToken?: string): Promise<GetBatchUserImportErrorsResponse> {
        const res = await this.batchUsersImpl.getBatchUserImportErrors(id, nextPageToken);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with any results');
        }
        return results;
    }

    async requestJobStatus(id: string): Promise<JobStatusResponse> {
        const rsp = await this.batchUsersImpl.getBatchUserImportStatus(id);
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

export class Users implements IUsers {
    protected readonly usersImpl: FSUsersApi;

    constructor(private opts: FullStoryOptions) {
        this.usersImpl = new FSUsersApi(opts);
    }

    //TODO(sabrina): move options or make query param a typed object, to make call signature backward compatible when adding query params
    async get(id: string, includeSchema?: boolean, options?: FSRequestOptions | undefined): Promise<FSResponse<GetUserResponse>> {
        return this.usersImpl.getUser(id, includeSchema, options);
    }

    async create(body: CreateUserRequest, includeSchema?: boolean, options?: FSRequestOptions | undefined): Promise<FSResponse<CreateUserResponse>> {
        return this.usersImpl.createUser(body, includeSchema, options);
    }

    async list(uid?: string | undefined, email?: string | undefined, displayName?: string | undefined, isIdentified?: boolean | undefined, pageToken?: string | undefined, includeSchema?: boolean, options?: FSRequestOptions | undefined): Promise<FSResponse<ListUsersResponse>> {
        return this.usersImpl.listUsers(uid, email, displayName, isIdentified, pageToken, includeSchema, options);
    }

    async delete(id: string, options?: FSRequestOptions | undefined): Promise<FSResponse<void>> {
        return this.usersImpl.deleteUser(id, options);
    }

    async update(id: string, body: UpdateUserRequest, includeSchema?: boolean, options?: FSRequestOptions | undefined): Promise<FSResponse<UpdateUserResponse>> {
        return this.usersImpl.updateUser(id, body, includeSchema, options);
    }

    batchCreate(requests: BatchUserImportRequest[] = [], jobOptions?: BatchJobOptions): BatchUsersJob {
        return new BatchUsersJob(this.opts, requests, jobOptions);
    }
}
