// Auth controller - thin handlers, delegate to service
import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';
import { SecurityError } from '@monara-sentinel/security';

function getUserAgent(request: FastifyRequest): string | undefined {
  const h = request.headers['user-agent'];
  return Array.isArray(h) ? h[0] : h;
}

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid input',
      code: 'VALIDATION_ERROR',
      details: parsed.error.errors,
      requestId: request.requestId || request.id,
    });
  }

  try {
    const result = await authService.register(parsed.data, request.ip, getUserAgent(request));

    return reply.status(201).send({
      user: result.user,
      organization: result.organization,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  } catch (error) {
    if (error instanceof SecurityError) {
      const status = error.code === 'EMAIL_EXISTS' || error.code === 'SLUG_EXISTS' ? 409 : 400;
      return reply.status(status).send({
        error: error.name,
        message: error.message,
        code: error.code,
        requestId: request.requestId || request.id,
      });
    }
    throw error;
  }
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: parsed.error.errors,
      requestId: request.requestId || request.id,
    });
  }

  try {
    const result = await authService.login(parsed.data, request.ip, getUserAgent(request));

    return reply.send({
      user: result.user,
      organization: result.organization,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  } catch (error) {
    if (error instanceof SecurityError) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: error.message,
        code: error.code,
        requestId: request.requestId || request.id,
      });
    }
    throw error;
  }
}

export async function refreshHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = refreshSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: parsed.error.errors,
      requestId: request.requestId || request.id,
    });
  }

  try {
    const tokens = await authService.refresh(parsed.data.refreshToken, request.ip, getUserAgent(request));

    return reply.send({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    if (error instanceof SecurityError) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: error.message,
        code: error.code,
        requestId: request.requestId || request.id,
      });
    }
    throw error;
  }
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const body = request.body as { refreshToken?: string } | undefined;
  const refreshToken = body?.refreshToken;

  if (!refreshToken) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'refreshToken required',
      code: 'VALIDATION_ERROR',
    });
  }

  await authService.logout(refreshToken, user.id, user.organizationId, request.ip, getUserAgent(request));

  return reply.send({ message: 'Logged out' });
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const profile = await authService.getProfile(user.id);
  return reply.send(profile);
}
