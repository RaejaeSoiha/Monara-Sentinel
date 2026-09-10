// Database connection handling for Monara Sentinel API
import { prisma } from '@monara-sentinel/database';
import { logger } from './logger';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    // Verify connection with simple query
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    logger.info('Database connected');
  } catch (error) {
    logger.error({ error }, 'Database connection failed');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    isConnected = false;
    logger.info('Database disconnected');
  } catch (error) {
    logger.error({ error }, 'Database disconnect failed');
  }
}

export function getDatabaseStatus(): { connected: boolean } {
  return { connected: isConnected };
}

export { prisma };
