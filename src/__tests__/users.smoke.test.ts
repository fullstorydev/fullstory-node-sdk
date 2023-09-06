import { randomUUID } from 'node:crypto';

import { describe, expect, test } from '@jest/globals';
import { CreateUserRequest, JobStatus, UpdateUserRequest } from '@model/index';
import * as dotenv from 'dotenv';

import { init } from '..';
import { FSApiError } from '../errors';

dotenv.config();
const { RUN_SMOKE_TESTS, FS_API_KEY } = process.env;

const BATCH_JOB_TIMEOUT = 10000; // wait for 10 seconds for the job to finish
const INTEGRATION_SRC = 'NodeJS SDK Smoke Test';

describe('FullStory Users API', () => {
    if (!RUN_SMOKE_TESTS || !FS_API_KEY) {
        test.only('Skipping all smoke tests, set env var RUN_SMOKE_TESTS and FS_API_KEY to allow smoke testing', () => { return; });
        return;
    }

    const { users } = init({
        apiKey: `Basic ${FS_API_KEY}`,
        integrationSource: INTEGRATION_SRC
    });

    //TODO(sabrina): make sure errors are thrown on error responses (like 401s)
    test.todo('CRUD negatives');

    test('CRUD single user API round trip', async () => {
        const uidSuffix = randomUUID();
        const createReq: CreateUserRequest = {
            uid: 'nodejs_sdk_smoke_test_crud_' + uidSuffix,
            display_name: 'NodeJS Smoke Test User',
            email: 'donotreply@fullstory',
            properties: {
                membership_tier: 'gold',
                sign_up: {
                    signed_up: true,
                    signed_up_date: '2000-10-31T00:00:00Z',
                },
                cell_number: '4041111111'
            }
        };

        // Create User
        const created = await users.create({ body: createReq });
        expect(created).toHaveProperty('httpStatusCode', 200);
        expect(created).toHaveProperty('httpHeaders');
        expect(created).toHaveProperty('body');
        expect(created.body).toHaveProperty('id');

        // Get User
        const id = created.body?.id;
        if (!id) {
            throw new Error('expected crated user to have ID');
        }
        const got = await users.get({ id });
        expect(got).toHaveProperty('httpStatusCode', 200);
        expect(got).toHaveProperty('httpHeaders');
        expect(got).toHaveProperty('body');
        expect(got.body).toEqual(
            expect.objectContaining({
                ...createReq,
                properties: expect.objectContaining(createReq.properties as any),
            })
        );

        // Update user
        const updateReq: UpdateUserRequest = {
            display_name: 'NodeJS Smoke Test Updated',
            properties: {
                signed_up: false,
                additional_prop: 'something new'
            }
        };

        const updated = await users.update({ id, body: updateReq });
        expect(updated).toHaveProperty('httpStatusCode', 200);
        expect(updated).toHaveProperty('httpHeaders');
        expect(updated).toHaveProperty('body');
        expect(updated.body).toHaveProperty('id');

        // Delete User
        const deleted = await users.delete({ id });
        expect(deleted).toHaveProperty('httpStatusCode', 200);
        expect(deleted).toHaveProperty('httpHeaders');
        expect(deleted).toHaveProperty('body');

        try {
            const gotAfterDelete = await users.get({ id });
            // Either user is marked for delete
            expect(gotAfterDelete).toHaveProperty('httpStatusCode', 200);
            expect(gotAfterDelete.body).toHaveProperty('is_being_deleted', true);
        } catch (err) {
            // Or user may be already gone
            expect(err).toBeInstanceOf(FSApiError);
            expect(err).toHaveProperty('httpStatusCode', 404);
        }
    });

    test('Batch Users Job handling', done => {
        const uidSuffix = randomUUID();
        const createReq1: CreateUserRequest = {
            uid: 'nodejs_sdk_smoke_test_batch_' + uidSuffix,
            display_name: 'NodeJS Smoke Test User',
            email: 'donotreply@fullstory',
            properties: {
                membership_tier: 'gold',
                sign_up: {
                    signed_up: true,
                    signed_up_date: '2000-10-31T00:00:00Z',
                },
                cell_number: '4041111111'
            }
        };
        const createReq2: CreateUserRequest = {
            display_name: 'NodeJS Smoke Test User 2'
        };

        const createReq3: CreateUserRequest = {
            display_name: 'NodeJS Smoke Test User 3'
        };

        const requests = [
            {
                uid: 'user123',
                display_name: 'Display Name',
                email: 'user123@example.com',
                properties: {
                    pricing_plan: 'paid',
                    popup_help: true,
                    total_spent: 14.5,
                },
            },
            {
                uid: 'user456',
            },
            {
                uid: 'user789',
                display_name: 'A New User',
            },
        ];

        // create a job object
        const j = users.batchCreate({ requests });

        // Create A Job
        const job = users
            .batchCreate({ requests: [createReq1] }, { pollInterval: 1000 })
            .add(createReq2, createReq3);

        job.execute();

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
                        expect.objectContaining({ ...createReq1 }),
                        expect.objectContaining({ ...createReq2 }),
                        expect.objectContaining({ ...createReq3 })
                    ])
                );
                done();
            });

        job.on('error', error => {
            done(error);
        });

    }, BATCH_JOB_TIMEOUT * 10);
});
