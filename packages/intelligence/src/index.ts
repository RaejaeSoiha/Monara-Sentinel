import { createHash } from 'crypto';
import * as dns from 'dns/promises';
import * as tls from 'tls';
import { Prisma, EvidenceVerificationStatus, RelationshipType, EntityType } from '@prisma/client';
import { prisma } from '@monara-sentinel/database';
import { validateUrl, resolveAndValidate, safeFetch, SSRFError } from '@monara-sentinel/ssrf';
import { z } from 'zod';

export const dnsRequestSchema = z.object({
  domain: z.string().min(1).max(253),
  entity_id: z.string().cuid().optional(),
});
export const rdapRequestSchema = z.object({ domain: z.string().min(1).max(253), entity_id: z.string().cuid().optional() });
export const tlsRequestSchema = z.object({ hostname: z.string().min(1).max(253), port: z.number().int().min(1).max(65535).default(443), entity_id: z.string().cuid().optional() });
export const urlRequestSchema = z.object({ url: z.string().url().max(2000), entity_id: z.string().cuid().optional() });
export const websiteRequestSchema = z.object({ url: z.string().url().max(2000), entity_id: z.string().cuid().optional() });

export type DnsRequest = z.infer<typeof dnsRequestSchema>;
export type RdapRequest = z.infer<typeof rdapRequestSchema>;
export type TlsRequest = z.infer<typeof tlsRequestSchema>;
export type UrlRequest = z.infer<typeof urlRequestSchema>;
export type WebsiteRequest = z.infer<typeof websiteRequestSchema>;

async function createAuditLog(params: { organizationId: string; userId: string; action: string; entityType: string; entityId?: string; caseId?: string }) {
  try {
    await prisma.auditLog.create({
      data: {
        organization_id: params.organizationId,
        user_id: params.userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        case_id: params.caseId || null,
      },
    });
  } catch {
    // ignore audit failures
  }
}

// Helper to create evidence for intelligence
async function createIntelligenceEvidence(
  caseId: string,
  _organizationId: string,
  collectorId: string,
  sourceUrl: string | null,
  sourceType: string,
  content: string,
  verificationStatus: 'OBSERVED' | 'VERIFIED' | 'CORROBORATED' | 'INFERENCE' | 'HYPOTHESIS' | 'UNKNOWN' = 'OBSERVED',
  provenance: Record<string, unknown> = {},
  entityId?: string
) {
  const sha256 = createHash('sha256').update(content, 'utf8').digest('hex');
  const excerpt = content.slice(0, 500);

  const evidence = await prisma.evidence.create({
    data: {
      case_id: caseId,
      source_url: sourceUrl,
      source_type: sourceType,
      source_title: `${sourceType} for ${sourceUrl || caseId}`,
      content,
      excerpt,
      sha256,
      mime_type: 'application/json',
      collection_method: 'intelligence',
      collector_id: collectorId,
      confidence: 80,
      verification_status: verificationStatus as unknown as EvidenceVerificationStatus,
      provenance: provenance as unknown as Prisma.InputJsonValue,
    },
  });

  if (entityId) {
    await prisma.entityEvidence.create({ data: { entity_id: entityId, evidence_id: evidence.id } });
  }

  return evidence;
}

// Helper to create evidence-backed relationships
async function createRelationship(
  caseId: string,
  sourceEntityId: string,
  targetEntityId: string,
  type: RelationshipType,
  evidenceId: string,
  explanation: string,
  confidence: number = 80,
  sourceUrl?: string
) {
  const relationship = await prisma.relationship.create({
    data: {
      case_id: caseId,
      source_entity_id: sourceEntityId,
      target_entity_id: targetEntityId,
      type,
      confidence,
      evidence_id: evidenceId,
      source_url: sourceUrl,
      explanation,
      created_by: 'system', // System-generated
    },
  });
  return relationship;
}

