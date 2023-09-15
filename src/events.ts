import { EventsApi as FSEventsApi, EventsBatchImportApi as FSBatchEventsApi } from '@api/index';
import { BatchCreateEventsResponse, CreateBatchEventsImportJobRequest, CreateBatchEventsImportJobResponse, CreateEventRequest, FailedEventsImport, GetBatchEventsImportErrorsResponse, GetBatchEventsImportsResponse, JobStatusResponse } from '@model/index';

import { BatchJob, BatchJobImpl, BatchJobOptions, BatchRequester } from './batch';
import { FSResponse, FullStoryOptions, WithOptions } from './http';

////////////////////////////////////
//  CRUD operations
////////////////////////////////////

/**
 * @interface EventsApi - create events within a single context.
*/
interface EventsApi {
    create(...req: Parameters<typeof FSEventsApi.prototype.createEvent>): Promise<FSResponse<void>>;
}

////////////////////////////////////
//  Batch Imports
////////////////////////////////////

/**
 * @interface BatchEventsApi - batch import events across multiple context.
*/
interface BatchEventsApi {
    batchCreate(
        request?: {
            body: CreateBatchEventsImportJobRequest,
            includeSchema?: boolean,
        },
        jobOptions?: BatchJobOptions,
    ): BatchEventsJob;
}

/**
 * @interface BatchEventsJob - a job for batch import events, providing job management and callbacks.
*/
export type BatchEventsJob = BatchJob<CreateBatchEventsImportJobRequest, CreateEventRequest, BatchCreateEventsResponse, FailedEventsImport>;

/**
 * @interface Events - create or batch import events.
*/
export type Events = BatchEventsApi & EventsApi;

class BatchEventsJobImpl extends BatchJobImpl<CreateBatchEventsImportJobRequest, CreateEventRequest, CreateBatchEventsImportJobResponse, JobStatusResponse, BatchCreateEventsResponse, FailedEventsImport> {
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

    async requestCreateJob(request: { body: CreateBatchEventsImportJobRequest, idempotencyKey?: string; }): Promise<CreateBatchEventsImportJobResponse> {
        const rsp = await this.batchEventsImpl.createBatchEventsImportJob(request);
        // make sure job metadata exist
        const job = rsp.body;
        if (!job?.job?.id) {
            throw new Error(`Unable to get job ID after creating job, server status: ${rsp.httpStatusCode}`);
        }
        return job;
    }

    async requestImports(jobId: string, pageToken?: string): Promise<GetBatchEventsImportsResponse> {
        const res = await this.batchEventsImpl.getBatchEventsImports({ jobId, pageToken, includeSchema: this.includeSchema });
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with expected body');
        }
        return results;
    }

    async requestImportErrors(jobId: string, pageToken?: string): Promise<GetBatchEventsImportErrorsResponse> {
        const res = await this.batchEventsImpl.getBatchEventsImportErrors({ jobId, pageToken });
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with expected body');
        }
        return results;
    }

    async requestJobStatus(jobId: string): Promise<JobStatusResponse> {
        const rsp = await this.batchEventsImpl.getBatchEventsImportStatus({ jobId });
        const body = rsp.body;
        if (!body) {
            throw new Error('API did not response with any results');
        }
        return body;
    }
}

////////////////////////////////////
//  Exported Event Interface
////////////////////////////////////
export class EventsImpl implements Events, WithOptions<Events> {
    protected readonly eventsImpl: FSEventsApi;

    constructor(private opts: FullStoryOptions) {
        this.eventsImpl = new FSEventsApi(opts);
    }

    withOptions(opts: Partial<FullStoryOptions>): Events {
        return new EventsImpl({ ...this.opts, ...opts });
    }

    async create(...request: Parameters<typeof FSEventsApi.prototype.createEvent>): Promise<FSResponse<void>> {
        return this.eventsImpl.createEvent(...request);
    }

    batchCreate(request?: { body: CreateBatchEventsImportJobRequest, includeSchema?: boolean; }, jobOptions?: BatchJobOptions): BatchEventsJob {
        return new BatchEventsJobImpl(this.opts, request?.body, jobOptions, request?.includeSchema);
    }
}
