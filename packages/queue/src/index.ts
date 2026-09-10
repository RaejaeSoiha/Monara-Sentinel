import { Queue } from 'bullmq';
import { config } from '@monara-sentinel/config';
import IORedis from 'ioredis';

let redis: IORedis | null = null;
let intelligenceQueue: Queue | null = null;

export function getRedisConnection() {
  if (!redis) {
    redis = new IORedis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return redis;
}

export function getIntelligenceQueue() {
  if (!intelligenceQueue) {
    const redis = getRedisConnection();
    intelligenceQueue = new Queue('intelligence', { connection: redis });
  }
  return intelligenceQueue;
}

export async function closeRedisConnection() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
  if (intelligenceQueue) {
    await intelligenceQueue.close();
    intelligenceQueue = null;
  }
}
