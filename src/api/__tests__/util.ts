export const defaultHost = 'api.fullstory.com';

export function makeMockReq(basePath: string, method: string, path: string, headers: any = {}) {
    return {
        headers: headers,
        protocol: 'https:',
        hostname: defaultHost,
        host: defaultHost,
        port: '',
        method: method,
        path: basePath + path
    };
}
