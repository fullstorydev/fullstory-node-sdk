/* eslint-disable simple-import-sort/exports */
/* eslint-disable simple-import-sort/imports */

/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from operation: EventsBatchImportApi
 * Do not edit manually.
 */

import { OutgoingHttpHeaders } from 'node:http';
import { RequestOptions } from 'node:https';

import { JobStatusResponse , GetBatchEventsImportErrorsResponse , CreateBatchEventsImportJobRequest , GetBatchEventsImportsResponse , CreateBatchEventsImportJobResponse , ErrorResponse } from '@model/index';

import { FSHttpClientImpl, FSResponse, FullStoryOptions, FSHttpClient } from '../../http';
import { chainedFSError } from '../../errors';

export class EventsBatchImportApi {
    readonly defaultBasePath = 'https://api.fullstory.com';
    private basePath = this.defaultBasePath;
    private httpClient: FSHttpClient;

    constructor(opts: FullStoryOptions) {
        // TODO(sabrina): allow injecting http client dependency rather than instantiating here
        this.httpClient = new FSHttpClientImpl(opts);

        // allow pointing to a different host for dev or tests
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            this.basePath = process.env.FS_API_HOST || this.defaultBasePath;
        }
    }

    /**
     * Creates a batch events import job with the given list of event information.  The maximum number of request objects that can be included in a single batch request is `50,000`. This request can be [made idempotent](../../idempotent-requests).
     * @summary Create Events Batch Import
     * @param body The request payloads contains the list of events to be imported
    */
    public async createBatchEventsImportJob(request: { body: CreateBatchEventsImportJobRequest,  }): Promise<FSResponse<CreateBatchEventsImportJobResponse>> {
        const { body,  } = request;
        const apiPath = `${this.basePath}/v2/events/batch`;
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};

        const consumes = ['application/json'];
        // prefer 'application/json' if supported
        if (consumes.indexOf('application/json') >= 0) {
            headerParams.accept = 'application/json';
        } else {
            headerParams.accept = consumes.join(',');
        }

        const queryStr = queryParams.toString();
        const requestOptions: RequestOptions = {
            method: 'POST',
            headers: headerParams,
            hostname: url.hostname,
            host: url.host,
            port: url.port,
            protocol: url.protocol,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        try {
            return await this.httpClient.request<CreateBatchEventsImportJobRequest, CreateBatchEventsImportJobResponse>(requestOptions, body);
        } catch (e) {
            // e originates from a callback (node task queue)
            // try to append the current stack trace to the error
            throw chainedFSError(e);
        }
    }

    /**
     * Get the error message and code for any events that failed from an events import job.
     * @summary Get Batch Import Errors
     * @param jobId ID that can be used to check the status and retrieve results for the batch import
     * @param pageToken The token that can be used in a request to fetch the next page of results
    */
    public async getBatchEventsImportErrors(request: { jobId: string, pageToken?: string,  }): Promise<FSResponse<GetBatchEventsImportErrorsResponse>> {
        const { jobId, pageToken,  } = request;
        const apiPath = `${this.basePath}/v2/events/batch/{job_id}/errors`
            .replace('{' + 'job_id' + '}', encodeURIComponent(String(jobId)));
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
        if (pageToken !== undefined) {
            queryParams.set('page_token', pageToken);
        }

        const queryStr = queryParams.toString();
        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            hostname: url.hostname,
            host: url.host,
            port: url.port,
            protocol: url.protocol,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        try {
            return await this.httpClient.request<void, GetBatchEventsImportErrorsResponse>(requestOptions, undefined);
        } catch (e) {
            // e originates from a callback (node task queue)
            // try to append the current stack trace to the error
            throw chainedFSError(e);
        }
    }

    /**
     * Get the status for a batch events import job with job details.
     * @summary Get Batch Import Job Details
     * @param jobId ID that can be used to check the status and retrieve results for the batch import
    */
    public async getBatchEventsImportStatus(request: { jobId: string,  }): Promise<FSResponse<JobStatusResponse>> {
        const { jobId,  } = request;
        const apiPath = `${this.basePath}/v2/events/batch/{job_id}`
            .replace('{' + 'job_id' + '}', encodeURIComponent(String(jobId)));
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};

        const queryStr = queryParams.toString();
        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            hostname: url.hostname,
            host: url.host,
            port: url.port,
            protocol: url.protocol,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        try {
            return await this.httpClient.request<void, JobStatusResponse>(requestOptions, undefined);
        } catch (e) {
            // e originates from a callback (node task queue)
            // try to append the current stack trace to the error
            throw chainedFSError(e);
        }
    }

    /**
     * Get the event details for successful events imported from a batch events import job.
     * @summary Get Batch Imported Events
     * @param jobId ID that can be used to check the status and retrieve results for the batch import
     * @param pageToken The token that can be used in a request to fetch the next page of results
     * @param includeSchema Whether to include the schema in the response.
    */
    public async getBatchEventsImports(request: { jobId: string, pageToken?: string, includeSchema?: boolean,  }): Promise<FSResponse<GetBatchEventsImportsResponse>> {
        const { jobId, pageToken, includeSchema,  } = request;
        const apiPath = `${this.basePath}/v2/events/batch/{job_id}/imports`
            .replace('{' + 'job_id' + '}', encodeURIComponent(String(jobId)));
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
        if (pageToken !== undefined) {
            queryParams.set('page_token', pageToken);
        }
        if (includeSchema !== undefined) {
            queryParams.set('include_schema', String(includeSchema));
        }

        const queryStr = queryParams.toString();
        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            hostname: url.hostname,
            host: url.host,
            port: url.port,
            protocol: url.protocol,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        try {
            return await this.httpClient.request<void, GetBatchEventsImportsResponse>(requestOptions, undefined);
        } catch (e) {
            // e originates from a callback (node task queue)
            // try to append the current stack trace to the error
            throw chainedFSError(e);
        }
    }
}

