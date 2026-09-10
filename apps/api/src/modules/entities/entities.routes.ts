import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  createEntityHandler,
  listEntitiesHandler,
  getEntityHandler,
  updateEntityHandler,
  deleteEntityHandler,
} from './entities.controller';

export async function entitiesRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/entities', { preHandler: [authenticate, authorize('cases', 'write')] }, createEntityHandler);
  fastify.get('/cases/:caseId/entities', { preHandler: [authenticate, authorize('cases', 'read')] }, listEntitiesHandler);
  fastify.get('/entities/:id', { preHandler: [authenticate, authorize('cases', 'read')] }, getEntityHandler);
  fastify.put('/entities/:id', { preHandler: [authenticate, authorize('cases', 'write')] }, updateEntityHandler);
  fastify.delete('/entities/:id', { preHandler: [authenticate, authorize('cases', 'delete')] }, deleteEntityHandler);
}
