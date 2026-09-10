import pino from 'pino';

export const logger = pino({
  level: process.env['LOG_LEVEL'] || 'info',
  formatters: { level: (label) => ({ level: label }) },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['password', 'password_hash', 'token'],
    remove: true,
  },
});

export default logger;
