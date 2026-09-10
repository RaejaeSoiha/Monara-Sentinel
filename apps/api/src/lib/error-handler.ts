// Error handler for Monara Sentinel API
// Security: never expose stack traces or internal details in production

import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

const isProduction = process.env['NODE_ENV'] === 'production';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  const requestId = request.requestId || request.id;

  // Zod validation errors (from fastify-type-provider-zod)
  if (error instanceof ZodError) {
    request.log.warn({ err: error, requestId }, 'Validation failed');
    reply.status(400).send({
      error: 'Validation Error',
      message: 'Request validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
      requestId,
    });
    return;
  }

  // Fastify validation errors
  if (error.validation) {
    request.log.warn({ validation: error.validation, requestId }, 'Validation failed');
    reply.status(400).send({
      error: 'Validation Error',
      message: 'Request validation failed',
      code: 'VALIDATION_ERROR',
      details: error.validation,
      requestId,
    });
    return;
  }

  // AppError (known operational errors)
  if (error instanceof AppError) {
    request.log.warn({ err: error, requestId }, error.message);
    reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
      code: error.code,
      requestId,
    });
    return;
  }

  // Fastify errors with statusCode
  if (error.statusCode && error.statusCode < 500) {
    request.log.warn({ err: error, requestId }, error.message);
    // FastifyError may have code property
    const code = (error as FastifyError & { code?: string }).code || 'CLIENT_ERROR';
    reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
      code,
      requestId,
    });
    return;
  }

  // Unknown / internal errors - do not leak details
  request.log.error({ err: error, requestId }, 'Internal error');
  reply.status(500).send({
    error: 'Internal Server Error',
    message: isProduction ? 'An unexpected error occurred' : error.message,
    code: 'INTERNAL_ERROR',
    requestId,
  });
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  reply.status(404).send({
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`,
    code: 'NOT_FOUND',
    requestId: request.requestId || request.id,
  });
}
