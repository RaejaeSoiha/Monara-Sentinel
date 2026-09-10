// Queue configuration for Monara Sentinel Worker
// BullMQ + Redis foundation - Stage 6

import { Queue, QueueOptions, Worker, WorkerOptions, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@monara-sentinel/config';
import { logger } from './logger';

// Redis connection - shared
let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (connection) return connection;

  const redisUrl = config.redis.url;
  logger.info({ redisUrl: redisUrl.replace(/:[^:@]+@/, ':***@') }, 'Connecting to Redis');

  connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
  });

  connection.on('connect', () => logger.info('Redis connected'));
  connection.on('error', (err) => logger.error({ err }, 'Redis error'));
  connection.on('close', () => logger.info('Redis closed'));

  return connection;
}

export async function closeRedisConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
    logger.info('Redis connection closed');
  }
}

// Job abstraction
export interface JobData {
  [key: string]: unknown;
}

export interface JobOptions {
  attempts?: number;
  backoff?: { type: 'exponential' | 'fixed'; delay: number };
  removeOnComplete?: number;
  removeOnFail?: number;
}

// Default queue options - secure and observable
const defaultQueueOptions: QueueOptions = {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
};

const defaultWorkerOptions: WorkerOptions = {
  connection: getRedisConnection(),
  concurrency: 5,
  limiter: { max: 10, duration: 1000 },
};

// Queue factory
export function createQueue<T extends JobData>(name: string, opts: Partial<QueueOptions> = {}): Queue<T> {
  const queue = new Queue<T>(name, {
    ...defaultQueueOptions,
    ...opts,
    connection: getRedisConnection(),
  });

  queue.on('error', (err) => logger.error({ err, queue: name }, 'Queue error'));

  logger.info({ queue: name }, 'Queue created');
  return queue;
}

// Worker factory with DLQ handling
export function createWorker<T extends JobData>(
  queueName: string,
  processor: (job: Job<T>) => Promise<unknown>,
  opts: Partial<WorkerOptions> = {}
): Worker<T> {
  const worker = new Worker<T>(
    queueName,
    async (job) => {
      const start = Date.now();
      logger.info({ queue: queueName, jobId: job.id, jobName: job.name }, 'Processing job');

      try {
        const result = await processor(job);
        logger.info(
          { queue: queueName, jobId: job.id, duration: Date.now() - start },
          'Job completed'
        );
        return result;
      } catch (error) {
        logger.error({ err: error, queue: queueName, jobId: job.id }, 'Job failed');
        // BullMQ will handle retries; after max attempts, job moves to failed
        throw error;
      }
    },
    {
      ...defaultWorkerOptions,
      ...opts,
      connection: getRedisConnection(),
    }
  );

  worker.on('completed', (job) => logger.info({ queue: queueName, jobId: job.id }, 'Job completed event'));
  worker.on('failed', (job, err) => logger.warn({ queue: queueName, jobId: job?.id, err }, 'Job failed event'));
  worker.on('error', (err) => logger.error({ err, queue: queueName }, 'Worker error'));

  logger.info({ queue: queueName }, 'Worker created');
  return worker;
}
