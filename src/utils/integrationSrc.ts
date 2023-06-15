// maybeAddIntegrationSrc takes an object and integration source string and
// add the "integration" property by mutating the object.
// Create a new object if obj is undefined.
// Will not attempt to override any existing integration property in the object.
export function maybeAddIntegrationSrc<T extends { integration?: string; }>(obj: T | undefined, integrationSrc: string | undefined): T | undefined {
    if (!integrationSrc) {
        return obj;
    }

    if (!obj) {
        return {
            integration: integrationSrc
        } as T;
    }

    if (obj.integration) {
        // do not override if integration already exist
        return obj;
    }

    obj.integration = integrationSrc;
    return obj;
}
