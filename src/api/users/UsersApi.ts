/* eslint-disable simple-import-sort/exports */
/* eslint-disable simple-import-sort/imports */

/**
 * This file is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Generated from operation: UsersApi
 * Do not edit manually.
 */

import { OutgoingHttpHeaders } from 'node:http';
import { RequestOptions } from 'node:https';

import { GetUserResponse , ListUsersResponse , CreateUserResponse , UpdateUserResponse , CreateUserRequest , UpdateUserRequest , ErrorResponse } from '@model/index';

import { FSHttpClientImpl, FSResponse, FullStoryOptions, FSHttpClient } from '../../http';
import { chainedFSError } from '../../errors';

export class UsersApi {
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
     * Creates a user with the specified details.
     * @summary Create User
     * @param body
     * @param idempotencyKey Optional header for making the request idempotent
    */
    public async createUser(request: { body: CreateUserRequest, idempotencyKey?: string,  }): Promise<FSResponse<CreateUserResponse>> {
        const { body, idempotencyKey,  } = request;
        const apiPath = `${this.basePath}/v2/users`;
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
        if (idempotencyKey !== undefined) {
            headerParams['Idempotency-Key'] = idempotencyKey;
        }

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
            return await this.httpClient.request<CreateUserRequest, CreateUserResponse>(requestOptions, body);
        } catch (e) {
            // e originates from a callback (node task queue)
            // try to append the current stack trace to the error
            throw chainedFSError(e);
        }
    }

    /**
     * Delete a single user by FullStory generated user ID.
     * @summary Delete User
     * @param id The FullStory-generated id for the user.
    */
    public async deleteUser(request: { id: string,  }): Promise<FSResponse<void>> {
        const { id,  } = request;
        const apiPath = `${this.basePath}/v2/users/{id}`
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)));
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};

        const queryStr = queryParams.toString();
        const requestOptions: RequestOptions = {
            method: 'DELETE',
            headers: headerParams,
            hostname: url.hostname,
            host: url.host,
            port: url.port,
            protocol: url.protocol,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        try {
            return await this.httpClient.request<void, void>(requestOptions, undefined);
        } catch (e) {
            // e originates from a callback (node task queue)
            // try to append the current stack trace to the error
            throw chainedFSError(e);
        }
    }

    /**
     * Delete a single user by uid.
     * @summary Delete User
     * @param uid The application-specific ID you've given to the user
    */
    public async deleteUserByUid(request: { uid?: string,  }): Promise<FSResponse<void>> {
        const { uid,  } = request;
        const apiPath = `${this.basePath}/v2/users`;
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
        if (uid !== undefined) {
            queryParams.set('uid', uid);
        }

        const queryStr = queryParams.toString();
        const requestOptions: RequestOptions = {
            method: 'DELETE',
            headers: headerParams,
            hostname: url.hostname,
            host: url.host,
            port: url.port,
            protocol: url.protocol,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        try {
            return await this.httpClient.request<void, void>(requestOptions, undefined);
        } catch (e) {
            // e originates from a callback (node task queue)
            // try to append the current stack trace to the error
            throw chainedFSError(e);
        }
    }

    /**
     * Retrieve details for a single user
     * @summary Get User
     * @param id The FullStory assigned user ID
     * @param includeSchema Whether to include the schema in the response.
    */
    public async getUser(request: { id: string, includeSchema?: boolean,  }): Promise<FSResponse<GetUserResponse>> {
        const { id, includeSchema,  } = request;
        const apiPath = `${this.basePath}/v2/users/{id}`
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)));
        const url = new URL(apiPath);

        const queryParams: URLSearchParams = new URLSearchParams();
        const headerParams: OutgoingHttpHeaders = {};
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
            return await this.httpClient.request<void, GetUserResponse>(requestOptions, undefined);
        } catch (e) {
            // e originates from a callback (node task queue)
            // try to append the current stack trace to the error
            throw chainedFSError(e);
        }
    }

    /**
     * Retrieve a list of users matching the supplied filter criteria
     * @summary Get Users
     * @param uid The application-specific ID you've given to a user
     * @param email The email address associated with a user
     * @param displayName The nice-looking name for a user
     * @param isIdentified Whether or not a user is anonymous or identified
     * @param pageToken The token indicating the page of users to fetch. The same filter criteria should be supplied. This value should not be specified when requesting the first page of users.
     * @param includeSchema Whether to include schemas in the response.
    */
    public async listUsers(request: { uid?: string, email?: string, displayName?: string, isIdentified?: boolean, pageToken?: string, includeSchema?: boolean,  }): Promise<FSResponse<ListUsersResponse>> {
        const { uid, email, displayName, isIdentified, pageToken, includeSchema,  } = request;
        const apiPath = `${this.basePath}/v2/users`;
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
            queryParams.set('is_identified', String(isIdentified));
        }
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
            return await this.httpClient.request<void, ListUsersResponse>(requestOptions, undefined);
        } catch (e) {
            // e originates from a callback (node task queue)
            // try to append the current stack trace to the error
            throw chainedFSError(e);
        }
    }

    /**
     * Updates a user with the specified details
     * @summary Update User
     * @param id The FullStory assigned user ID
     * @param body
    */
    public async updateUser(request: { id: string, body: UpdateUserRequest,  }): Promise<FSResponse<UpdateUserResponse>> {
        const { id, body,  } = request;
        const apiPath = `${this.basePath}/v2/users/{id}`
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
            host: url.host,
            port: url.port,
            protocol: url.protocol,
            path: url.pathname + (queryStr ? '?' + queryStr : ''),
        };

        try {
            return await this.httpClient.request<UpdateUserRequest, UpdateUserResponse>(requestOptions, body);
        } catch (e) {
            // e originates from a callback (node task queue)
            // try to append the current stack trace to the error
            throw chainedFSError(e);
        }
    }
}

