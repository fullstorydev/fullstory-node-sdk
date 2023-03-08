

import { beforeEach, describe, expect, test } from '@jest/globals';
import { GetUserResponse } from '@model/users/GetUserResponse';
import { RequestOptions } from 'https';
import nock from 'nock';

import { FSError, FSErrorName, FSHttpClient } from '../index';

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
        if (promise instanceof GetUserResponse) {
            console.log(true, typeof promise);
        } else {
            console.log(false, typeof promise);
        }

        await expect(promise).resolves.toEqual(mockReply);
    }, 2000);

    test('request fails with 401 should error', async () => {
        mockEndpoint().reply(401, 'Unauthorized');

        const promise = client.request<any, any>(mockReqOpts, {});

        // FS server response with 'Unauthorized', not parsable into FSError Obj
        await expect(promise).rejects.toEqual({
            name: FSErrorName.ERROR_PARSE_RESPONSE,
            code: 'parse_error_response_failed',
            headers: {},
            httpCode: 401,
            message: 'Unable to parse response body into error object',
            resDataStr: 'Unauthorized'
        });
    }, 2000);

    test('request fails with 500 should error', async () => {
        const mockReply = {
            'code': 'internal',
            'message': 'Internal Error Occurred',
            'details': 'Something went wrong...'
        };
        mockEndpoint().reply(500, JSON.stringify(mockReply));

        const promise = client.request<any, any>(mockReqOpts, {});

        const errorObj: FSError = {
            name: FSErrorName.ERROR_FULLSTORY,
            code: 'internal',
            headers: {},
            httpCode: 500,
            message: 'Internal Error Occurred',
            details: 'Something went wrong...'
        };

        await expect(promise).rejects.toEqual(errorObj);
    }, 2000);
});
