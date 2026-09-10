// Correlation ID / Request ID plugin for tracing
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

export async function correlationPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId =
      (request.headers['x-request-id'] as string) || randomUUID();

    // Attach to request for logging
    request.requestId = requestId;
    reply.header('x-request-id', requestId);
  });

  // Log request completion with correlation
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.info(
      {
        requestId: request.requestId,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'request completed'
    );
  });
}
