import { z } from 'zod';

export const investigationStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']);
export const caseSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const casePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const createInvestigationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  status: investigationStatusSchema.optional(),
  severity: caseSeveritySchema.optional(),
  priority: casePrioritySchema.optional(),
  assigned_to: z.string().cuid().optional().nullable(),
});

export const updateInvestigationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: investigationStatusSchema.optional(),
  severity: caseSeveritySchema.optional(),
  priority: casePrioritySchema.optional(),
  assigned_to: z.string().cuid().optional().nullable(),
});

export type CreateInvestigationInput = z.infer<typeof createInvestigationSchema>;
export type UpdateInvestigationInput = z.infer<typeof updateInvestigationSchema>;
