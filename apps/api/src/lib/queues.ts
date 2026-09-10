import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@monara-sentinel/config';
import { logger } from './logger';

let connection: IORedis | null = null;
let intelligenceQueue: Queue | null = null;

function getConnection(): IORedis {
  if (connection) return connection;
  connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null, enableReadyCheck: false });
  connection.on('error', (err) => logger.error({ err }, 'Redis queue error'));
  return connection;
}

export function getIntelligenceQueue(): Queue {
  if (intelligenceQueue) return intelligenceQueue;
  intelligenceQueue = new Queue('intelligence', {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });
  return intelligenceQueue;
}

export async function createIntelligenceJob(
  caseId: string,
  organizationId: string,
  userId: string,
  type: 'dns' | 'rdap' | 'tls' | 'url' | 'website',
  input: unknown,
  ip?: string,
  userAgent?: string
) {
  const queue = getIntelligenceQueue();
  const job = await queue.add(type, {
    caseId,
    organizationId,
    userId,
    type,
    input,
    ip,
    userAgent,
    requestedAt: new Date().toISOString(),
  });
  logger.info({ jobId: job.id, type, caseId }, 'Intelligence job enqueued');
  return job;
}

export async function closeQueues(): Promise<void> {
  if (intelligenceQueue) {
    await intelligenceQueue.close();
    intelligenceQueue = null;
  }
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
