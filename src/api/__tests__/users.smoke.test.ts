import { describe, expect, test } from '@jest/globals';
import { CreateUserRequest, UpdateUserRequest } from '@model/index';
import * as dotenv from 'dotenv';

import { FSErrorImpl } from '../../http/error';
import { UsersApi } from '../index';

dotenv.config();
const { RUN_SMOKE_TESTS, FS_API_KEY } = process.env;

describe('FullStory Users API', () => {
    if (!RUN_SMOKE_TESTS || !FS_API_KEY) {
        test.only('Skipping all smoke tests, set env var RUN_SMOKE_TESTS and FS_API_KEY to allow smoke testing', () => { return; });
    }

    const users = new UsersApi({
        apiKey: `Basic ${FS_API_KEY}`,
    });

    test.todo('CRUD negatives');

    test.todo('CRUD round trip');
});
