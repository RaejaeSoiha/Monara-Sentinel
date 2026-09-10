import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  getOrganizationHandler,
  listOrganizationsHandler,
  protectedCasesHandler,
} from './organization.controller';

export async function organizationRoutes(fastify: FastifyInstance) {
  // List orgs - authenticated
  fastify.get('/organizations', { preHandler: [authenticate] }, listOrganizationsHandler);

  // Get org by id - tests tenant isolation (user must be member)
  fastify.get('/organizations/:id', { preHandler: [authenticate] }, getOrganizationHandler);

  // Protected cases endpoint - tests permission checks (cases:read)
  fastify.get(
    '/protected/cases',
    { preHandler: [authenticate, authorize('cases', 'read')] },
    protectedCasesHandler
  );

  // Admin-only endpoint - tests permission denial for VIEWER
  fastify.get(
    '/protected/admin',
    { preHandler: [authenticate, authorize('organizations', 'write')] },
    protectedCasesHandler
  );
}
