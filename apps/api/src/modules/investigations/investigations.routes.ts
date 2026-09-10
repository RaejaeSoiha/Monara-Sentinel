import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  createInvestigationHandler,
  listInvestigationsHandler,
  getInvestigationHandler,
  updateInvestigationHandler,
  deleteInvestigationHandler,
} from './investigations.controller';

export async function investigationsRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/investigations', { preHandler: [authenticate, authorize('cases', 'write')] }, createInvestigationHandler);
  fastify.get('/cases/:caseId/investigations', { preHandler: [authenticate, authorize('cases', 'read')] }, listInvestigationsHandler);
  fastify.get('/investigations/:id', { preHandler: [authenticate, authorize('cases', 'read')] }, getInvestigationHandler);
  fastify.put('/investigations/:id', { preHandler: [authenticate, authorize('cases', 'write')] }, updateInvestigationHandler);
  fastify.delete('/investigations/:id', { preHandler: [authenticate, authorize('cases', 'delete')] }, deleteInvestigationHandler);
}
