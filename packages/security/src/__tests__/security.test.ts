import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateTokenPair, verifyToken, encrypt, decrypt, sha256, sha512 } from '../index';

describe('Security utilities', () => {
  it('hashes and verifies password with Argon2id', async () => {
    const hash = await hashPassword('TestPassword123!');
    expect(hash).toBeTruthy();
    expect(await verifyPassword(hash, 'TestPassword123!')).toBe(true);
    expect(await verifyPassword(hash, 'wrong')).toBe(false);
  });

  it('generates and verifies JWT pair', () => {
    const payload = { userId: 'u1', organizationId: 'o1', email: 'a@b.com' };
    const secret = 'super-secret-jwt-key-for-development-only-change-in-production-32c';
    const tokens = generateTokenPair(payload, secret, '15m', '7d');
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    const decoded = verifyToken(tokens.accessToken, secret);
    expect(decoded.userId).toBe('u1');
    expect(decoded.organizationId).toBe('o1');
  });

  it('encrypts and decrypts with AES-256-GCM', () => {
    const key = 'b005aff07348ce7d831ab50cb5d04e141516046f305c4567889fe49d024a4e4f';
    const data = 'sensitive data';
    const { encrypted, iv, authTag } = encrypt(data, key);
    const decrypted = decrypt(encrypted, key, iv, authTag);
    expect(decrypted).toBe(data);
  });

  it('generates SHA hashes', () => {
    expect(sha256('hello')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    expect(sha512('hello').length).toBe(128);
  });
});
