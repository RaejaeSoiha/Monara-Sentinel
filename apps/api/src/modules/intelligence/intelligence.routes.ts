import { FastifyInstance } from 'fastify';
import { authorize } from '../../middleware/authorize';
import { submitDns, submitRdap, submitTls, submitUrl, submitWebsite, getJob, getIntelligence } from './intelligence.controller';
import { submitDnsSchema, submitRdapSchema, submitTlsSchema, submitUrlSchema, submitWebsiteSchema } from './intelligence.schema';

export async function intelligenceRoutes(fastify: FastifyInstance) {
  // Submit intelligence jobs
  fastify.post('/cases/:caseId/intelligence/dns', {
    preHandler: [authorize('cases', 'write')],
    schema: { body: submitDnsSchema },
    handler: submitDns,
  });

  fastify.post('/cases/:caseId/intelligence/rdap', {
    preHandler: [authorize('cases', 'write')],
    schema: { body: submitRdapSchema },
    handler: submitRdap,
  });

  fastify.post('/cases/:caseId/intelligence/tls', {
    preHandler: [authorize('cases', 'write')],
    schema: { body: submitTlsSchema },
    handler: submitTls,
  });

  fastify.post('/cases/:caseId/intelligence/url', {
    preHandler: [authorize('cases', 'write')],
    schema: { body: submitUrlSchema },
    handler: submitUrl,
  });

  fastify.post('/cases/:caseId/intelligence/website', {
    preHandler: [authorize('cases', 'write')],
    schema: { body: submitWebsiteSchema },
    handler: submitWebsite,
  });

  // Get job status
  fastify.get('/cases/:caseId/intelligence/jobs/:jobId', {
    preHandler: [authorize('cases', 'read')],
    handler: getJob,
  });

  // Get case intelligence
  fastify.get('/cases/:caseId/intelligence', {
    preHandler: [authorize('cases', 'read')],
    handler: getIntelligence,
  });
}