// Helper to create deterministic risk indicators
async function createRiskIndicator(
  caseId: string,
  organizationId: string,
  indicatorType: string,
  explanation: string,
  evidenceIds: string[],
  confidence: number = 70,
  calculation?: Record<string, unknown>
) {
  const indicator = await prisma.riskIndicator.create({
    data: {
      case_id: caseId,
      organization_id: organizationId,
      indicator_type: indicatorType,
      explanation,
      confidence,
      evidence_ids: evidenceIds,
      calculation: calculation as unknown as Prisma.InputJsonValue,
      created_by: 'system',
    },
  });
  return indicator;
}

// Normalize entities from intelligence results
async function normalizeEntity(
  caseId: string,
  type: EntityType,
  value: string,
  metadata?: Record<string, unknown>,
  createdBy?: string
) {
  const normalizedValue = value.toLowerCase().trim();
  const existing = await prisma.entity.findFirst({
    where: { case_id: caseId, type, value: normalizedValue },
  });

  if (existing) return existing;

  const created = await prisma.entity.create({
    data: {
      case_id: caseId,
      type,
      value: normalizedValue,
      metadata: metadata as unknown as Prisma.InputJsonValue,
      created_by: createdBy || 'system',
    },
  });

  await prisma.timelineEvent.create({
    data: {
      case_id: caseId,
      entity_id: created.id,
      event_type: 'ENTITY_ADDED',
      title: `Entity added via intelligence: ${type} - ${normalizedValue}`,
      created_by: createdBy || 'system',
    },
  });

  return created;
}

// DNS intelligence
export async function collectDns(caseId: string, organizationId: string, collectorId: string, input: DnsRequest) {
  const domain = input.domain.toLowerCase().trim();

  // SSRF check: validate domain is not private
  validateUrl(`https://${domain}`);
  await resolveAndValidate(domain);

  const collectedAt = new Date().toISOString();
  const result: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  // Helper to resolve and store
  async function resolve(type: 'A' | 'AAAA' | 'MX' | 'NS' | 'TXT' | 'CNAME') {
    try {
      const records = await dns.resolve(domain, type);
      result[type] = records;
    } catch (e) {
      errors[type] = e instanceof Error ? e.message : String(e);
      result[type] = null;
    }
  }

  await Promise.all([resolve('A'), resolve('AAAA'), resolve('MX'), resolve('NS'), resolve('TXT'), resolve('CNAME')]);

  const normalized = JSON.stringify(result, null, 2);
  const provenance = { domain, collectedAt, resolver: 'dns', errors, raw: result };

  // Find or create Domain entity
  let entityId = input.entity_id;
  if (!entityId) {
    const existing = await prisma.entity.findFirst({ where: { case_id: caseId, type: 'DOMAIN', value: domain } });
    if (existing) entityId = existing.id;
    else {
      const created = await prisma.entity.create({
        data: { case_id: caseId, type: 'DOMAIN', value: domain, created_by: collectorId },
      });
      entityId = created.id;
      await prisma.timelineEvent.create({
        data: { case_id: caseId, entity_id: entityId, event_type: 'ENTITY_ADDED', title: `Domain entity added: ${domain}`, created_by: collectorId },
      });
    }
  }

  const evidence = await createIntelligenceEvidence(
    caseId,
    organizationId,
    collectorId,
    `dns://${domain}`,
    'DNS',
    normalized,
    'OBSERVED',
    provenance,
    entityId
  );

  // Create relationships for resolved IPs
  const aRecords = result['A'] as string[] | null;
  if (aRecords && aRecords.length > 0) {
    for (const ip of aRecords) {
      const ipEntity = await normalizeEntity(caseId, 'IP_ADDRESS', ip, { source: 'DNS' }, collectorId);
      if (ipEntity.id) {
        await createRelationship(
          caseId,
          entityId,
          ipEntity.id,
          'RESOLVES_TO',
          evidence.id,
          `DNS A record: ${domain} resolves to ${ip}`,
          90,
          `dns://${domain}`
        );
      }
    }
  }

  // Create relationships for nameservers
  const nsRecords = result['NS'] as string[] | null;
  if (nsRecords && nsRecords.length > 0) {
    for (const ns of nsRecords) {
      const nsEntity = await normalizeEntity(caseId, 'DOMAIN', ns, { source: 'DNS', role: 'nameserver' }, collectorId);
      if (nsEntity.id) {
        await createRelationship(
          caseId,
          entityId,
          nsEntity.id,
          'USES',
          evidence.id,
          `DNS NS record: ${domain} uses nameserver ${ns}`,
          90,
          `dns://${domain}`
        );
      }
    }
  }

  // Generate deterministic indicators
  const indicators: string[] = [];
  if (aRecords && aRecords.length > 3) {
    indicators.push('MULTIPLE_A_RECORDS');
    await createRiskIndicator(
      caseId,
      organizationId,
      'MULTIPLE_A_RECORDS',
      `Observed indicator: domain ${domain} resolves to ${aRecords.length} IPv4 addresses. This may indicate load balancing, CDN usage, or other infrastructure patterns.`,
      [evidence.id],
      60,
      { aRecordCount: aRecords.length, domain }
    );
  }

  if (nsRecords && nsRecords.length > 4) {
    indicators.push('MULTIPLE_NAMESERVERS');
    await createRiskIndicator(
      caseId,
      organizationId,
      'MULTIPLE_NAMESERVERS',
      `Observed indicator: domain ${domain} has ${nsRecords.length} nameservers. This may indicate distributed DNS infrastructure.`,
      [evidence.id],
      50,
      { nsRecordCount: nsRecords.length, domain }
    );
  }

  await createAuditLog({ organizationId, userId: collectorId, action: 'intelligence.dns', entityType: 'entity', entityId, caseId });
  await prisma.timelineEvent.create({
    data: { case_id: caseId, entity_id: entityId, evidence_id: evidence.id, event_type: 'DNS_COLLECTED', title: `DNS collected for ${domain}`, created_by: collectorId },
  });

  return { domain, result, evidenceId: evidence.id, collectedAt, indicators };
}

