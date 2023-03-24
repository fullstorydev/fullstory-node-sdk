import { beforeEach, describe, expect, test } from '@jest/globals';
import { CreateBatchUserImportJobRequest, CreateBatchUserImportJobResponse, CreateUserRequest, CreateUserResponse, GetBatchUserImportErrorsResponse, GetBatchUserImportsResponse, GetBatchUserImportStatusResponse, GetUserResponse, JobStatus, UpdateUserRequest, UpdateUserResponse } from '@model/index';
import { IncomingMessage } from 'http';

import { FSErrorImpl } from '../../http/error';
import { UsersApi, UsersBatchImportApi } from '../index';

const MOCK_API_KEY = 'MOCK_API_KEY';
const basePath = '/v2beta/users';
const expectedHeaders = { accept: 'application/json' };

// TODO(sabrina): create a better mock for the http client
const MOCK_HTTP_CLIENT: any = {
    clearMockReply() {
        delete MOCK_HTTP_CLIENT.httpStatusCode;
        delete MOCK_HTTP_CLIENT.httpHeaders;
        delete MOCK_HTTP_CLIENT.body;
        delete MOCK_HTTP_CLIENT.throwError;
    },
    setMockReply(httpStatusCode: number, body: any) {
        MOCK_HTTP_CLIENT.httpStatusCode = httpStatusCode;
        MOCK_HTTP_CLIENT.body = body;
    },
    setThrowError(err: Error) {
        MOCK_HTTP_CLIENT.throwError = err;
    },
    request: (opts: any, body: any, fsopts: any) => {
        return new Promise((res, rej) => {
            MOCK_HTTP_CLIENT.reqOpts = opts;
            MOCK_HTTP_CLIENT.reqBody = body;
            MOCK_HTTP_CLIENT.reqFsOpts = fsopts;
            if (MOCK_HTTP_CLIENT.throwError) {
                rej(MOCK_HTTP_CLIENT.throwError);
            }
            res({
                httpStatusCode: MOCK_HTTP_CLIENT.httpStatusCode,
                body: MOCK_HTTP_CLIENT.body,
            });
        });
    }
};

beforeEach(() => {
    MOCK_HTTP_CLIENT.clearMockReply();
});

describe('FullStory Users API', () => {
    const users = new UsersApi({
        apiKey: MOCK_API_KEY,
    });
    (users as any)['httpClient'] = MOCK_HTTP_CLIENT;

    test('get single', async () => {
        const mockUser: GetUserResponse = {
            id: '12341234',
            uid: 'test_user_1',
            display_name: 'test_user_1_display',
            email: 'test_user_1@test.com',
            properties: {
                singed_up: true,
                signed_up_date: '2023-03-14T20:30:19+0000'
            }
        };
        MOCK_HTTP_CLIENT.setMockReply(200, mockUser);

        const user = users.getUser('123123');

        expect(MOCK_HTTP_CLIENT.reqOpts.hostname).toBe('api.fullstory.com');
        expect(MOCK_HTTP_CLIENT.reqOpts.method).toBe('GET');
        expect(MOCK_HTTP_CLIENT.reqOpts.path).toBe(`${basePath}/123123`);

        await expect(user).resolves.toEqual({
            httpStatusCode: 200,
            body: mockUser,
        });
    });

    test('create', async () => {
        const mockReq: CreateUserRequest = {
            uid: 'test_user_2'
        };
        const mockUser: CreateUserResponse = {
            id: '12341234',
        };
        MOCK_HTTP_CLIENT.setMockReply(200, mockUser);

        const user = users.createUser(mockReq);

        expect(MOCK_HTTP_CLIENT.reqBody).toEqual(mockReq);
        expect(MOCK_HTTP_CLIENT.reqOpts.method).toBe('POST');
        expect(MOCK_HTTP_CLIENT.reqOpts.headers).toEqual(expectedHeaders);
        expect(MOCK_HTTP_CLIENT.reqOpts.path).toBe(`${basePath}`);

        await expect(user).resolves.toEqual({
            httpStatusCode: 200,
            body: mockUser,
        });
    });

    test('update', async () => {
        const mockReq: UpdateUserRequest = {
            uid: 'test_user_2',
            properties: {
                preferred_pronoun: 'she/her'
            }
        };
        const mockUser: UpdateUserResponse = {
            id: '12341234',
            ...mockReq
        };
        MOCK_HTTP_CLIENT.setMockReply(200, mockUser);

        const user = users.updateUser('12341234', mockReq);

        expect(MOCK_HTTP_CLIENT.reqBody).toEqual(mockReq);
        expect(MOCK_HTTP_CLIENT.reqOpts.method).toBe('POST');
        expect(MOCK_HTTP_CLIENT.reqOpts.headers).toEqual(expectedHeaders);
        expect(MOCK_HTTP_CLIENT.reqOpts.path).toBe(`${basePath}/12341234`);

        await expect(user).resolves.toEqual({
            httpStatusCode: 200,
            body: mockUser,
        });
    });

    test('delete', async () => {
        MOCK_HTTP_CLIENT.setMockReply(200);

        const user = users.deleteUser('12341234');

        expect(MOCK_HTTP_CLIENT.reqBody).toBeUndefined();
        expect(MOCK_HTTP_CLIENT.reqOpts.method).toBe('DELETE');
        expect(MOCK_HTTP_CLIENT.reqOpts.path).toBe(`${basePath}/12341234`);

        await expect(user).resolves.toEqual({
            httpStatusCode: 200,
        });
    });

    test('throws when error', async () => {
        const err = FSErrorImpl.newFSError(
            <IncomingMessage>{ statusCode: 404 },
            { code: 'user_not_found', message: 'User with that ID does not exist', }
        );
        MOCK_HTTP_CLIENT.setThrowError(err);

        const user = users.getUser('12341234');
        // error is passed on
        await expect(user).rejects.toThrow(expect.stringContaining(err));
    });
});


