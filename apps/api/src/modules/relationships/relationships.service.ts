import { RelationshipType, RelationshipStatus } from '@prisma/client';
import { prisma } from '../../lib/db';
import { createAuditLog } from '../../lib/audit';
import { SecurityError } from '@monara-sentinel/security';
import type { CreateRelationshipInput, UpdateRelationshipInput } from './relationships.schema';

async function verifyEntities(sourceId: string, targetId: string, organizationId: string, caseId: string) {
  const [source, target] = await Promise.all([
    prisma.entity.findFirst({ where: { id: sourceId }, include: { case: true } }),
    prisma.entity.findFirst({ where: { id: targetId }, include: { case: true } }),
  ]);
  if (!source || source.case.organization_id !== organizationId || source.case_id !== caseId) throw new SecurityError('Source entity not found or not in case', 'NOT_FOUND');
  if (!target || target.case.organization_id !== organizationId || target.case_id !== caseId) throw new SecurityError('Target entity not found or not in case', 'NOT_FOUND');
  if (source.deleted_at || target.deleted_at) throw new SecurityError('Entity deleted', 'NOT_FOUND');
  return { source, target };
}

export async function createRelationship(caseId: string, organizationId: string, createdBy: string, input: CreateRelationshipInput, ip?: string, ua?: string) {
  const caseExists = await prisma.case.findFirst({ where: { id: caseId, organization_id: organizationId, deleted_at: null } });
  if (!caseExists) throw new SecurityError('Case not found', 'NOT_FOUND');
  await verifyEntities(input.source_entity_id, input.target_entity_id, organizationId, caseId);

  if (input.evidence_id) {
    const ev = await prisma.evidence.findFirst({ where: { id: input.evidence_id }, include: { case: true } });
    if (!ev || ev.case.organization_id !== organizationId) throw new SecurityError('Evidence not found', 'NOT_FOUND');
    if (ev.case_id !== caseId) throw new SecurityError('Evidence not in case', 'INVALID_EVIDENCE');
  }

  const created = await prisma.relationship.create({
    data: {
      case_id: caseId,
      source_entity_id: input.source_entity_id,
      target_entity_id: input.target_entity_id,
      type: input.type as unknown as RelationshipType,
      confidence: input.confidence ?? 50,
      status: (input.status as unknown as RelationshipStatus) || 'ACTIVE',
      evidence_id: input.evidence_id || null,
      source_url: input.source_url || null,
      explanation: input.explanation || null,
      created_by: createdBy,
    },
  });

  await createAuditLog({ organizationId, userId: createdBy, action: 'relationship.create', entityType: 'relationship', entityId: created.id, caseId, ipAddress: ip || null, userAgent: ua || null });
  await prisma.timelineEvent.create({
    data: { case_id: caseId, event_type: 'RELATIONSHIP_CREATED', title: `Relationship created: ${input.type}`, description: input.explanation || `${input.source_entity_id} -> ${input.target_entity_id}`, created_by: createdBy },
  });
  return created;
}

export async function listRelationships(caseId: string, organizationId: string) {
  const c = await prisma.case.findFirst({ where: { id: caseId, organization_id: organizationId, deleted_at: null } });
  if (!c) throw new SecurityError('Case not found', 'NOT_FOUND');
  return prisma.relationship.findMany({ where: { case_id: caseId, deleted_at: null }, orderBy: { created_at: 'desc' }, include: { source_entity: true, target_entity: true } });
}

export async function getRelationship(id: string, organizationId: string) {
  const r = await prisma.relationship.findFirst({ where: { id }, include: { case: true, source_entity: true, target_entity: true } });
  if (!r || r.case.organization_id !== organizationId || r.deleted_at) throw new SecurityError('Relationship not found', 'NOT_FOUND');
  return r;
}

export async function updateRelationship(id: string, organizationId: string, updatedBy: string, input: UpdateRelationshipInput, ip?: string, ua?: string) {
  const existing = await prisma.relationship.findFirst({ where: { id }, include: { case: true } });
  if (!existing || existing.case.organization_id !== organizationId || existing.deleted_at) throw new SecurityError('Relationship not found', 'NOT_FOUND');
  const updated = await prisma.relationship.update({
    where: { id },
    data: {
      type: input.type as unknown as RelationshipType,
      confidence: input.confidence,
      status: input.status as unknown as RelationshipStatus,
      evidence_id: input.evidence_id,
      source_url: input.source_url,
      explanation: input.explanation,
    },
  });
  await createAuditLog({ organizationId, userId: updatedBy, action: 'relationship.update', entityType: 'relationship', entityId: id, changes: input as Record<string, unknown>, caseId: existing.case_id, ipAddress: ip || null, userAgent: ua || null });
  await prisma.timelineEvent.create({ data: { case_id: existing.case_id, event_type: 'RELATIONSHIP_UPDATED', title: `Relationship updated: ${updated.type}`, created_by: updatedBy } });
  return updated;
}

export async function deleteRelationship(id: string, organizationId: string) {
  const existing = await prisma.relationship.findFirst({ where: { id }, include: { case: true } });
  if (!existing || existing.case.organization_id !== organizationId) throw new SecurityError('Relationship not found', 'NOT_FOUND');
  return prisma.relationship.update({ where: { id }, data: { deleted_at: new Date() } });
}
