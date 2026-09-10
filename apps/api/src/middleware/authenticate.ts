// Authentication middleware - verifies JWT and attaches user to request
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, SecurityError } from '@monara-sentinel/security';
import { config } from '@monara-sentinel/config';
import { prisma } from '../lib/db';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
      code: 'UNAUTHORIZED',
      requestId: request.requestId || request.id,
    });
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token, config.jwt.secret);

    // Verify session exists and not expired (token revocation check)
    // For now we verify via JWT jti - in production we would check Redis/DB for revocation
    // Stage 4 foundation: check Session table via token hash? We store refresh tokens, not access.
    // Access tokens are short-lived (15m) and stateless; we validate via signature only.
    // Full session validation for refresh flow.

    // Attach user
    request.user = {
      id: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      tokenId: (payload as unknown as { jti: string }).jti,
    };

    // Verify user still exists and not deleted
    const user = await prisma.user.findFirst({
      where: { id: payload.userId, deleted_at: null },
    });

    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'User not found or deactivated',
        code: 'UNAUTHORIZED',
        requestId: request.requestId || request.id,
      });
    }
  } catch (error) {
    if (error instanceof SecurityError) {
      const status = error.code === 'TOKEN_EXPIRED' ? 401 : 401;
      return reply.status(status).send({
        error: 'Unauthorized',
        message: error.message,
        code: error.code,
        requestId: request.requestId || request.id,
      });
    }

    request.log.error({ error }, 'Authentication failed');
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
      requestId: request.requestId || request.id,
    });
  }
}
