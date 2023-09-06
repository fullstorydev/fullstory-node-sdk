import { EventsApi as FSEventsApi, EventsBatchImportApi as FSBatchEventsApi } from '@api/index';
import { BatchCreateEventsResponse, CreateBatchEventsImportJobRequest, CreateBatchEventsImportJobResponse, CreateEventsRequest, FailedEventsImport, GetBatchEventsImportErrorsResponse, GetBatchEventsImportsResponse, JobStatusResponse } from '@model/index';

import { BatchJob, BatchJobImpl, BatchJobOptions, BatchRequester } from './batch';
import { FSRequestOptions, FSResponse, FullStoryOptions } from './http';

////////////////////////////////////
//  CRUD operations
////////////////////////////////////

/**
 * @interface EventsApi - create events within a single context.
*/
export interface EventsApi {
    create(...req: Parameters<typeof FSEventsApi.prototype.createEvents>): Promise<FSResponse<void>>;
}

////////////////////////////////////
//  Batch Imports
////////////////////////////////////

/**
 * @interface BatchEventsApi - batch import events across multiple context.
*/
export interface BatchEventsApi {
    batchCreate(
        request: {
            body: CreateBatchEventsImportJobRequest,
            includeSchema?: boolean,
        },
        jobOptions?: BatchJobOptions,
        reqOptions?: FSRequestOptions,
    ): BatchEventsJob;
}

/**
 * @interface BatchEventsJob - a job for batch import events, providing job management and callbacks.
*/
export type BatchEventsJob = BatchJob<CreateBatchEventsImportJobRequest, CreateEventsRequest, BatchCreateEventsResponse, FailedEventsImport>;

/**
 * @interface IEvents - create or batch import events.
*/
export type Events = BatchEventsApi & EventsApi;

class BatchEventsJobImpl extends BatchJobImpl<CreateBatchEventsImportJobRequest, CreateEventsRequest, CreateBatchEventsImportJobResponse, JobStatusResponse, BatchCreateEventsResponse, FailedEventsImport> {
    constructor(fsOpts: FullStoryOptions, request: CreateBatchEventsImportJobRequest, opts: BatchJobOptions = {}, includeSchema = false) {
        super(request, new BatchEventsRequesterImpl(fsOpts, includeSchema), opts);
    }
}

export type BatchEventRequester = BatchRequester<CreateBatchEventsImportJobRequest, CreateBatchEventsImportJobResponse, JobStatusResponse, GetBatchEventsImportsResponse, GetBatchEventsImportErrorsResponse>;

class BatchEventsRequesterImpl implements BatchEventRequester {
    protected readonly batchEventsImpl: FSBatchEventsApi;
    protected readonly fsOpts: FullStoryOptions;
    protected readonly includeSchema: boolean;

    constructor(fsOpts: FullStoryOptions, includeSchema: boolean) {
        this.fsOpts = fsOpts;
        this.includeSchema = includeSchema;
        this.batchEventsImpl = new FSBatchEventsApi(fsOpts);
    }

    async requestCreateJob(request: { body: CreateBatchEventsImportJobRequest, idempotencyKey?: string; }): Promise<CreateBatchEventsImportJobResponse> {
        const rsp = await this.batchEventsImpl.createBatchEventsImportJob(request, this.fsOpts);
        // make sure job metadata exist
        const job = rsp.body;
        if (!job?.job?.id) {
            throw new Error(`Unable to get job ID after creating job, server status: ${rsp.httpStatusCode}`);
        }
        return job;
    }

    async requestImports(jobId: string, pageToken?: string): Promise<GetBatchEventsImportsResponse> {
        const res = await this.batchEventsImpl.getBatchEventsImports({ jobId, pageToken, includeSchema: this.includeSchema }, this.fsOpts);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with expected body');
        }
        return results;
    }

    async requestImportErrors(jobId: string, pageToken?: string): Promise<GetBatchEventsImportErrorsResponse> {
        const res = await this.batchEventsImpl.getBatchEventsImportErrors({ jobId, pageToken }, this.fsOpts);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with expected body');
        }
        return results;
    }

    async requestJobStatus(jobId: string): Promise<JobStatusResponse> {
        const rsp = await this.batchEventsImpl.getBatchEventsImportStatus({ jobId }, this.fsOpts);
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

export class EventsImpl implements Events {
    protected readonly eventsImpl: FSEventsApi;

    constructor(private opts: FullStoryOptions) {
        this.eventsImpl = new FSEventsApi(opts);
    }

    async create(request: { body: CreateEventsRequest; }, options?: FSRequestOptions): Promise<FSResponse<void>> {
        return this.eventsImpl.createEvents(request, { ...this.opts, ...options });
    }

    batchCreate(request: { body: CreateBatchEventsImportJobRequest, includeSchema?: boolean; }, jobOptions?: BatchJobOptions, reqOptions?: FSRequestOptions): BatchEventsJob {
        return new BatchEventsJobImpl({ ...this.opts, ...reqOptions }, request.body, jobOptions, request.includeSchema);
    }
}
