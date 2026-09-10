"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.env = void 0;
const tslib_1 = require("tslib");
const dotenv = tslib_1.__importStar(require("dotenv"));
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs"));
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
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('3001'),
    API_URL: zod_1.z.string().url().default('http://localhost:3001'),
    WEB_URL: zod_1.z.string().url().default('http://localhost:3000'),
    DATABASE_URL: zod_1.z.string().min(1),
    DIRECT_URL: zod_1.z.string().min(1).optional(),
    REDIS_URL: zod_1.z.string().min(1).default('redis://localhost:6379'),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    ENCRYPTION_KEY: zod_1.z
        .string()
        .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32'),
    ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:3000,http://localhost:3001'),
    MAX_FILE_SIZE: zod_1.z.string().default('52428800'),
    UPLOAD_DIR: zod_1.z.string().default('./uploads'),
});
function validateEnv() {
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
exports.env = validateEnv();
exports.config = {
    app: {
        env: exports.env.NODE_ENV,
        port: parseInt(exports.env.PORT, 10),
        apiUrl: exports.env.API_URL,
        webUrl: exports.env.WEB_URL,
        isDevelopment: exports.env.NODE_ENV === 'development',
        isProduction: exports.env.NODE_ENV === 'production',
        isTest: exports.env.NODE_ENV === 'test',
    },
    database: {
        url: exports.env.DATABASE_URL,
        directUrl: exports.env.DIRECT_URL,
    },
    redis: {
        url: exports.env.REDIS_URL,
    },
    jwt: {
        secret: exports.env.JWT_SECRET,
        expiresIn: exports.env.JWT_EXPIRES_IN,
        refreshExpiresIn: exports.env.JWT_REFRESH_EXPIRES_IN,
    },
    encryption: {
        key: exports.env.ENCRYPTION_KEY,
    },
    cors: {
        allowedOrigins: exports.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
    },
    upload: {
        maxFileSize: parseInt(exports.env.MAX_FILE_SIZE, 10),
        uploadDir: exports.env.UPLOAD_DIR,
    },
};
exports.default = exports.config;
