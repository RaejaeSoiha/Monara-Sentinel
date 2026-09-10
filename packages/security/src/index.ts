// Security utilities for Monara Sentinel

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  organizationId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Hash a password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3, // iterations
      parallelism: 4, // threads
      hashLength: 32, // 32 bytes
      saltLength: 16, // 16 bytes
    });
  } catch (error) {
    throw new SecurityError('Failed to hash password', 'HASH_ERROR');
  }
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    throw new SecurityError('Failed to verify password', 'VERIFY_ERROR');
  }
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a token for storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(
  payload: TokenPayload,
  secret: string,
  expiresIn: string
): string {
  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'monara-sentinel',
    audience: 'monara-sentinel-api',
    jwtid: crypto.randomUUID(),
  } as jwt.SignOptions);
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(
  payload: TokenPayload,
  secret: string,
  expiresIn: string
): string {
  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'monara-sentinel',
    audience: 'monara-sentinel-api',
    jwtid: crypto.randomUUID(),
  } as jwt.SignOptions);
}

/**
 * Generate token pair
 */
export function generateTokenPair(
  payload: TokenPayload,
  secret: string,
  accessExpiresIn: string,
  refreshExpiresIn: string
): TokenPair {
  const accessToken = generateAccessToken(payload, secret, accessExpiresIn);
  const refreshToken = generateRefreshToken(payload, secret, refreshExpiresIn);

  return { accessToken, refreshToken };
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string, secret: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'monara-sentinel',
      audience: 'monara-sentinel-api',
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new SecurityError('Token expired', 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new SecurityError('Invalid token', 'INVALID_TOKEN');
    }
    throw new SecurityError('Failed to verify token', 'VERIFY_ERROR');
  }
}

/**
 * Decode JWT token without verification (for debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(
  data: string,
  key: string
): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encrypted: string, key: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate SHA-256 hash
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate SHA-512 hash
 */
export function sha512(data: string): string {
  return crypto.createHash('sha512').update(data).digest('hex');
}

export default {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  decodeToken,
  encrypt,
  decrypt,
  sha256,
  sha512,
};
