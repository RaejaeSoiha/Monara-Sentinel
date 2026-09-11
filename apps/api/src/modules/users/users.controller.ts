import { FastifyRequest, FastifyReply } from 'fastify';
import { listUsersHandler, inviteUserHandler, updateUserRoleHandler, deleteUserHandler, getUserMembership } from './users.service';

export async function listUsersController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  // Check if user has permission to view users
  const membership = await getUserMembership(user.id, user.organizationId);
  if (!membership || (membership.role.name !== 'OWNER' && membership.role.name !== 'ADMIN')) {
    return reply.status(403).send({ error: 'Forbidden', code: 'FORBIDDEN' });
  }

  const users = await listUsersHandler(user.id, user.organizationId);
  return reply.send(users);
}

export async function inviteUserController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  // Check if user has permission to invite users
  const membership = await getUserMembership(user.id, user.organizationId);
  if (!membership || (membership.role.name !== 'OWNER' && membership.role.name !== 'ADMIN')) {
    return reply.status(403).send({ error: 'Forbidden', code: 'FORBIDDEN' });
  }

  const result = await inviteUserHandler(request.body, user.id, user.organizationId);
  return reply.status(201).send(result);
}

export async function updateUserRoleController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  // Check if user has permission to update roles
  const membership = await getUserMembership(user.id, user.organizationId);
  if (!membership || membership.role.name !== 'OWNER') {
    return reply.status(403).send({ error: 'Forbidden', code: 'FORBIDDEN' });
  }

  const { userId } = request.params as { userId: string };
  const { role } = request.body as { role: string };

  const result = await updateUserRoleHandler(userId, role, user.id, user.organizationId);
  return reply.send(result);
}

export async function deleteUserController(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  // Check if user has permission to delete users
  const membership = await getUserMembership(user.id, user.organizationId);
  if (!membership || membership.role.name !== 'OWNER') {
    return reply.status(403).send({ error: 'Forbidden', code: 'FORBIDDEN' });
  }

  const { userId } = request.params as { userId: string };

  await deleteUserHandler(userId, user.id, user.organizationId);
  return reply.status(204).send();
}
