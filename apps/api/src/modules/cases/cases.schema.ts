import { z } from 'zod';

export const caseStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED']);
export const caseSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const casePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const createCaseSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  status: caseStatusSchema.optional(),
  severity: caseSeveritySchema.optional(),
  priority: casePrioritySchema.optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  assigned_to: z.string().cuid().optional().nullable(),
});

export const updateCaseSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: caseStatusSchema.optional(),
  severity: caseSeveritySchema.optional(),
  priority: casePrioritySchema.optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  assigned_to: z.string().cuid().optional().nullable(),
});

export const caseQuerySchema = z.object({
  status: caseStatusSchema.optional(),
  severity: caseSeveritySchema.optional(),
  priority: casePrioritySchema.optional(),
  assigned_to: z.string().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type CaseQuery = z.infer<typeof caseQuerySchema>;
