import { FastifyRequest, FastifyReply } from 'fastify';
import { createEvidence, listEvidence, getEvidence, updateEvidence, deleteEvidence, associateEntityWithEvidence, removeEntityFromEvidence } from './evidence.service';
import { createEvidenceSchema, updateEvidenceSchema, associateEntitySchema } from './evidence.schema';
import { SecurityError } from '@monara-sentinel/security';

function ua(req: FastifyRequest) {
  const h = req.headers['user-agent'];
  return Array.isArray(h) ? h[0] : h;
}

export async function createEvidenceHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { caseId } = req.params as { caseId: string };
  const parsed = createEvidenceSchema.safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', code: 'VALIDATION_ERROR', details: parsed.error.errors, requestId: req.requestId || req.id });
  try {
    const created = await createEvidence(caseId, user.organizationId, user.id, parsed.data, req.ip, ua(req));
    return reply.status(201).send(created);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(e.code === 'NOT_FOUND' ? 404 : 400).send({ error: e.name, message: e.message, code: e.code });
    throw e;
  }
}

export async function listEvidenceHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { caseId } = req.params as { caseId: string };
  const { verification_status } = req.query as { verification_status?: string };
  try {
    const items = await listEvidence(caseId, user.organizationId, verification_status);
    return reply.send({ items });
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(404).send({ error: 'Not Found', code: e.code });
    throw e;
  }
}

export async function getEvidenceHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id } = req.params as { id: string };
  try {
    const found = await getEvidence(id, user.organizationId);
    return reply.send(found);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(404).send({ error: 'Not Found', code: e.code });
    throw e;
  }
}

export async function updateEvidenceHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id } = req.params as { id: string };
  const parsed = updateEvidenceSchema.safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', code: 'VALIDATION_ERROR', details: parsed.error.errors });
  try {
    const updated = await updateEvidence(id, user.organizationId, user.id, parsed.data, req.ip, ua(req));
    return reply.send(updated);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(e.code === 'NOT_FOUND' ? 404 : 400).send({ error: e.name, message: e.message, code: e.code });
    throw e;
  }
}

export async function deleteEvidenceHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id } = req.params as { id: string };
  try {
    await deleteEvidence(id, user.organizationId);
    return reply.status(204).send();
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(404).send({ error: 'Not Found', code: e.code });
    throw e;
  }
}

export async function associateEntityHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id } = req.params as { id: string };
  const parsed = associateEntitySchema.safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', code: 'VALIDATION_ERROR', details: parsed.error.errors });
  try {
    const association = await associateEntityWithEvidence(id, parsed.data.entity_id, user.organizationId, user.id, req.ip, ua(req));
    return reply.status(201).send(association);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(e.code === 'NOT_FOUND' ? 404 : 400).send({ error: e.name, message: e.message, code: e.code });
    throw e;
  }
}

export async function removeEntityHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id, entityId } = req.params as { id: string; entityId: string };
  try {
    await removeEntityFromEvidence(id, entityId, user.organizationId, user.id, req.ip, ua(req));
    return reply.status(204).send();
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(e.code === 'NOT_FOUND' ? 404 : 400).send({ error: e.name, message: e.message, code: e.code });
    throw e;
  }
}
