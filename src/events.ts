import { EventsApi as FSEventsApi, EventsBatchImportApi as FSBatchEventsApi } from '@api/index';
import { BatchCreateEventsResponse, CreateBatchEventsImportJobRequest, CreateBatchEventsImportJobResponse, CreateEventsRequest, FailedEventsImport, GetBatchEventsImportErrorsResponse, GetBatchEventsImportsResponse, JobStatusResponse } from '@model/index';

import { BatchJob, BatchJobOptions, IBatchJob, IBatchRequester } from './batch';
import { FSRequestOptions, FSResponse, FullStoryOptions } from './http';
import { maybeAddIntegrationSrc } from './utils/integrationSrc';

////////////////////////////////////
//  CRUD operations
////////////////////////////////////

/**
 * @interface IEventsApi - create events within a single context.
*/
export interface IEventsApi {
    create(...req: Parameters<typeof FSEventsApi.prototype.createEvents>): Promise<FSResponse<void>>;
}

////////////////////////////////////
//  Batch Imports
////////////////////////////////////

/**
 * @interface IBatchEventsApi - batch import events across multiple context.
*/
export interface IBatchEventsApi {
    batchCreate(
        requests?: CreateEventsRequest[],
        jobOptions?: BatchJobOptions
    ): BatchEventsJob;
}

/**
 * @interface IBatchEventsJob - a job for batch import events, providing job management and callbacks.
*/
export type IBatchEventsJob = IBatchJob<CreateEventsRequest, BatchCreateEventsResponse, FailedEventsImport>;

/**
 * @interface IEvents - create or batch import events.
*/
export type IEvents = IBatchEventsApi & IEventsApi;

class BatchEventsJob extends BatchJob<CreateEventsRequest, CreateBatchEventsImportJobResponse, JobStatusResponse, BatchCreateEventsResponse, FailedEventsImport> {
    constructor(fsOpts: FullStoryOptions, requests: CreateEventsRequest[] = [], opts: BatchJobOptions = {}) {
        super(requests, new BatchEventsRequester(fsOpts), opts);
    }
}

export type IBatchEventRequester = IBatchRequester<CreateBatchEventsImportJobRequest, CreateBatchEventsImportJobResponse, JobStatusResponse, GetBatchEventsImportsResponse, GetBatchEventsImportErrorsResponse>;

class BatchEventsRequester implements IBatchEventRequester {
    protected readonly batchEventsImpl: FSBatchEventsApi;
    protected readonly fsOpts: FullStoryOptions;

    constructor(fsOpts: FullStoryOptions) {
        this.fsOpts = fsOpts;
        this.batchEventsImpl = new FSBatchEventsApi(fsOpts);
    }

    async requestCreateJob(requests: CreateBatchEventsImportJobRequest): Promise<CreateBatchEventsImportJobResponse> {
        for (const req of requests.requests) {
            req.context = maybeAddIntegrationSrc(req.context, this.fsOpts.integration_src);
        }
        const rsp = await this.batchEventsImpl.createBatchEventsImportJob(requests);
        // make sure job metadata exist
        const job = rsp.body;
        if (!job?.job?.id) {
            throw new Error(`Unable to get job ID after creating job, server status: ${rsp.httpStatusCode}`);
        }
        return job;
    }

    async requestImports(id: string, nextPageToken?: string): Promise<GetBatchEventsImportsResponse> {
        const res = await this.batchEventsImpl.getBatchEventsImports(id, nextPageToken);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with expected body');
        }
        return results;
    }

    async requestImportErrors(id: string, nextPageToken?: string): Promise<GetBatchEventsImportErrorsResponse> {
        const res = await this.batchEventsImpl.getBatchEventsImportErrors(id, nextPageToken);
        const results = res.body;
        if (!results) {
            throw new Error('API did not response with expected body');
        }
        return results;
    }

    async requestJobStatus(id: string): Promise<JobStatusResponse> {
        const rsp = await this.batchEventsImpl.getBatchEventsImportStatus(id);
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

export class Events implements IEvents {
    protected readonly eventsImpl: FSEventsApi;

    constructor(private opts: FullStoryOptions) {
        this.eventsImpl = new FSEventsApi(opts);
    }

    async create(body: CreateEventsRequest, options?: FSRequestOptions | undefined): Promise<FSResponse<void>> {
        body.context = maybeAddIntegrationSrc(body.context, options?.integration_src);
        return this.eventsImpl.createEvents(body, options);
    }

    batchCreate(requests?: CreateEventsRequest[] | undefined, jobOptions?: BatchJobOptions | undefined): BatchEventsJob {
        return new BatchEventsJob(this.opts, requests, jobOptions);
    }
}
