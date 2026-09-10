import { InvestigationStatus, CaseSeverity, CasePriority } from '@prisma/client';
import { prisma } from '../../lib/db';
import { createAuditLog } from '../../lib/audit';
import { SecurityError } from '@monara-sentinel/security';
import type { CreateInvestigationInput, UpdateInvestigationInput } from './investigations.schema';

async function verifyCaseAccess(caseId: string, organizationId: string) {
  const found = await prisma.case.findFirst({
    where: { id: caseId, organization_id: organizationId, deleted_at: null },
  });
  if (!found) throw new SecurityError('Case not found', 'NOT_FOUND');
  return found;
}

export async function createInvestigation(
  caseId: string,
  organizationId: string,
  createdBy: string,
  input: CreateInvestigationInput,
  ipAddress?: string,
  userAgent?: string
) {
  await verifyCaseAccess(caseId, organizationId);

  if (input.assigned_to) {
    const membership = await prisma.membership.findFirst({
      where: { user_id: input.assigned_to, organization_id: organizationId },
    });
    if (!membership) throw new SecurityError('Assigned user not in organization', 'INVALID_ASSIGNEE');
  }

  const created = await prisma.investigation.create({
    data: {
      case_id: caseId,
      name: input.name,
      description: input.description || null,
      status: (input.status as unknown as InvestigationStatus) || 'ACTIVE',
      severity: (input.severity as unknown as CaseSeverity) || 'MEDIUM',
      priority: (input.priority as unknown as CasePriority) || 'MEDIUM',
      assigned_to: input.assigned_to || null,
      created_by: createdBy,
    },
  });

  await createAuditLog({
    organizationId,
    userId: createdBy,
    action: 'investigation.create',
    entityType: 'investigation',
    entityId: created.id,
    caseId,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  await prisma.timelineEvent.create({
    data: {
      case_id: caseId,
      event_type: 'INVESTIGATION_CREATED',
      title: `Investigation created: ${created.name}`,
      description: `Investigation ${created.id} created`,
      created_by: createdBy,
    },
  });

  return created;
}

export async function listInvestigations(caseId: string, organizationId: string) {
  await verifyCaseAccess(caseId, organizationId);
  return prisma.investigation.findMany({
    where: { case_id: caseId, deleted_at: null },
    orderBy: { created_at: 'desc' },
  });
}

export async function getInvestigation(investigationId: string, organizationId: string) {
  const found = await prisma.investigation.findFirst({
    where: { id: investigationId, deleted_at: null },
    include: { case: true },
  });
  if (!found || found.case.organization_id !== organizationId) throw new SecurityError('Investigation not found', 'NOT_FOUND');
  return found;
}

export async function updateInvestigation(
  investigationId: string,
  organizationId: string,
  updatedBy: string,
  input: UpdateInvestigationInput,
  ipAddress?: string,
  userAgent?: string
) {
  const existing = await prisma.investigation.findFirst({
    where: { id: investigationId, deleted_at: null },
    include: { case: true },
  });
  if (!existing || existing.case.organization_id !== organizationId) throw new SecurityError('Investigation not found', 'NOT_FOUND');

  if (input.assigned_to) {
    const membership = await prisma.membership.findFirst({
      where: { user_id: input.assigned_to, organization_id: organizationId },
    });
    if (!membership) throw new SecurityError('Assigned user not in organization', 'INVALID_ASSIGNEE');
  }

  const updated = await prisma.investigation.update({
    where: { id: investigationId },
    data: {
      name: input.name,
      description: input.description,
      status: input.status as unknown as InvestigationStatus,
      severity: input.severity as unknown as CaseSeverity,
      priority: input.priority as unknown as CasePriority,
      assigned_to: input.assigned_to,
      closed_at: input.status === 'COMPLETED' ? new Date() : undefined,
    },
  });

  await createAuditLog({
    organizationId,
    userId: updatedBy,
    action: 'investigation.update',
    entityType: 'investigation',
    entityId: investigationId,
    changes: input as Record<string, unknown>,
    caseId: existing.case_id,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  await prisma.timelineEvent.create({
    data: {
      case_id: existing.case_id,
      event_type: 'INVESTIGATION_UPDATED',
      title: `Investigation updated: ${updated.name}`,
      created_by: updatedBy,
    },
  });

  return updated;
}

export async function deleteInvestigation(investigationId: string, organizationId: string, _deletedBy: string) {
  const existing = await prisma.investigation.findFirst({
    where: { id: investigationId, deleted_at: null },
    include: { case: true },
  });
  if (!existing || existing.case.organization_id !== organizationId) throw new SecurityError('Investigation not found', 'NOT_FOUND');

  return prisma.investigation.update({
    where: { id: investigationId },
    data: { deleted_at: new Date() },
  });
}
