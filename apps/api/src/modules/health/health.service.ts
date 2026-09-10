// Health service - data access / business logic separated from routes
import { prisma } from '../../lib/db';

export interface DatabaseCheckResult {
  status: 'ok' | 'error';
  latencyMs?: number;
  error?: string;
}

export async function checkDatabase(): Promise<DatabaseCheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Redis check - foundation for Stage 6 (worker queues)
// Returns not_configured if REDIS_URL not reachable or not set up yet
export async function checkRedis(): Promise<'ok' | 'error' | 'not_configured'> {
  // Stage 6 will implement full Redis health via BullMQ
  // For now, try simple connection if REDIS_URL is configured
  const redisUrl = process.env['REDIS_URL'];
  if (!redisUrl) return 'not_configured';

  // We don't yet have a Redis client in API foundation - mark as not_configured
  // Stage 6 will replace with actual Redis ping
  return 'not_configured';
}

export function getHealthData() {
  return {
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
    version: '0.1.0',
  };
}
