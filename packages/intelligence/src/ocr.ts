import { Prisma } from '@prisma/client';
import { prisma } from '@monara-sentinel/database';

export interface OCRResult {
  text: string;
  confidence: number;
  extracted: {
    urls: string[];
    domains: string[];
    emails: string[];
    phones: string[];
    usernames: string[];
    crypto_addresses: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
  };
}

/**
 * Extract URLs from text
 */
function extractUrls(text: string): string[] {
  const urlPattern = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi;
  return text.match(urlPattern) || [];
}

/**
 * Extract domains from text
 */
function extractDomains(text: string): string[] {
  const domainPattern = /\b[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}\b/g;
  return text.match(domainPattern) || [];
}

/**
 * Extract emails from text
 */
function extractEmails(text: string): string[] {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return text.match(emailPattern) || [];
}

/**
 * Extract phone numbers from text
 */
function extractPhones(text: string): string[] {
  const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\+\d{1,3}[- ]?\d{3}[- ]?\d{3}[- ]?\d{4}\b/g;
  return text.match(phonePattern) || [];
}

/**
 * Extract potential usernames from text
 */
function extractUsernames(text: string): string[] {
  const usernamePattern = /@[\w.]+|[\w]{3,20}/g;
  const matches = text.match(usernamePattern) || [];
  return matches.filter(m => m.startsWith('@') || /^[a-zA-Z0-9_]{3,20}$/.test(m));
}

/**
 * Extract potential crypto addresses from text
 */
function extractCryptoAddresses(text: string): string[] {
  // Bitcoin-like addresses
  const btcPattern = /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g;
  // Ethereum-like addresses
  const ethPattern = /\b0x[a-fA-F0-9]{40}\b/g;
  return [...(text.match(btcPattern) || []), ...(text.match(ethPattern) || [])];
}

/**
 * Extract potential organization names from text
 */
function extractOrganizations(text: string): string[] {
  const orgPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\s+(?:Inc|Corp|LLC|Ltd|Company|Bank|Foundation|Institute)\b/g;
  return text.match(orgPattern) || [];
}

/**
 * Extract potential locations from text
 */
function extractLocations(text: string): string[] {
  const locationPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2})?\b/g;
  return text.match(locationPattern) || [];
}

/**
 * Extract potential dates from text
 */
function extractDates(text: string): string[] {
  const datePattern = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi;
  return text.match(datePattern) || [];
}

/**
 * Perform OCR text analysis and entity extraction
 */
