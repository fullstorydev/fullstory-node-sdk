import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { BatchUserImportRequest, BatchUserImportResponse, CreateBatchUserImportJobResponse, CreateUserResponse, FailedUserImport, JobStatus, JobStatusResponse } from '@model/index';

import { FSApiError } from '../../errors';
import { IBatchUsersRequester } from '../../users';
import { BatchJob } from '..';

const mockRequester: jest.Mocked<IBatchUsersRequester> = {
    requestCreateJob: jest.fn(),
    requestImports: jest.fn(),
    requestImportErrors: jest.fn(),
    requestJobStatus: jest.fn(),
};

beforeEach(() => {
    jest.resetAllMocks();
});

const MOCK_JOB_RSP: CreateBatchUserImportJobResponse = { job: { id: 'test', status: JobStatus.Processing, created: new Date().toISOString() } };
const MOCK_JOB__PROCESSING: JobStatusResponse = { job: { id: 'test', status: JobStatus.Processing, created: new Date().toISOString() }, imports: 0, errors: 0 };
const MOCK_JOB_FAILED: JobStatusResponse = { job: { id: 'test', status: JobStatus.Failed, created: new Date().toISOString(), finished: new Date().toISOString() }, imports: 0, errors: 0 };
const MOCK_JOB_COMPLETED: JobStatusResponse = { job: { id: 'test', status: JobStatus.Completed, created: new Date().toISOString(), finished: new Date().toISOString() }, imports: 0, errors: 0 };

describe('BatchJob', () => {
    test('more requests can be added', () => {
        const req: BatchUserImportRequest = { display_name: 'test batch job' };
        const baseJob = new BatchJob([req], mockRequester, {});
        expect(baseJob.requests).toHaveLength(1);
        baseJob.add([req, req]);
        expect(baseJob.requests).toHaveLength(3);
    });

    test('can execute', done => {
        mockRequester.requestCreateJob = jest.fn(async _ => MOCK_JOB_RSP);
        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('created', job => {
            expect(mockRequester.requestCreateJob).toHaveBeenCalledTimes(1);
            expect(job.getId()).toEqual('test');
            done();
        });
        baseJob.execute();
    });

    test('on processing should be called', done => {
        mockRequester.requestCreateJob = jest.fn(async _ => MOCK_JOB_RSP);
        mockRequester.requestJobStatus = jest.fn(async _ => MOCK_JOB__PROCESSING);

        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('processing', _ => {
            done();
        });
        baseJob.execute();
    });

    test('on error should be called', done => {
        mockRequester.requestCreateJob = jest.fn(async _ => MOCK_JOB_RSP);
        mockRequester.requestJobStatus = jest.fn(async _ => { throw new Error('test'); });

        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('error', _ => {
            done();
        });
        baseJob.execute();
    });

    test('request imports should be called with paging', done => {
        const rsp: CreateUserResponse = { id: 'fake' };
        mockRequester.requestCreateJob = jest.fn(async _ => MOCK_JOB_RSP);
        mockRequester.requestJobStatus = jest.fn(async _ => MOCK_JOB_COMPLETED);

        // mock return of 4 pages of 3 rsp each
        let i = 0;
        mockRequester.requestImports = jest.fn(async _ => {
            if (i < 3) {
                return { total_records: 3, results: [rsp, rsp, rsp], next_page_token: `test.token.${++i}` };
            } else {
                return { total_records: 3, results: [rsp, rsp, rsp], next_page_token: '' };
            }
        });

        const baseJob = new BatchJob([], mockRequester, {});

        baseJob.on('done', (i, f) => {
            expect(i).toHaveLength(12);
            expect(f).toHaveLength(0);
            expect(mockRequester.requestImports).toHaveBeenCalledTimes(4);
            expect(mockRequester.requestImports).toHaveBeenNthCalledWith(1, 'test', undefined);
            expect(mockRequester.requestImports).toHaveBeenNthCalledWith(2, 'test', 'test.token.1');
            expect(mockRequester.requestImports).toHaveBeenNthCalledWith(3, 'test', 'test.token.2');
            expect(mockRequester.requestImports).toHaveBeenNthCalledWith(4, 'test', 'test.token.3');
            done();
        });
        baseJob.execute();
    });

    test('on done should be called on job complete', done => {
        mockRequester.requestCreateJob = jest.fn(async _ => MOCK_JOB_RSP);
        mockRequester.requestJobStatus = jest.fn(async _ => MOCK_JOB_COMPLETED);
        const mockUser: BatchUserImportResponse = { id: 'test_user_id' };
        mockRequester.requestImports = jest.fn(async _ => { return { total_records: 3, results: [mockUser, mockUser, mockUser], next_page_token: '' }; });

        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('done', (i, f) => {
            expect(i).toHaveLength(3);
            expect(f).toHaveLength(0);
            done();
        });
        baseJob.execute();
    });

    test('on done should be called on job complete with failure', (done) => {
        const mockFailed: FailedUserImport = { message: 'test message', code: 'test_error', user: { id: 'test_user_id' } };
        mockRequester.requestCreateJob = jest.fn(async _ => MOCK_JOB_RSP);
        mockRequester.requestJobStatus = jest.fn(async _ => MOCK_JOB_FAILED);
        mockRequester.requestImportErrors = jest.fn(async _ => { return { total_records: 3, results: [mockFailed, mockFailed, mockFailed], next_page_token: '' }; });

        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('done', (i, f) => {
            expect(i).toHaveLength(0);
            expect(f).toHaveLength(3);
            done();
        });
        baseJob.execute();
    });

    test('abort on error', done => {
        mockRequester.requestCreateJob = jest.fn(async _ => { throw new Error('something unrecoverable'); });
        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('abort', (errors) => {
            expect(errors).toHaveLength(1);
            expect(mockRequester.requestCreateJob).toHaveBeenCalledTimes(1);
            done();
        });
        baseJob.execute();
    });

    test('abort on max number of retry-able retries', done => {
        mockRequester.requestCreateJob = jest.fn(async _ => { throw new FSApiError('rate limited', 429); });
        const baseJob = new BatchJob([], mockRequester, { pollInterval: 1, maxRetry: 4 });
        baseJob.on('abort', (errors) => {
            expect(errors).toHaveLength(4);
            expect(mockRequester.requestCreateJob).toHaveBeenCalledTimes(4);
            done();
        });
        baseJob.execute();
    });

    test('abort on max number of retry-able poll errors', done => {
        mockRequester.requestCreateJob = jest.fn(async _ => MOCK_JOB_RSP);
        mockRequester.requestJobStatus = jest.fn(async _ => {
            throw new FSApiError('rate limited', 429);
        });

        const baseJob = new BatchJob([], mockRequester, { pollInterval: 1, maxRetry: 4 });
        baseJob.on('abort', (errors) => {
            expect(errors).toHaveLength(4);
            expect(mockRequester.requestCreateJob).toHaveBeenCalledTimes(1);
            expect(mockRequester.requestJobStatus).toHaveBeenCalledTimes(4);
            done();
        });
        baseJob.execute();
    });
});
