import { FastifyRequest, FastifyReply } from 'fastify';
import { createInvestigation, listInvestigations, getInvestigation, updateInvestigation, deleteInvestigation } from './investigations.service';
import { createInvestigationSchema, updateInvestigationSchema } from './investigations.schema';
import { SecurityError } from '@monara-sentinel/security';

function getUserAgent(request: FastifyRequest): string | undefined {
  const h = request.headers['user-agent'];
  return Array.isArray(h) ? h[0] : h;
}

export async function createInvestigationHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { caseId } = request.params as { caseId: string };
  const parsed = createInvestigationSchema.safeParse(request.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', code: 'VALIDATION_ERROR', details: parsed.error.errors, requestId: request.requestId || request.id });
  try {
    const created = await createInvestigation(caseId, user.organizationId, user.id, parsed.data, request.ip, getUserAgent(request));
    return reply.status(201).send(created);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(e.code === 'NOT_FOUND' ? 404 : 400).send({ error: e.name, message: e.message, code: e.code, requestId: request.requestId || request.id });
    throw e;
  }
}

export async function listInvestigationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { caseId } = request.params as { caseId: string };
  try {
    const items = await listInvestigations(caseId, user.organizationId);
    return reply.send({ items });
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(404).send({ error: 'Not Found', message: e.message, code: e.code });
    throw e;
  }
}

export async function getInvestigationHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id } = request.params as { id: string };
  try {
    const found = await getInvestigation(id, user.organizationId);
    return reply.send(found);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(404).send({ error: 'Not Found', code: e.code });
    throw e;
  }
}

export async function updateInvestigationHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id } = request.params as { id: string };
  const parsed = updateInvestigationSchema.safeParse(request.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', code: 'VALIDATION_ERROR', details: parsed.error.errors });
  try {
    const updated = await updateInvestigation(id, user.organizationId, user.id, parsed.data, request.ip, getUserAgent(request));
    return reply.send(updated);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(e.code === 'NOT_FOUND' ? 404 : 400).send({ error: e.name, message: e.message, code: e.code });
    throw e;
  }
}

export async function deleteInvestigationHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id } = request.params as { id: string };
  try {
    await deleteInvestigation(id, user.organizationId, user.id);
    return reply.status(204).send();
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(404).send({ error: 'Not Found', code: e.code });
    throw e;
  }
}
