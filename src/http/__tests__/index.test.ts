

import { beforeEach, describe, expect, test } from '@jest/globals';
import { GetUserResponse } from '@model/index';
import { RequestOptions } from 'https';
import nock from 'nock';

import { FSErrorImpl, FSErrorName, isFSError } from '../../errors';
import { FSHttpClient } from '../index';

const MOCK_API_KEY = 'MOCK_API_KEY';
const testHost = 'api.fullstory.test';
const testServer = 'https://' + testHost;
const testPath = '/test';

beforeEach(() => {
    nock.cleanAll();
});

describe('FSHttpClient', () => {
    const client = new FSHttpClient({
        apiKey: MOCK_API_KEY
    });

    const mockEndpoint = (): nock.Interceptor => {
        return nock(testServer)
            .post(testPath)
            .delayConnection(50)
            .delayBody(50)
            .matchHeader('Authorization', MOCK_API_KEY);
    };

    const mockReqOpts: RequestOptions = {
        hostname: testHost,
        method: 'POST',
        path: testPath,
        timeout: 1000
    };

    test('request success with 200 should resolve', async () => {
        const mockReply = {
            id: '12345',
            uid: 'test_user_1',
            display_name: 'Ada Lovelace',
            email: 'ada@fullstory.com',
            properties: {
                signed_up: true,
            }
        };
        const mockBody = { requestData: 'test request data' };
        mockEndpoint().reply(200, (_, body) => {
            // make sure request body is received
            expect(body).toBe(JSON.stringify(mockBody));
            return JSON.stringify(mockReply);
        });

        const promise = client.request<any, GetUserResponse>(mockReqOpts, mockBody);
        await expect(promise).resolves.toEqual({
            httpStatusCode: 200,
            httpHeaders: {},
            body: mockReply
        });
    }, 2000);

    test('request fails with non-json body', async () => {
        mockEndpoint().reply(401, 'Unauthorized\n');
        try {
            await client.request<any, GetUserResponse>(mockReqOpts);
        }
        catch (e) {
            if (isFSError(e)) {
                expect(e).toHaveProperty('name', FSErrorName.ERROR_FULLSTORY);
                expect(e).toHaveProperty('message', 'HTTP error status 401 received');
                expect(e).toHaveProperty('httpStatusCode', 401);
                expect(e).toHaveProperty('fsErrorResponse', 'Unauthorized\n');
            }
        }
        expect.hasAssertions();
    }, 2000);

    test('request fails with 500 and ErrorResponse body', async () => {
        const mockReply = {
            'code': 'internal',
            'message': 'Internal Error Occurred',
            'details': 'Something went wrong...'
        };
        mockEndpoint().reply(500, JSON.stringify(mockReply));

        try {
            await client.request<any, GetUserResponse>(mockReqOpts);
        }
        catch (e) {
            if (e instanceof FSErrorImpl) {
                expect(e).toHaveProperty('name', FSErrorName.ERROR_FULLSTORY);
                expect(e).toHaveProperty('message', 'HTTP error status 500 received');
                expect(e).toHaveProperty('httpStatusCode', 500);
                expect(e).toHaveProperty('fsErrorResponse', { code: 'internal', message: 'Internal Error Occurred' });
                expect(e).toHaveProperty('details', 'Something went wrong...');
            }
        }
        expect.hasAssertions();
    }, 2000);

    test('request returns 200 but malformed response body', async () => {
        const invalidRsp = 'invalid json response body';
        mockEndpoint().reply(200, invalidRsp);

        try {
            await client.request<any, GetUserResponse>(mockReqOpts);
        }
        catch (e) {
            if (e instanceof FSErrorImpl) {
                expect(e).toHaveProperty('name', FSErrorName.ERROR_PARSE_RESPONSE);
                expect(e).toHaveProperty('message', 'Invalid JSON response');
                expect(e).toHaveProperty('httpStatusCode', 200);
                expect(e).toHaveProperty('fsErrorResponse', invalidRsp);
                expect(e.cause).toHaveProperty('name', 'SyntaxError');
                expect(e.cause).toHaveProperty('message', expect.stringMatching(new RegExp('Unexpected token . in JSON at position')));
            }
        }
        expect.hasAssertions();
    }, 2000);
});