describe('FullStory Batch Users API', () => {
    const batchUsers = new UsersBatchImportApi({
        apiKey: MOCK_API_KEY,
    });
    (batchUsers as any)['httpClient'] = MOCK_HTTP_CLIENT;

    test('create job', async () => {
        const mockReq: CreateBatchUserImportJobRequest = {
            requests: [{ uid: 'test_batch_1' }]
        };
        const mockJob: CreateBatchUserImportJobResponse = {
            job: {
                id: 'abcd1234',
                status: JobStatus.Processing
            }
        };

        MOCK_HTTP_CLIENT.setMockReply(200, mockJob);

        const job = batchUsers.createBatchUserImportJob(mockReq);

        expect(MOCK_HTTP_CLIENT.reqBody).toEqual(mockReq);
        expect(MOCK_HTTP_CLIENT.reqOpts.method).toBe('POST');
        expect(MOCK_HTTP_CLIENT.reqOpts.headers).toEqual(expectedHeaders);
        expect(MOCK_HTTP_CLIENT.reqOpts.path).toBe(`${basePath}/batch`);

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockJob,
        });
    });

    test('get job status', async () => {
        const mockJob: GetBatchUserImportStatusResponse = {
            job: {
                id: 'abcd1234',
                status: JobStatus.Processing
            }
        };

        MOCK_HTTP_CLIENT.setMockReply(200, mockJob);

        const job = batchUsers.getBatchUserImportStatus('abcd1234');

        expect(MOCK_HTTP_CLIENT.reqBody).toBeUndefined();
        expect(MOCK_HTTP_CLIENT.reqOpts.method).toBe('GET');
        expect(MOCK_HTTP_CLIENT.reqOpts.path).toBe(`${basePath}/batch/abcd1234`);

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockJob,
        });
    });

    test('get job imports', async () => {
        const mockRsp: GetBatchUserImportsResponse = {
            results: [
                { id: '12341234' },
                { id: '43214321' }
            ]
        };
        MOCK_HTTP_CLIENT.setMockReply(200, mockRsp);

        const job = batchUsers.getBatchUserImports('abcd1234');

        expect(MOCK_HTTP_CLIENT.reqBody).toBeUndefined();
        expect(MOCK_HTTP_CLIENT.reqOpts.method).toBe('GET');
        expect(MOCK_HTTP_CLIENT.reqOpts.path).toBe(`${basePath}/batch/abcd1234/imports`);

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockRsp,
        });
    });

    test('get job errors', async () => {
        const mockJob: GetBatchUserImportErrorsResponse = {
            results: [
                {
                    message: 'Unknown error occurred',
                    code: 'unknown_error',
                    user: { uid: 'test_user_1' },
                }
            ]
        };

        MOCK_HTTP_CLIENT.setMockReply(200, mockJob);

        const job = batchUsers.getBatchUserImportErrors('abcd1234', 'next_page_token');

        expect(MOCK_HTTP_CLIENT.reqBody).toBeUndefined();
        expect(MOCK_HTTP_CLIENT.reqOpts.method).toBe('GET');
        expect(MOCK_HTTP_CLIENT.reqOpts.path).toBe(`${basePath}/batch/abcd1234/errors?next_page_token=next_page_token`);

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockJob,
        });
    });
});