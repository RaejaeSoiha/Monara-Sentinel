// Audit logging for Monara Sentinel - evidence-first
// All privileged actions must be audited per SECURITY_PLAN.md:9

import { prisma } from './db';
import { logger } from './logger';

export interface AuditParams {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  caseId?: string | null;
}

import { Prisma } from '@prisma/client';

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organization_id: params.organizationId,
        user_id: params.userId || null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        changes: (params.changes as unknown as Prisma.InputJsonValue) || undefined,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        case_id: params.caseId || null,
      },
    });
  } catch (error) {
    // Audit failure should not break main flow, but must be logged
    logger.error({ error, params }, 'Failed to create audit log');
  }
}

export const AuditActions = {
  USER_REGISTER: 'user.register',
  USER_LOGIN: 'user.login',
  USER_LOGIN_FAILED: 'user.login_failed',
  USER_LOGOUT: 'user.logout',
  TOKEN_REFRESH: 'user.token_refresh',
  ORG_CREATE: 'organization.create',
  MEMBER_ADD: 'organization.member_add',
  CASE_CREATE: 'case.create',
  CASE_UPDATE: 'case.update',
  CASE_DELETE: 'case.delete',
} as const;
