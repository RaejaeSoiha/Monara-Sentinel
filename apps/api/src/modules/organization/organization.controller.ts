import { FastifyRequest, FastifyReply } from 'fastify';
import { getOrganizationById, listUserOrganizations } from './organization.service';

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

// Dummy protected endpoint to test RBAC
export async function protectedCasesHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  return reply.send({
    message: 'Access granted to cases:read',
    organizationId: user?.organizationId,
  });
}
