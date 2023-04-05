import { describe, expect, test } from '@jest/globals';

import { init } from '../index';

const MOCK_API_KEY = 'MOCK_API_KEY';

describe('FullStory SDK', () => {
    test('can initialize with an api key', () => {
        const client = init({
            apiKey: MOCK_API_KEY,
        });
        expect(client).toHaveProperty('opts');
        expect((client as any)['opts']).toHaveProperty('apiKey', MOCK_API_KEY);

        expect(client).toHaveProperty('users');
        expect(client).toHaveProperty('events');
    });
});
