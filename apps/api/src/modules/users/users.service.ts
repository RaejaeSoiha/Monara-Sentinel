import { prisma } from '../../lib/db';
import { hashPassword } from '@monara-sentinel/security';
import { createAuditLog, AuditActions } from '../../lib/audit';

export async function listUsersHandler(_userId: string, organizationId: string) {
  // Get all users in the organization
  const memberships = await prisma.membership.findMany({
    where: { organization_id: organizationId },
    include: {
      user: true,
      role: true,
    },
  });

  return memberships.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role.name.toLowerCase(),
    status: 'active',
    joined: m.user.created_at.toISOString().split('T')[0],
  }));
}

export async function getUserMembership(userId: string, organizationId: string) {
  return await prisma.membership.findFirst({
    where: {
      user_id: userId,
      organization_id: organizationId,
    },
    include: {
      role: true,
    },
  });
}

export async function inviteUserHandler(data: any, inviterId: string, organizationId: string) {
  const { name, email, password, role } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      name,
    },
  });

  // Get role
  const targetRole = await prisma.role.findFirst({
    where: { name: role.toUpperCase() },
  });
  if (!targetRole) {
    throw new Error('Role not found');
  }

  // Create membership
  await prisma.membership.create({
    data: {
      user_id: user.id,
      organization_id: organizationId,
      role_id: targetRole.id,
    },
  });

  await createAuditLog({
    organizationId,
    userId: inviterId,
    action: AuditActions.MEMBER_ADD,
    entityType: 'user',
    entityId: user.id,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: targetRole.name.toLowerCase(),
    status: 'pending',
    joined: user.created_at.toISOString().split('T')[0],
  };
}

export async function updateUserRoleHandler(userId: string, newRole: string, requesterId: string, organizationId: string) {
  // Verify user is member of this organization
  const membership = await prisma.membership.findFirst({
    where: {
      user_id: userId,
      organization_id: organizationId,
    },
    include: {
      role: true,
    },
  });

  if (!membership) {
    throw new Error('User not found in this organization');
  }

  // Get target role
  const targetRole = await prisma.role.findFirst({
    where: { name: newRole.toUpperCase() },
  });
  if (!targetRole) {
    throw new Error('Role not found');
  }

  // Update membership role
  await prisma.membership.update({
    where: { id: membership.id },
    data: { role_id: targetRole.id },
  });

  await createAuditLog({
    organizationId,
    userId: requesterId,
    action: AuditActions.MEMBER_ADD, // Using this for role changes
    entityType: 'user',
    entityId: userId,
  });

  return {
    id: userId,
    role: targetRole.name.toLowerCase(),
  };
}

export async function deleteUserHandler(userId: string, requesterId: string, organizationId: string) {
  // Verify user is member of this organization
  const membership = await prisma.membership.findFirst({
    where: {
      user_id: userId,
      organization_id: organizationId,
    },
  });

  if (!membership) {
    throw new Error('User not found in this organization');
  }

  // Delete membership (soft delete user if this is their only org)
  await prisma.membership.delete({
    where: { id: membership.id },
  });

  // Check if user has any other memberships
  const otherMemberships = await prisma.membership.findMany({
    where: { user_id: userId },
  });

  if (otherMemberships.length === 0) {
    // Soft delete user
    await prisma.user.update({
      where: { id: userId },
      data: { deleted_at: new Date() },
    });
  }

  await createAuditLog({
    organizationId,
    userId: requesterId,
    action: AuditActions.MEMBER_ADD, // Using this for deletion
    entityType: 'user',
    entityId: userId,
  });
}