export async function performOCR(
  caseId: string,
  _organizationId: string,
  userId: string,
  _evidenceId: string,
  imageAnalysisId: string,
  text: string
): Promise<OCRResult> {
  const extracted = {
    urls: extractUrls(text),
    domains: extractDomains(text),
    emails: extractEmails(text),
    phones: extractPhones(text),
    usernames: extractUsernames(text),
    crypto_addresses: extractCryptoAddresses(text),
    organizations: extractOrganizations(text),
    locations: extractLocations(text),
    dates: extractDates(text),
  };

  // Create OCR evidence
  const ocrEvidence = await prisma.evidence.create({
    data: {
      case_id: caseId,
      source_type: 'OCR',
      source_title: 'OCR Analysis',
      content: text,
      excerpt: text.slice(0, 500),
      collection_method: 'ocr',
      collector_id: userId,
      confidence: 70,
      verification_status: 'OBSERVED',
      provenance: {
        source: 'image_ocr',
        image_analysis_id: imageAnalysisId,
        extracted_entities: extracted,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  // Create entities for extracted data
  const entityCreations = [];

  // URL entities
  for (const url of extracted.urls) {
    const entity = await prisma.entity.findFirst({
      where: { case_id: caseId, type: 'URL', value: url },
    });
    if (!entity) {
      const created = await prisma.entity.create({
        data: {
          case_id: caseId,
          type: 'URL',
          value: url,
          display_name: url,
          metadata: { source: 'ocr', confidence: 70 } as unknown as Prisma.InputJsonValue,
          created_by: userId,
        },
      });
      entityCreations.push(created);
      await prisma.entityEvidence.create({
        data: { entity_id: created.id, evidence_id: ocrEvidence.id },
      });
    }
  }

  // Domain entities
  for (const domain of extracted.domains) {
    const entity = await prisma.entity.findFirst({
      where: { case_id: caseId, type: 'DOMAIN', value: domain.toLowerCase() },
    });
    if (!entity) {
      const created = await prisma.entity.create({
        data: {
          case_id: caseId,
          type: 'DOMAIN',
          value: domain.toLowerCase(),
          display_name: domain,
          metadata: { source: 'ocr', confidence: 70 } as unknown as Prisma.InputJsonValue,
          created_by: userId,
        },
      });
      entityCreations.push(created);
      await prisma.entityEvidence.create({
        data: { entity_id: created.id, evidence_id: ocrEvidence.id },
      });
    }
  }

  // Email entities
  for (const email of extracted.emails) {
    const entity = await prisma.entity.findFirst({
      where: { case_id: caseId, type: 'EMAIL', value: email.toLowerCase() },
    });
    if (!entity) {
      const created = await prisma.entity.create({
        data: {
          case_id: caseId,
          type: 'EMAIL',
          value: email.toLowerCase(),
          display_name: email,
          metadata: { source: 'ocr', confidence: 70 } as unknown as Prisma.InputJsonValue,
          created_by: userId,
        },
      });
      entityCreations.push(created);
      await prisma.entityEvidence.create({
        data: { entity_id: created.id, evidence_id: ocrEvidence.id },
      });
    }
  }

  // Phone entities
  for (const phone of extracted.phones) {
    const entity = await prisma.entity.findFirst({
      where: { case_id: caseId, type: 'PHONE', value: phone },
    });
    if (!entity) {
      const created = await prisma.entity.create({
        data: {
          case_id: caseId,
          type: 'PHONE',
          value: phone,
          display_name: phone,
          metadata: { source: 'ocr', confidence: 70 } as unknown as Prisma.InputJsonValue,
          created_by: userId,
        },
      });
      entityCreations.push(created);
      await prisma.entityEvidence.create({
        data: { entity_id: created.id, evidence_id: ocrEvidence.id },
      });
    }
  }

  // Username entities
  for (const username of extracted.usernames) {
    const normalized = username.startsWith('@') ? username.substring(1) : username;
    const entity = await prisma.entity.findFirst({
      where: { case_id: caseId, type: 'USERNAME', value: normalized.toLowerCase() },
    });
    if (!entity) {
      const created = await prisma.entity.create({
        data: {
          case_id: caseId,
          type: 'USERNAME',
          value: normalized.toLowerCase(),
          display_name: username,
          metadata: { source: 'ocr', confidence: 60 } as unknown as Prisma.InputJsonValue,
          created_by: userId,
        },
      });
      entityCreations.push(created);
      await prisma.entityEvidence.create({
        data: { entity_id: created.id, evidence_id: ocrEvidence.id },
      });
    }
  }

  // Crypto address entities
  for (const crypto of extracted.crypto_addresses) {
    const entity = await prisma.entity.findFirst({
      where: { case_id: caseId, type: 'CRYPTO_ADDRESS', value: crypto },
    });
    if (!entity) {
      const created = await prisma.entity.create({
        data: {
          case_id: caseId,
          type: 'CRYPTO_ADDRESS',
          value: crypto,
          display_name: crypto,
          metadata: { source: 'ocr', confidence: 70 } as unknown as Prisma.InputJsonValue,
          created_by: userId,
        },
      });
      entityCreations.push(created);
      await prisma.entityEvidence.create({
        data: { entity_id: created.id, evidence_id: ocrEvidence.id },
      });
    }
  }

  // Create OCR timeline event
  await prisma.timelineEvent.create({
    data: {
      case_id: caseId,
      evidence_id: ocrEvidence.id,
      event_type: 'OCR_COMPLETED',
      title: 'OCR analysis completed',
      description: `Extracted ${extracted.urls.length} URLs, ${extracted.emails.length} emails, ${extracted.phones.length} phone numbers, ${extracted.usernames.length} usernames.`,
      created_by: userId,
    },
  });

  // Create relationships between image and extracted entities
  const imageEntity = await prisma.entity.findFirst({
    where: { case_id: caseId, type: 'IMAGE' },
  });

  if (imageEntity) {
    for (const entity of entityCreations) {
      await prisma.relationship.create({
        data: {
          case_id: caseId,
          source_entity_id: imageEntity.id,
          target_entity_id: entity.id,
          type: 'ASSOCIATED_WITH',
          confidence: 70,
          evidence_id: ocrEvidence.id,
          explanation: 'Entity extracted from image OCR analysis',
          created_by: userId,
        },
      });
    }
  }

  return {
    text,
    confidence: 70,
    extracted,
  };
}
