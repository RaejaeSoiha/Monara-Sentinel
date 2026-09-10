// Zod schemas for health endpoints
import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string(),
  uptime: z.number(),
  environment: z.string(),
  version: z.string(),
  requestId: z.string().optional(),
});

export const readinessResponseSchema = z.object({
  status: z.enum(['ready', 'not ready']),
  timestamp: z.string(),
  checks: z.object({
    database: z.enum(['ok', 'error']),
    redis: z.enum(['ok', 'error', 'not_configured']),
  }),
  requestId: z.string().optional(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
