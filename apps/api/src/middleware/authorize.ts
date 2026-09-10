// Authorization / RBAC middleware - permission checks and tenant isolation
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';

export async function requirePermission(
  request: FastifyRequest,
  reply: FastifyReply,
  resource: string,
  action: string
) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Not authenticated',
      code: 'UNAUTHORIZED',
    });
  }

  // Find membership for user's organization
  const membership = await prisma.membership.findFirst({
    where: {
      user_id: user.id,
      organization_id: user.organizationId,
    },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!membership) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'No membership in organization',
      code: 'FORBIDDEN',
      requestId: request.requestId || request.id,
    });
  }

  const hasPermission = membership.role.permissions.some(
    (rp: { permission: { resource: string; action: string } }) =>
      rp.permission.resource === resource && rp.permission.action === action
  );

  // OWNER and ADMIN roles implicitly have all? Actually seeded permissions define, but check owner has all
  if (!hasPermission) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: `Missing permission: ${resource}:${action}`,
      code: 'FORBIDDEN',
      requestId: request.requestId || request.id,
    });
  }
}

// Tenant isolation helper - ensures resource belongs to user's organization
export async function assertTenantIsolation(
  request: FastifyRequest,
  reply: FastifyReply,
  organizationId: string
) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  if (organizationId !== user.organizationId) {
    // Return 404 to avoid leaking existence (security)
    return reply.status(404).send({
      error: 'Not Found',
      message: 'Resource not found',
      code: 'NOT_FOUND',
      requestId: request.requestId || request.id,
    });
  }
}

// Factory for route-level permission middleware
export function authorize(resource: string, action: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requirePermission(request, reply, resource, action);
  };
}
