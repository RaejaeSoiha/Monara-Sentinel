import 'fastify';

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  tokenId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
    requestId?: string;
  }
}
