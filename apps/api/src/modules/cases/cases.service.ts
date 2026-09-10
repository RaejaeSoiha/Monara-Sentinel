import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/db';
import { createAuditLog, AuditActions } from '../../lib/audit';
import type { CreateCaseInput, UpdateCaseInput, CaseQuery } from './cases.schema';
import { SecurityError } from '@monara-sentinel/security';

function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CASE-${year}-${random}`;
}

export async function createCase(
  organizationId: string,
  createdBy: string,
  input: CreateCaseInput,
  ipAddress?: string,
  userAgent?: string
) {
  // Validate assigned user is in org if provided
  if (input.assigned_to) {
    const membership = await prisma.membership.findFirst({
      where: { user_id: input.assigned_to, organization_id: organizationId },
    });
    if (!membership) {
      throw new SecurityError('Assigned user not in organization', 'INVALID_ASSIGNEE');
    }
  }

  // Generate unique case_number
  let caseNumber = generateCaseNumber();
  let attempts = 0;
  while (
    await prisma.case.findUnique({
      where: { organization_id_case_number: { organization_id: organizationId, case_number: caseNumber } },
    })
  ) {
    attempts++;
    if (attempts > 5) throw new Error('Failed to generate unique case number');
    caseNumber = generateCaseNumber();
  }

  const created = await prisma.case.create({
    data: {
      organization_id: organizationId,
      case_number: caseNumber,
      name: input.name,
      description: input.description || null,
      status: input.status || 'OPEN',
      severity: input.severity || 'MEDIUM',
      priority: input.priority || 'MEDIUM',
      tags: input.tags || [],
      assigned_to: input.assigned_to || null,
      created_by: createdBy,
    },
  });

  await createAuditLog({
    organizationId,
    userId: createdBy,
    action: AuditActions.CASE_CREATE,
    entityType: 'case',
    entityId: created.id,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  // Timeline
  await prisma.timelineEvent.create({
    data: {
      case_id: created.id,
      event_type: 'CASE_CREATED',
      title: `Case created: ${created.name}`,
      description: `Case ${caseNumber} created`,
      created_by: createdBy,
    },
  });

  return created;
}

export async function listCases(organizationId: string, query: CaseQuery) {
  const where: Record<string, unknown> = {
    organization_id: organizationId,
    deleted_at: null,
  };

  if (query.status) where['status'] = query.status;
  if (query.severity) where['severity'] = query.severity;
  if (query.priority) where['priority'] = query.priority;
  if (query.assigned_to) where['assigned_to'] = query.assigned_to;
  if (query.search) {
    where['OR'] = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { case_number: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.case.findMany({
      where: where as unknown as Prisma.CaseWhereInput,
      orderBy: { created_at: 'desc' },
      skip,
      take: query.limit,
      include: { creator: { select: { id: true, email: true, name: true } }, assignee: { select: { id: true, email: true, name: true } } },
    }),
    prisma.case.count({ where: where as unknown as Prisma.CaseWhereInput }),
  ]);

  return { items, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
}

export async function getCaseById(caseId: string, organizationId: string) {
  const found = await prisma.case.findFirst({
    where: { id: caseId, organization_id: organizationId, deleted_at: null },
    include: { creator: { select: { id: true, email: true, name: true } }, assignee: { select: { id: true, email: true, name: true } } },
  });
  return found;
}

export async function updateCase(
  caseId: string,
  organizationId: string,
  updatedBy: string,
  input: UpdateCaseInput,
  ipAddress?: string,
  userAgent?: string
) {
  const existing = await prisma.case.findFirst({
    where: { id: caseId, organization_id: organizationId, deleted_at: null },
  });
  if (!existing) throw new SecurityError('Case not found', 'NOT_FOUND');

  if (input.assigned_to) {
    const membership = await prisma.membership.findFirst({
      where: { user_id: input.assigned_to, organization_id: organizationId },
    });
    if (!membership) throw new SecurityError('Assigned user not in organization', 'INVALID_ASSIGNEE');
  }

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: {
      name: input.name,
      description: input.description,
      status: input.status as unknown as Prisma.CaseUpdateInput['status'],
      severity: input.severity as unknown as Prisma.CaseUpdateInput['severity'],
      priority: input.priority as unknown as Prisma.CaseUpdateInput['priority'],
      tags: input.tags,
      assigned_to: input.assigned_to,
      closed_at: input.status === 'CLOSED' ? new Date() : undefined,
    },
  });

  await createAuditLog({
    organizationId,
    userId: updatedBy,
    action: AuditActions.CASE_UPDATE,
    entityType: 'case',
    entityId: caseId,
    changes: input as Record<string, unknown>,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  await prisma.timelineEvent.create({
    data: {
      case_id: caseId,
      event_type: input.status ? 'CASE_STATUS_CHANGED' : 'CASE_UPDATED',
      title: `Case updated: ${updated.name}`,
      description: input.status ? `Status changed to ${input.status}` : `Case updated`,
      created_by: updatedBy,
    },
  });

  return updated;
}

export async function deleteCase(caseId: string, organizationId: string, deletedBy: string, ipAddress?: string, userAgent?: string) {
  const existing = await prisma.case.findFirst({
    where: { id: caseId, organization_id: organizationId, deleted_at: null },
  });
  if (!existing) throw new SecurityError('Case not found', 'NOT_FOUND');

  const deleted = await prisma.case.update({
    where: { id: caseId },
    data: { deleted_at: new Date() },
  });

  await createAuditLog({
    organizationId,
    userId: deletedBy,
    action: AuditActions.CASE_DELETE,
    entityType: 'case',
    entityId: caseId,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  await prisma.timelineEvent.create({
    data: {
      case_id: caseId,
      event_type: 'STATUS_CHANGED',
      title: `Case archived: ${existing.name}`,
      description: `Case ${existing.case_number} soft deleted`,
      created_by: deletedBy,
    },
  });

  return deleted;
}
