import { TimelineEventType } from '@prisma/client';
import { prisma } from '../../lib/db';
import { createAuditLog } from '../../lib/audit';
import { SecurityError } from '@monara-sentinel/security';
import type { CreateTimelineEventInput } from './timeline.schema';

export async function createTimelineEvent(caseId: string, organizationId: string, createdBy: string, input: CreateTimelineEventInput, ip?: string, ua?: string) {
  const c = await prisma.case.findFirst({ where: { id: caseId, organization_id: organizationId, deleted_at: null } });
  if (!c) throw new SecurityError('Case not found', 'NOT_FOUND');

  if (input.entity_id) {
    const e = await prisma.entity.findFirst({ where: { id: input.entity_id }, include: { case: true } });
    if (!e || e.case.organization_id !== organizationId) throw new SecurityError('Entity not found', 'NOT_FOUND');
    if (e.case_id !== caseId) throw new SecurityError('Entity must belong to the same case', 'INVALID_CASE');
  }
  if (input.evidence_id) {
    const ev = await prisma.evidence.findFirst({ where: { id: input.evidence_id }, include: { case: true } });
    if (!ev || ev.case.organization_id !== organizationId) throw new SecurityError('Evidence not found', 'NOT_FOUND');
    if (ev.case_id !== caseId) throw new SecurityError('Evidence must belong to the same case', 'INVALID_CASE');
  }

  const created = await prisma.timelineEvent.create({
    data: {
      case_id: caseId,
      entity_id: input.entity_id || null,
      evidence_id: input.evidence_id || null,
      event_type: input.event_type as unknown as TimelineEventType,
      title: input.title,
      description: input.description || null,
      occurred_at: input.occurred_at ? new Date(input.occurred_at) : new Date(),
      created_by: createdBy,
    },
  });

  await createAuditLog({ organizationId, userId: createdBy, action: 'timeline.create', entityType: 'timeline', entityId: created.id, caseId, ipAddress: ip || null, userAgent: ua || null });
  return created;
}

export async function listTimelineEvents(caseId: string, organizationId: string, event_type?: string) {
  const c = await prisma.case.findFirst({ where: { id: caseId, organization_id: organizationId, deleted_at: null } });
  if (!c) throw new SecurityError('Case not found', 'NOT_FOUND');
  const where: Record<string, unknown> = { case_id: caseId };
  if (event_type) where['event_type'] = event_type;
  return prisma.timelineEvent.findMany({
    where: where as unknown as import('@prisma/client').Prisma.TimelineEventWhereInput,
    orderBy: { occurred_at: 'desc' },
    include: { creator: { select: { id: true, email: true, name: true } }, entity: true, evidence: true },
  });
}

export async function getTimelineEvent(id: string, organizationId: string) {
  const e = await prisma.timelineEvent.findFirst({ where: { id }, include: { case: true } });
  if (!e || e.case.organization_id !== organizationId) throw new SecurityError('Timeline event not found', 'NOT_FOUND');
  return e;
}
