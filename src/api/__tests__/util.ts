import * as dotenv from 'dotenv';
dotenv.config();

export const defaultHost = 'api.fullstory.com';

export function makeMockReq(basePath: string, method: string, path: string, headers: any = {}) {
    let host = defaultHost;
    if (process.env.FS_API_HOST) {
        const url = new URL(process.env.FS_API_HOST);
        host = url.host;
    }

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