// RDAP intelligence
export async function collectRdap(caseId: string, organizationId: string, collectorId: string, input: RdapRequest) {
  const domain = input.domain.toLowerCase().trim();
  validateUrl(`https://${domain}`);
  await resolveAndValidate(domain);

  const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
  validateUrl(rdapUrl);

  let raw: string;
  let parsed: unknown;
  try {
    const res = await safeFetch(rdapUrl, { timeoutMs: 8000, maxResponseBytes: 1024 * 1024 });
    raw = res.body;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { raw };
    }
  } catch (e) {
    if (e instanceof SSRFError) throw e;
    throw new Error(`RDAP fetch failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  const normalized = JSON.stringify(parsed, null, 2);
  const provenance = { domain, sourceUrl: rdapUrl, collectedAt: new Date().toISOString(), provider: 'rdap.org' };

  let entityId = input.entity_id;
  if (!entityId) {
    const existing = await prisma.entity.findFirst({ where: { case_id: caseId, type: 'DOMAIN', value: domain } });
    if (existing) entityId = existing.id;
    else {
      const created = await prisma.entity.create({ data: { case_id: caseId, type: 'DOMAIN', value: domain, created_by: collectorId } });
      entityId = created.id;
    }
  }

  const evidence = await createIntelligenceEvidence(caseId, organizationId, collectorId, rdapUrl, 'RDAP', normalized, 'OBSERVED', provenance, entityId);

  // Extract registration information for indicators
  const rdapData = parsed as Record<string, unknown>;
  const events = rdapData['events'] as Array<{ eventAction: string; eventDate: string }> | undefined;
  const indicators: string[] = [];

  if (events) {
    const registrationEvent = events.find((e) => e.eventAction === 'registration');
    if (registrationEvent) {
      const regDate = new Date(registrationEvent.eventDate);
      const daysSinceRegistration = Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceRegistration < 30) {
        indicators.push('RECENT_DOMAIN_REGISTRATION');
        await createRiskIndicator(
          caseId,
          organizationId,
          'RECENT_DOMAIN_REGISTRATION',
          `Observed indicator: domain ${domain} was registered ${daysSinceRegistration} days ago. Recent domain registration may indicate newly established infrastructure.`,
          [evidence.id],
          70,
          { daysSinceRegistration, registrationDate: registrationEvent.eventDate, domain }
        );
      }
    }
  }

  await createAuditLog({ organizationId, userId: collectorId, action: 'intelligence.rdap', entityType: 'entity', entityId, caseId });
  await prisma.timelineEvent.create({ data: { case_id: caseId, entity_id: entityId, evidence_id: evidence.id, event_type: 'RDAP_COLLECTED', title: `RDAP collected for ${domain}`, created_by: collectorId } });

  return { domain, rdap: parsed, evidenceId: evidence.id, indicators };
}

// TLS intelligence
export async function collectTls(caseId: string, organizationId: string, collectorId: string, input: TlsRequest) {
  const hostname = input.hostname.toLowerCase().trim();
  validateUrl(`https://${hostname}`);
  await resolveAndValidate(hostname);

  const port = input.port || 443;

  // Use tls to fetch certificate
  const certInfo = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const socket = tls.connect(
      { host: hostname, port, servername: hostname, rejectUnauthorized: true },
      () => {
        try {
          const cert = socket.getPeerCertificate(true) as unknown as { subject: unknown; issuer: unknown; subjectaltname?: string; serialNumber: string; valid_from: string; valid_to: string; fingerprint: string; fingerprint256: string; raw?: Buffer };
          if (!cert || Object.keys(cert).length === 0) {
            reject(new Error('No certificate'));
            socket.end();
            return;
          }
          const info = {
            subject: cert.subject,
            issuer: cert.issuer,
            subjectaltname: cert.subjectaltname,
            serialNumber: cert.serialNumber,
            valid_from: cert.valid_from,
            valid_to: cert.valid_to,
            fingerprint: cert.fingerprint,
            fingerprint256: cert.fingerprint256,
            raw: cert.raw ? cert.raw.toString('base64').slice(0, 200) + '...' : undefined,
          };
          socket.end();
          resolve(info);
        } catch (e) {
          socket.destroy();
          reject(e);
        }
      }
    );
    socket.setTimeout(8000, () => {
      socket.destroy();
      reject(new Error('TLS timeout'));
    });
    socket.on('error', (err) => reject(err));
  });

  const normalized = JSON.stringify(certInfo, null, 2);
  const provenance = { hostname, port, collectedAt: new Date().toISOString(), provider: 'tls' };

  let entityId = input.entity_id;
  if (!entityId) {
    const existing = await prisma.entity.findFirst({ where: { case_id: caseId, type: 'DOMAIN', value: hostname } });
    if (existing) entityId = existing.id;
    else {
      const created = await prisma.entity.create({ data: { case_id: caseId, type: 'DOMAIN', value: hostname, created_by: collectorId } });
      entityId = created.id;
    }
  }

  const evidence = await createIntelligenceEvidence(
    caseId,
    organizationId,
    collectorId,
    `tls://${hostname}:${port}`,
    'TLS',
    normalized,
    'OBSERVED',
    provenance,
    entityId
  );

  // Generate deterministic indicators
  const indicators: string[] = [];
  const san = certInfo['subjectaltname'] as string | undefined;
  if (san) {
    const domains = san.split(',').map((d) => d.trim().replace(/^DNS:/, ''));
    if (domains.length > 10) {
      indicators.push('CERT_SAN_MANY');
      await createRiskIndicator(
        caseId,
        organizationId,
        'CERT_SAN_MANY',
        `Observed indicator: certificate for ${hostname} contains ${domains.length} Subject Alternative Names. This may indicate shared infrastructure or wildcard certificate usage.`,
        [evidence.id],
        60,
        { sanCount: domains.length, hostname, san }
      );
    }
  }

  await createAuditLog({ organizationId, userId: collectorId, action: 'intelligence.tls', entityType: 'entity', entityId, caseId });
  await prisma.timelineEvent.create({ data: { case_id: caseId, entity_id: entityId, evidence_id: evidence.id, event_type: 'TLS_COLLECTED', title: `TLS collected for ${hostname}`, created_by: collectorId } });

  return { hostname, cert: certInfo, evidenceId: evidence.id, indicators };
}

