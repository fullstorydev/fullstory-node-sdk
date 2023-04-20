import { describe, expect, test } from '@jest/globals';
import { CreateUserRequest, JobStatus, UpdateUserRequest } from '@model/index';
import * as dotenv from 'dotenv';

import { FSApiError, FSErrorName, isFSError } from '../errors';
import { Users } from '../users';

dotenv.config();
const { RUN_SMOKE_TESTS, FS_API_KEY } = process.env;

const BATCH_JOB_TIMEOUT = 10000; // wait for 10 seconds for the job to finish

describe('FullStory Users API', () => {
    if (!RUN_SMOKE_TESTS || !FS_API_KEY) {
        test.only('Skipping all smoke tests, set env var RUN_SMOKE_TESTS and FS_API_KEY to allow smoke testing', () => { return; });
        return;
    }

    const users = new Users({
        apiKey: `Basic ${FS_API_KEY}`,
    });

    //TODO(sabrina): make sure errors are thrown on error responses (like 401s)
    test.todo('CRUD negatives');

    test('CRUD single user API round trip', async () => {
        const createReq: CreateUserRequest = {
            uid: 'nodejs_sdk_smoke_test_user_1',
            display_name: 'NodeJS Smoke Test User',
            email: 'donotreply@fullstory',
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

        // Create User
        const created = await users.create(createReq);
        expect(created).toHaveProperty('httpStatusCode', 200);
        expect(created).toHaveProperty('httpHeaders');
        expect(created).toHaveProperty('body');
        expect(created.body).toEqual(
            expect.objectContaining({
                ...createReq,
                properties: expect.objectContaining(createReq.properties as any),
            })
        );

        // Get User
        const id = created.body?.id;
        if (!id) {
            throw new Error('expected crated user to have ID');
        }
        const got = await users.get(id);
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

        const updated = await users.update(id, updateReq);
        expect(updated).toHaveProperty('httpStatusCode', 200);
        expect(updated).toHaveProperty('httpHeaders');
        expect(updated).toHaveProperty('body');
        expect(updated.body?.display_name).toBe(updateReq.display_name);
        expect(updated.body?.properties).toEqual(expect.objectContaining({ ...updateReq.properties }));

        // Delete User
        const deleted = await users.delete(id);
        expect(deleted).toHaveProperty('httpStatusCode', 200);
        expect(deleted).toHaveProperty('httpHeaders');
        expect(deleted).toHaveProperty('body');

        try {
            const gotAfterDelete = await users.get(id);
            // Either user is marked for delete
            expect(gotAfterDelete).toHaveProperty('httpStatusCode', 200);
            expect(gotAfterDelete.body).toHaveProperty('is_being_deleted', true);
        } catch (err) {
            // Or user may be already gone
            expect(err).toBeInstanceOf(FSApiError);
            expect(err).toHaveProperty('httpCode', 404);
        }
    });

    test('Batch Users Job handling', done => {
        const createReq1: CreateUserRequest = {
            uid: 'nodejs_sdk_smoke_test_batch_1',
            display_name: 'NodeJS Smoke Test User',
            email: 'donotreply@fullstory',
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
        const createReq2: CreateUserRequest = {
            display_name: 'NodeJS Smoke Test User 2'
        };

        const createReq3: CreateUserRequest = {
            display_name: 'NodeJS Smoke Test User 3'
        };


        // Create A Job
        const job = users
            .batchCreate([createReq1], { pollInterval: 1000 })
            .add([createReq2, createReq3]);

        job.execute();

        job.on('processing', (job) => {
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

    }, BATCH_JOB_TIMEOUT);

    test('Batch Users Job handling with pagination', done => {
        const reqs: CreateUserRequest[] = [];
        for (let i = 0; i < 101; i++) {
            reqs.push({
                display_name: 'NodeJS Smoke Test User Batch 2 - ' + i,
            });
        }

        // Create A Job
        const job = users.batchCreate(reqs, { pollInterval: 1000 });

        job.execute();

        job.on('processing', (job) => {
            console.log('on processing...', job.getId());
            expect(job.getId()).toBeTruthy();
            expect(job.metadata?.status).toBe(JobStatus.Processing);
            expect(job.getImports()).toEqual([]);
            expect(job.getFailedImports()).toEqual([]);
        });

        job.on('done',
            (imported, failed) => {
                expect(job.metadata?.status).toBe(JobStatus.Completed);
                expect(imported).toHaveLength(101);
                expect(failed).toHaveLength(0);
                done();
            });

        job.on('error', error => {
            done(error);
        });

    }, BATCH_JOB_TIMEOUT * 5); // longer wait for big imports

    test('Batch Users Job handling with rate limited', done => {
        const req: CreateUserRequest = {
            display_name: 'NodeJS Smoke Test User 1',
        };

        let gotRLError = false;
        // Create A Job
        const job = users
            .batchCreate([], {
                pollInterval: 1 // should trigger at least one rate limited error
            });
        for (let i = 0; i < 10; i++) {
            job.add([req]);
        }
        job.on('processing', (job) => {
            console.log('processing', job.getId());
            expect(job.getId()).toBeTruthy();
            expect(job.metadata?.status).toBe(JobStatus.Processing);
            expect(job.getImports()).toEqual([]);
            expect(job.getFailedImports()).toEqual([]);
        });

        job.on('done',
            (imported, failed) => {
                expect(job.metadata?.status).toBe(JobStatus.Completed);
                expect(imported).toHaveLength(10);
                expect(failed).toHaveLength(0);
                expect(imported).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ ...req }),
                    ])
                );
                // make sure at least one error had been encountered
                expect(gotRLError).toBeTruthy();
                done();
            });

        job.on('abort', errors => {
            console.error('job', job.getId(), 'aborted with errors:');
            console.error(errors);
            done(errors.pop());
        });

        job.on('error', e => {
            if (isFSError(e) && e.name === FSErrorName.ERROR_RATE_LIMITED) {
                gotRLError = true;
            }

            console.log(`error ${e} encountered`);
        });

        job.execute();
    }, BATCH_JOB_TIMEOUT);
});
