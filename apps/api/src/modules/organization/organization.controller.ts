import { FastifyRequest, FastifyReply } from 'fastify';
import { getOrganizationById, listUserOrganizations, createOrganization, updateOrganization, deleteOrganization, getUserMembership } from './organization.service';

export async function getOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }
  const { id } = request.params as { id: string };

  const org = await getOrganizationById(id, user.id);

  if (!org) {
    return reply.status(404).send({
      error: 'Not Found',
      message: 'Organization not found',
      code: 'NOT_FOUND',
      requestId: request.requestId || request.id,
    });
  }

  return reply.send(org);
}

export async function listOrganizationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }
  const orgs = await listUserOrganizations(user.id);
  return reply.send({ organizations: orgs });
}

export async function createOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const body = request.body as { name: string; slug?: string; description?: string };
  const org = await createOrganization(body, user.id, user.organizationId);

  return reply.status(201).send(org);
}

export async function updateOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const { id } = request.params as { id: string };
  const body = request.body as { name?: string; description?: string };

  // Check if user has permission to update organization
  const membership = await getUserMembership(user.id, id);
  if (!membership || membership.role.name !== 'OWNER') {
    return reply.status(403).send({ error: 'Forbidden', code: 'FORBIDDEN' });
  }

  const org = await updateOrganization(id, body, user.id, user.organizationId);

  return reply.send(org);
}

export async function deleteOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const { id } = request.params as { id: string };

  // Check if user has permission to delete organization
  const membership = await getUserMembership(user.id, id);
  if (!membership || membership.role.name !== 'OWNER') {
    return reply.status(403).send({ error: 'Forbidden', code: 'FORBIDDEN' });
  }

  await deleteOrganization(id, user.id, user.organizationId);

  return reply.status(204).send();
}

// Dummy protected endpoint to test RBAC
export async function protectedCasesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  return reply.send({
    message: 'Access granted to cases:read',
    organizationId: user?.organizationId,
  });
}
