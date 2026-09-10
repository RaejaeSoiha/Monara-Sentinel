import './__tests__/setup';
import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import { validatorCompiler, serializerCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './lib/error-handler';
import { correlationPlugin } from './plugins/correlation';
import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { organizationRoutes } from './modules/organization/organization.routes';
import { casesRoutes } from './modules/cases/cases.routes';
import { investigationsRoutes } from './modules/investigations/investigations.routes';
import { entitiesRoutes } from './modules/entities/entities.routes';
import { relationshipsRoutes } from './modules/relationships/relationships.routes';
import { evidenceRoutes } from './modules/evidence/evidence.routes';
import { timelineRoutes } from './modules/timeline/timeline.routes';
import { intelligenceRoutes } from './modules/intelligence/intelligence.routes';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from '@monara-sentinel/config';

export async function createTestApp() {
  const fastify = Fastify({
    loggerInstance: logger,
    trustProxy: true,
    genReqId: () => randomUUID(),
  }).withTypeProvider<ZodTypeProvider>();

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Register plugins
  await fastify.register(correlationPlugin);
  await fastify.register(cors, {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow: boolean) => void
    ) => {
      if (!origin) callback(null, true);
      else if (config.cors.allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });
  await fastify.register(helmet, {
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
  });
  await fastify.register(rateLimit, { max: 100, timeWindow: '15 minutes' });
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: { title: 'Test', version: '0.1.0' },
    },
  });
  await fastify.register(swaggerUi, { routePrefix: '/docs' });
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  // Routes
  await fastify.register(healthRoutes, { prefix: '/api/v1' });
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(organizationRoutes, { prefix: '/api/v1' });
  await fastify.register(casesRoutes, { prefix: '/api/v1' });
  await fastify.register(investigationsRoutes, { prefix: '/api/v1' });
  await fastify.register(entitiesRoutes, { prefix: '/api/v1' });
  await fastify.register(relationshipsRoutes, { prefix: '/api/v1' });
  await fastify.register(evidenceRoutes, { prefix: '/api/v1' });
  await fastify.register(timelineRoutes, { prefix: '/api/v1' });
  await fastify.register(intelligenceRoutes, { prefix: '/api/v1' });

  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(organizationRoutes, { prefix: '/api' });
  await fastify.register(casesRoutes, { prefix: '/api' });
  await fastify.register(intelligenceRoutes, { prefix: '/api' });

  fastify.get('/api', async () => ({ name: 'Test', versions: ['v1'] }));

  await fastify.ready();
  return fastify;
}
