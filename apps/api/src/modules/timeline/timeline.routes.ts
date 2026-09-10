import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  createTimelineEventHandler,
  listTimelineEventsHandler,
  getTimelineEventHandler,
} from './timeline.controller';

export async function timelineRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/timeline', { preHandler: [authenticate, authorize('cases', 'write')] }, createTimelineEventHandler);
  fastify.get('/cases/:caseId/timeline', { preHandler: [authenticate, authorize('cases', 'read')] }, listTimelineEventsHandler);
  fastify.get('/timeline/:id', { preHandler: [authenticate, authorize('cases', 'read')] }, getTimelineEventHandler);
}
