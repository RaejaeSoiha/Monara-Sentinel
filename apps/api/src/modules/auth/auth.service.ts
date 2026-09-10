// Auth service - business logic, separated from routes
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/db';
import { config } from '@monara-sentinel/config';
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyToken,
  hashToken,
  SecurityError,
} from '@monara-sentinel/security';
import { createAuditLog, AuditActions } from '../../lib/audit';
import type { RegisterInput, LoginInput } from './auth.schema';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export class AuthService {
  async register(input: RegisterInput, ipAddress?: string, userAgent?: string) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new SecurityError('Email already registered', 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(input.password);

    // Transaction: create user, organization, membership
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          password_hash: passwordHash,
          name: input.name || null,
        },
      });

      // Create or find organization
      let organization;
      if (input.organizationSlug) {
        // Check slug unique
        const existingOrg = await tx.organization.findUnique({
          where: { slug: input.organizationSlug },
        });
        if (existingOrg) throw new SecurityError('Organization slug taken', 'SLUG_EXISTS');

        organization = await tx.organization.create({
          data: {
            name: input.organizationName || input.email.split('@')[0] || 'My Organization',
            slug: input.organizationSlug,
          },
        });
      } else {
        const baseName = input.organizationName || `${input.name || input.email.split('@')[0]}'s Organization`;
        let slug = slugify(baseName);
        // Ensure unique
        let attempts = 0;
        while (await tx.organization.findUnique({ where: { slug } })) {
          attempts++;
          slug = `${slugify(baseName)}-${attempts}-${Date.now().toString(36).slice(-4)}`;
        }

        organization = await tx.organization.create({
          data: {
            name: baseName,
            slug,
          },
        });
      }

      // Get OWNER role
      const ownerRole = await tx.role.findUnique({ where: { name: 'OWNER' } });
      if (!ownerRole) throw new Error('OWNER role not seeded');

      await tx.membership.create({
        data: {
          user_id: user.id,
          organization_id: organization.id,
          role_id: ownerRole.id,
        },
      });

      return { user, organization };
    });

    // Generate tokens
    const payload = {
      userId: result.user.id,
      organizationId: result.organization.id,
      email: result.user.email,
    };

    const tokens = generateTokenPair(
      payload,
      config.jwt.secret,
      config.jwt.expiresIn,
      config.jwt.refreshExpiresIn
    );

    // Store refresh session
    const refreshHash = hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d

    await prisma.session.create({
      data: {
        user_id: result.user.id,
        token_hash: refreshHash,
        expires_at: expiresAt,
      },
    });

    await createAuditLog({
      organizationId: result.organization.id,
      userId: result.user.id,
      action: AuditActions.USER_REGISTER,
      entityType: 'user',
      entityId: result.user.id,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
      tokens,
    };
  }

  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || user.deleted_at) {
      await this.auditFailedLogin(input.email, ipAddress, userAgent);
      throw new SecurityError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const valid = await verifyPassword(user.password_hash, input.password);
    if (!valid) {
      await this.auditFailedLogin(input.email, ipAddress, userAgent);
      throw new SecurityError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Get primary membership (first org)
    const membership = await prisma.membership.findFirst({
      where: { user_id: user.id },
      include: { organization: true },
    });

    if (!membership) {
      throw new SecurityError('No organization membership', 'NO_MEMBERSHIP');
    }

    const payload = {
      userId: user.id,
      organizationId: membership.organization_id,
      email: user.email,
    };

    const tokens = generateTokenPair(
      payload,
      config.jwt.secret,
      config.jwt.expiresIn,
      config.jwt.refreshExpiresIn
    );

    const refreshHash = hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        user_id: user.id,
        token_hash: refreshHash,
        expires_at: expiresAt,
      },
    });

    await createAuditLog({
      organizationId: membership.organization_id,
      userId: user.id,
      action: AuditActions.USER_LOGIN,
      entityType: 'user',
      entityId: user.id,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
      },
      tokens,
    };
  }

  private async auditFailedLogin(email: string, ipAddress?: string, userAgent?: string) {
    // Find org for audit? Use placeholder org id for failed login without user
    // We audit to a dummy org or skip - but we should try to find user org if exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const membership = await prisma.membership.findFirst({ where: { user_id: user.id } });
      if (membership) {
        await createAuditLog({
          organizationId: membership.organization_id,
          userId: user.id,
          action: AuditActions.USER_LOGIN_FAILED,
          entityType: 'user',
          entityId: user.id,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        });
      }
    }
  }

  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string) {
    let payload;
    try {
      payload = verifyToken(refreshToken, config.jwt.secret);
    } catch (_e) {
      throw new SecurityError('Invalid refresh token', 'INVALID_TOKEN');
    }

    const tokenHash = hashToken(refreshToken);
    const session = await prisma.session.findUnique({ where: { token_hash: tokenHash } });

    if (!session || session.expires_at < new Date()) {
      throw new SecurityError('Refresh token expired or revoked', 'TOKEN_EXPIRED');
    }

    // Rotate: delete old session, create new
    await prisma.session.delete({ where: { token_hash: tokenHash } });

    const membership = await prisma.membership.findFirst({
      where: { user_id: payload.userId, organization_id: payload.organizationId },
    });

    if (!membership) {
      throw new SecurityError('Membership not found', 'NO_MEMBERSHIP');
    }

    const newPayload = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      email: payload.email,
    };

    const tokens = generateTokenPair(
      newPayload,
      config.jwt.secret,
      config.jwt.expiresIn,
      config.jwt.refreshExpiresIn
    );

    const newHash = hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        user_id: payload.userId,
        token_hash: newHash,
        expires_at: expiresAt,
      },
    });

    await createAuditLog({
      organizationId: payload.organizationId,
      userId: payload.userId,
      action: AuditActions.TOKEN_REFRESH,
      entityType: 'session',
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return tokens;
  }

  async logout(refreshToken: string, userId: string, organizationId: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = hashToken(refreshToken);
    await prisma.session.deleteMany({ where: { token_hash: tokenHash, user_id: userId } });

    await createAuditLog({
      organizationId,
      userId,
      action: AuditActions.USER_LOGOUT,
      entityType: 'session',
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    if (!user || user.deleted_at) {
      throw new SecurityError('User not found', 'USER_NOT_FOUND');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
      memberships: user.memberships.map((m: (typeof user.memberships)[number]) => ({
        organization: {
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          description: m.organization.description,
        },
        role: {
          id: m.role.id,
          name: m.role.name,
          description: m.role.description,
        },
      })),
    };
  }
}

export const authService = new AuthService();