// URL intelligence
export async function collectUrl(caseId: string, organizationId: string, collectorId: string, input: UrlRequest) {
  const rawUrl = input.url.trim();
  const url = validateUrl(rawUrl);
  await resolveAndValidate(url.hostname);

  // Safe fetch with redirect chain
  const result = await safeFetch(rawUrl, { timeoutMs: 8000, maxRedirects: 5, maxResponseBytes: 1024 * 1024 });

  const parsed = {
    original: rawUrl,
    finalUrl: result.finalUrl,
    redirectChain: result.redirectChain,
    status: result.status,
    headers: result.headers,
  };

  const normalized = JSON.stringify(parsed, null, 2);
  const provenance = { url: rawUrl, collectedAt: new Date().toISOString(), provider: 'url-intel', redirectChain: result.redirectChain, status: result.status };

  let entityId = input.entity_id;
  if (!entityId) {
    const existing = await prisma.entity.findFirst({ where: { case_id: caseId, type: 'URL', value: rawUrl } });
    if (existing) entityId = existing.id;
    else {
      const created = await prisma.entity.create({ data: { case_id: caseId, type: 'URL', value: rawUrl, metadata: { finalUrl: result.finalUrl } as unknown as Prisma.InputJsonValue, created_by: collectorId } });
      entityId = created.id;
    }
  }

  const evidence = await createIntelligenceEvidence(caseId, organizationId, collectorId, rawUrl, 'URL', normalized, 'OBSERVED', provenance, entityId);

  // Create relationships for redirect chain
  const indicators: string[] = [];
  if (result.redirectChain.length > 0) {
    for (const redirect of result.redirectChain) {
      const redirectEntity = await normalizeEntity(caseId, 'URL', redirect.url, { redirectFrom: rawUrl }, collectorId);
      await createRelationship(
        caseId,
        entityId,
        redirectEntity.id,
        'LINKS_TO',
        evidence.id,
        `URL redirect: ${redirect.url} → ${redirect.status}`,
        90,
        rawUrl
      );
    }

    if (result.redirectChain.length > 3) {
      indicators.push('DOMAIN_REDIRECT_CHAIN');
      await createRiskIndicator(
        caseId,
        organizationId,
        'DOMAIN_REDIRECT_CHAIN',
        `Observed indicator: URL ${rawUrl} has a redirect chain of ${result.redirectChain.length} hops. This may indicate URL shortening, content delivery networks, or complex routing.`,
        [evidence.id],
        50,
        { redirectCount: result.redirectChain.length, url: rawUrl }
      );
    }
  }

  // Create relationship to domain
  const domainEntity = await normalizeEntity(caseId, 'DOMAIN', url.hostname || url.host || '', { source: 'URL' }, collectorId);
  await createRelationship(
    caseId,
    entityId,
    domainEntity.id,
    'HOSTED_ON',
    evidence.id,
    `URL ${rawUrl} is hosted on domain ${url.hostname || url.host}`,
    90,
    rawUrl
  );

  await createAuditLog({ organizationId, userId: collectorId, action: 'intelligence.url', entityType: 'entity', entityId, caseId });
  await prisma.timelineEvent.create({ data: { case_id: caseId, entity_id: entityId, evidence_id: evidence.id, event_type: 'URL_ANALYZED', title: `URL analyzed: ${rawUrl}`, created_by: collectorId } });

  return { url: rawUrl, parsed, evidenceId: evidence.id, indicators };
}

