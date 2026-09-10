// Configuration validation and loading for Monara Sentinel
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env files in order: .env.local (local overrides), .env, then process.env
// This ensures `node dist/index.js` works without manual export, while Docker env vars still take precedence
const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'packages/database/.env'),
  path.resolve(process.cwd(), 'apps/api/.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  API_URL: z.string().url().default('http://localhost:3001'),
  WEB_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),

  // Redis
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Encryption - 32 bytes = 64 hex characters
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

  // File Upload
  MAX_FILE_SIZE: z.string().default('52428800'),
  UPLOAD_DIR: z.string().default('./uploads'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((err) => {
        return `${err.path.join('.')}: ${err.message}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}

export const env = validateEnv();

export const config = {
  app: {
    env: env.NODE_ENV,
    port: parseInt(env.PORT, 10),
    apiUrl: env.API_URL,
    webUrl: env.WEB_URL,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
  database: {
    url: env.DATABASE_URL,
    directUrl: env.DIRECT_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  encryption: {
    key: env.ENCRYPTION_KEY,
  },
  cors: {
    allowedOrigins: env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
  },
  upload: {
    maxFileSize: parseInt(env.MAX_FILE_SIZE, 10),
    uploadDir: env.UPLOAD_DIR,
  },
} as const;

export default config;
