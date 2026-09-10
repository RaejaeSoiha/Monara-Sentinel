import { z } from 'zod';

export const relationshipTypeSchema = z.enum([
  'USES',
  'OWNS',
  'MENTIONS',
  'LINKS_TO',
  'HOSTED_ON',
  'RESOLVES_TO',
  'SHARES',
  'REUSES',
  'REFERENCES',
  'ASSOCIATED_WITH',
  'POSSIBLY_ASSOCIATED_WITH',
]);

export const createRelationshipSchema = z.object({
  source_entity_id: z.string().cuid(),
  target_entity_id: z.string().cuid(),
  type: relationshipTypeSchema,
  confidence: z.number().int().min(0).max(100).default(50),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISPUTED', 'CONFIRMED']).optional(),
  evidence_id: z.string().cuid().optional().nullable(),
  source_url: z.string().url().optional().nullable(),
  explanation: z.string().max(2000).optional().nullable(),
});

export const updateRelationshipSchema = z.object({
  type: relationshipTypeSchema.optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISPUTED', 'CONFIRMED']).optional(),
  evidence_id: z.string().cuid().optional().nullable(),
  source_url: z.string().url().optional().nullable(),
  explanation: z.string().max(2000).optional().nullable(),
});

export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;
export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>;
