import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { BatchUserImportRequest, CreateUserResponse, FailedUserImport, JobStatus } from '@model/index';

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

describe('BatchJob', () => {
    test('more requests can be added', () => {
        const req: BatchUserImportRequest = { display_name: 'test batch job' };
        const baseJob = new BatchJob([req], mockRequester, {});
        expect(baseJob.requests).toHaveLength(1);
        baseJob.add([req, req]);
        expect(baseJob.requests).toHaveLength(3);
    });

    test('can execute', done => {
        mockRequester.requestCreateJob = jest.fn(async _ => { return { job: { id: 'test' } }; });
        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('created', job => {
            expect(mockRequester.requestCreateJob).toHaveBeenCalledTimes(1);
            expect(job.getId()).toEqual('test');
            done();
        });
        baseJob.execute();
    });

    test('on processing should be called', done => {
        mockRequester.requestCreateJob = jest.fn(async _ => { return { job: { id: 'test' } }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { return { job: { status: JobStatus.Processing } }; });

        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('processing', _ => {
            done();
        });
        baseJob.execute();
    });

    test('on error should be called', done => {
        mockRequester.requestCreateJob = jest.fn(async _ => { return { job: { id: 'test' } }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { throw new Error('test'); });

        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('error', _ => {
            done();
        });
        baseJob.execute();
    });

    test('request imports should be called with paging', done => {
        const rsp: CreateUserResponse = {};
        mockRequester.requestCreateJob = jest.fn(async _ => { return { job: { id: 'test' } }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { return { job: { status: JobStatus.Completed } }; });
        mockRequester.requestImports = jest.fn(async _ => { return { results: [rsp, rsp, rsp], next_page_token: 'test.token' }; });

        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('done', (i, f) => {
            expect(i).toHaveLength(6);
            expect(f).toHaveLength(0);
            expect(mockRequester.requestImports).toHaveBeenCalledTimes(2);
            done();
        });
        baseJob.execute();
    });

    test('on done should be called on job complete', done => {
        const rsp: CreateUserResponse = {};
        mockRequester.requestCreateJob = jest.fn(async _ => { return { job: { id: 'test' } }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { return { job: { status: JobStatus.Completed } }; });
        mockRequester.requestImports = jest.fn(async _ => { return { results: [rsp, rsp, rsp] }; });

        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('done', (i, f) => {
            expect(i).toHaveLength(3);
            expect(f).toHaveLength(0);
            done();
        });
        baseJob.execute();
    });

    test('on done should be called on job complete with failure', (done) => {
        const rsp: FailedUserImport = {};
        mockRequester.requestCreateJob = jest.fn(async _ => { return { job: { id: 'test' } }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { return { job: { status: JobStatus.Failed } }; });
        mockRequester.requestImportErrors = jest.fn(async _ => { return { results: [rsp, rsp, rsp] }; });

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
        mockRequester.requestCreateJob = jest.fn(async _ => { return { job: { id: 'test' } }; });
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
