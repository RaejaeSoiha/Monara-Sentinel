// Monara Sentinel Worker - BullMQ bootstrap (Stage 6)
import { config } from '@monara-sentinel/config';
import { logger } from './lib/logger';
import { createQueue, createWorker, getRedisConnection, closeRedisConnection } from './lib/queues';
import { processExampleJob, EXAMPLE_QUEUE, ExampleJobData } from './jobs/example.job';
import { processIntelligenceJob, INTELLIGENCE_QUEUE, IntelligenceJobData } from './jobs/intelligence.job';

const workers: Array<{ close: () => Promise<void> }> = [];
const queues: Array<{ close: () => Promise<void> }> = [];

async function bootstrap() {
  logger.info(
    {
      queues: [EXAMPLE_QUEUE, INTELLIGENCE_QUEUE],
      redisUrl: config.redis.url.replace(/:[^:@]+@/, ':***@'),
    },
    'Monara Sentinel Worker starting'
  );

  // Verify Redis
  const redis = getRedisConnection();
  try {
    await redis.ping();
    logger.info('Redis ping OK');
  } catch (err) {
    logger.error({ err }, 'Redis not available - worker will retry');
  }

  // Example queue + worker (proves infrastructure)
  const exampleQueue = createQueue<ExampleJobData>(EXAMPLE_QUEUE);
  queues.push(exampleQueue);

  const exampleWorker = createWorker<ExampleJobData>(EXAMPLE_QUEUE, async (job) => {
    return processExampleJob(job);
  });
  workers.push(exampleWorker);

  // Intelligence queue + worker (Phase 3)
  const intelligenceQueue = createQueue<IntelligenceJobData>(INTELLIGENCE_QUEUE);
  queues.push(intelligenceQueue);

  const intelligenceWorker = createWorker<IntelligenceJobData>(INTELLIGENCE_QUEUE, async (job) => {
    return processIntelligenceJob(job);
  });
  workers.push(intelligenceWorker);

  // Add a test job on startup to verify pipeline (only in development)
  if (config.app.isDevelopment) {
    const job = await exampleQueue.add('test', {
      message: 'Hello from Monara Sentinel Worker',
      timestamp: new Date().toISOString(),
    });
    logger.info({ jobId: job.id }, 'Enqueued test job');
  }

  logger.info('Worker bootstrap complete - waiting for jobs');
}

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Shutting down worker...');

  for (const w of workers) {
    try {
      await w.close();
    } catch (err) {
      logger.error({ err }, 'Error closing worker');
    }
  }

  for (const q of queues) {
    try {
      await q.close();
    } catch (err) {
      logger.error({ err }, 'Error closing queue');
    }
  }

  await closeRedisConnection();
  logger.info('Worker shutdown complete');
  process.exit(0);
}

async function main() {
  await bootstrap();

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
  });
  process.on('unhandledRejection', (err) => {
    logger.error({ err }, 'Unhandled rejection');
  });
}

if (require.main === module) {
  main().catch((err) => {
    logger.error({ err }, 'Worker failed to start');
    process.exit(1);
  });
}

export { bootstrap, gracefulShutdown };
export default main;
