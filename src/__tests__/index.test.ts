import { describe, expect, test } from '@jest/globals';
import { init } from '../index';

const MOCK_API_KEY = 'MOCK_API_KEY';

describe('index', () => {
    test('initializes with an api key', () => {
        const client = init({
            apiKey: MOCK_API_KEY,
        });
        expect(client).toHaveProperty('opts');
        expect(client['opts']).toHaveProperty('apiKey', MOCK_API_KEY);
    });
});
