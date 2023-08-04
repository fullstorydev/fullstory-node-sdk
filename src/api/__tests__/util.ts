import * as dotenv from 'dotenv';
dotenv.config();

export const defaultHost = 'api.fullstory.com';

export function makeMockReq(basePath: string, method: string, path: string, headers: any = {}) {
    let host = defaultHost;
    let hostname = defaultHost;
    let port = '';
    let protocol = 'https:';
    if (process.env.FS_API_HOST) {
        const url = new URL(process.env.FS_API_HOST);
        host = url.host;
        hostname = url.hostname;
        port = url.port;
        protocol = url.protocol;
    }

    return {
        headers: headers,
        protocol: protocol,
        hostname: hostname,
        host: host,
        port: port,
        method: method,
        path: basePath + path
    };
}
