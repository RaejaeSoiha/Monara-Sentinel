import { FastifyRequest, FastifyReply } from 'fastify';
import { createTimelineEvent, listTimelineEvents, getTimelineEvent } from './timeline.service';
import { createTimelineEventSchema } from './timeline.schema';
import { SecurityError } from '@monara-sentinel/security';

function ua(req: FastifyRequest) {
  const h = req.headers['user-agent'];
  return Array.isArray(h) ? h[0] : h;
}

export async function createTimelineEventHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { caseId } = req.params as { caseId: string };
  const parsed = createTimelineEventSchema.safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Validation Error', code: 'VALIDATION_ERROR', details: parsed.error.errors, requestId: req.requestId || req.id });
  try {
    const created = await createTimelineEvent(caseId, user.organizationId, user.id, parsed.data, req.ip, ua(req));
    return reply.status(201).send(created);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(e.code === 'NOT_FOUND' ? 404 : 400).send({ error: e.name, message: e.message, code: e.code });
    throw e;
  }
}

export async function listTimelineEventsHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { caseId } = req.params as { caseId: string };
  const { event_type } = req.query as { event_type?: string };
  try {
    const items = await listTimelineEvents(caseId, user.organizationId, event_type);
    return reply.send({ items });
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(404).send({ error: 'Not Found', code: e.code });
    throw e;
  }
}

export async function getTimelineEventHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  const { id } = req.params as { id: string };
  try {
    const found = await getTimelineEvent(id, user.organizationId);
    return reply.send(found);
  } catch (e) {
    if (e instanceof SecurityError) return reply.status(404).send({ error: 'Not Found', code: e.code });
    throw e;
  }
}
