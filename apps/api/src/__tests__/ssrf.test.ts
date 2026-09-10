import { describe, it, expect } from 'vitest';
import { validateUrl, isBlockedIp, decodeIP, SSRFError } from '@monara-sentinel/ssrf';

describe('SSRF Protection', () => {
  describe('isBlockedIp', () => {
    it('should block 127.0.0.1', () => {
      expect(isBlockedIp('127.0.0.1')).toBe(true);
    });

    it('should block 0.0.0.0', () => {
      expect(isBlockedIp('0.0.0.0')).toBe(true);
    });

    it('should block 10.0.0.1', () => {
      expect(isBlockedIp('10.0.0.1')).toBe(true);
    });

    it('should block 172.16.0.1', () => {
      expect(isBlockedIp('172.16.0.1')).toBe(true);
    });

    it('should block 192.168.1.1', () => {
      expect(isBlockedIp('192.168.1.1')).toBe(true);
    });

    it('should block 169.254.169.254 (metadata)', () => {
      expect(isBlockedIp('169.254.169.254')).toBe(true);
    });

    it('should block ::1 (IPv6 loopback)', () => {
      expect(isBlockedIp('::1')).toBe(true);
    });

    it('should block fc00:: (IPv6 ULA)', () => {
      expect(isBlockedIp('fc00::1')).toBe(true);
    });

    it('should block fe80:: (IPv6 link-local)', () => {
      expect(isBlockedIp('fe80::1')).toBe(true);
    });

    it('should allow public IPv4', () => {
      expect(isBlockedIp('8.8.8.8')).toBe(false);
      expect(isBlockedIp('1.1.1.1')).toBe(false);
    });

    it('should allow public IPv6', () => {
      expect(isBlockedIp('2001:4860:4860::8888')).toBe(false);
    });
  });

  describe('decodeIP', () => {
    it('should decode decimal IP 2130706433 to 127.0.0.1', () => {
      expect(decodeIP('2130706433')).toBe('127.0.0.1');
    });

    it('should decode hex IP 0x7f000001 to 127.0.0.1', () => {
      expect(decodeIP('0x7f000001')).toBe('127.0.0.1');
    });

    it('should decode octal IP 0177.0.0.1 to 127.0.0.1', () => {
      expect(decodeIP('0177.0.0.1')).toBe('127.0.0.1');
    });

    it('should decode mixed hex/octal IP', () => {
      expect(decodeIP('0x7f.0.0.1')).toBe('127.0.0.1');
    });

    it('should return null for non-IP input', () => {
      expect(decodeIP('example.com')).toBe(null);
    });

    it('should return normal IP unchanged', () => {
      expect(decodeIP('8.8.8.8')).toBe('8.8.8.8');
    });
  });

  describe('validateUrl', () => {
    it('should allow valid http URL', () => {
      const url = validateUrl('http://example.com');
      expect(url.href).toBe('http://example.com/');
    });

    it('should allow valid https URL', () => {
      const url = validateUrl('https://example.com');
      expect(url.href).toBe('https://example.com/');
    });

    it('should block ftp protocol', () => {
      expect(() => validateUrl('ftp://example.com')).toThrow(SSRFError);
    });

    it('should block file protocol', () => {
      expect(() => validateUrl('file:///etc/passwd')).toThrow(SSRFError);
    });

    it('should block localhost', () => {
      expect(() => validateUrl('http://localhost')).toThrow(SSRFError);
    });

    it('should block 127.0.0.1', () => {
      expect(() => validateUrl('http://127.0.0.1')).toThrow(SSRFError);
    });

    it('should block 0.0.0.0', () => {
      expect(() => validateUrl('http://0.0.0.0')).toThrow(SSRFError);
    });

    it('should block 10.0.0.1', () => {
      expect(() => validateUrl('http://10.0.0.1')).toThrow(SSRFError);
    });

    it('should block 192.168.1.1', () => {
      expect(() => validateUrl('http://192.168.1.1')).toThrow(SSRFError);
    });

    it('should block 172.16.0.1', () => {
      expect(() => validateUrl('http://172.16.0.1')).toThrow(SSRFError);
    });

    it('should block 169.254.169.254', () => {
      expect(() => validateUrl('http://169.254.169.254')).toThrow(SSRFError);
    });

    it('should block .local domains', () => {
      expect(() => validateUrl('http://example.local')).toThrow(SSRFError);
    });

    it('should block .internal domains', () => {
      expect(() => validateUrl('http://example.internal')).toThrow(SSRFError);
    });

    it('should block encoded IP in hostname', () => {
      expect(() => validateUrl('http://2130706433')).toThrow(SSRFError);
    });

    it('should block hex IP in hostname', () => {
      expect(() => validateUrl('http://0x7f000001')).toThrow(SSRFError);
    });

    it('should block URL with credentials', () => {
      expect(() => validateUrl('http://user:pass@example.com')).toThrow(SSRFError);
    });

    it('should block invalid URL', () => {
      expect(() => validateUrl('not-a-url')).toThrow(SSRFError);
    });

    it('should allow valid public URL', () => {
      const url = validateUrl('https://www.example.com/path?query=value');
      expect(url.href).toBe('https://www.example.com/path?query=value');
    });
  });

  describe('SSRFError', () => {
    it('should create error with code and blocked URL', () => {
      const error = new SSRFError('Blocked IP', 'BLOCKED_IP', 'http://127.0.0.1');
      expect(error.message).toBe('Blocked IP');
      expect(error.code).toBe('BLOCKED_IP');
      expect(error.blockedUrl).toBe('http://127.0.0.1');
      expect(error.name).toBe('SSRFError');
    });
  });
});
