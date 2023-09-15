import { describe, expect, test } from '@jest/globals';
import { CreateEventRequest, ErrorResponse, JobStatus } from '@model/index';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

import { init } from '..';
import { FSApiError, FSErrorName } from '../errors';

dotenv.config();
const { RUN_SMOKE_TESTS, FS_API_KEY } = process.env;

const BATCH_JOB_TIMEOUT = 10000; // wait for 10 seconds for the job to finish
const INTEGRATION_SRC = 'NodeJS SDK Smoke Test';

describe('FullStory Events API', () => {
    if (!RUN_SMOKE_TESTS || !FS_API_KEY) {
        test.only('Skipping all smoke tests, set env var RUN_SMOKE_TESTS and FS_API_KEY to allow smoke testing', () => { return; });
        return;
    }

    const { events, users } = init({
        apiKey: `Basic ${FS_API_KEY}`,
        integrationSource: INTEGRATION_SRC
    });

    const uidSuffix = randomUUID();

    test('Event with no name should reject with error', async () => {
        try {
            await events.create({ body: { name: '' } });
        } catch (e) {
            expect(e).toBeInstanceOf(FSApiError);
            const apiError = e as FSApiError;
            expect(apiError.name).toBe(FSErrorName.ERROR_FULLSTORY);
            expect(apiError.httpStatusCode).toBe(400);

            expect((apiError.fsErrorPayload as ErrorResponse).code).toBe('invalid_argument');
            expect((apiError.fsErrorPayload as ErrorResponse).message).toContain('events must have a non-empty name');
        }
    });

    //TODO(sabrina): test for context and session identity

    test('Create Events API should create a new with user.uid', async () => {
        // Create events
        const createEventReq: CreateEventRequest = {
            user: { uid: 'nodejs_sdk_smoke_test_event_' + uidSuffix },
            name: 'NodeJS Smoke Test Event - with user.uid',
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

        const created = await events.create({ body: createEventReq });
        expect(created).toHaveProperty('httpStatusCode', 200);
        expect(created).toHaveProperty('httpHeaders');
        expect(created).toHaveProperty('body');
        expect(created.body).toEqual({});
    });

    test('Create Events API for user.id', async () => {
        // Setup user
        const u = await users.create({
            body:
                { display_name: 'nodejs_sdk_smoke_test_display_' + uidSuffix }
        });
        expect(u.body?.id).toBeTruthy();

        // Create events
        const createEventReq: CreateEventRequest = {
            user: { id: u.body?.id },
            name: 'NodeJS Smoke Test Event - with user.id',
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

        const created = await events.create({ body: createEventReq });
        expect(created).toHaveProperty('httpStatusCode', 200);
        expect(created).toHaveProperty('httpHeaders');
        expect(created).toHaveProperty('body');
        expect(created.body).toEqual({});
    });

    test('Create Events API should create new anonymous user', async () => {
        // Create events
        const createEventReq: CreateEventRequest = {
            name: 'NodeJS Smoke Test Event - anonymous user',
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

        const created = await events.create({ body: createEventReq });
        expect(created).toHaveProperty('httpStatusCode', 200);
        expect(created).toHaveProperty('httpHeaders');
        expect(created).toHaveProperty('body');
        expect(created.body).toEqual({});
    });

    test('Batch Events Job handling', done => {
        const createReq1: CreateEventRequest = {
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
        const createReq2: CreateEventRequest = {
            // user: { uid: 'nodejs_sdk_smoke_test_batch_2' },
            name: 'NodeJS Smoke Test Batch - Event - 3',
        };
        const createReq3: CreateEventRequest = {
            name: 'NodeJS Smoke Test Batch - Event - 4',
        };

        // Create A Job
        const job = events
            .batchCreate({ body: { requests: [createReq1] } }, { pollInterval: 1000 })
            .add(createReq2, createReq3);

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
                            name: createReq1.name,
                            properties: createReq1.properties
                        }),
                        expect.objectContaining({
                            name: createReq2.name,
                        }),
                        expect.objectContaining({
                            name: createReq3.name,
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
