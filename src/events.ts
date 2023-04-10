import { EventsApi as FSEventsApi, EventsBatchImportApi as FSBatchEventsApi } from '@api/index';
import { CreateBatchEventsImportJobRequest, CreateEventsRequest, CreateEventsResponse, FailedEventsImport, GetBatchEventsImportStatusResponse, JobMetadata } from '@model/index';

import { BatchJob, BatchJobOptions, IBatchRequester } from './batch';
import { FSRequestOptions, FSResponse, FullStoryOptions } from './http';

////////////////////////////////////
//  CRUD operations
////////////////////////////////////

export interface IEventsApi {
    create(...req: Parameters<typeof FSEventsApi.prototype.createEvents>): Promise<FSResponse<CreateEventsResponse>>;
}

////////////////////////////////////
//  Batch Imports
////////////////////////////////////

export interface IBatchEventsApi {
    batchCreate(
        requests?: CreateEventsRequest[],
        jobOptions?: BatchJobOptions
    ): BatchEventsJob;
}

class BatchEventsJob extends BatchJob<'events', GetBatchEventsImportStatusResponse, CreateEventsRequest, CreateEventsResponse, FailedEventsImport> {
    constructor(fsOpts: FullStoryOptions, requests: CreateEventsRequest[] = [], opts: BatchJobOptions = {}) {
        super(requests, new BatchEventsRequester(fsOpts), opts);
    }
}

class BatchEventsRequester implements IBatchRequester<GetBatchEventsImportStatusResponse, CreateEventsRequest, CreateEventsResponse, FailedEventsImport> {
    protected readonly batchEventsImpl: FSBatchEventsApi;

    constructor(fsOpts: FullStoryOptions) {
        this.batchEventsImpl = new FSBatchEventsApi(fsOpts);
    }

    async requestCreateJob(requests: CreateBatchEventsImportJobRequest): Promise<JobMetadata> {
        const rsp = await this.batchEventsImpl.createBatchEventsImportJob(requests);
        // make sure job metadata exist
        const job = rsp.body?.job;
        if (!job) {
            throw new Error(`Unable to get job ID after creating job, server status: ${rsp.httpStatusCode}`);
        }
        return job;
    }

    async requestImports(id: string): Promise<CreateEventsResponse[]> {
        // TODO(sabrina): handle when there's a next_page_token
        // we'd have to invoke /events/batch/{job_id}/imports more than once

        const res = await this.batchEventsImpl.getBatchEventsImports(id);
        const results = res.body?.results;
        if (!results) {
            throw new Error('API did not response with any results');
        }
        return results;
    }

    async requestImportErrors(id: string): Promise<FailedEventsImport[]> {
        // TODO(sabrina): handle when there's a next_page_token
        // we'd have to invoke /events/batch/{job_id}/errors more than once

        const res = await this.batchEventsImpl.getBatchEventsImportErrors(id);
        const results = res.body?.results;
        if (!results) {
            throw new Error('API did not response with any results');
        }
        return results;
    }

    async requestJobStatus(id: string): Promise<GetBatchEventsImportStatusResponse> {
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
export class Events implements IEventsApi, IBatchEventsApi {
    protected readonly eventsImpl: FSEventsApi;

    constructor(private opts: FullStoryOptions) {
        this.eventsImpl = new FSEventsApi(opts);
    }

    async create(body: CreateEventsRequest, options?: FSRequestOptions | undefined): Promise<FSResponse<CreateEventsResponse>> {
        return this.eventsImpl.createEvents(body, options);
    }

    batchCreate(requests?: CreateEventsRequest[] | undefined, jobOptions?: BatchJobOptions | undefined): BatchEventsJob {
        return new BatchEventsJob(this.opts, requests, jobOptions);
    }
}
