import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { CreateBatchUserImportJobRequest, CreateBatchUserImportJobResponse, CreateUserRequest, CreateUserResponse, GetBatchUserImportErrorsResponse, GetBatchUserImportsResponse, GetUserResponse, JobStatus, UpdateUserRequest, UpdateUserResponse } from '@model/index';

import { FSApiError, FSErrorName, FSUnknownError } from '../../errors';
import { UsersApi, UsersBatchImportApi } from '../index';

const MOCK_API_KEY = 'MOCK_API_KEY';
const defaultHost = 'api.fullstory.com';
const basePath = '/v2beta/users';
const expectedHeaders = { accept: 'application/json' };

const mockRequest = jest.fn<any>();
jest.mock('../../http', () => {
    return {
        ...jest.createMockFromModule<any>('../../http'),
        // so we can spy on "request"
        FSHttpClient: class {
            request = mockRequest;
        },
    };
});

beforeEach(() => {
    mockRequest.mockClear();
});

describe('FullStory Users API', () => {
    const users = new UsersApi({
        apiKey: MOCK_API_KEY,
    });

    test('get', async () => {
        const mockUser: GetUserResponse = {
            id: '12341234',
            uid: 'test_user_1',
            display_name: 'test_user_1_display',
            email: 'test_user_1@test.com',
            is_being_deleted: false,
            properties: {
                singed_up: true,
                signed_up_date: '2023-03-14T20:30:19+0000'
            }
        };
        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockUser,
        });

        const user = users.getUser('123123');

        expect(mockRequest).toBeCalledWith(
            // TODO(sabrina): find out why the accept headers is not passed for GETs
            { headers: {}, hostname: defaultHost, method: 'GET', path: basePath + '/123123' },
            undefined,
            undefined
        );

        await expect(user).resolves.toEqual({
            httpStatusCode: 200,
            body: mockUser,
        });
    });

    test('list', async () => {
        const mockUser = {
            id: '12341234',
            uid: 'test_user_1',
            display_name: 'test_user_1_display',
            email: 'test_user_1@test.com',
            properties: {
                singed_up: true,
                signed_up_date: '2023-03-14T20:30:19+0000'
            }
        };
        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockUser,
        });

        const user = users.listUsers('test_user_1', 'test_user_1@test.com');

        expect(mockRequest).toBeCalledWith(
            // TODO(sabrina): find out why the accept headers is not passed for GETs
            { headers: {}, hostname: defaultHost, method: 'GET', path: basePath + '?uid=test_user_1&email=test_user_1%40test.com' },
            undefined,
            undefined
        );

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
        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockUser,
        });

        const user = users.createUser(mockReq);

        expect(mockRequest).toBeCalledWith(
            { headers: expectedHeaders, hostname: defaultHost, method: 'POST', path: basePath },
            mockReq,
            undefined
        );

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
        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockUser,
        });

        const user = users.updateUser('12341234', mockReq);

        expect(mockRequest).toBeCalledWith(
            { headers: expectedHeaders, hostname: defaultHost, method: 'POST', path: basePath + '/12341234' },
            mockReq,
            undefined
        );

        await expect(user).resolves.toEqual({
            httpStatusCode: 200,
            body: mockUser,
        });
    });

    test('delete', async () => {
        mockRequest.mockReturnValue({
            httpStatusCode: 200
        });

        const user = users.deleteUser('12341234');

        expect(mockRequest).toBeCalledWith(
            { headers: {}, hostname: defaultHost, method: 'DELETE', path: basePath + '/12341234' },
            undefined,
            undefined
        );
        await expect(user).resolves.toHaveProperty('httpStatusCode', 200);
        await expect(user).resolves.not.toHaveProperty('body');
    });


    describe('API throws nice looking error when needed', () => {
        test('handle async error with unknown Error type', async () => {
            const mockReq: CreateUserRequest = {
                uid: 'test_user_2'
            };
            const rootError = new Error('test error');
            mockRequest.mockRejectedValue(rootError);

            expect.hasAssertions();
            try {
                await users.createUser(mockReq);
            } catch (error) {
                // root error survives
                expect(error).toBeInstanceOf(FSUnknownError);
                expect(error).toHaveProperty('name', FSErrorName.ERROR_UNKNOWN);
                expect(error).toHaveProperty('message', rootError.message);
                expect(error).toHaveProperty('cause', rootError);
                // check that stack trace contains info on api method invoked
                expect(error).toHaveProperty('stack', expect.stringContaining('createUser'));
            }
        });

        test('handle async error with FSError type', async () => {
            const rootError = new FSApiError('test error', 401);
            mockRequest.mockRejectedValue(rootError);

            expect.hasAssertions();
            try {
                await users.getUser('1');
            } catch (error) {
                // root error survives
                expect(error).toBeInstanceOf(FSApiError);
                expect(error).toHaveProperty('name', FSErrorName.ERROR_FULLSTORY);
                expect(error).toHaveProperty('message', rootError.message);
                // check that stack trace contains info on api method invoked
                expect(error).toHaveProperty('stack', expect.stringContaining('getUser'));
            }
        });
    });
});


describe('FullStory Batch Users API', () => {
    const batchUsers = new UsersBatchImportApi({
        apiKey: MOCK_API_KEY,
    });

    test('create job', async () => {
        const mockReq: CreateBatchUserImportJobRequest = {
            requests: [{ uid: 'test_batch_1' }]
        };
        const mockJob: CreateBatchUserImportJobResponse = {
            job: {
                id: 'abcd1234',
                status: JobStatus.Processing,
                created: new Date().toISOString()
            }
        };

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockJob,
        });

        const job = batchUsers.createBatchUserImportJob(mockReq);

        expect(mockRequest).toBeCalledWith(
            { headers: expectedHeaders, hostname: defaultHost, method: 'POST', path: basePath + '/batch' },
            mockReq,
            undefined
        );

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockJob,
        });
    });

    test('get job status', async () => {
        const mockJob = {
            job: {
                id: 'abcd1234',
                status: JobStatus.Processing
            }
        };

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockJob,
        });

        const job = batchUsers.getBatchUserImportStatus('abcd1234');

        expect(mockRequest).toBeCalledWith(
            { headers: {}, hostname: defaultHost, method: 'GET', path: basePath + '/batch/abcd1234' },
            undefined,
            undefined
        );

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockJob,
        });
    });

    test('get job imports', async () => {
        const mockRsp: GetBatchUserImportsResponse = {
            total_records: '2',
            next_page_token: '',
            results: [
                { id: '12341234' },
                { id: '43214321' }
            ]
        };
        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockRsp,
        });

        const job = batchUsers.getBatchUserImports('abcd1234');

        expect(mockRequest).toBeCalledWith(
            { headers: {}, hostname: defaultHost, method: 'GET', path: basePath + '/batch/abcd1234/imports' },
            undefined,
            undefined
        );

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

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockJob,
        });

        const job = batchUsers.getBatchUserImportErrors('abcd1234', 'next_page_token');

        expect(mockRequest).toBeCalledWith(
            { headers: {}, hostname: defaultHost, method: 'GET', path: basePath + '/batch/abcd1234/errors?next_page_token=next_page_token' },
            undefined,
            undefined
        );

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockJob,
        });
    });
});
