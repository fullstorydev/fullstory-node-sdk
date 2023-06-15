import { describe, expect, test } from '@jest/globals';

import { maybeAddIntegrationSrc } from '../integrationSrc';

describe('maybeAddIntegrationSrc function', () => {
    test('should not mutate object when no integrationSrc string provided', async () => {
        let input = undefined;
        let result = maybeAddIntegrationSrc(input, undefined);
        expect(result).toBeUndefined();

        input = {};
        result = maybeAddIntegrationSrc(input, undefined);
        expect(result).toEqual({});

        input = { anything: 'should not change' } as { integration?: string; };
        result = maybeAddIntegrationSrc(input, undefined);
        expect(result).toEqual({ anything: 'should not change' });

        result = maybeAddIntegrationSrc(input, '');
        expect(result).toEqual({ anything: 'should not change' });
    });

    test('should not mutate object when object already have an integration string', async () => {
        const input = { integration: 'test', anything: 'should not change' };
        let result = maybeAddIntegrationSrc(input, '');
        expect(result).toEqual({ integration: 'test', anything: 'should not change' });

        result = maybeAddIntegrationSrc(input, 'abc');
        expect(result).toEqual({ integration: 'test', anything: 'should not change' });
    });

    test('should add the integration string to object', async () => {
        let input = undefined;
        let result = maybeAddIntegrationSrc(input, 'test');
        expect(result).toEqual({ integration: 'test' });

        input = { anything: 'should not change' } as { integration?: string; };
        result = maybeAddIntegrationSrc(input, 'test');
        expect(result).toEqual({ integration: 'test', anything: 'should not change' });
    });
});
