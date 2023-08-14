import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { CreateBatchEventsImportJobRequest, CreateBatchEventsImportJobResponse, CreateEventsRequest, GetBatchEventsImportErrorsResponse, GetBatchEventsImportsResponse, JobStatus, JobStatusResponse } from '@model/index';

import { EventsApi, EventsBatchImportApi } from '..';
import { makeMockReq } from './util';

const MOCK_API_KEY = 'MOCK_API_KEY';
const basePath = '/v2/events';
const expectedHeaders = { accept: 'application/json' };

const mockRequest = jest.fn();
jest.mock('../../http', () => {
    return {
        ...jest.createMockFromModule<any>('../../http'),
        // so we can spy on "request"
        FSHttpClientImpl: class {
            request = mockRequest;
        },
    };
});

beforeEach(() => {
    mockRequest.mockClear();
});

describe('FullStory Events API', () => {
    const events = new EventsApi({
        apiKey: MOCK_API_KEY,
    });

    test('create', async () => {
        const createReq: CreateEventsRequest = {
            user: { id: 'test_user_id' },
            session: { id: 'test_session_id' },
            context: {
                //TODO(sabrina): add more context here
            },
            name: 'nodejs-sdk-event-1',
        };
        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: {},
        });

        const event = events.createEvents(createReq);

        expect(mockRequest).toBeCalledWith(
            // TODO(sabrina): find out why the accept headers is not passed for GETs
            makeMockReq(basePath, 'POST', '', expectedHeaders),
            createReq,
            undefined
        );

        await expect(event).resolves.toEqual({
            httpStatusCode: 200,
            body: {},
        });
    });
});


describe('FullStory Batch Events API', () => {
    const batchEvents = new EventsBatchImportApi({
        apiKey: MOCK_API_KEY,
    });

    test('create job', async () => {
        const mockReq: CreateBatchEventsImportJobRequest = {
            requests: [
                {
                    user: { uid: 'test_batch_1' },
                    name: 'NodeJS Test Batch 1-2',
                    properties: {
                        prop_1: '1,2,3'
                    },
                }, {
                    user: { uid: 'test_batch_2' },
                    name: 'NodeJS Test Batch 2-1',
                },
            ]
        };
        const mockJob: CreateBatchEventsImportJobResponse = {
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

        const job = batchEvents.createBatchEventsImportJob(mockReq);

        expect(mockRequest).toBeCalledWith(
            makeMockReq(basePath, 'POST', '/batch', expectedHeaders),
            mockReq,
            undefined
        );

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockJob,
        });
    });

    test('get job status', async () => {
        const mockJob: JobStatusResponse = {
            imports: 0,
            errors: 0,
            job: {
                id: 'abcd1234',
                status: JobStatus.Processing,
                created: new Date().toISOString(),
            }
        };

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockJob,
        });

        const job = batchEvents.getBatchEventsImportStatus('abcd1234');

        expect(mockRequest).toBeCalledWith(
            makeMockReq(basePath, 'GET', '/batch/abcd1234'),
            undefined,
            undefined
        );

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockJob,
        });
    });

    test('get job imports', async () => {
        const mockRsp: GetBatchEventsImportsResponse = {
            results: [
                { name: 'NodeJS Test Batch 1' },
                { name: 'NodeJS Test Batch 2' }
            ]
        };

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockRsp,
        });

        const job = batchEvents.getBatchEventsImports('abcd1234');

        expect(mockRequest).toBeCalledWith(
            makeMockReq(basePath, 'GET', '/batch/abcd1234/imports'),
            undefined,
            undefined
        );

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockRsp,
        });
    });

    test('get job imports with page_token', async () => {
        const mockRsp: GetBatchEventsImportsResponse = {
            results: [
                { name: 'NodeJS Test Batch 1' },
                { name: 'NodeJS Test Batch 2' }
            ]
        };

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockRsp,
        });

        const job = batchEvents.getBatchEventsImports('abcd1234', 't123');

        expect(mockRequest).toBeCalledWith(
            makeMockReq(basePath, 'GET', '/batch/abcd1234/imports?page_token=t123'),
            undefined,
            undefined
        );

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockRsp,
        });
    });

    test('get job imports with schema', async () => {
        const mockRsp: GetBatchEventsImportsResponse = {
            results: [
                { name: 'NodeJS Test Batch 1' },
                { name: 'NodeJS Test Batch 2' }
            ]
        };

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockRsp,
        });

        const job = batchEvents.getBatchEventsImports('abcd1234', undefined, true);

        expect(mockRequest).toBeCalledWith(
            makeMockReq(basePath, 'GET', '/batch/abcd1234/imports?include_schema=true'),
            undefined,
            undefined
        );

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockRsp,
        });
    });

    test('get job errors', async () => {
        const mockJob: GetBatchEventsImportErrorsResponse = {
            results: [
                {
                    message: 'Unknown error occurred',
                    code: 'unknown_error',
                    event:
                    {
                        user: { uid: 'NodeJS mock' },
                        name: 'NodeJS Test Batch 1',
                    }
                }
            ]
        };

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockJob,
        });

        const job = batchEvents.getBatchEventsImportErrors('abcd1234', 'page_token');

        expect(mockRequest).toBeCalledWith(
            makeMockReq(basePath, 'GET', '/batch/abcd1234/errors?page_token=page_token'),
            undefined,
            undefined
        );

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockJob,
        });
    });
});
