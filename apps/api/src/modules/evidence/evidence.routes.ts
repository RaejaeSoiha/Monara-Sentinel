import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  createEvidenceHandler,
  listEvidenceHandler,
  getEvidenceHandler,
  updateEvidenceHandler,
  deleteEvidenceHandler,
  associateEntityHandler,
  removeEntityHandler,
} from './evidence.controller';

export async function evidenceRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/evidence', { preHandler: [authenticate, authorize('cases', 'write')] }, createEvidenceHandler);
  fastify.get('/cases/:caseId/evidence', { preHandler: [authenticate, authorize('cases', 'read')] }, listEvidenceHandler);
  fastify.get('/evidence/:id', { preHandler: [authenticate, authorize('cases', 'read')] }, getEvidenceHandler);
  fastify.put('/evidence/:id', { preHandler: [authenticate, authorize('cases', 'write')] }, updateEvidenceHandler);
  fastify.delete('/evidence/:id', { preHandler: [authenticate, authorize('cases', 'delete')] }, deleteEvidenceHandler);
  fastify.post('/evidence/:id/entities', { preHandler: [authenticate, authorize('cases', 'write')] }, associateEntityHandler);
  fastify.delete('/evidence/:id/entities/:entityId', { preHandler: [authenticate, authorize('cases', 'write')] }, removeEntityHandler);
}
