import { Prisma, EntityType } from '@prisma/client';
import { prisma } from '../../lib/db';
import { createAuditLog } from '../../lib/audit';
import { SecurityError } from '@monara-sentinel/security';
import type { CreateEntityInput, UpdateEntityInput } from './entities.schema';

async function verifyCase(caseId: string, organizationId: string) {
  const c = await prisma.case.findFirst({ where: { id: caseId, organization_id: organizationId, deleted_at: null } });
  if (!c) throw new SecurityError('Case not found', 'NOT_FOUND');
  return c;
}

export async function createEntity(caseId: string, organizationId: string, createdBy: string, input: CreateEntityInput, ip?: string, ua?: string) {
  await verifyCase(caseId, organizationId);
  const created = await prisma.entity.create({
    data: {
      case_id: caseId,
      type: input.type as unknown as EntityType,
      value: input.value,
      display_name: input.display_name || null,
      metadata: input.metadata ? (input.metadata as unknown as Prisma.InputJsonValue) : undefined,
      created_by: createdBy,
    },
  });
  await createAuditLog({ organizationId, userId: createdBy, action: 'entity.create', entityType: 'entity', entityId: created.id, caseId, ipAddress: ip || null, userAgent: ua || null });
  await prisma.timelineEvent.create({
    data: { case_id: caseId, entity_id: created.id, event_type: 'ENTITY_ADDED', title: `Entity added: ${created.value}`, description: `${created.type} ${created.value}`, created_by: createdBy },
  });
  return created;
}

export async function listEntities(caseId: string, organizationId: string, type?: string) {
  await verifyCase(caseId, organizationId);
  const where: Record<string, unknown> = { case_id: caseId, deleted_at: null };
  if (type) where['type'] = type;
  return prisma.entity.findMany({ where: where as unknown as import('@prisma/client').Prisma.EntityWhereInput, orderBy: { created_at: 'desc' } });
}

export async function getEntity(entityId: string, organizationId: string) {
  const e = await prisma.entity.findFirst({ where: { id: entityId }, include: { case: true, evidence_links: { include: { evidence: true } } } });
  if (!e || e.case.organization_id !== organizationId || e.deleted_at) throw new SecurityError('Entity not found', 'NOT_FOUND');
  return e;
}

export async function updateEntity(entityId: string, organizationId: string, updatedBy: string, input: UpdateEntityInput, ip?: string, ua?: string) {
  const existing = await prisma.entity.findFirst({ where: { id: entityId }, include: { case: true } });
  if (!existing || existing.case.organization_id !== organizationId || existing.deleted_at) throw new SecurityError('Entity not found', 'NOT_FOUND');
  const updated = await prisma.entity.update({
    where: { id: entityId },
    data: { value: input.value, display_name: input.display_name, metadata: input.metadata as unknown as Prisma.InputJsonValue },
  });
  await createAuditLog({ organizationId, userId: updatedBy, action: 'entity.update', entityType: 'entity', entityId, changes: input as Record<string, unknown>, caseId: existing.case_id, ipAddress: ip || null, userAgent: ua || null });
  await prisma.timelineEvent.create({ data: { case_id: existing.case_id, entity_id: entityId, event_type: 'ENTITY_UPDATED', title: `Entity updated: ${updated.value}`, created_by: updatedBy } });
  return updated;
}

export async function deleteEntity(entityId: string, organizationId: string, _deletedBy: string) {
  const existing = await prisma.entity.findFirst({ where: { id: entityId }, include: { case: true } });
  if (!existing || existing.case.organization_id !== organizationId) throw new SecurityError('Entity not found', 'NOT_FOUND');
  return prisma.entity.update({ where: { id: entityId }, data: { deleted_at: new Date() } });
}
