// Auth routes - Monara Sentinel
import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from './auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes - rate limited via global limiter + specific limits in Stage 4
  fastify.post('/register', registerHandler);
  fastify.post('/login', loginHandler);
  fastify.post('/refresh', refreshHandler);

  // Authenticated routes
  fastify.post('/logout', { preHandler: [authenticate] }, logoutHandler);
  fastify.get('/me', { preHandler: [authenticate] }, meHandler);
}
