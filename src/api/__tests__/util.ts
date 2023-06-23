export const defaultHost = 'api.fullstory.com';

export function makeMockReq(basePath: string, method: string, path: string, headers: any = {}) {
    const host = process.env.FS_API_HOST || defaultHost;
    return {
        headers: headers,
        protocol: 'https:',
        hostname: host,
        host: host,
        port: '',
        method: method,
        path: basePath + path
    };
}
