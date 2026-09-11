// Organization service - minimal for Stage 4 tenant isolation
import { prisma } from '../../lib/db';
import { createAuditLog, AuditActions } from '../../lib/audit';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export async function getOrganizationById(organizationId: string, requestingUserId: string) {
  // Verify requesting user is member of this org (tenant isolation)
  const membership = await prisma.membership.findFirst({
    where: { user_id: requestingUserId, organization_id: organizationId },
  });

  if (!membership) {
    // Return null to trigger 404 (don't leak existence)
    return null;
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  return org;
}

export async function listUserOrganizations(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { user_id: userId },
    include: { organization: true, role: true },
  });

  return memberships.map((m: (typeof memberships)[number]) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    description: m.organization.description,
    role: m.role.name,
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

export async function createOrganization(data: { name: string; slug?: string; description?: string }, userId: string, currentOrganizationId: string) {
  const { name, slug, description } = data;

  // Generate slug if not provided
  let orgSlug = slug || slugify(name);
  let attempts = 0;
  while (await prisma.organization.findUnique({ where: { slug: orgSlug } })) {
    attempts++;
    orgSlug = `${slugify(name)}-${attempts}-${Date.now().toString(36).slice(-4)}`;
  }

  // Get OWNER role
  const ownerRole = await prisma.role.findUnique({ where: { name: 'OWNER' } });
  if (!ownerRole) throw new Error('OWNER role not seeded');

  const org = await prisma.organization.create({
    data: {
      name,
      slug: orgSlug,
      description,
    },
  });

  // Create membership for the creator
  await prisma.membership.create({
    data: {
      user_id: userId,
      organization_id: org.id,
      role_id: ownerRole.id,
    },
  });

  await createAuditLog({
    organizationId: currentOrganizationId,
    userId,
    action: AuditActions.ORG_CREATE,
    entityType: 'organization',
    entityId: org.id,
  });

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description,
  };
}

export async function updateOrganization(organizationId: string, data: { name?: string; description?: string }, userId: string, currentOrganizationId: string) {
  // Verify user is member of this organization
  const membership = await prisma.membership.findFirst({
    where: {
      user_id: userId,
      organization_id: organizationId,
    },
  });

  if (!membership) {
    throw new Error('Not a member of this organization');
  }

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });

  await createAuditLog({
    organizationId: currentOrganizationId,
    userId,
    action: AuditActions.ORG_CREATE, // Using this for updates
    entityType: 'organization',
    entityId: organizationId,
  });

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description,
  };
}

export async function deleteOrganization(organizationId: string, userId: string, currentOrganizationId: string) {
  // Verify user is member of this organization
  const membership = await prisma.membership.findFirst({
    where: {
      user_id: userId,
      organization_id: organizationId,
    },
  });

  if (!membership) {
    throw new Error('Not a member of this organization');
  }

  // Soft delete organization
  await prisma.organization.update({
    where: { id: organizationId },
    data: { deleted_at: new Date() },
  });

  await createAuditLog({
    organizationId: currentOrganizationId,
    userId,
    action: AuditActions.ORG_CREATE, // Using this for deletion
    entityType: 'organization',
    entityId: organizationId,
  });
}
