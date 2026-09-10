import { Prisma } from '@prisma/client';
import { prisma } from '@monara-sentinel/database';
import { collectDns, collectRdap, collectTls, collectUrl, collectWebsite, listIntelligence } from '@monara-sentinel/intelligence';
import type { DnsRequest, RdapRequest, TlsRequest, UrlRequest, WebsiteRequest } from '@monara-sentinel/intelligence';

export async function submitIntelligenceJob(
  caseId: string,
  organizationId: string,
  userId: string,
  type: 'DNS' | 'RDAP' | 'TLS' | 'URL' | 'WEBSITE',
  input: DnsRequest | RdapRequest | TlsRequest | UrlRequest | WebsiteRequest
) {
  // Verify case belongs to organization
  const caseRecord = await prisma.case.findFirst({
    where: { id: caseId, organization_id: organizationId, deleted_at: null },
  });
  if (!caseRecord) {
    throw new Error('Case not found');
  }

  // Create job record
  const job = await prisma.intelligenceJob.create({
    data: {
      case_id: caseId,
      organization_id: organizationId,
      user_id: userId,
      type,
      input: input as unknown as Prisma.InputJsonValue,
      status: 'QUEUED',
    },
  });

  // Create timeline event
  await prisma.timelineEvent.create({
    data: {
      case_id: caseId,
      event_type: 'INTELLIGENCE_REQUESTED',
      title: `Intelligence requested: ${type}`,
      created_by: userId,
    },
  });

  // Note: In production, this would enqueue to BullMQ
  // For testing/simplicity, we process synchronously
  try {
    let result: unknown;
    switch (type) {
      case 'DNS':
        result = await collectDns(caseId, organizationId, userId, input as unknown as DnsRequest);
        break;
      case 'RDAP':
        result = await collectRdap(caseId, organizationId, userId, input as unknown as RdapRequest);
        break;
      case 'TLS':
        result = await collectTls(caseId, organizationId, userId, input as unknown as TlsRequest);
        break;
      case 'URL':
        result = await collectUrl(caseId, organizationId, userId, input as unknown as UrlRequest);
        break;
      case 'WEBSITE':
        result = await collectWebsite(caseId, organizationId, userId, input as unknown as WebsiteRequest);
        break;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    await prisma.intelligenceJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        result: result as unknown as Prisma.InputJsonValue,
      },
    });

    return job;
  } catch (error) {
    await prisma.intelligenceJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        completed_at: new Date(),
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

export async function getJobStatus(jobId: string, organizationId: string) {
  const job = await prisma.intelligenceJob.findFirst({
    where: { id: jobId, organization_id: organizationId },
  });
  if (!job) {
    throw new Error('Job not found');
  }
  return job;
}

export async function getCaseIntelligence(caseId: string, organizationId: string) {
  const caseRecord = await prisma.case.findFirst({
    where: { id: caseId, organization_id: organizationId, deleted_at: null },
  });
  if (!caseRecord) {
    throw new Error('Case not found');
  }

  const jobs = await prisma.intelligenceJob.findMany({
    where: { case_id: caseId },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  const evidence = await listIntelligence(caseId, organizationId);

  const indicators = await prisma.riskIndicator.findMany({
    where: { case_id: caseId },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  return { jobs, evidence, indicators };
}

export async function processJob(jobId: string) {
  const job = await prisma.intelligenceJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new Error('Job not found');
  }

  if (job.status !== 'QUEUED') {
    throw new Error('Job is not in QUEUED state');
  }

  await prisma.intelligenceJob.update({
    where: { id: jobId },
    data: { status: 'RUNNING', started_at: new Date() },
  });

  try {
    let result: unknown;
    const input = job.input as unknown as DnsRequest | RdapRequest | TlsRequest | UrlRequest | WebsiteRequest;

    switch (job.type) {
      case 'DNS':
        result = await collectDns(job.case_id, job.organization_id, job.user_id, input as DnsRequest);
        break;
      case 'RDAP':
        result = await collectRdap(job.case_id, job.organization_id, job.user_id, input as RdapRequest);
        break;
      case 'TLS':
        result = await collectTls(job.case_id, job.organization_id, job.user_id, input as TlsRequest);
        break;
      case 'URL':
        result = await collectUrl(job.case_id, job.organization_id, job.user_id, input as UrlRequest);
        break;
      case 'WEBSITE':
        result = await collectWebsite(job.case_id, job.organization_id, job.user_id, input as WebsiteRequest);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    await prisma.intelligenceJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        result: result as unknown as Prisma.InputJsonValue,
      },
    });

    return result;
  } catch (error) {
    await prisma.intelligenceJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completed_at: new Date(),
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
