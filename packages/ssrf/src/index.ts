// Monara Sentinel — SSRF Protection Package
// Dedicated reusable package — do not scatter checks through services.
// Validates immediately before every network connection, including redirects.

import * as dns from 'dns/promises';
import * as net from 'net';

// ---------------------------------------------------------------------------
// IP validation
// ---------------------------------------------------------------------------

/**
 * Check if IPv4 is private/internal per Phase 3B spec.
 * Covers: 127.0.0.0/8, 0.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16,
 * 169.254.0.0/16, 100.64.0.0/10, 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return false;

  const [a, b] = parts;

  if (a === 127) return true; // 127.0.0.0/8
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // 169.254.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 192 && b === 0 && parts[2] === 2) return true; // 192.0.2.0/24
  if (a === 198 && b === 51 && parts[2] === 100) return true; // 198.51.100.0/24
  if (a === 203 && b === 0 && parts[2] === 113) return true; // 203.0.113.0/24
  if (a >= 224) return true; // 224.0.0.0/4 multicast
  // Check exact metadata IP
  if (ip === '169.254.169.254') return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // Normalize: remove zone id
  const base = lower.split('%')[0] || '';

  // ::1
  if (base === '::1' || base === '0:0:0:0:0:0:0:1') return true;
  // :: (unspecified)
  if (base === '::' || base === '0:0:0:0:0:0:0:0') return true;
  // fc00::/7 (ULA) fc00:: - fdff:ffff:...
  if (base.startsWith('fc') || base.startsWith('fd')) return true;
  // fe80::/10 link-local fe80 - febf
  if (base.startsWith('fe80:') || base.startsWith('fe8') || base.startsWith('fe9') || base.startsWith('fea') || base.startsWith('feb')) return true;

  // Check for embedded IPv4 in IPv6 (like ::ffff:10.0.0.1)
  // If it contains '.' it has IPv4
  if (base.includes('.')) {
    const lastColon = base.lastIndexOf(':');
    const ipv4Part = base.substring(lastColon + 1);
    if (isPrivateIPv4(ipv4Part)) return true;
    // Decimal/hex encoded IPv4 inside IPv6
    const decoded = decodeIP(ipv4Part);
    if (decoded && isPrivateIPv4(decoded)) return true;
  }

  // Metadata IPv6? Not really, but check mapped
  // ::ffff:169.254.169.254
  if (base.includes('169.254.169.254')) return true;

  return false;
}

export function isBlockedIp(ip: string): boolean {
  const trimmed = ip.trim().replace(/^\[(.*)\]$/, '$1');
  if (!trimmed) return true;
  if (net.isIPv4(trimmed)) return isPrivateIPv4(trimmed);
  if (net.isIPv6(trimmed)) return isPrivateIPv6(trimmed);
  // Also try without brackets for IPv6 literal
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1);
    if (net.isIPv6(inner)) return isPrivateIPv6(inner);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Encoded IP handling
// ---------------------------------------------------------------------------

/**
 * Decode various IP representations:
 * - decimal: 2130706433 (127.0.0.1), 3232235777 (192.168.1.1)
 * - hex: 0x7f000001, 0x7f.0x0.0x0.0x1, 0xc0.0xa8.0x1.0x1
 * - octal: 0177.0.0.01, 0300.0250.0001.0001
 * - mixed: 0x7f.0.0.1, 0177.0.0.1
 * Returns normalized dotted-decimal or null if not an IP encoding.
 */
