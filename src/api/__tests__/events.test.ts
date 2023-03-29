import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { CreateBatchEventsImportJobRequest, CreateBatchEventsImportJobResponse, CreateEventsRequest, CreateEventsResponse, GetBatchEventsImportErrorsResponse, GetBatchEventsImportsResponse, GetBatchEventsImportStatusResponse, JobStatus } from '@model/index';

import { EventsApi, EventsBatchImportApi } from '..';

const MOCK_API_KEY = 'MOCK_API_KEY';
const defaultHost = 'api.fullstory.com';
const basePath = '/v2beta/events';
const expectedHeaders = { accept: 'application/json' };

const mockRequest = jest.fn();
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

describe('FullStory Events API', () => {
    const events = new EventsApi({
        apiKey: MOCK_API_KEY,
    });

    test('create', async () => {
        const createReq: CreateEventsRequest = {
            user: { id: 'test_user_id' },
            session: { id: 'test_session_id' },
            context: {
                integration: 'nodejs-sdk-test',
                //todo more context here
            },
            events: [
                { name: 'nodejs-sdk-event-1' },
                { name: 'nodejs-sdk-event-2' }
            ],
            include_schema: false,
        };
        const mockEvent: CreateEventsResponse = {
            ...createReq
        };
        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockEvent,
        });

        const event = events.createEvents(createReq);

        expect(mockRequest).toBeCalledWith(
            // TODO(sabrina): find out why the accept headers is not passed for GETs
            { headers: expectedHeaders, hostname: defaultHost, method: 'POST', path: basePath },
            createReq,
            undefined
        );

        await expect(event).resolves.toEqual({
            httpStatusCode: 200,
            body: mockEvent,
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
                    events: [
                        { name: 'NodeJS Test Batch 1-1' },
                        {
                            name: 'NodeJS Test Batch 1-2',
                            properties: {
                                prop_1: '1,2,3'
                            }
                        }
                    ]
                }, {
                    user: { uid: 'test_batch_2' },
                    events: [
                        { name: 'NodeJS Test Batch 2-1' },
                        { name: 'NodeJS Test Batch 2-2' }
                    ]
                }
            ]
        };
        const mockJob: CreateBatchEventsImportJobResponse = {
            job: {
                id: 'abcd1234',
                status: JobStatus.Processing
            }
        };

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockJob,
        });

        const job = batchEvents.createBatchEventsImportJob(mockReq);

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
        const mockJob: GetBatchEventsImportStatusResponse = {
            job: {
                id: 'abcd1234',
                status: JobStatus.Processing
            }
        };

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockJob,
        });

        const job = batchEvents.getBatchEventsImportStatus('abcd1234');

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
        const mockRsp: GetBatchEventsImportsResponse = {
            results: [
                {
                    events: [
                        { name: 'NodeJS Test Batch 1' },
                        { name: 'NodeJS Test Batch 2' }
                    ]
                },
            ]
        };

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockRsp,
        });

        const job = batchEvents.getBatchEventsImports('abcd1234');

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
        const mockJob: GetBatchEventsImportErrorsResponse = {
            results: [
                {
                    message: 'Unknown error occurred',
                    code: 'unknown_error',
                    events:
                    {
                        user: { uid: 'NodeJS mock' },
                        events: [
                            { name: 'NodeJS Test Batch 1' },
                            { name: 'NodeJS Test Batch 1' }
                        ]
                    }
                }
            ]
        };

        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: mockJob,
        });

        const job = batchEvents.getBatchEventsImportErrors('abcd1234', 'next_page_token');

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