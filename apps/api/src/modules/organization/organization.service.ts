// Organization service - minimal for Stage 4 tenant isolation
import { prisma } from '../../lib/db';

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
