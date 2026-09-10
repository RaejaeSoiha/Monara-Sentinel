import { FastifyRequest, FastifyReply } from 'fastify';
import { createCase, listCases, getCaseById, updateCase, deleteCase } from './cases.service';
import { createCaseSchema, updateCaseSchema, caseQuerySchema } from './cases.schema';
import { SecurityError } from '@monara-sentinel/security';

function getUserAgent(request: FastifyRequest): string | undefined {
  const h = request.headers['user-agent'];
  return Array.isArray(h) ? h[0] : h;
}

export async function createCaseHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });

  const parsed = createCaseSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: parsed.error.errors,
      requestId: request.requestId || request.id,
    });
  }

  try {
    const created = await createCase(user.organizationId, user.id, parsed.data, request.ip, getUserAgent(request));
    return reply.status(201).send(created);
  } catch (error) {
    if (error instanceof SecurityError) {
      return reply.status(400).send({ error: error.name, message: error.message, code: error.code, requestId: request.requestId || request.id });
    }
    throw error;
  }
}

export async function listCasesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });

  const parsed = caseQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Validation Error', code: 'VALIDATION_ERROR', details: parsed.error.errors, requestId: request.requestId || request.id });
  }

  const result = await listCases(user.organizationId, parsed.data);
  return reply.send(result);
}

export async function getCaseHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });

  const { id } = request.params as { id: string };
  const found = await getCaseById(id, user.organizationId);
  if (!found) {
    return reply.status(404).send({ error: 'Not Found', message: 'Case not found', code: 'NOT_FOUND', requestId: request.requestId || request.id });
  }
  return reply.send(found);
}

export async function updateCaseHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });

  const { id } = request.params as { id: string };
  const parsed = updateCaseSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Validation Error', code: 'VALIDATION_ERROR', details: parsed.error.errors, requestId: request.requestId || request.id });
  }

  try {
    const updated = await updateCase(id, user.organizationId, user.id, parsed.data, request.ip, getUserAgent(request));
    return reply.send(updated);
  } catch (error) {
    if (error instanceof SecurityError && error.code === 'NOT_FOUND') {
      return reply.status(404).send({ error: 'Not Found', message: 'Case not found', code: 'NOT_FOUND', requestId: request.requestId || request.id });
    }
    if (error instanceof SecurityError) {
      return reply.status(400).send({ error: error.name, message: error.message, code: error.code, requestId: request.requestId || request.id });
    }
    throw error;
  }
}

export async function deleteCaseHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });

  const { id } = request.params as { id: string };
  try {
    await deleteCase(id, user.organizationId, user.id, request.ip, getUserAgent(request));
    return reply.status(204).send();
  } catch (error) {
    if (error instanceof SecurityError && error.code === 'NOT_FOUND') {
      return reply.status(404).send({ error: 'Not Found', message: 'Case not found', code: 'NOT_FOUND', requestId: request.requestId || request.id });
    }
    throw error;
  }
}
