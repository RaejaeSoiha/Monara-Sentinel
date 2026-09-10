// Auth schemas - Zod validation for Monara Sentinel
// SCAMNET internal auth - secure by design

import { z } from 'zod';

// Password: min 12 chars, require complexity per SECURITY_PLAN.md:55
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

export const registerSchema = z.object({
  email: z.string().email('Invalid email').max(255),
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
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
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
