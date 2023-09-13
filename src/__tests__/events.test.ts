

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import Module from 'module';

import { CreateBatchEventsImportJobRequest, CreateEventsRequest, init, JobStatus } from '..';

const MOCK_API_KEY = 'MOCK_API_KEY';
const MOCK_JOB_ID = 'MOCK_JOB_ID';
const MOCK_INTEGRATION_SOURCE = 'MOCK_INTEGRATION_SOURCE';
const MOCK_IDEMPOTENCY_KEY = 'MOCK_IDEMPOTENCY_KEY';

const mockRequest = jest.fn();
const mockJobCreate = jest.fn();
const mockJobStatus = jest.fn();
const mockJobImports = jest.fn();
const mockJobErrors = jest.fn();
jest.mock('@api/index', () => {
    return {
        ...jest.createMockFromModule<Module>('@api/index'),
        // so we can spy on "request"
        EventsApi: class {
            createEvents = mockRequest;
        },
        EventsBatchImportApi: class {
            createBatchEventsImportJob = mockJobCreate;
            getBatchEventsImportStatus = mockJobStatus;
            getBatchEventsImports = mockJobImports;
            getBatchEventsImportErrors = mockJobErrors;
        },
    };
});

describe('FullStory Events API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    const { events } = init({
        apiKey: MOCK_API_KEY,
    });

    test('events have the right API key', () => {
        expect(events).toHaveProperty('opts', { 'apiKey': 'Basic ' + MOCK_API_KEY });
    });

    test('events withOptions has the right options', () => {
        expect(events).toHaveProperty('opts', { 'apiKey': 'Basic ' + MOCK_API_KEY });
        const eventsWithOptions = events.withOptions({ integrationSource: MOCK_INTEGRATION_SOURCE });
        expect(eventsWithOptions).toHaveProperty('opts', { 'apiKey': 'Basic ' + MOCK_API_KEY, integrationSource: MOCK_INTEGRATION_SOURCE });
        // original events has not been modified
        expect(events).toHaveProperty('opts', { 'apiKey': 'Basic ' + MOCK_API_KEY });
    });

    test('create single event success', async () => {
        const createReq: CreateEventsRequest = {
            name: 'nodejs-sdk-event-1',
        };
        mockRequest.mockReturnValue({
            httpStatusCode: 200,
            body: {},
        });

        const event1 = events.create({ body: createReq });
        expect(mockRequest).lastCalledWith(
            // TODO(sabrina): find out why the accept headers is not passed for GETs
            { body: createReq },
        );
        await expect(event1).resolves.toEqual({
            httpStatusCode: 200,
            body: {},
        });

        const event2 = events.withOptions({ integrationSource: MOCK_INTEGRATION_SOURCE }).create({ body: createReq, idempotencyKey: MOCK_IDEMPOTENCY_KEY });
        expect(mockRequest).lastCalledWith(
            // TODO(sabrina): find out why the accept headers is not passed for GETs
            { body: createReq, idempotencyKey: MOCK_IDEMPOTENCY_KEY },
        );
        await expect(event2).resolves.toEqual({
            httpStatusCode: 200,
            body: {},
        });
    });

    test('batch event success without options', (done) => {
        const createJobReq: CreateBatchEventsImportJobRequest = {
            requests: [{ name: 'nodejs-sdk-event-2', }]
        };
        mockJobCreate.mockReturnValue({
            httpStatusCode: 200,
            body: { job: { id: MOCK_JOB_ID } },
        });
        mockJobStatus.mockReturnValue({
            httpStatusCode: 200,
            body: { job: { id: MOCK_JOB_ID, status: JobStatus.Completed } },
        });
        mockJobImports.mockReturnValue({
            httpStatusCode: 200,
            body: {},
        });
        mockJobErrors.mockReturnValue({
            httpStatusCode: 200,
            body: {},
        });

        const job = events.batchCreate({ body: createJobReq });
        expect(mockJobCreate).toBeCalledTimes(0);
        job.on('abort', (errs: Error[]) => {
            throw errs;
        });
        job.on('done', () => {
            expect(mockJobCreate).toHaveBeenLastCalledWith(
                { body: createJobReq },
            );

            expect(mockJobStatus).toHaveBeenLastCalledWith(
                { jobId: MOCK_JOB_ID },
            );
            done();
        });

        job.execute();
    });

    test('batch event success with job and request options', (done) => {
        const createJobReq: CreateBatchEventsImportJobRequest = {
            requests: [{ name: 'nodejs-sdk-event-2', }]
        };
        mockJobCreate.mockReturnValue({
            httpStatusCode: 200,
            body: { job: { id: MOCK_JOB_ID } },
        });
        mockJobStatus.mockReturnValue({
            httpStatusCode: 200,
            body: { job: { id: MOCK_JOB_ID, status: JobStatus.Completed } },
        });
        mockJobImports.mockReturnValue({
            httpStatusCode: 200,
            body: {},
        });
        mockJobErrors.mockReturnValue({
            httpStatusCode: 200,
            body: {},
        });

        const job = events.withOptions({ integrationSource: MOCK_INTEGRATION_SOURCE }).batchCreate({ body: createJobReq }, { pollInterval: 1000, maxRetry: 5 });
        expect(mockJobCreate).toBeCalledTimes(0);

        job.on('done', () => {
            expect(mockJobCreate).toBeCalledWith(
                { body: createJobReq },
            );
            expect(mockJobStatus).toBeCalledWith(
                { jobId: MOCK_JOB_ID },
            );
            done();
        });

        job.execute();
    });
});
