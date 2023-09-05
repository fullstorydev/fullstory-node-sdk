import { EventsApi as FSEventsApi, EventsBatchImportApi as FSBatchEventsApi } from '@api/index';
import { BatchCreateEventsResponse, CreateBatchEventsImportJobRequest, CreateBatchEventsImportJobResponse, CreateEventsRequest, FailedEventsImport, GetBatchEventsImportErrorsResponse, GetBatchEventsImportsResponse, JobStatusResponse } from '@model/index';

import { BatchJob, BatchJobImpl, BatchJobOptions, BatchRequester } from './batch';
import { FSRequestOptions, FSResponse, FullStoryOptions } from './http';
import { WithJobOptions, WithRequestOptions } from './options';

////////////////////////////////////
//  CRUD operations
////////////////////////////////////

/**
 * @interface EventsApi - create events within a single context.
*/
export interface EventsApi {
    create(body: CreateEventsRequest): Promise<FSResponse<void>>;
}

////////////////////////////////////
//  Batch Imports
////////////////////////////////////

/**
 * @interface BatchEventsApi - batch import events across multiple context.
*/
export interface BatchEventsApi {
    batchCreate(
        body?: CreateBatchEventsImportJobRequest,
        includeSchema?: boolean,
    ): BatchEventsJob;
}

/**
 * @interface BatchEventsJob - a job for batch import events, providing job management and callbacks.
*/
export type BatchEventsJob = BatchJob<CreateBatchEventsImportJobRequest, CreateEventsRequest, BatchCreateEventsResponse, FailedEventsImport>;

/**
 * @interface Events - create or batch import events.
*/
export type Events = BatchEventsApi & EventsApi & WithRequestOptions<EventsApi> & WithJobOptions<BatchEventsApi>;

class BatchEventsJobImpl extends BatchJobImpl<CreateBatchEventsImportJobRequest, CreateEventsRequest, CreateBatchEventsImportJobResponse, JobStatusResponse, BatchCreateEventsResponse, FailedEventsImport> {
    constructor(fsOpts: FullStoryOptions, request: CreateBatchEventsImportJobRequest = { requests: [] }, opts: BatchJobOptions = {}, includeSchema = false) {
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

    async requestCreateJob(req: CreateBatchEventsImportJobRequest): Promise<CreateBatchEventsImportJobResponse> {
        const rsp = await this.batchEventsImpl.createBatchEventsImportJob(req, this.fsOpts);
        // make sure job metadata exist
        const job = rsp.body;
        if (!job?.job?.id) {
            throw new Error(`Unable to get job ID after creating job, server status: ${rsp.httpStatusCode}`);
        }
        return job;
    }

    async requestImports(id: string, pageToken?: string): Promise<GetBatchEventsImportsResponse> {
        const res = await this.batchEventsImpl.getBatchEventsImports(id, pageToken, this.includeSchema, this.fsOpts);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with expected body');
        }
        return results;
    }

    async requestImportErrors(id: string, pageToken?: string): Promise<GetBatchEventsImportErrorsResponse> {
        const res = await this.batchEventsImpl.getBatchEventsImportErrors(id, pageToken, this.fsOpts);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with expected body');
        }
        return results;
    }

    async requestJobStatus(id: string): Promise<JobStatusResponse> {
        const rsp = await this.batchEventsImpl.getBatchEventsImportStatus(id, this.fsOpts);
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
    protected readonly eventsImpl: FSEventsApi; // pure API impl

    constructor(protected opts: FullStoryOptions, protected jobOptions: BatchJobOptions = {}) {
        this.eventsImpl = new FSEventsApi(opts);
    }

    withRequestOptions(ro: FSRequestOptions) {
        return new EventsImpl(Object.assign({}, this.opts, ro));
    }

    withBatchJobOptions(bo: BatchJobOptions) {
        return new EventsImpl(Object.assign({}, this.opts), bo);
    }

    async create(body: CreateEventsRequest): Promise<FSResponse<void>> {
        return this.eventsImpl.createEvents(body, this.opts);
    }

    batchCreate(body?: CreateBatchEventsImportJobRequest, includeSchema?: boolean): BatchEventsJob {
        return new BatchEventsJobImpl(this.opts, body, this.jobOptions, includeSchema);
    }
}
