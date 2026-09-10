import { z } from 'zod';

export const entityTypeSchema = z.enum([
  'PERSON',
  'ORGANIZATION',
  'USERNAME',
  'EMAIL',
  'PHONE',
  'DOMAIN',
  'URL',
  'IP_ADDRESS',
  'WEBSITE',
  'SOCIAL_PROFILE',
  'CRYPTO_ADDRESS',
  'PAYMENT_IDENTIFIER',
]);

export const createEntitySchema = z.object({
  type: entityTypeSchema,
  value: z.string().min(1).max(500),
  display_name: z.string().max(200).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const updateEntitySchema = z.object({
  value: z.string().min(1).max(500).optional(),
  display_name: z.string().max(200).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;
