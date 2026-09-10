// Health routes - thin route definitions, delegate to controller
import { FastifyInstance } from 'fastify';
import { healthHandler, readinessHandler, livenessHandler } from './health.controller';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', healthHandler);
  fastify.get('/ready', readinessHandler);
  fastify.get('/live', livenessHandler);
}

export { healthRoutes as healthCheckRoutes };
