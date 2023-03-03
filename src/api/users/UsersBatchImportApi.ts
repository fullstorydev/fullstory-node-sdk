/* eslint-disable simple-import-sort/exports */
/* eslint-disable simple-import-sort/imports */

/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from operation: UsersBatchImportApi
 * Do not edit manually.
 */

import { OutgoingHttpHeaders } from 'node:http';
import { RequestOptions } from 'node:https';

import { CreateBatchUserImportJobRequest } from '@model/users/CreateBatchUserImportJobRequest';
import { GetBatchUserImportsResponse } from '@model/users/GetBatchUserImportsResponse';
import { GetBatchUserImportErrorsResponse } from '@model/users/GetBatchUserImportErrorsResponse';
import { CreateBatchUserImportJobResponse } from '@model/users/CreateBatchUserImportJobResponse';
import { GetBatchUserImportStatusResponse } from '@model/users/GetBatchUserImportStatusResponse';
import { ErrorResponse } from '@model/apierror/ErrorResponse';

import { FSHttpClient, FSRequestOptions, FullStoryOptions } from '../../http';

export class UsersBatchImportApi {
    protected readonly basePath = 'http://localhost';
    protected readonly httpClient: FSHttpClient;

    constructor(opts: FullStoryOptions) {
        this.httpClient = new FSHttpClient(opts);
    }

    /**
     * Creates a batch user import job with the given list of users\' information. Users are upserted (created if they do not exist or updated if they do exist).  ### Payload Limits  The number of request objects that can be included in a single batch request is `50,000`.
     * @summary Create Batch Import
     * @param body
    */
    public async createBatchUserImportJob(body: CreateBatchUserImportJobRequest, options?: FSRequestOptions): Promise<CreateBatchUserImportJobResponse> {
        const apiPath = `${this.basePath}/v2beta/users/batch`;

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};

        const consumes = ['application/json'];
        // prefer 'application/json' if supported
        if (consumes.indexOf('application/json') >= 0) {
            headerParams.accept = 'application/json';
        } else {
            headerParams.accept = consumes.join(',');
        }

        const requestOptions: RequestOptions = {
            method: 'POST',
            headers: headerParams,
            path: apiPath + queryParams.toString(),
        };

