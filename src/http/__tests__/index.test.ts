

import { beforeEach, describe, expect, test } from '@jest/globals';
import { GetUserResponse } from '@model/users/GetUserResponse';
import { RequestOptions } from 'https';
import nock from 'nock';

import { FSErrorImpl, FSErrorName, FSHttpClient } from '../index';

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
            .get(testPath)
            .delayConnection(50)
            .delayBody(50)
            .matchHeader('Authorization', MOCK_API_KEY);
    };

    const mockReqOpts: RequestOptions = {
        hostname: testHost,
        method: 'GET',
        path: testPath,
        timeout: 1000
    };

    test('request success with 200 should resolve', async () => {
        const mockReply: GetUserResponse = {
            id: '12345',
            uid: 'test_user_1',
            display_name: 'Ada Lovelace',
            email: 'ada@fullstory.com',
            properties: {
                signed_up: true,
            }
        };
        mockEndpoint().reply(200, JSON.stringify(mockReply));

        const promise = client.request<any, GetUserResponse>(mockReqOpts, {});

        await expect(promise).resolves.toEqual(mockReply);
    }, 2000);

    test('request fails with 401 should error', async () => {
        mockEndpoint().reply(401, 'Unauthorized');

        try {
            await client.request<any, any>(mockReqOpts, {});
        }
        catch (e) {
            expect(e).toBeInstanceOf(FSErrorImpl);
            if (e instanceof FSErrorImpl) {
                expect(e.name).toBe(FSErrorName.ERROR_PARSE_RESPONSE);
                expect(e.httpCode).toBe(401);
                expect(e.code).toBe('parse_error_response_failed');
                expect(e.message).toBe('Unable to parse response body into error object');
                expect(e.resDataStr).toBe('Unauthorized');
                expect(e.cause?.message).toBe('Unexpected token U in JSON at position 0');
                expect(e.cause?.name).toBe('SyntaxError');
            }
        }
    }, 2000);

    test('request fails with 500 should error', async () => {
        const mockReply = {
            'code': 'internal',
            'message': 'Internal Error Occurred',
            'details': 'Something went wrong...'
        };
        mockEndpoint().reply(500, JSON.stringify(mockReply));

        try {
            await client.request<any, any>(mockReqOpts, {});
        }
        catch (e) {
            expect(e).toBeInstanceOf(FSErrorImpl);
            if (e instanceof FSErrorImpl) {
                expect(e.name).toBe(FSErrorName.ERROR_FULLSTORY);
                expect(e.httpCode).toBe(500);
                expect(e.code).toBe('internal');
                expect(e.message).toBe('Internal Error Occurred');
                expect(e.details).toBe('Something went wrong...');
                expect(e.cause).toBeUndefined();
            }
        }
    }, 2000);
});