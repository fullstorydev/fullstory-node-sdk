

import { beforeEach, describe, expect, test } from '@jest/globals';
import { GetUserResponse } from '@model/index';
import { RequestOptions } from 'https';
import nock, { cleanAll } from 'nock';

import { FSApiError, FSErrorName, FSParserError, isFSError } from '../../errors';
import { FSHttpClientImpl } from '../index';

const MOCK_API_KEY = 'MOCK_API_KEY';
const MOCK_IDEMPOTENCY_KEY = 'MOCK_IDEMPOTENCY_KEY';
const MOCK_INTEGRATION_SOURCE = 'MOCK_INTEGRATION_SOURCE';
const testHost = 'api.fullstory.test';
const testServer = 'https://' + testHost;
const testPath = '/test';

beforeEach(() => {
    cleanAll();
});

describe('FSHttpClient', () => {
    const client = new FSHttpClientImpl({
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

        const promise = client.request<unknown, GetUserResponse>(mockReqOpts, mockBody);
        await expect(promise).resolves.toEqual({
            httpStatusCode: 200,
            httpHeaders: {},
            body: mockReply
        });
    }, 2000);

    test('request fails with non 2xx code', async () => {
        mockEndpoint().reply(401, '{"code":"unauthorized", "message":"Unauthorized"}');
        expect.hasAssertions();

        try {
            await client.request<string, GetUserResponse>(mockReqOpts);
        }
        catch (e) {
            if (isFSError(e)) {
                expect(e).toHaveProperty('name', FSErrorName.ERROR_FULLSTORY);
                expect(e).toHaveProperty('message', 'HTTP error status 401 received. Error message: Unauthorized');
                expect(e).toHaveProperty('httpStatusCode', 401);
                expect(e).toHaveProperty('fsErrorPayload', { 'code': 'unauthorized', 'message': 'Unauthorized' });
            }
        }
    }, 2000);

    test('request fails with 500 and ErrorResponse body', async () => {
        const mockReply = {
            'code': 'internal',
            'message': 'Internal Error Occurred',
            'details': 'Something went wrong...'
        };
        mockEndpoint().reply(500, JSON.stringify(mockReply));

        expect.hasAssertions();
        try {
            await client.request<any, GetUserResponse>(mockReqOpts);
        }
        catch (e) {
            if (e instanceof FSApiError) {
                expect(e).toHaveProperty('name', FSErrorName.ERROR_FULLSTORY);
                expect(e).toHaveProperty('message', 'HTTP error status 500 received. Error message: Internal Error Occurred');
                expect(e).toHaveProperty('httpStatusCode', 500);
                expect(e).toHaveProperty('fsErrorPayload', { code: 'internal', message: 'Internal Error Occurred' });
                expect(e).toHaveProperty('details', 'Something went wrong...');
            }
        }
    }, 2000);

    test('request returns 200 but malformed response body', async () => {
        const invalidRsp = 'invalid json response body';
        mockEndpoint().reply(200, invalidRsp);

        expect.hasAssertions();
        try {
            await client.request<string, GetUserResponse>(mockReqOpts);
        }
        catch (e) {
            if (e instanceof FSParserError) {
                expect(e).toHaveProperty('name', FSErrorName.ERROR_PARSE_RESPONSE);
                expect(e).toHaveProperty('message', 'Invalid JSON response');
                expect(e).toHaveProperty('httpStatusCode', 200);
                expect(e).toHaveProperty('fsErrorPayload', invalidRsp);
                expect(e.cause).toHaveProperty('name', 'SyntaxError');
                expect(e.cause).toHaveProperty('message', expect.stringMatching(new RegExp('Unexpected token . in JSON at position')));
            }
        }
    }, 2000);

    test('request with headers', async () => {
        const mockReply = {
            id: '12345',
        };
        const mockBody = { requestData: 'test request data' };
        mockEndpoint()
            .reply(200, (_, body) => {
                // make sure request body is received
                expect(body).toBe(JSON.stringify(mockBody));

                return JSON.stringify(mockReply);
            })
            .matchHeader('Idempotency-Key', MOCK_IDEMPOTENCY_KEY)
            .matchHeader('Integration-Source', MOCK_INTEGRATION_SOURCE);

        const promise = client.request<unknown, GetUserResponse>(mockReqOpts, mockBody, { idempotencyKey: MOCK_IDEMPOTENCY_KEY, integrationSource: MOCK_INTEGRATION_SOURCE });
        await expect(promise).resolves.toEqual({
            httpStatusCode: 200,
            httpHeaders: {},
            body: mockReply
        });
    }, 2000);
});
