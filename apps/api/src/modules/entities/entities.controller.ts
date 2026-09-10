import { FastifyRequest, FastifyReply } from 'fastify';
import { createEntity, listEntities, getEntity, updateEntity, deleteEntity } from './entities.service';
import { createEntitySchema, updateEntitySchema } from './entities.schema';
import { SecurityError } from '@monara-sentinel/security';

function ua(req: FastifyRequest) {
  const h = req.headers['user-agent'];
  return Array.isArray(h) ? h[0] : h;
}

export async function createEntityHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { caseId } = req.params as { caseId: string };
  const parsed = createEntitySchema.safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', code: 'VALIDATION_ERROR', details: parsed.error.errors, requestId: req.requestId || req.id });
  try {
    const created = await createEntity(caseId, user.organizationId, user.id, parsed.data, req.ip, ua(req));
    return reply.status(201).send(created);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(e.code === 'NOT_FOUND' ? 404 : 400).send({ error: e.name, message: e.message, code: e.code });
    throw e;
  }
}

export async function listEntitiesHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { caseId } = req.params as { caseId: string };
  const { type } = req.query as { type?: string };
  try {
    const items = await listEntities(caseId, user.organizationId, type);
    return reply.send({ items });
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(404).send({ error: 'Not Found', code: e.code });
    throw e;
  }
}

export async function getEntityHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id } = req.params as { id: string };
  try {
    const found = await getEntity(id, user.organizationId);
    return reply.send(found);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(404).send({ error: 'Not Found', code: e.code });
    throw e;
  }
}

export async function updateEntityHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id } = req.params as { id: string };
  const parsed = updateEntitySchema.safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', code: 'VALIDATION_ERROR', details: parsed.error.errors });
  try {
    const updated = await updateEntity(id, user.organizationId, user.id, parsed.data, req.ip, ua(req));
    return reply.send(updated);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(e.code === 'NOT_FOUND' ? 404 : 400).send({ error: e.name, message: e.message, code: e.code });
    throw e;
  }
}

export async function deleteEntityHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id } = req.params as { id: string };
  try {
    await deleteEntity(id, user.organizationId, user.id);
    return reply.status(204).send();
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(404).send({ error: 'Not Found', code: e.code });
    throw e;
  }
}
