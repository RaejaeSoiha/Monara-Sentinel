declare function isPrivateIPv4(ip: string): boolean;
declare function isPrivateIPv6(ip: string): boolean;
export declare function isBlockedIp(ip: string): boolean;
export declare function decodeIP(input: string): string | null;
export declare class SSRFError extends Error {
    code: string;
    blockedUrl?: string;
    constructor(message: string, code: string, blockedUrl?: string);
}
export declare function validateUrl(rawUrl: string): URL;
export declare function resolveAndValidate(hostname: string): Promise<string[]>;
export interface SafeFetchOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs?: number;
    maxRedirects?: number;
    maxResponseBytes?: number;
}
export interface SafeFetchResult {
    status: number;
    headers: Record<string, string>;
    body: string;
    finalUrl: string;
    redirectChain: Array<{
        url: string;
        status: number;
    }>;
}
export declare function safeFetch(rawUrl: string, opts?: SafeFetchOptions): Promise<SafeFetchResult>;
export declare const _private: {
    isPrivateIPv4: typeof isPrivateIPv4;
    isPrivateIPv6: typeof isPrivateIPv6;
    decodeIP: typeof decodeIP;
};
export {};
//# sourceMappingURL=index.d.ts.map