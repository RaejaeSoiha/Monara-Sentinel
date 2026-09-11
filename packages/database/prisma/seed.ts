import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from root .env.local or .env, and package .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@monara-sentinel/security';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default roles
  const ownerRole = await prisma.role.upsert({
    where: { name: 'OWNER' },
    update: {},
    create: {
      name: 'OWNER',
      description: 'Full access to organization',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Manage users, cases, investigations',
    },
  });

  const investigatorRole = await prisma.role.upsert({
    where: { name: 'INVESTIGATOR' },
    update: {},
    create: {
      name: 'INVESTIGATOR',
      description: 'Create and manage cases and evidence',
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: 'VIEWER' },
    update: {},
    create: {
      name: 'VIEWER',
      description: 'Read-only access',
    },
  });

  console.log('Created default roles');

  // Create default permissions
  const permissions = [
    { name: 'cases:read', resource: 'cases', action: 'read', description: 'Read cases' },
    { name: 'cases:write', resource: 'cases', action: 'write', description: 'Create and update cases' },
    { name: 'cases:delete', resource: 'cases', action: 'delete', description: 'Delete cases' },
    { name: 'evidence:read', resource: 'evidence', action: 'read', description: 'Read evidence' },
    { name: 'evidence:upload', resource: 'evidence', action: 'upload', description: 'Upload evidence' },
    { name: 'evidence:delete', resource: 'evidence', action: 'delete', description: 'Delete evidence' },
    { name: 'organizations:read', resource: 'organizations', action: 'read', description: 'Read organizations' },
    { name: 'organizations:write', resource: 'organizations', action: 'write', description: 'Manage organizations' },
    { name: 'members:read', resource: 'members', action: 'read', description: 'Read members' },
    { name: 'members:write', resource: 'members', action: 'write', description: 'Manage members' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  console.log('Created default permissions');

  // Assign permissions to roles
  const allPermissions = await prisma.permission.findMany();

  // Owner gets all permissions
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: ownerRole.id,
          permission_id: permission.id,
        },
      },
      update: {},
      create: {
        role_id: ownerRole.id,
        permission_id: permission.id,
      },
    });
  }

  // Admin gets most permissions (except org management)
  const adminPermissions = allPermissions.filter(
    (p) => !p.name.includes('organizations:write')
  );
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      },
      update: {},
      create: {
        role_id: adminRole.id,
        permission_id: permission.id,
      },
    });
  }

  // Investigator gets case and evidence permissions
  const investigatorPermissions = allPermissions.filter(
    (p) => p.name.includes('cases') || p.name.includes('evidence')
  );
  for (const permission of investigatorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: investigatorRole.id,
          permission_id: permission.id,
        },
      },
      update: {},
      create: {
        role_id: investigatorRole.id,
        permission_id: permission.id,
      },
    });
  }

  // Viewer gets read permissions only
  const viewerPermissions = allPermissions.filter((p) => p.action === 'read');
  for (const permission of viewerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: viewerRole.id,
          permission_id: permission.id,
        },
      },
      update: {},
      create: {
        role_id: viewerRole.id,
        permission_id: permission.id,
      },
    });
  }

  console.log('Assigned permissions to roles');

  // Create superadmin user (admin/1212)
  const superadminPasswordHash = await hashPassword('1212');
  const superadminUser = await prisma.user.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      email: 'admin',
      password_hash: superadminPasswordHash,
      name: 'Platform Owner',
    },
  });

  console.log('Created superadmin user (admin/1212)');

  // Create platform owner organization
  const platformOwnerOrg = await prisma.organization.upsert({
    where: { slug: 'platform-owner' },
    update: {},
    create: {
      name: 'Platform Owner Team',
      slug: 'platform-owner',
      description: 'Platform owner organization',
    },
  });

  console.log('Created platform owner organization');

  // Create superadmin membership
  await prisma.membership.upsert({
    where: {
      user_id_organization_id: {
        user_id: superadminUser.id,
        organization_id: platformOwnerOrg.id,
      },
    },
    update: {},
    create: {
      user_id: superadminUser.id,
      organization_id: platformOwnerOrg.id,
      role_id: ownerRole.id,
    },
  });

  console.log('Created superadmin membership');

  // Create test user
  const passwordHash = await hashPassword('TestPassword123!');
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password_hash: passwordHash,
      name: 'Test User',
    },
  });

  console.log('Created test user');

  // Create test organization
  const testOrganization = await prisma.organization.upsert({
    where: { slug: 'test-org' },
    update: {},
    create: {
      name: 'Test Organization',
      slug: 'test-org',
      description: 'Test organization for development',
    },
  });

  console.log('Created test organization');

  // Create membership
  await prisma.membership.upsert({
    where: {
      user_id_organization_id: {
        user_id: testUser.id,
        organization_id: testOrganization.id,
      },
    },
    update: {},
    create: {
      user_id: testUser.id,
      organization_id: testOrganization.id,
      role_id: investigatorRole.id,
    },
  });

  console.log('Created test membership');

  console.log('Database seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
