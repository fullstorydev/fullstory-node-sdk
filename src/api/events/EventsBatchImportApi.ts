/* eslint-disable simple-import-sort/exports */
/* eslint-disable simple-import-sort/imports */

/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from operation: EventsBatchImportApi
 * Do not edit manually.
 */

import { OutgoingHttpHeaders } from 'node:http';
import { RequestOptions } from 'node:https';

import { GetBatchEventsImportErrorsResponse } from '@model/events/GetBatchEventsImportErrorsResponse';
import { CreateBatchEventsImportJobRequest } from '@model/events/CreateBatchEventsImportJobRequest';
import { GetBatchEventsImportsResponse } from '@model/events/GetBatchEventsImportsResponse';
import { CreateBatchEventsImportJobResponse } from '@model/events/CreateBatchEventsImportJobResponse';
import { ErrorResponse } from '@model/apierror/ErrorResponse';
import { GetBatchEventsImportStatusResponse } from '@model/events/GetBatchEventsImportStatusResponse';

import { FSHttpClient, FSRequestOptions, FSResponse, FullStoryOptions, IFSHttpClient } from '../../http';
import { chainedFSError } from '../../errors';

export class EventsBatchImportApi {
    protected readonly basePath = 'https://api.fullstory.com';
    private httpClient: IFSHttpClient;

    constructor(opts: FullStoryOptions) {
        // TODO(sabrina): allow injecting http client dependency rather than instantiating here
        this.httpClient = new FSHttpClient(opts);
    }

    /**
     * Creates a batch events import job with the given list of event information.  The number of request objects that can be included in a single batch request is `50,000`.
     * @summary Create Events Import
     * @param body
    */
    public async createBatchEventsImportJob(body: CreateBatchEventsImportJobRequest, options?: FSRequestOptions): Promise<FSResponse<CreateBatchEventsImportJobResponse>> {
        const apiPath = `${this.basePath}/v2beta/events/batch`;
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
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        try {
            return await this.httpClient.request<CreateBatchEventsImportJobRequest, CreateBatchEventsImportJobResponse>(requestOptions, body, options);
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
     * @param nextPageToken The token that can be used in a request to fetch the next page of results
    */
    public async getBatchEventsImportErrors(jobId: string, nextPageToken?: string, options?: FSRequestOptions): Promise<FSResponse<GetBatchEventsImportErrorsResponse>> {
        const apiPath = `${this.basePath}/v2beta/events/batch/{job_id}/errors`
            .replace('{' + 'job_id' + '}', encodeURIComponent(String(jobId)));
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
        if (nextPageToken !== undefined) {
            queryParams.set('next_page_token', nextPageToken);
        }

        const queryStr = queryParams.toString();
        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            hostname: url.hostname,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        try {
            return await this.httpClient.request<void, GetBatchEventsImportErrorsResponse>(requestOptions, undefined, options);
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
    public async getBatchEventsImportStatus(jobId: string, options?: FSRequestOptions): Promise<FSResponse<GetBatchEventsImportStatusResponse>> {
        const apiPath = `${this.basePath}/v2beta/events/batch/{job_id}`
            .replace('{' + 'job_id' + '}', encodeURIComponent(String(jobId)));
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};

        const queryStr = queryParams.toString();
        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            hostname: url.hostname,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        try {
            return await this.httpClient.request<void, GetBatchEventsImportStatusResponse>(requestOptions, undefined, options);
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
     * @param nextPageToken The token that can be used in a request to fetch the next page of results
    */
    public async getBatchEventsImports(jobId: string, nextPageToken?: string, options?: FSRequestOptions): Promise<FSResponse<GetBatchEventsImportsResponse>> {
        const apiPath = `${this.basePath}/v2beta/events/batch/{job_id}/imports`
            .replace('{' + 'job_id' + '}', encodeURIComponent(String(jobId)));
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
        if (nextPageToken !== undefined) {
            queryParams.set('next_page_token', nextPageToken);
        }

        const queryStr = queryParams.toString();
        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            hostname: url.hostname,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        try {
            return await this.httpClient.request<void, GetBatchEventsImportsResponse>(requestOptions, undefined, options);
        } catch (e) {
            // e originates from a callback (node task queue)
            // try to append the current stack trace to the error
            throw chainedFSError(e);
        }
    }
}


