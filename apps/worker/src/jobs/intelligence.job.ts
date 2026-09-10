import type { Job } from 'bullmq';
import { logger } from '../lib/logger';
import { prisma } from '@monara-sentinel/database';
import { collectDns, collectRdap, collectTls, collectUrl, collectWebsite } from '@monara-sentinel/intelligence';
import type { DnsRequest, RdapRequest, TlsRequest, UrlRequest, WebsiteRequest } from '@monara-sentinel/intelligence';
import { Prisma } from '@prisma/client';

export interface IntelligenceJobData extends Record<string, unknown> {
  jobId: string;
  caseId: string;
  organizationId: string;
  userId: string;
  type: 'DNS' | 'RDAP' | 'TLS' | 'URL' | 'WEBSITE';
  input: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestedAt: string;
}

export async function processIntelligenceJob(job: Job<IntelligenceJobData>): Promise<Record<string, unknown>> {
  const { jobId, caseId, organizationId, userId, type, input } = job.data;
  logger.info({ jobId: job.id, type, caseId }, 'Processing intelligence job');

  try {
    // Update job status to RUNNING
    await prisma.intelligenceJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', started_at: new Date() },
    });

    let result: unknown;
    const typedInput = input as unknown as DnsRequest | RdapRequest | TlsRequest | UrlRequest | WebsiteRequest;

    switch (type) {
      case 'DNS':
        result = await collectDns(caseId, organizationId, userId, typedInput as DnsRequest);
        break;
      case 'RDAP':
        result = await collectRdap(caseId, organizationId, userId, typedInput as RdapRequest);
        break;
      case 'TLS':
        result = await collectTls(caseId, organizationId, userId, typedInput as TlsRequest);
        break;
      case 'URL':
        result = await collectUrl(caseId, organizationId, userId, typedInput as UrlRequest);
        break;
      case 'WEBSITE':
        result = await collectWebsite(caseId, organizationId, userId, typedInput as WebsiteRequest);
        break;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    await prisma.intelligenceJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        result: result as unknown as Prisma.InputJsonValue,
      },
    });
    
    logger.info({ jobId: job.id, type, caseId }, 'Intelligence job completed successfully');
    return result as unknown as Record<string, unknown>;
  } catch (error) {
    await prisma.intelligenceJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completed_at: new Date(),
        error: error instanceof Error ? error.message : String(error),
      },
    });
    logger.error({ err: error, jobId: job.id, type }, 'Intelligence job failed');
    throw error;
  }
}

export const INTELLIGENCE_QUEUE = 'intelligence';