export function decodeIP(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // URL decode first (handle %2e, %3A etc.)
  let decoded: string;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    decoded = trimmed;
  }

  // If it's already a normal IP, return it
  if (net.isIPv4(decoded) || net.isIPv6(decoded)) return decoded;

  // Check for decimal single number (e.g., 2130706433)
  if (/^\d+$/.test(decoded)) {
    const num = Number(decoded);
    if (Number.isSafeInteger(num) && num >= 0 && num <= 4294967295) {
      // Convert 32-bit int to dotted decimal
      return `${(num >>> 24) & 0xff}.${(num >>> 16) & 0xff}.${(num >>> 8) & 0xff}.${num & 0xff}`;
    }
  }

  // Check for hex single (0x7f000001)
  if (/^0x[0-9a-fA-F]+$/.test(decoded)) {
    const num = parseInt(decoded, 16);
    if (num >= 0 && num <= 4294967295) {
      return `${(num >>> 24) & 0xff}.${(num >>> 16) & 0xff}.${(num >>> 8) & 0xff}.${num & 0xff}`;
    }
  }

  // Check for dotted with hex/octal parts (e.g., 0x7f.0.0.1, 0177.0.0.1, 0xc0.0250.01.1)
  if (decoded.includes('.')) {
    const parts = decoded.split('.');
    if (parts.length === 4) {
      const normalized: number[] = [];
      for (const part of parts) {
        let num: number;
        if (/^0x[0-9a-fA-F]+$/.test(part)) {
          num = parseInt(part, 16);
        } else if (/^0[0-7]+$/.test(part) && part.length > 1) {
          num = parseInt(part, 8);
        } else if (/^\d+$/.test(part)) {
          num = parseInt(part, 10);
        } else {
          return null;
        }
        if (Number.isNaN(num) || num < 0 || num > 255) return null;
        normalized.push(num);
      }
      return normalized.join('.');
    }
    // Handle 3 parts, 2 parts, etc. — for simplicity, try to parse as mixed
    // e.g., 0x7f.1 (127.0.0.1 with 2 parts)
    // For now, if any part is hex/octal, we flag as suspicious and block
    if (parts.some((p) => /^0x|0[0-7]/.test(p))) {
      // If it contains hex/octal encoding, treat as blocked (we can't safely normalize all variants)
      // Return a known private IP to ensure blocking
      return '127.0.0.1';
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Hostname / URL validation
// ---------------------------------------------------------------------------

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google.com',
  'instance-data',
  '169.254.169.254',
]);

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export class SSRFError extends Error {
  constructor(
    message: string,
    public code: string,
    public blockedUrl?: string
  ) {
    super(message);
    this.name = 'SSRFError';
  }
}

export function validateUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SSRFError(`Invalid URL: ${rawUrl}`, 'INVALID_URL', rawUrl);
  }

  // Protocol check
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new SSRFError(`Blocked protocol: ${url.protocol}`, 'BLOCKED_PROTOCOL', rawUrl);
  }

  // Credentials in URL (e.g., http://user:pass@host)
  if (url.username || url.password) {
    throw new SSRFError('URL with credentials blocked', 'BLOCKED_CREDENTIALS', rawUrl);
  }

  // Hostname checks — handle bracketed IPv6 like [::1]
  const rawHostname = url.hostname.toLowerCase();
  const hostname = rawHostname.replace(/^\[(.*)\]$/, '$1');
  if (!hostname) throw new SSRFError('Missing hostname', 'MISSING_HOST', rawUrl);
  if (BLOCKED_HOSTNAMES.has(hostname) || BLOCKED_HOSTNAMES.has(rawHostname)) {
    throw new SSRFError(`Blocked hostname: ${hostname}`, 'BLOCKED_HOSTNAME', rawUrl);
  }
  // Private hostname patterns
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw new SSRFError(`Blocked private hostname: ${hostname}`, 'BLOCKED_HOSTNAME', rawUrl);
  }

  // Check for encoded IP in hostname
  const decodedHostname = decodeIP(hostname);
  if (decodedHostname && isBlockedIp(decodedHostname)) {
    throw new SSRFError(`Blocked encoded IP: ${hostname} -> ${decodedHostname}`, 'BLOCKED_IP', rawUrl);
  }

  // If hostname itself is an IP, check it (handle brackets)
  const checkHost = hostname.replace(/^\[(.*)\]$/, '$1');
  if (net.isIPv4(checkHost) || net.isIPv6(checkHost)) {
    if (isBlockedIp(checkHost)) {
      throw new SSRFError(`Blocked IP: ${hostname}`, 'BLOCKED_IP', rawUrl);
    }
  } else {
    // For hostnames that look like numeric IP encodings (e.g., 0x7f000001)
    const decoded = decodeIP(hostname);
    if (decoded && isBlockedIp(decoded)) {
      throw new SSRFError(`Blocked encoded IP hostname: ${hostname}`, 'BLOCKED_IP', rawUrl);
    }
  }

  // Also check the full URL for encoded tricks (e.g., http://0x7f.0.0.1)
  // The URL parser may have already normalized, but we check the raw host
  const rawHost = (() => {
    try {
      // Extract host part before URL parsing normalization
      const match = rawUrl.match(/:\/\/([^/]+)/);
      if (match && match[1]) {
        const hostPart = match[1].split('@').pop() || '';
        const withoutPort = hostPart.split(':')[0] || '';
        return withoutPort ? withoutPort.toLowerCase() : hostname;
      }
    } catch {
      // ignore
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

// ---------------------------------------------------------------------------
// DNS resolution + validation (validate immediately before connection)
// ---------------------------------------------------------------------------

export async function resolveAndValidate(hostname: string): Promise<string[]> {
  // First, check if hostname itself is IP and already validated
  if (net.isIPv4(hostname) || net.isIPv6(hostname)) {
    if (isBlockedIp(hostname)) throw new SSRFError(`Blocked IP: ${hostname}`, 'BLOCKED_IP');
    return [hostname];
  }

  // Check encoded IP
  const decoded = decodeIP(hostname);
  if (decoded && net.isIPv4(decoded)) {
    if (isBlockedIp(decoded)) throw new SSRFError(`Blocked encoded IP: ${hostname} -> ${decoded}`, 'BLOCKED_IP');
    // If it decodes to an IP, we should not resolve DNS — treat as IP
    return [decoded];
  }

  // DNS lookup — get all addresses
  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch (e) {
    throw new SSRFError(`DNS lookup failed for ${hostname}: ${e instanceof Error ? e.message : String(e)}`, 'DNS_FAILED');
  }

  if (!addresses || addresses.length === 0) {
    throw new SSRFError(`No DNS results for ${hostname}`, 'DNS_NO_RESULT');
  }

  // Validate every resolved address — block if any is private
  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw new SSRFError(`DNS for ${hostname} resolved to blocked IP ${address}`, 'BLOCKED_IP');
    }
  }

  return addresses.map((a) => a.address);
}

// ---------------------------------------------------------------------------
// Safe fetch with redirect handling and DNS rebinding protection
// ---------------------------------------------------------------------------

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
  redirectChain: Array<{ url: string; status: number }>;
}

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2MB

