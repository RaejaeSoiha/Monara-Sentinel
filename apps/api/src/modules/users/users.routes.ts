import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { listUsersController, inviteUserController, updateUserRoleController, deleteUserController } from './users.controller';

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.get('/users', { preHandler: [authenticate] }, listUsersController);
  fastify.post('/users/invite', { preHandler: [authenticate] }, inviteUserController);
  fastify.patch('/users/:userId/role', { preHandler: [authenticate] }, updateUserRoleController);
  fastify.delete('/users/:userId', { preHandler: [authenticate] }, deleteUserController);
}
