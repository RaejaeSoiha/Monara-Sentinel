import { z } from 'zod';
import { dnsRequestSchema, rdapRequestSchema, tlsRequestSchema, urlRequestSchema, websiteRequestSchema } from '@monara-sentinel/intelligence';

export const submitDnsSchema = z.object({
  domain: dnsRequestSchema.shape.domain,
  entity_id: dnsRequestSchema.shape.entity_id,
});

export const submitRdapSchema = z.object({
  domain: rdapRequestSchema.shape.domain,
  entity_id: rdapRequestSchema.shape.entity_id,
});

export const submitTlsSchema = z.object({
  hostname: tlsRequestSchema.shape.hostname,
  port: tlsRequestSchema.shape.port,
  entity_id: tlsRequestSchema.shape.entity_id,
});

export const submitUrlSchema = z.object({
  url: urlRequestSchema.shape.url,
  entity_id: urlRequestSchema.shape.entity_id,
});

export const submitWebsiteSchema = z.object({
  url: websiteRequestSchema.shape.url,
  entity_id: websiteRequestSchema.shape.entity_id,
});

export type SubmitDnsInput = z.infer<typeof submitDnsSchema>;
export type SubmitRdapInput = z.infer<typeof submitRdapSchema>;
export type SubmitTlsInput = z.infer<typeof submitTlsSchema>;
export type SubmitUrlInput = z.infer<typeof submitUrlSchema>;
export type SubmitWebsiteInput = z.infer<typeof submitWebsiteSchema>;