// Website metadata
export async function collectWebsite(caseId: string, organizationId: string, collectorId: string, input: WebsiteRequest) {
  const rawUrl = input.url.trim();
  const url = validateUrl(rawUrl);
  await resolveAndValidate(url.hostname);

  const result = await safeFetch(rawUrl, { timeoutMs: 10000, maxResponseBytes: 2 * 1024 * 1024 });

  // Parse title/meta from HTML (treat as untrusted)
  let title: string | null = null;
  let description: string | null = null;
  const headersRecord = result.headers as Record<string, string>;
  if (headersRecord['content-type']?.includes('text/html') && result.body) {
    const titleMatch = result.body.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) title = titleMatch[1]?.trim().slice(0, 500) || null;
    const descMatch = result.body.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    if (descMatch) description = descMatch[1]?.trim().slice(0, 500) || null;
  }

  // Extract security headers
  const securityHeaders = {
    'strict-transport-security': headersRecord['strict-transport-security'],
    'content-security-policy': headersRecord['content-security-policy'],
    'x-content-type-options': headersRecord['x-content-type-options'],
    'x-frame-options': headersRecord['x-frame-options'],
    'referrer-policy': headersRecord['referrer-policy'],
    'permissions-policy': headersRecord['permissions-policy'],
  };

  const normalized = JSON.stringify(
    {
      url: rawUrl,
      finalUrl: result.finalUrl,
      status: result.status,
      contentType: headersRecord['content-type'],
      title,
      description,
      headers: { 'content-type': headersRecord['content-type'], 'server': headersRecord['server'], ...securityHeaders },
      bodyLength: result.body.length,
      redirectChain: result.redirectChain,
    },
    null,
    2
  );

  const provenance = { url: rawUrl, collectedAt: new Date().toISOString(), provider: 'website', status: result.status, finalUrl: result.finalUrl };

  let entityId = input.entity_id;
  if (!entityId) {
    const entity = await normalizeEntity(caseId, 'WEBSITE', rawUrl, { title, finalUrl: result.finalUrl }, collectorId);
    entityId = entity.id;
  }

  const evidence = await createIntelligenceEvidence(caseId, organizationId, collectorId, rawUrl, 'WEBSITE', normalized, 'OBSERVED', provenance, entityId);

  // Generate deterministic indicators
  const indicators: string[] = [];
  const missingSecurityHeaders = Object.entries(securityHeaders).filter(([_, value]) => !value).map(([key]) => key);
  
  if (missingSecurityHeaders.length > 2) {
    indicators.push('MISSING_SECURITY_HEADERS');
    await createRiskIndicator(
      caseId,
      organizationId,
      'MISSING_SECURITY_HEADERS',
      `Observed indicator: website ${rawUrl} is missing ${missingSecurityHeaders.length} recommended security headers (${missingSecurityHeaders.join(', ')}). This may indicate incomplete security configuration.`,
      [evidence.id],
      40,
      { missingHeaders: missingSecurityHeaders, url: rawUrl }
    );
  }

  await createAuditLog({ organizationId, userId: collectorId, action: 'intelligence.website', entityType: 'entity', entityId, caseId });
  await prisma.timelineEvent.create({ data: { case_id: caseId, entity_id: entityId, evidence_id: evidence.id, event_type: 'WEBSITE_ANALYZED', title: `Website metadata collected: ${rawUrl}`, created_by: collectorId } });

  return { url: rawUrl, title, description, status: result.status, finalUrl: result.finalUrl, evidenceId: evidence.id, indicators };
}

// List intelligence
export async function listIntelligence(caseId: string, organizationId: string) {
  const c = await prisma.case.findFirst({ where: { id: caseId, organization_id: organizationId, deleted_at: null } });
  if (!c) throw new Error('Case not found');
  const evidence = await prisma.evidence.findMany({
    where: { case_id: caseId, source_type: { in: ['DNS', 'RDAP', 'TLS', 'URL', 'WEBSITE'] }, deleted_at: null },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
  return evidence;
}
