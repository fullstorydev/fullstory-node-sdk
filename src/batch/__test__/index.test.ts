import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { JobStatus } from '@model/events.index';

import { BatchJob, IBatchRequester } from '..';

const mockRequester: jest.Mocked<IBatchRequester<any, any, any, any>> = {
    requestCreateJob: jest.fn(),
    requestImports: jest.fn(),
    requestImportErrors: jest.fn(),
    requestJobStatus: jest.fn(),
};

beforeEach(() => {
    jest.resetAllMocks();
});

describe('FullStory Events API', () => {
    test('more requests can be added', () => {
        const baseJob = new BatchJob<'users', any, any, any, any>([], mockRequester, {});
        expect(baseJob.requests).toHaveLength(0);
        baseJob.add([1, 2, 3]);
        expect(baseJob.requests).toHaveLength(3);
    });

    test('can execute', () => {
        mockRequester.requestCreateJob = jest.fn(async _ => { return { id: 'test' }; });
        const baseJob = new BatchJob<'users', any, any, any, any>([], mockRequester, {});
        baseJob.execute();
        expect(mockRequester.requestCreateJob).toHaveBeenCalledTimes(1);
    });

    test('on processing should be called', (done) => {
        mockRequester.requestCreateJob = jest.fn(async _ => { return { id: 'test' }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { return { job: { status: JobStatus.Processing } }; });

        const baseJob = new BatchJob<'users', any, any, any, any>([], mockRequester, {});
        baseJob.on('processing', _ => {
            done();
        });
        baseJob.execute();
    });

    test('on error should be called', (done) => {
        mockRequester.requestCreateJob = jest.fn(async _ => { return { id: 'test' }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { throw new Error('test'); });

        const baseJob = new BatchJob<'users', any, any, any, any>([], mockRequester, {});
        baseJob.on('error', _ => {
            done();
        });
        baseJob.execute();
    });

    test('on done should be called on job complete', (done) => {
        mockRequester.requestCreateJob = jest.fn(async _ => { return { id: 'test' }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { return { job: { status: JobStatus.Completed } }; });
        mockRequester.requestImports = jest.fn(async _ => { return [1, 2, 3]; });

        const baseJob = new BatchJob<'users', any, any, any, any>([], mockRequester, {});
        baseJob.on('done', (i, f) => {
            console.log(i, f);
            done();
        });
        baseJob.execute();
    });

    test('on done should be called on job complete with failure', (done) => {
        mockRequester.requestCreateJob = jest.fn(async _ => { return { id: 'test' }; });
        mockRequester.requestJobStatus = jest.fn(async _ => { return { job: { status: JobStatus.Failed } }; });
        mockRequester.requestImportErrors = jest.fn(async _ => { return [1, 2, 3]; });

        const baseJob = new BatchJob<'users', any, any, any, any>([], mockRequester, {});
        baseJob.on('done', (i, f) => {
            console.log(i, f);
            done();
        });
        baseJob.execute();
    });
});