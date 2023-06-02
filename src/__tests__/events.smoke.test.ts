import { describe, expect, test } from '@jest/globals';
import { CreateEventsRequest, JobStatus } from '@model/index';
import * as dotenv from 'dotenv';

import { Events } from '../events';

dotenv.config();
const { RUN_SMOKE_TESTS, FS_API_KEY } = process.env;

const BATCH_JOB_TIMEOUT = 10000; // wait for 10 seconds for the job to finish

describe('FullStory Events API', () => {
    if (!RUN_SMOKE_TESTS || !FS_API_KEY) {
        test.only('Skipping all smoke tests, set env var RUN_SMOKE_TESTS and FS_API_KEY to allow smoke testing', () => { return; });
        return;
    }

    const events = new Events({
        apiKey: `Basic ${FS_API_KEY}`,
    });

    //TODO(sabrina): make sure errors are thrown on error responses (like 401s)
    test.todo('CRUD negatives');

    test('Events API round trip', async () => {
        // Create events
        const createEventsReq: CreateEventsRequest = {
            user: { uid: 'nodejs_sdk_smoke_test_user_2' },
            /*
             * TODO(sabrina): add sessions and context to these events
             * 'session'?: SessionIdRequest;
             * 'context'?: Context;
             */

            name: 'NodeJS Smoke Test Event - 1',
            properties: {
                membership_tier: 'gold',
                sign_up: {
                    signed_up: true,
                    signed_up_date: '2000-10-31T00:00:00Z',
                    signed_up_d_str: '2000-10-31T00:00:00Z',
                },
                cell_num: '4041111111'
            }
        };

        const created = await events.create(createEventsReq);

        expect(created).toHaveProperty('httpStatusCode', 200);
        expect(created).toHaveProperty('httpHeaders');
        expect(created).toHaveProperty('body');
        const responseBody = created.body;
        expect(responseBody?.user?.uid).toEqual(createEventsReq.user?.uid);
        expect(responseBody?.user?.id).toBeTruthy();
        expect(responseBody?.session?.id).toBeTruthy();
        expect(responseBody).toHaveProperty('name');
        expect(responseBody).toHaveProperty('properties');

        expect(responseBody?.name).toEqual('NodeJS Smoke Test Event - 1');
    });

    test('Batch Events Job handling', done => {
        const createReq1: CreateEventsRequest = {
            // user: { uid: 'nodejs_sdk_smoke_test_batch_2' },
            name: 'NodeJS Smoke Test Batch - Event - 1',
            properties: {
                membership_tier: 'gold',
                sign_up: {
                    signed_up: true,
                    some_other_str: 'some other strings...',
                },
                cell_num: '4041111111'
            }
        };
        const createReq2: CreateEventsRequest = {
            // user: { uid: 'nodejs_sdk_smoke_test_batch_2' },
            name: 'NodeJS Smoke Test Batch - Event - 3',
        };
        const createReq3: CreateEventsRequest = {
            name: 'NodeJS Smoke Test Batch - Event - 4',
        };

        // Create A Job
        const job = events
            .batchCreate([createReq1], { pollInterval: 1000 })
            .add([createReq2, createReq3]);

        job.on('processing', (job) => {
            console.log('processing...', job.getId());
            expect(job.getId()).toBeTruthy();
            expect(job.metadata?.status).toBe(JobStatus.Processing);
            expect(job.getImports()).toEqual([]);
            expect(job.getFailedImports()).toEqual([]);
        });

        job.on('done',
            (imported, failed) => {
                expect(job.metadata?.status).toBe(JobStatus.Completed);
                expect(imported).toHaveLength(3);
                expect(failed).toHaveLength(0);
                expect(imported).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            ...createReq1
                        }),
                        expect.objectContaining({
                            ...createReq2
                        }),
                        expect.objectContaining({
                            ...createReq3
                        }),
                    ])
                );
                done();
            });

        job.on('error', error => {
            done(error);
        });

        job.execute();
    }, BATCH_JOB_TIMEOUT);
});
