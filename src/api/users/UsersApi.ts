/* eslint-disable simple-import-sort/exports */
/* eslint-disable simple-import-sort/imports */

/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from operation: UsersApi
 * Do not edit manually.
 */

import { OutgoingHttpHeaders } from 'node:http';
import { RequestOptions } from 'node:https';

import { GetUserResponse } from '@model/users/GetUserResponse';
import { ListUsersResponse } from '@model/users/ListUsersResponse';
import { CreateUserResponse } from '@model/users/CreateUserResponse';
import { UpdateUserResponse } from '@model/users/UpdateUserResponse';
import { CreateUserRequest } from '@model/users/CreateUserRequest';
import { UpdateUserRequest } from '@model/users/UpdateUserRequest';
import { ErrorResponse } from '@model/apierror/ErrorResponse';

import { FSHttpClient, FSRequestOptions, FSResponse, FullStoryOptions } from '../../http';
export class UsersApi {
    protected readonly basePath = 'https://api.fullstory.com';
    protected readonly httpClient: FSHttpClient;

    constructor(opts: FullStoryOptions) {
        this.httpClient = new FSHttpClient(opts);
    }

    /**
     * Creates a user with the specified details
     * @summary Create User
     * @param body
    */
    public async createUser(body: CreateUserRequest, options?: FSRequestOptions): Promise<FSResponse<CreateUserResponse>> {
        const apiPath = `${this.basePath}/v2beta/users`;
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

        // instantiate response object to be mutated.
        const response = await this.httpClient.request<CreateUserRequest, CreateUserResponse>(requestOptions, body, options);
        return response;
    }

    /**
     * Delete a single user
     * @summary Delete User
     * @param id The FullStory assigned user ID
    */
    public async deleteUser(id: string, options?: FSRequestOptions): Promise<FSResponse<void>> {
        const apiPath = `${this.basePath}/v2beta/users/{id}`
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)));
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};

        const queryStr = queryParams.toString();
        const requestOptions: RequestOptions = {
            method: 'DELETE',
            headers: headerParams,
            hostname: url.hostname,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        // instantiate response object to be mutated.
        const response = await this.httpClient.request<void, void>(requestOptions, undefined, options);
        return response;
    }

    /**
     * Retrieve details for a single user
     * @summary Get User
     * @param id The FullStory assigned user ID
    */
    public async getUser(id: string, options?: FSRequestOptions): Promise<FSResponse<GetUserResponse>> {
        const apiPath = `${this.basePath}/v2beta/users/{id}`
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)));
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

        // instantiate response object to be mutated.
        const response = await this.httpClient.request<void, GetUserResponse>(requestOptions, undefined, options);
        return response;
    }

    /**
     * Retrieve a list of users matching the supplied filter criteria
     * @summary Get Users
     * @param uid The application-specific ID you\&#39;ve given to a user
     * @param email The email address associated with a user
     * @param displayName The nice-looking name for a user
     * @param isIdentified Whether or not a user is anonymous or identified
     * @param pageToken The token indicating the page of users to fetch. The same filter criteria should be supplied. This value should not be specified when requesting the first page of users.
    */
    public async listUsers(uid?: string, email?: string, displayName?: string, isIdentified?: boolean, pageToken?: string, options?: FSRequestOptions): Promise<FSResponse<ListUsersResponse>> {
        const apiPath = `${this.basePath}/v2beta/users`;
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
        if (uid !== undefined) {
            queryParams.set('uid', uid);
        }
        if (email !== undefined) {
            queryParams.set('email', email);
        }
        if (displayName !== undefined) {
            queryParams.set('display_name', displayName);
        }
        if (isIdentified !== undefined) {
            queryParams.set('is_identified', isIdentified);
        }
        if (pageToken !== undefined) {
            queryParams.set('page_token', pageToken);
        }

        const queryStr = queryParams.toString();
        const requestOptions: RequestOptions = {
            method: 'GET',
            headers: headerParams,
            hostname: url.hostname,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        // instantiate response object to be mutated.
        const response = await this.httpClient.request<void, ListUsersResponse>(requestOptions, undefined, options);
        return response;
    }

    /**
     * Updates a user with the specified details
     * @summary Update User
     * @param id The FullStory assigned user ID
     * @param body
    */
    public async updateUser(id: string, body: UpdateUserRequest, options?: FSRequestOptions): Promise<FSResponse<UpdateUserResponse>> {
        const apiPath = `${this.basePath}/v2beta/users/{id}`
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)));
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

        // instantiate response object to be mutated.
        const response = await this.httpClient.request<UpdateUserRequest, UpdateUserResponse>(requestOptions, body, options);
        return response;
    }
}


