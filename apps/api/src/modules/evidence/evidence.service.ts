import { Prisma, EvidenceVerificationStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { prisma } from '../../lib/db';
import { createAuditLog } from '../../lib/audit';
import { SecurityError } from '@monara-sentinel/security';
import type { CreateEvidenceInput, UpdateEvidenceInput } from './evidence.schema';

function computeSha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

async function verifyCase(caseId: string, organizationId: string) {
  const c = await prisma.case.findFirst({ where: { id: caseId, organization_id: organizationId, deleted_at: null } });
  if (!c) throw new SecurityError('Case not found', 'NOT_FOUND');
  return c;
}

export async function createEvidence(caseId: string, organizationId: string, collectorId: string, input: CreateEvidenceInput, ip?: string, ua?: string) {
  await verifyCase(caseId, organizationId);

  // Compute sha256 if content provided and sha not given
  let sha256 = input.sha256 || null;
  if (!sha256 && input.content) {
    sha256 = computeSha256(input.content);
  }

  // Verify entity_ids belong to same case
  if (input.entity_ids && input.entity_ids.length > 0) {
    const entities = await prisma.entity.findMany({ where: { id: { in: input.entity_ids }, case_id: caseId } });
    if (entities.length !== input.entity_ids.length) throw new SecurityError('One or more entities not found in case', 'INVALID_ENTITY');
  }

  const created = await prisma.evidence.create({
    data: {
      case_id: caseId,
      source_url: input.source_url || null,
      source_type: input.source_type || null,
      source_title: input.source_title || null,
      observed_at: input.observed_at ? new Date(input.observed_at) : null,
      content: input.content || null,
      excerpt: input.excerpt || null,
      artifact_url: input.artifact_url || null,
      sha256,
      mime_type: input.mime_type || null,
      collection_method: input.collection_method || null,
      collector_id: collectorId,
      confidence: input.confidence ?? 50,
      verification_status: (input.verification_status as unknown as EvidenceVerificationStatus) || 'OBSERVED',
      provenance: input.provenance ? (input.provenance as unknown as Prisma.InputJsonValue) : undefined,
    },
  });

  // Link to entities
  if (input.entity_ids && input.entity_ids.length > 0) {
    await prisma.entityEvidence.createMany({
      data: input.entity_ids.map((eid) => ({ entity_id: eid, evidence_id: created.id })),
    });
  }

  await createAuditLog({ organizationId, userId: collectorId, action: 'evidence.create', entityType: 'evidence', entityId: created.id, caseId, ipAddress: ip || null, userAgent: ua || null });
  await prisma.timelineEvent.create({
    data: { case_id: caseId, evidence_id: created.id, event_type: 'EVIDENCE_COLLECTED', title: `Evidence collected: ${created.source_title || created.source_type || 'Unknown'}`, description: created.excerpt || `Evidence ${created.id} collected`, created_by: collectorId },
  });

  return created;
}

export async function listEvidence(caseId: string, organizationId: string, verification_status?: string) {
  await verifyCase(caseId, organizationId);
  const where: Record<string, unknown> = { case_id: caseId, deleted_at: null };
  if (verification_status) where['verification_status'] = verification_status;
  return prisma.evidence.findMany({
    where: where as unknown as import('@prisma/client').Prisma.EvidenceWhereInput,
    orderBy: { created_at: 'desc' },
    include: { entity_links: { include: { entity: true } } },
  });
}

export async function getEvidence(evidenceId: string, organizationId: string) {
  const e = await prisma.evidence.findFirst({ where: { id: evidenceId, deleted_at: null }, include: { case: true, entity_links: { include: { entity: true } } } });
  if (!e || e.case.organization_id !== organizationId) throw new SecurityError('Evidence not found', 'NOT_FOUND');
  return e;
}

export async function updateEvidence(evidenceId: string, organizationId: string, updatedBy: string, input: UpdateEvidenceInput, ip?: string, ua?: string) {
  const existing = await prisma.evidence.findFirst({ where: { id: evidenceId, deleted_at: null }, include: { case: true } });
  if (!existing || existing.case.organization_id !== organizationId) throw new SecurityError('Evidence not found', 'NOT_FOUND');

  // Evidence integrity: content and sha256 are immutable (not in update schema)
  // We only allow updating verification status, confidence, metadata, etc.

  const updated = await prisma.evidence.update({
    where: { id: evidenceId },
    data: {
      source_url: input.source_url,
      source_type: input.source_type,
      source_title: input.source_title,
      confidence: input.confidence,
      verification_status: input.verification_status as unknown as EvidenceVerificationStatus,
      excerpt: input.excerpt,
      provenance: input.provenance as unknown as Prisma.InputJsonValue,
    },
  });

  await createAuditLog({ organizationId, userId: updatedBy, action: 'evidence.update', entityType: 'evidence', entityId: evidenceId, changes: input as Record<string, unknown>, caseId: existing.case_id, ipAddress: ip || null, userAgent: ua || null });
  await prisma.timelineEvent.create({ data: { case_id: existing.case_id, evidence_id: evidenceId, event_type: 'EVIDENCE_VERIFIED', title: `Evidence updated: ${updated.verification_status}`, created_by: updatedBy } });
  return updated;
}

export async function deleteEvidence(evidenceId: string, organizationId: string) {
  const existing = await prisma.evidence.findFirst({ where: { id: evidenceId, deleted_at: null }, include: { case: true } });
  if (!existing || existing.case.organization_id !== organizationId) throw new SecurityError('Evidence not found', 'NOT_FOUND');
  return prisma.evidence.update({ where: { id: evidenceId }, data: { deleted_at: new Date() } });
}

export async function associateEntityWithEvidence(evidenceId: string, entityId: string, organizationId: string, userId: string, ip?: string, ua?: string) {
  // Verify evidence exists and belongs to organization
  const evidence = await prisma.evidence.findFirst({ where: { id: evidenceId, deleted_at: null }, include: { case: true } });
  if (!evidence || evidence.case.organization_id !== organizationId) throw new SecurityError('Evidence not found', 'NOT_FOUND');

  // Verify entity exists and belongs to same case
  const entity = await prisma.entity.findFirst({ where: { id: entityId, case_id: evidence.case_id, deleted_at: null } });
  if (!entity) throw new SecurityError('Entity not found in case', 'INVALID_ENTITY');

  // Check for existing association
  const existing = await prisma.entityEvidence.findFirst({ where: { evidence_id: evidenceId, entity_id: entityId } });
  if (existing) return existing; // Already associated

  // Create association
  const association = await prisma.entityEvidence.create({
    data: { evidence_id: evidenceId, entity_id: entityId },
    include: { entity: true, evidence: true },
  });

  await createAuditLog({ organizationId, userId, action: 'evidence.associate_entity', entityType: 'evidence', entityId: evidenceId, caseId: evidence.case_id, changes: { entity_id: entityId } as Record<string, unknown>, ipAddress: ip || null, userAgent: ua || null });
  await prisma.timelineEvent.create({
    data: { case_id: evidence.case_id, evidence_id: evidenceId, entity_id: entityId, event_type: 'EVIDENCE_ASSOCIATED', title: `Evidence associated with entity: ${entity.display_name || entity.value}`, created_by: userId },
  });

  return association;
}

export async function removeEntityFromEvidence(evidenceId: string, entityId: string, organizationId: string, userId: string, ip?: string, ua?: string) {
  // Verify evidence exists and belongs to organization
  const evidence = await prisma.evidence.findFirst({ where: { id: evidenceId, deleted_at: null }, include: { case: true } });
  if (!evidence || evidence.case.organization_id !== organizationId) throw new SecurityError('Evidence not found', 'NOT_FOUND');

  // Verify entity exists and belongs to same case
  const entity = await prisma.entity.findFirst({ where: { id: entityId, case_id: evidence.case_id, deleted_at: null } });
  if (!entity) throw new SecurityError('Entity not found in case', 'INVALID_ENTITY');

  // Delete association
  const deleted = await prisma.entityEvidence.deleteMany({ where: { evidence_id: evidenceId, entity_id: entityId } });
  if (deleted.count === 0) throw new SecurityError('Association not found', 'NOT_FOUND');

  await createAuditLog({ organizationId, userId, action: 'evidence.remove_entity', entityType: 'evidence', entityId: evidenceId, caseId: evidence.case_id, changes: { entity_id: entityId } as Record<string, unknown>, ipAddress: ip || null, userAgent: ua || null });
  await prisma.timelineEvent.create({
    data: { case_id: evidence.case_id, evidence_id: evidenceId, entity_id: entityId, event_type: 'EVIDENCE_DISSOCIATED', title: `Evidence dissociated from entity: ${entity.display_name || entity.value}`, created_by: userId },
  });
}
