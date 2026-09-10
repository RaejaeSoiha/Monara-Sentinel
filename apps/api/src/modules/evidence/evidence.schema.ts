import { z } from 'zod';

export const verificationStatusSchema = z.enum(['OBSERVED', 'VERIFIED', 'CORROBORATED', 'INFERENCE', 'HYPOTHESIS', 'UNKNOWN']);

export const createEvidenceSchema = z.object({
  source_url: z.string().url().max(2000).optional().nullable(),
  source_type: z.string().max(100).optional().nullable(),
  source_title: z.string().max(500).optional().nullable(),
  observed_at: z.string().datetime().optional().nullable(),
  content: z.string().max(100000).optional().nullable(),
  excerpt: z.string().max(5000).optional().nullable(),
  artifact_url: z.string().url().max(2000).optional().nullable(),
  sha256: z.string().regex(/^[a-fA-F0-9]{64}$/).optional().nullable(),
  mime_type: z.string().max(100).optional().nullable(),
  collection_method: z.string().max(100).optional().nullable(),
  confidence: z.number().int().min(0).max(100).optional(),
  verification_status: verificationStatusSchema.optional(),
  provenance: z.record(z.unknown()).optional().nullable(),
  entity_ids: z.array(z.string().cuid()).max(50).optional(),
});

export const updateEvidenceSchema = z.object({
  source_url: z.string().url().max(2000).optional().nullable(),
  source_type: z.string().max(100).optional().nullable(),
  source_title: z.string().max(500).optional().nullable(),
  confidence: z.number().int().min(0).max(100).optional(),
  verification_status: verificationStatusSchema.optional(),
  excerpt: z.string().max(5000).optional().nullable(),
  provenance: z.record(z.unknown()).optional().nullable(),
});

export const associateEntitySchema = z.object({
  entity_id: z.string().cuid(),
});

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
export type UpdateEvidenceInput = z.infer<typeof updateEvidenceSchema>;
export type AssociateEntityInput = z.infer<typeof associateEntitySchema>;
