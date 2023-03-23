import { describe, expect, test } from '@jest/globals';
import { CreateEventsRequest } from '@model/index';
import * as dotenv from 'dotenv';

import { Events } from '../events';

dotenv.config();
const { RUN_SMOKE_TESTS, FS_API_KEY } = process.env;

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

            // 'session'?: SessionIdRequest;
            // 'context'?: Context;
            events: [{
                name: 'NodeJS Somke Test Event - 1',
                properties: {
                    membership_tier: 'gold',
                    sign_up: {
                        signed_up: true,
                        signed_up_date: '2000-10-31T00:00:00Z',
                        signed_up_d_str: '2000-10-31T00:00:00Z',
                    },
                    cell_num: '4041111111'
                }
            },
            {
                name: 'NodeJS Somke Test Event - 2',
                properties: {
                    prop_2: 'properties two'
                }
            }
            ],
            include_schema: true,
        };

        const created = await events.create(createEventsReq);

        expect(created).toHaveProperty('httpStatusCode', 200);
        expect(created).toHaveProperty('httpHeaders');
        expect(created).toHaveProperty('body');
        const responseBody = created.body;
        expect(responseBody?.user?.uid).toEqual(createEventsReq.user?.uid);
        expect(responseBody?.user?.id).toBeTruthy();
        expect(responseBody?.session?.id).toBeTruthy();
        expect(responseBody).toHaveProperty('events');
        expect(responseBody?.events?.[0]?.name).toEqual('NodeJS Somke Test Event - 1');
        expect(responseBody?.events?.[0]).toHaveProperty('schema');
        expect(responseBody?.events?.[0]).toHaveProperty('properties');
    });
});