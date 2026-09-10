import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  createCaseHandler,
  listCasesHandler,
  getCaseHandler,
  updateCaseHandler,
  deleteCaseHandler,
} from './cases.controller';

export async function casesRoutes(fastify: FastifyInstance) {
  // Create - requires cases:write
  fastify.post('/cases', { preHandler: [authenticate, authorize('cases', 'write')] }, createCaseHandler);

  // List - requires cases:read
  fastify.get('/cases', { preHandler: [authenticate, authorize('cases', 'read')] }, listCasesHandler);

  // Get one - requires cases:read + tenant isolation via service
  fastify.get('/cases/:id', { preHandler: [authenticate, authorize('cases', 'read')] }, getCaseHandler);

  // Update - requires cases:write
  fastify.put('/cases/:id', { preHandler: [authenticate, authorize('cases', 'write')] }, updateCaseHandler);

  // Delete (soft) - requires cases:delete
  fastify.delete('/cases/:id', { preHandler: [authenticate, authorize('cases', 'delete')] }, deleteCaseHandler);
}
