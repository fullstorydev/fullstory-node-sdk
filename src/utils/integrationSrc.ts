export function addIntegrationSrc<T extends { integration?: string; }>(obj: T | undefined, intgSrc: string | undefined): T | undefined {
    if (!intgSrc) {
        return obj;
    }

    if (!obj) {
        return {
            integration: intgSrc
        } as T;
    }

    if (obj.integration) {
        // do not override if integration already exist
        return;
    }

    obj.integration = intgSrc;
    return obj;
}
