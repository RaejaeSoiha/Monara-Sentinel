import { z } from 'zod';

export const timelineEventTypeSchema = z.enum([
  'CASE_CREATED',
  'CASE_UPDATED',
  'CASE_STATUS_CHANGED',
  'INVESTIGATION_CREATED',
  'INVESTIGATION_UPDATED',
  'ENTITY_ADDED',
  'ENTITY_UPDATED',
  'EVIDENCE_COLLECTED',
  'EVIDENCE_VERIFIED',
  'EVIDENCE_ASSOCIATED',
  'EVIDENCE_DISSOCIATED',
  'RELATIONSHIP_CREATED',
  'RELATIONSHIP_UPDATED',
  'ANALYST_NOTE',
  'ASSIGNMENT_CHANGED',
  'RISK_ASSESSMENT',
  'REPORT_GENERATED',
  'STATUS_CHANGED',
  'INTELLIGENCE_REQUESTED',
  'DNS_COLLECTED',
  'RDAP_COLLECTED',
  'TLS_COLLECTED',
  'URL_ANALYZED',
  'WEBSITE_ANALYZED',
  'INDICATOR_CREATED',
]);

export const createTimelineEventSchema = z.object({
  event_type: timelineEventTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  entity_id: z.string().cuid().optional().nullable(),
  evidence_id: z.string().cuid().optional().nullable(),
  occurred_at: z.string().datetime().optional(),
});

export type CreateTimelineEventInput = z.infer<typeof createTimelineEventSchema>;