export async function safeFetch(rawUrl: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const maxRedirects = opts.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
  const maxBytes = opts.maxResponseBytes ?? DEFAULT_MAX_BYTES;

  let currentUrl = rawUrl;
  const redirectChain: Array<{ url: string; status: number }> = [];

  for (let i = 0; i <= maxRedirects; i++) {
    // Validate URL before every connection
    const url = validateUrl(currentUrl);

    // DNS + IP validation immediately before connection
    await resolveAndValidate(url.hostname);

    // Perform fetch with timeout and no automatic redirect
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        method: opts.method || 'GET',
        headers: opts.headers,
        body: opts.body,
        redirect: 'manual',
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof Error && e.name === 'AbortError') {
        throw new SSRFError(`Timeout fetching ${currentUrl}`, 'TIMEOUT', currentUrl);
      }
      throw new SSRFError(`Fetch failed for ${currentUrl}: ${e instanceof Error ? e.message : String(e)}`, 'FETCH_FAILED', currentUrl);
    } finally {
      clearTimeout(timeout);
    }

    // Handle redirects manually — re-validate destination
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        throw new SSRFError(`Redirect status ${res.status} without Location header`, 'REDIRECT_NO_LOCATION', currentUrl);
      }

      // Resolve location relative to current URL
      let nextUrl: string;
      try {
        nextUrl = new URL(location, currentUrl).toString();
      } catch {
        throw new SSRFError(`Invalid redirect Location: ${location}`, 'INVALID_REDIRECT', currentUrl);
      }

      redirectChain.push({ url: currentUrl, status: res.status });

      if (redirectChain.length > maxRedirects) {
        throw new SSRFError(`Too many redirects (>${maxRedirects})`, 'TOO_MANY_REDIRECTS', currentUrl);
      }

      // Validate next URL before following
      validateUrl(nextUrl);
      await resolveAndValidate(new URL(nextUrl).hostname);

      currentUrl = nextUrl;
      continue;
    }

    // Not a redirect — return result
    // Check content length and limit body size
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      throw new SSRFError(`Response too large (${contentLength} > ${maxBytes})`, 'TOO_LARGE', currentUrl);
    }

    let body = '';
    if (res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let bytes = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          bytes += value.length;
          if (bytes > maxBytes) {
            throw new SSRFError(`Response too large (>${maxBytes} bytes)`, 'TOO_LARGE', currentUrl);
          }
          body += decoder.decode(value, { stream: true });
        }
      }
      body += decoder.decode();
      // Truncate if still too large (safety)
      if (body.length > maxBytes) body = body.slice(0, maxBytes);
    } else {
      body = await res.text();
      if (body.length > maxBytes) body = body.slice(0, maxBytes);
    }

    const headers: Record<string, string> = {};
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

// ---------------------------------------------------------------------------
// Utility for testing
// ---------------------------------------------------------------------------

export const _private = {
  isPrivateIPv4,
  isPrivateIPv6,
  decodeIP,
};
