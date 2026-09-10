// Structured logging using pino for Monara Sentinel
// SCAMNET platform uses evidence-first logging - all logs are structured JSON with correlation
// Note: pino-pretty transport is not used with Fastify logger instance to avoid Fastify validation error
// Use `pino-pretty` via `node --loader` or separate pretty printing if needed

import pino from 'pino';

const isDevelopment = process.env['NODE_ENV'] === 'development';

export const logger = pino({
  level: process.env['LOG_LEVEL'] || (isDevelopment ? 'debug' : 'info'),
  formatters: {
    level: (label) => ({ level: label }),
  },
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Never log sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'password_hash'],
    remove: true,
  },
});

export default logger;
