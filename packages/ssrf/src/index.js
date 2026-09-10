"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._private = exports.SSRFError = void 0;
exports.isBlockedIp = isBlockedIp;
exports.decodeIP = decodeIP;
exports.validateUrl = validateUrl;
exports.resolveAndValidate = resolveAndValidate;
exports.safeFetch = safeFetch;
const tslib_1 = require("tslib");
const dns = tslib_1.__importStar(require("dns/promises"));
const net = tslib_1.__importStar(require("net"));
function isPrivateIPv4(ip) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255))
        return false;
    const [a, b] = parts;
    if (a === 127)
        return true;
    if (a === 0)
        return true;
    if (a === 10)
        return true;
    if (a === 172 && b >= 16 && b <= 31)
        return true;
    if (a === 192 && b === 168)
        return true;
    if (a === 169 && b === 254)
        return true;
    if (a === 100 && b >= 64 && b <= 127)
        return true;
    if (a === 192 && b === 0 && parts[2] === 2)
        return true;
    if (a === 198 && b === 51 && parts[2] === 100)
        return true;
    if (a === 203 && b === 0 && parts[2] === 113)
        return true;
    if (a >= 224)
        return true;
    if (ip === '169.254.169.254')
        return true;
    return false;
}
function isPrivateIPv6(ip) {
    const lower = ip.toLowerCase();
    const base = lower.split('%')[0] || '';
    if (base === '::1' || base === '0:0:0:0:0:0:0:1')
        return true;
    if (base === '::' || base === '0:0:0:0:0:0:0:0')
        return true;
    if (base.startsWith('fc') || base.startsWith('fd'))
        return true;
    if (base.startsWith('fe80:') || base.startsWith('fe8') || base.startsWith('fe9') || base.startsWith('fea') || base.startsWith('feb'))
        return true;
    if (base.includes('.')) {
        const lastColon = base.lastIndexOf(':');
        const ipv4Part = base.substring(lastColon + 1);
        if (isPrivateIPv4(ipv4Part))
            return true;
        const decoded = decodeIP(ipv4Part);
        if (decoded && isPrivateIPv4(decoded))
            return true;
    }
    if (base.includes('169.254.169.254'))
        return true;
    return false;
}
function isBlockedIp(ip) {
    const trimmed = ip.trim().replace(/^\[(.*)\]$/, '$1');
    if (!trimmed)
        return true;
    if (net.isIPv4(trimmed))
        return isPrivateIPv4(trimmed);
    if (net.isIPv6(trimmed))
        return isPrivateIPv6(trimmed);
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const inner = trimmed.slice(1, -1);
        if (net.isIPv6(inner))
            return isPrivateIPv6(inner);
    }
    return false;
}
function decodeIP(input) {
    const trimmed = input.trim();
    if (!trimmed)
        return null;
    let decoded;
    try {
        decoded = decodeURIComponent(trimmed);
    }
    catch {
        decoded = trimmed;
    }
    if (net.isIPv4(decoded) || net.isIPv6(decoded))
        return decoded;
    if (/^\d+$/.test(decoded)) {
        const num = Number(decoded);
        if (Number.isSafeInteger(num) && num >= 0 && num <= 4294967295) {
            return `${(num >>> 24) & 0xff}.${(num >>> 16) & 0xff}.${(num >>> 8) & 0xff}.${num & 0xff}`;
        }
    }
    if (/^0x[0-9a-fA-F]+$/.test(decoded)) {
        const num = parseInt(decoded, 16);
        if (num >= 0 && num <= 4294967295) {
            return `${(num >>> 24) & 0xff}.${(num >>> 16) & 0xff}.${(num >>> 8) & 0xff}.${num & 0xff}`;
        }
    }
    if (decoded.includes('.')) {
        const parts = decoded.split('.');
        if (parts.length === 4) {
            const normalized = [];
            for (const part of parts) {
                let num;
                if (/^0x[0-9a-fA-F]+$/.test(part)) {
                    num = parseInt(part, 16);
                }
                else if (/^0[0-7]+$/.test(part) && part.length > 1) {
                    num = parseInt(part, 8);
                }
                else if (/^\d+$/.test(part)) {
                    num = parseInt(part, 10);
                }
                else {
                    return null;
                }
                if (Number.isNaN(num) || num < 0 || num > 255)
                    return null;
                normalized.push(num);
            }
            return normalized.join('.');
        }
        if (parts.some((p) => /^0x|0[0-7]/.test(p))) {
            return '127.0.0.1';
        }
    }
    return null;
}
const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    'metadata.google.internal',
    'metadata.google.com',
    'instance-data',
    '169.254.169.254',
]);
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
class SSRFError extends Error {
    code;
    blockedUrl;
    constructor(message, code, blockedUrl) {
        super(message);
        this.code = code;
        this.blockedUrl = blockedUrl;
        this.name = 'SSRFError';
    }
}
exports.SSRFError = SSRFError;
function validateUrl(rawUrl) {
    let url;
    try {
        url = new URL(rawUrl);
    }
    catch {
        throw new SSRFError(`Invalid URL: ${rawUrl}`, 'INVALID_URL', rawUrl);
    }
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
        throw new SSRFError(`Blocked protocol: ${url.protocol}`, 'BLOCKED_PROTOCOL', rawUrl);
    }
    if (url.username || url.password) {
        throw new SSRFError('URL with credentials blocked', 'BLOCKED_CREDENTIALS', rawUrl);
    }
    const rawHostname = url.hostname.toLowerCase();
    const hostname = rawHostname.replace(/^\[(.*)\]$/, '$1');
    if (!hostname)
        throw new SSRFError('Missing hostname', 'MISSING_HOST', rawUrl);
    if (BLOCKED_HOSTNAMES.has(hostname) || BLOCKED_HOSTNAMES.has(rawHostname)) {
        throw new SSRFError(`Blocked hostname: ${hostname}`, 'BLOCKED_HOSTNAME', rawUrl);
    }
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
        throw new SSRFError(`Blocked private hostname: ${hostname}`, 'BLOCKED_HOSTNAME', rawUrl);
    }
    const decodedHostname = decodeIP(hostname);
    if (decodedHostname && isBlockedIp(decodedHostname)) {
        throw new SSRFError(`Blocked encoded IP: ${hostname} -> ${decodedHostname}`, 'BLOCKED_IP', rawUrl);
    }
    const checkHost = hostname.replace(/^\[(.*)\]$/, '$1');
    if (net.isIPv4(checkHost) || net.isIPv6(checkHost)) {
        if (isBlockedIp(checkHost)) {
            throw new SSRFError(`Blocked IP: ${hostname}`, 'BLOCKED_IP', rawUrl);
        }
    }
    else {
        const decoded = decodeIP(hostname);
        if (decoded && isBlockedIp(decoded)) {
            throw new SSRFError(`Blocked encoded IP hostname: ${hostname}`, 'BLOCKED_IP', rawUrl);
        }
    }
    const rawHost = (() => {
        try {
            const match = rawUrl.match(/:\/\/([^/]+)/);
            if (match && match[1]) {
                const hostPart = match[1].split('@').pop() || '';
                const withoutPort = hostPart.split(':')[0] || '';
                return withoutPort ? withoutPort.toLowerCase() : hostname;
            }
        }
        catch {
        }
        return hostname;
    })();
    if (rawHost !== hostname) {
        const rawDecoded = decodeIP(rawHost);
        if (rawDecoded && isBlockedIp(rawDecoded)) {
            throw new SSRFError(`Blocked encoded host in raw URL: ${rawHost}`, 'BLOCKED_IP', rawUrl);
        }
    }
    return url;
}
async function resolveAndValidate(hostname) {
    if (net.isIPv4(hostname) || net.isIPv6(hostname)) {
        if (isBlockedIp(hostname))
            throw new SSRFError(`Blocked IP: ${hostname}`, 'BLOCKED_IP');
        return [hostname];
    }
    const decoded = decodeIP(hostname);
    if (decoded && net.isIPv4(decoded)) {
        if (isBlockedIp(decoded))
            throw new SSRFError(`Blocked encoded IP: ${hostname} -> ${decoded}`, 'BLOCKED_IP');
        return [decoded];
    }
    let addresses;
    try {
        addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    }
    catch (e) {
        throw new SSRFError(`DNS lookup failed for ${hostname}: ${e instanceof Error ? e.message : String(e)}`, 'DNS_FAILED');
    }
    if (!addresses || addresses.length === 0) {
        throw new SSRFError(`No DNS results for ${hostname}`, 'DNS_NO_RESULT');
    }
    for (const { address } of addresses) {
        if (isBlockedIp(address)) {
            throw new SSRFError(`DNS for ${hostname} resolved to blocked IP ${address}`, 'BLOCKED_IP');
        }
    }
    return addresses.map((a) => a.address);
}
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
async function safeFetch(rawUrl, opts = {}) {
    const maxRedirects = opts.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
    const maxBytes = opts.maxResponseBytes ?? DEFAULT_MAX_BYTES;
    let currentUrl = rawUrl;
    const redirectChain = [];
    for (let i = 0; i <= maxRedirects; i++) {
        const url = validateUrl(currentUrl);
        await resolveAndValidate(url.hostname);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        let res;
        try {
            res = await fetch(currentUrl, {
                method: opts.method || 'GET',
                headers: opts.headers,
                body: opts.body,
                redirect: 'manual',
                signal: controller.signal,
            });
        }
        catch (e) {
            clearTimeout(timeout);
            if (e instanceof Error && e.name === 'AbortError') {
                throw new SSRFError(`Timeout fetching ${currentUrl}`, 'TIMEOUT', currentUrl);
            }
            throw new SSRFError(`Fetch failed for ${currentUrl}: ${e instanceof Error ? e.message : String(e)}`, 'FETCH_FAILED', currentUrl);
        }
        finally {
            clearTimeout(timeout);
        }
        if (res.status >= 300 && res.status < 400) {
            const location = res.headers.get('location');
            if (!location) {
                throw new SSRFError(`Redirect status ${res.status} without Location header`, 'REDIRECT_NO_LOCATION', currentUrl);
            }
            let nextUrl;
            try {
                nextUrl = new URL(location, currentUrl).toString();
            }
            catch {
                throw new SSRFError(`Invalid redirect Location: ${location}`, 'INVALID_REDIRECT', currentUrl);
            }
            redirectChain.push({ url: currentUrl, status: res.status });
            if (redirectChain.length > maxRedirects) {
                throw new SSRFError(`Too many redirects (>${maxRedirects})`, 'TOO_MANY_REDIRECTS', currentUrl);
            }
            validateUrl(nextUrl);
            await resolveAndValidate(new URL(nextUrl).hostname);
            currentUrl = nextUrl;
            continue;
        }
        const contentLength = res.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > maxBytes) {
            throw new SSRFError(`Response too large (${contentLength} > ${maxBytes})`, 'TOO_LARGE', currentUrl);
        }
        let body = '';
        if (res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let bytes = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                if (value) {
                    bytes += value.length;
                    if (bytes > maxBytes) {
                        throw new SSRFError(`Response too large (>${maxBytes} bytes)`, 'TOO_LARGE', currentUrl);
                    }
                    body += decoder.decode(value, { stream: true });
                }
            }
            body += decoder.decode();
            if (body.length > maxBytes)
                body = body.slice(0, maxBytes);
        }
        else {
            body = await res.text();
            if (body.length > maxBytes)
                body = body.slice(0, maxBytes);
        }
        const headers = {};
        res.headers.forEach((value, key) => {
            headers[key] = value;
        });
        return {
            status: res.status,
            headers,
            body,
            finalUrl: currentUrl,
            redirectChain,
        };
    }
    throw new SSRFError('Unhandled redirect loop', 'REDIRECT_LOOP', rawUrl);
}
exports._private = {
    isPrivateIPv4,
    isPrivateIPv6,
    decodeIP,
};
