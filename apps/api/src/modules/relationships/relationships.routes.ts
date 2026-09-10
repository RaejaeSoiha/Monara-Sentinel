import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  createRelationshipHandler,
  listRelationshipsHandler,
  getRelationshipHandler,
  updateRelationshipHandler,
  deleteRelationshipHandler,
} from './relationships.controller';

export async function relationshipsRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/relationships', { preHandler: [authenticate, authorize('cases', 'write')] }, createRelationshipHandler);
  fastify.get('/cases/:caseId/relationships', { preHandler: [authenticate, authorize('cases', 'read')] }, listRelationshipsHandler);
  fastify.get('/relationships/:id', { preHandler: [authenticate, authorize('cases', 'read')] }, getRelationshipHandler);
  fastify.put('/relationships/:id', { preHandler: [authenticate, authorize('cases', 'write')] }, updateRelationshipHandler);
  fastify.delete('/relationships/:id', { preHandler: [authenticate, authorize('cases', 'delete')] }, deleteRelationshipHandler);
}
