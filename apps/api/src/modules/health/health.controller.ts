// Health controller - handles request/response, delegates to service
import { FastifyRequest, FastifyReply } from 'fastify';
import { checkDatabase, checkRedis, getHealthData } from './health.service';

export async function healthHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = getHealthData();
  return reply.send({
    ...data,
    requestId: request.requestId || request.id,
  });
}

export async function readinessHandler(request: FastifyRequest, reply: FastifyReply) {
  const [dbCheck, redisCheck] = await Promise.all([checkDatabase(), checkRedis()]);

  const isReady = dbCheck.status === 'ok';
  const statusCode = isReady ? 200 : 503;

  return reply.status(statusCode).send({
    status: isReady ? ('ready' as const) : ('not ready' as const),
    timestamp: new Date().toISOString(),
    checks: {
      database: dbCheck.status,
      redis: redisCheck,
    },
    requestId: request.requestId || request.id,
  });
}

export async function livenessHandler(request: FastifyRequest, reply: FastifyReply) {
  // Kubernetes liveness - just checks process is alive
  return reply.send({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    requestId: request.requestId || request.id,
  });
}
