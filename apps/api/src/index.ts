// Monara Sentinel API - Fastify bootstrap
// SCAMNET internal platform module lives under Monara Sentinel project

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { randomUUID } from 'crypto';
import {
  validatorCompiler,
  serializerCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { config } from '@monara-sentinel/config';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './lib/error-handler';
import { connectDatabase, disconnectDatabase } from './lib/db';
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
import { imagesRoutes } from './modules/images/images.routes';
import { usersRoutes } from './modules/users/users.routes';

// Create Fastify instance with Zod type provider
// Fastify 5 uses loggerInstance for passing a pino instance
const fastify = Fastify({
  loggerInstance: logger,
  trustProxy: true,
  genReqId: () => randomUUID(),
}).withTypeProvider<ZodTypeProvider>();

// Set Zod compilers for validation
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Register plugins
export async function registerPlugins() {
  // Multipart support for image uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
    },
  });

  // Correlation / Request ID
  await fastify.register(correlationPlugin);

  // CORS - security: whitelist only
  await fastify.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowedOrigins = config.cors.allowedOrigins;
      
      // Allow localhost/127.0.0.1 with any port in development
      if (process.env['NODE_ENV'] === 'development') {
        try {
          const originUrl = new URL(origin);
          if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
            callback(null, true);
            return;
          }
        } catch {
          // Invalid URL, continue to strict check
        }
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        fastify.log.warn({ origin }, 'CORS blocked');
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'X-Ratelimit-Limit', 'X-Ratelimit-Remaining'],
  });

  // Security headers via helmet
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  });

  // Rate limiting - foundation, per-route limits will be added in Stage 4
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    cache: 10000,
    skipOnError: true,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    keyGenerator: (req) => {
      // Prefer user ID if authenticated, else IP
      const user = req.user;
      return user?.id || req.ip;
    },
  });

  // OpenAPI / Swagger
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Monara Sentinel API',
        description:
          'Defensive scam-intelligence and fraud-investigation platform. SCAMNET is the internal intelligence platform module.',
        version: '0.1.0',
      },
      servers: [
        { url: config.app.apiUrl, description: 'Development server' },
        { url: 'http://localhost:3001', description: 'Local' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Error & 404 handlers
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);
}

// Register routes with versioning
// Strategy: /api/v1 is canonical, /api is alias for backward compat during Stage 3-4
export async function registerRoutes() {
  // v1 canonical
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
  await fastify.register(imagesRoutes, { prefix: '/api/v1/cases' });
  await fastify.register(usersRoutes, { prefix: '/api/v1' });

  // Alias for existing clients (will be deprecated after Stage 4)
  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(organizationRoutes, { prefix: '/api' });
  await fastify.register(casesRoutes, { prefix: '/api' });
  await fastify.register(investigationsRoutes, { prefix: '/api' });
  await fastify.register(entitiesRoutes, { prefix: '/api' });
  await fastify.register(relationshipsRoutes, { prefix: '/api' });
  await fastify.register(evidenceRoutes, { prefix: '/api' });
  await fastify.register(timelineRoutes, { prefix: '/api' });
  await fastify.register(intelligenceRoutes, { prefix: '/api' });
  await fastify.register(imagesRoutes, { prefix: '/api/cases' });
  await fastify.register(usersRoutes, { prefix: '/api' });

  // Version discovery endpoint
  fastify.get('/api', async () => ({
    name: 'Monara Sentinel API',
    versions: ['v1'],
    docs: `${config.app.apiUrl}/docs`,
  }));
}

// Graceful shutdown
let isShuttingDown = false;
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  fastify.log.info({ signal }, 'Starting graceful shutdown...');

  try {
    await fastify.close();
    await disconnectDatabase();
    fastify.log.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    fastify.log.error({ error }, 'Graceful shutdown failed');
    process.exit(1);
  }
}

// Start server
async function start() {
  try {
    // Config is already validated on import; if it fails, process exits before here

    await registerPlugins();
    await registerRoutes();

    // Connect to database (non-fatal for health endpoint but logs warning)
    try {
      await connectDatabase();
    } catch (error) {
      fastify.log.warn({ error }, 'Database unavailable at startup - readiness will report not ready');
    }

    await fastify.listen({ port: config.app.port, host: '0.0.0.0' });

    fastify.log.info(`Monara Sentinel API listening on port ${config.app.port}`);
    fastify.log.info(`API docs available at ${config.app.apiUrl}/docs`);
    fastify.log.info(`Health at ${config.app.apiUrl}/api/v1/health`);

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    fastify.log.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  start();
}

export { fastify, start, gracefulShutdown };
