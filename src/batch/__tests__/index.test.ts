import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { JobStatus } from '@model/events.index';
import { BatchUserImportRequest, BatchUserImportResponse, CreateUserResponse, FailedUserImport, GetBatchUserImportStatusResponse } from '@model/users.index';

import { BatchJob, IBatchRequester } from '..';

const mockRequester: jest.Mocked<IBatchRequester<GetBatchUserImportStatusResponse, BatchUserImportRequest, BatchUserImportResponse, FailedUserImport>> = {
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
        mockRequester.requestCreateJob = jest.fn(async _ => { return { id: 'test' }; });
        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('created', job => {
            expect(mockRequester.requestCreateJob).toHaveBeenCalledTimes(1);
            expect(job.getId()).toEqual('test');
            done();
        });
        baseJob.execute();
    });

    test('on processing should be called', done => {
        mockRequester.requestCreateJob = jest.fn(async _ => { return { id: 'test' }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { return { job: { status: JobStatus.Processing } }; });

        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('processing', _ => {
            done();
        });
        baseJob.execute();
    });

    test('on error should be called', (done) => {
        mockRequester.requestCreateJob = jest.fn(async _ => { return { id: 'test' }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { throw new Error('test'); });

        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('error', _ => {
            done();
        });
        baseJob.execute();
    });

    test('on done should be called on job complete', (done) => {
        const rsp: CreateUserResponse = {};
        mockRequester.requestCreateJob = jest.fn(async _ => { return { id: 'test' }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { return { job: { status: JobStatus.Completed } }; });
        mockRequester.requestImports = jest.fn(async _ => { return [rsp, rsp, rsp]; });

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
        mockRequester.requestCreateJob = jest.fn(async _ => { return { id: 'test' }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { return { job: { status: JobStatus.Failed } }; });
        mockRequester.requestImportErrors = jest.fn(async _ => { return [rsp, rsp, rsp]; });

        const baseJob = new BatchJob([], mockRequester, {});
        baseJob.on('done', (i, f) => {
            expect(i).toHaveLength(0);
            expect(f).toHaveLength(3);
            done();
        });
        baseJob.execute();
    });
});
