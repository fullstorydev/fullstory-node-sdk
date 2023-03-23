import { beforeEach, describe, expect, test } from '@jest/globals';
import { CreateBatchEventsImportJobRequest, CreateBatchEventsImportJobResponse, CreateEventsRequest, CreateEventsResponse, GetBatchEventsImportErrorsResponse, GetBatchEventsImportsResponse, GetBatchEventsImportStatusResponse, JobStatus } from '@model/index';
import { IncomingMessage } from 'http';

import { FSErrorImpl } from '../../http';
import { MockFSHttpClient } from '../../http/__mocks__/http.mock';
import { EventsApi, EventsBatchImportApi } from '../index';

const MOCK_API_KEY = 'MOCK_API_KEY';
const basePath = '/v2beta/events';
const expectedHeaders = { accept: 'application/json' };

const mockHttp = new MockFSHttpClient();

beforeEach(() => {
    mockHttp.clearMockReply();
});

describe('FullStory Events API', () => {
    const events = new EventsApi({
        apiKey: MOCK_API_KEY,
    });
    (events as any)['httpClient'] = mockHttp;

    test('create', async () => {
        const mockReq: CreateEventsRequest = {
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
            ...mockReq
        };
        mockHttp.setMockReply(200, mockEvent);

        const event = events.createEvents(mockReq);

        expect(mockHttp.reqBody).toEqual(mockReq);
        expect(mockHttp.reqOpts.method).toBe('POST');
        expect(mockHttp.reqOpts.headers).toEqual(expectedHeaders);
        expect(mockHttp.reqOpts.path).toBe(`${basePath}`);

        await expect(event).resolves.toEqual({
            httpStatusCode: 200,
            body: mockEvent,
        });
    });

    test('throws when error', async () => {
        const err = FSErrorImpl.newFSError(
            <IncomingMessage>{ statusCode: 500 },
            { code: 'some_fake_code', message: 'This is a mock 500 error.', }
        );
        mockHttp.setThrowError(err);

        const evt = events.createEvents({});
        await expect(evt).rejects.toThrow(err);
    });
});


describe('FullStory Batch Events API', () => {
    const batchEvents = new EventsBatchImportApi({
        apiKey: MOCK_API_KEY,
    });
    (batchEvents as any)['httpClient'] = mockHttp;

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

        mockHttp.setMockReply(200, mockJob);

        const job = batchEvents.createBatchEventsImportJob(mockReq);

        expect(mockHttp.reqBody).toEqual(mockReq);
        expect(mockHttp.reqOpts.method).toBe('POST');
        expect(mockHttp.reqOpts.headers).toEqual(expectedHeaders);
        expect(mockHttp.reqOpts.path).toBe(`${basePath}/batch`);

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

        mockHttp.setMockReply(200, mockJob);

        const job = batchEvents.getBatchEventsImportStatus('abcd1234');

        expect(mockHttp.reqBody).toBeUndefined();
        expect(mockHttp.reqOpts.method).toBe('GET');
        expect(mockHttp.reqOpts.path).toBe(`${basePath}/batch/abcd1234`);

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
        mockHttp.setMockReply(200, mockRsp);

        const job = batchEvents.getBatchEventsImports('abcd1234');

        expect(mockHttp.reqBody).toBeUndefined();
        expect(mockHttp.reqOpts.method).toBe('GET');
        expect(mockHttp.reqOpts.path).toBe(`${basePath}/batch/abcd1234/imports`);

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

        mockHttp.setMockReply(200, mockJob);

        const job = batchEvents.getBatchEventsImportErrors('abcd1234', 'next_page_token');

        expect(mockHttp.reqBody).toBeUndefined();
        expect(mockHttp.reqOpts.method).toBe('GET');
        expect(mockHttp.reqOpts.path).toBe(`${basePath}/batch/abcd1234/errors?next_page_token=next_page_token`);

        await expect(job).resolves.toEqual({
            httpStatusCode: 200,
            body: mockJob,
        });
    });
});