        const response = await this.httpClient.request<CreateBatchUserImportJobRequest, CreateBatchUserImportJobResponse>(requestOptions, options, body);
        return response;
    }

    /**
     * Creates a batch user import job with the given list of users\' information. Users are upserted (created if they do not exist or updated if they do exist).  ### Payload Limits  The number of request objects that can be included in a single batch request is `50,000`.
     * @summary Create Batch Import
     * @param body
    */
    public async createBatchUserImportJob_1(body: CreateBatchUserImportJobRequest, options?: FSRequestOptions): Promise<CreateBatchUserImportJobResponse> {
        const apiPath = `${this.basePath}/v2beta/users/batch`;

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};

        const consumes = ['application/json'];
        // prefer 'application/json' if supported
        if (consumes.indexOf('application/json') >= 0) {
            headerParams.accept = 'application/json';
        } else {
            headerParams.accept = consumes.join(',');
        }

        const requestOptions: RequestOptions = {
            method: 'POST',
            headers: headerParams,
            path: apiPath + queryParams.toString(),
        };

        const response = await this.httpClient.request<CreateBatchUserImportJobRequest, CreateBatchUserImportJobResponse>(requestOptions, options, body);
        return response;
    }

    /**
     * Get the error message and code for any users that failed from a user import job.
     * @summary Get Batch Import Errors
     * @param jobId ID that can be used to check the status and retrieve results for the batch import
     * @param nextPageToken The token that can be used in a request to fetch the next page of results
    */
    public async getBatchUserImportErrors(jobId: string, nextPageToken?: string, options?: FSRequestOptions): Promise<GetBatchUserImportErrorsResponse> {
        const apiPath = `${this.basePath}/v2beta/users/batch/{job_id}/errors`
            .replace('job_id', encodeURIComponent(String(jobId)));

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
        if (nextPageToken !== undefined) {
            queryParams.set('next_page_token', nextPageToken);
        }

        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            path: apiPath + queryParams.toString(),
        };

        const response = await this.httpClient.request<void, GetBatchUserImportErrorsResponse>(requestOptions, options, undefined);
        return response;
    }

    /**
     * Get the error message and code for any users that failed from a user import job.
     * @summary Get Batch Import Errors
     * @param jobId ID that can be used to check the status and retrieve results for the batch import
     * @param nextPageToken The token that can be used in a request to fetch the next page of results
    */
    public async getBatchUserImportErrors_2(jobId: string, nextPageToken?: string, options?: FSRequestOptions): Promise<GetBatchUserImportErrorsResponse> {
        const apiPath = `${this.basePath}/v2beta/users/batch/{job_id}/errors`
            .replace('job_id', encodeURIComponent(String(jobId)));

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
        if (nextPageToken !== undefined) {
            queryParams.set('next_page_token', nextPageToken);
        }

        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            path: apiPath + queryParams.toString(),
        };

        const response = await this.httpClient.request<void, GetBatchUserImportErrorsResponse>(requestOptions, options, undefined);
        return response;
    }

    /**
     * Get the status for a batch user import job with job details.
     * @summary Get Batch Import Job Details
     * @param jobId ID that can be used to check the status and retrieve results for the batch import
    */
    public async getBatchUserImportStatus(jobId: string, options?: FSRequestOptions): Promise<GetBatchUserImportStatusResponse> {
        const apiPath = `${this.basePath}/v2beta/users/batch/{job_id}`
            .replace('job_id', encodeURIComponent(String(jobId)));

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};

        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            path: apiPath + queryParams.toString(),
        };

        const response = await this.httpClient.request<void, GetBatchUserImportStatusResponse>(requestOptions, options, undefined);
        return response;
    }

    /**
     * Get the status for a batch user import job with job details.
     * @summary Get Batch Import Job Details
     * @param jobId ID that can be used to check the status and retrieve results for the batch import
    */
    public async getBatchUserImportStatus_3(jobId: string, options?: FSRequestOptions): Promise<GetBatchUserImportStatusResponse> {
        const apiPath = `${this.basePath}/v2beta/users/batch/{job_id}`
            .replace('job_id', encodeURIComponent(String(jobId)));

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};

        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            path: apiPath + queryParams.toString(),
        };

        const response = await this.httpClient.request<void, GetBatchUserImportStatusResponse>(requestOptions, options, undefined);
        return response;
    }

    /**
     * Get the FullStory uid and user details for successful users imported from a batch user import job.
     * @summary Get Batch Imported Users
     * @param jobId ID that can be used to check the status and retrieve results for the batch import
     * @param nextPageToken The token that can be used in a request to fetch the next page of results
    */
    public async getBatchUserImports(jobId: string, nextPageToken?: string, options?: FSRequestOptions): Promise<GetBatchUserImportsResponse> {
        const apiPath = `${this.basePath}/v2beta/users/batch/{job_id}/imports`
            .replace('job_id', encodeURIComponent(String(jobId)));

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
        if (nextPageToken !== undefined) {
            queryParams.set('next_page_token', nextPageToken);
        }

        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            path: apiPath + queryParams.toString(),
        };

        const response = await this.httpClient.request<void, GetBatchUserImportsResponse>(requestOptions, options, undefined);
        return response;
    }

    /**
     * Get the FullStory uid and user details for successful users imported from a batch user import job.
     * @summary Get Batch Imported Users
     * @param jobId ID that can be used to check the status and retrieve results for the batch import
     * @param nextPageToken The token that can be used in a request to fetch the next page of results
    */
    public async getBatchUserImports_4(jobId: string, nextPageToken?: string, options?: FSRequestOptions): Promise<GetBatchUserImportsResponse> {
        const apiPath = `${this.basePath}/v2beta/users/batch/{job_id}/imports`
            .replace('job_id', encodeURIComponent(String(jobId)));

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
        if (nextPageToken !== undefined) {
            queryParams.set('next_page_token', nextPageToken);
        }

        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            path: apiPath + queryParams.toString(),
        };

        const response = await this.httpClient.request<void, GetBatchUserImportsResponse>(requestOptions, options, undefined);
        return response;
    }
}


