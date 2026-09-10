import { FastifyRequest, FastifyReply } from 'fastify';
import { submitIntelligenceJob, getJobStatus, getCaseIntelligence } from './intelligence.service';
import type { SubmitDnsInput, SubmitRdapInput, SubmitTlsInput, SubmitUrlInput, SubmitWebsiteInput } from './intelligence.schema';

export async function submitDns(req: FastifyRequest<{ Params: { caseId: string }; Body: SubmitDnsInput }>, reply: FastifyReply) {
  const { caseId } = req.params;
  const input = req.body;
  const { organizationId } = req.user || {};
  const userId = req.user?.id;

  if (!organizationId || !userId) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const job = await submitIntelligenceJob(caseId, organizationId, userId, 'DNS', input);
  return reply.status(202).send({ jobId: job.id, type: 'DNS', status: job.status });
}

export async function submitRdap(req: FastifyRequest<{ Params: { caseId: string }; Body: SubmitRdapInput }>, reply: FastifyReply) {
  const { caseId } = req.params;
  const input = req.body;
  const { organizationId } = req.user || {};
  const userId = req.user?.id;

  if (!organizationId || !userId) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const job = await submitIntelligenceJob(caseId, organizationId, userId, 'RDAP', input);
  return reply.status(202).send({ jobId: job.id, type: 'RDAP', status: job.status });
}

export async function submitTls(req: FastifyRequest<{ Params: { caseId: string }; Body: SubmitTlsInput }>, reply: FastifyReply) {
  const { caseId } = req.params;
  const input = req.body;
  const { organizationId } = req.user || {};
  const userId = req.user?.id;

  if (!organizationId || !userId) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const job = await submitIntelligenceJob(caseId, organizationId, userId, 'TLS', input);
  return reply.status(202).send({ jobId: job.id, type: 'TLS', status: job.status });
}

export async function submitUrl(req: FastifyRequest<{ Params: { caseId: string }; Body: SubmitUrlInput }>, reply: FastifyReply) {
  const { caseId } = req.params;
  const input = req.body;
  const { organizationId } = req.user || {};
  const userId = req.user?.id;

  if (!organizationId || !userId) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const job = await submitIntelligenceJob(caseId, organizationId, userId, 'URL', input);
  return reply.status(202).send({ jobId: job.id, type: 'URL', status: job.status });
}

export async function submitWebsite(req: FastifyRequest<{ Params: { caseId: string }; Body: SubmitWebsiteInput }>, reply: FastifyReply) {
  const { caseId } = req.params;
  const input = req.body;
  const { organizationId } = req.user || {};
  const userId = req.user?.id;

  if (!organizationId || !userId) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const job = await submitIntelligenceJob(caseId, organizationId, userId, 'WEBSITE', input);
  return reply.status(202).send({ jobId: job.id, type: 'WEBSITE', status: job.status });
}

export async function getJob(req: FastifyRequest<{ Params: { caseId: string; jobId: string } }>, reply: FastifyReply) {
  const { jobId } = req.params;
  const { organizationId } = req.user || {};

  if (!organizationId) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const job = await getJobStatus(jobId, organizationId);
  return reply.send(job);
}

export async function getIntelligence(req: FastifyRequest<{ Params: { caseId: string } }>, reply: FastifyReply) {
  const { caseId } = req.params;
  const { organizationId } = req.user || {};

  if (!organizationId) {
    return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const data = await getCaseIntelligence(caseId, organizationId);
  return reply.send(data);
}
