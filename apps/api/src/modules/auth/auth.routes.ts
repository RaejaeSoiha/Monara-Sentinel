// Auth routes - Monara Sentinel
import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
  listAllUsersHandler,
  listAllOrganizationsHandler,
  switchOrganizationHandler,
  requestPasswordResetHandler,
  resetPasswordHandler,
} from './auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes - rate limited via global limiter + specific limits in Stage 4
  fastify.post('/register', registerHandler);
  fastify.post('/login', loginHandler);
  fastify.post('/refresh', refreshHandler);
  fastify.post('/request-password-reset', requestPasswordResetHandler);
  fastify.post('/reset-password', resetPasswordHandler);

  // Authenticated routes
  fastify.post('/logout', { preHandler: [authenticate] }, logoutHandler);
  fastify.get('/me', { preHandler: [authenticate] }, meHandler);
  fastify.post('/switch-organization', { preHandler: [authenticate] }, switchOrganizationHandler);

  // Superadmin routes
  fastify.get('/superadmin/users', { preHandler: [authenticate] }, listAllUsersHandler);
  fastify.get('/superadmin/organizations', { preHandler: [authenticate] }, listAllOrganizationsHandler);
}
