// Auth schemas - Zod validation for Monara Sentinel
// SCAMNET internal auth - secure by design

import { z } from 'zod';

// Password: min 4 chars for demo (reduced from 12 for development)
export const passwordSchema = z
  .string()
  .min(4, 'Password must be at least 4 characters')
  .max(128, 'Password must be at most 128 characters');

export const registerSchema = z.object({
  email: z.string().min(1).max(255), // Accept email or username
  password: passwordSchema,
  name: z.string().min(1).max(100).optional(),
  organizationName: z.string().min(1).max(100).optional(),
  organizationSlug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().min(1).max(255), // Accept email or username
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().min(1).max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const meResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    avatar_url: z.string().nullable(),
  }),
  memberships: z.array(
    z.object({
      organization: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
      }),
      role: z.object({
        id: z.string(),
        name: z.string(),
      }),
    })
  ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
