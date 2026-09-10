// Domain types and interfaces for Monara Sentinel - SCAMNET internal

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  role_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: Date;
  updated_at: Date;
}

export interface Case {
  id: string;
  organization_id: string;
  case_number: string;
  name: string;
  description: string | null;
  status: CaseStatus;
  severity: CaseSeverity;
  priority: CasePriority;
  tags: string[];
  assigned_to: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
  deleted_at: Date | null;
}

export interface Investigation {
  id: string;
  case_id: string;
  name: string;
  description: string | null;
  status: InvestigationStatus;
  severity: CaseSeverity;
  priority: CasePriority;
  assigned_to: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
  deleted_at: Date | null;
}

export interface Entity {
  id: string;
  case_id: string;
  type: EntityType;
  value: string;
  display_name: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Relationship {
  id: string;
  case_id: string;
  source_entity_id: string;
  target_entity_id: string;
  type: RelationshipType;
  confidence: number;
  status: RelationshipStatus;
  first_seen: Date;
  last_seen: Date;
  evidence_id: string | null;
  source_url: string | null;
  explanation: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Evidence {
  id: string;
  case_id: string;
  source_url: string | null;
  source_type: string | null;
  source_title: string | null;
  observed_at: Date | null;
  retrieved_at: Date;
  content: string | null;
  excerpt: string | null;
  artifact_url: string | null;
  sha256: string | null;
  mime_type: string | null;
  collection_method: string | null;
  collector_id: string;
  confidence: number;
  verification_status: EvidenceVerificationStatus;
  provenance: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface TimelineEvent {
  id: string;
  case_id: string;
  entity_id: string | null;
  evidence_id: string | null;
  event_type: TimelineEventType;
  title: string;
  description: string | null;
  occurred_at: Date;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export enum CaseStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum CasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum CaseSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum InvestigationStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum RoleName {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  INVESTIGATOR = 'INVESTIGATOR',
  VIEWER = 'VIEWER',
}

export enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  USERNAME = 'USERNAME',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  DOMAIN = 'DOMAIN',
  URL = 'URL',
  IP_ADDRESS = 'IP_ADDRESS',
  WEBSITE = 'WEBSITE',
  SOCIAL_PROFILE = 'SOCIAL_PROFILE',
  CRYPTO_ADDRESS = 'CRYPTO_ADDRESS',
  PAYMENT_IDENTIFIER = 'PAYMENT_IDENTIFIER',
}

export enum RelationshipType {
  USES = 'USES',
  OWNS = 'OWNS',
  MENTIONS = 'MENTIONS',
  LINKS_TO = 'LINKS_TO',
  HOSTED_ON = 'HOSTED_ON',
  RESOLVES_TO = 'RESOLVES_TO',
  SHARES = 'SHARES',
  REUSES = 'REUSES',
  REFERENCES = 'REFERENCES',
  ASSOCIATED_WITH = 'ASSOCIATED_WITH',
  POSSIBLY_ASSOCIATED_WITH = 'POSSIBLY_ASSOCIATED_WITH',
}

export enum RelationshipStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISPUTED = 'DISPUTED',
  CONFIRMED = 'CONFIRMED',
}

export enum EvidenceVerificationStatus {
  OBSERVED = 'OBSERVED',
  VERIFIED = 'VERIFIED',
  CORROBORATED = 'CORROBORATED',
  INFERENCE = 'INFERENCE',
  HYPOTHESIS = 'HYPOTHESIS',
  UNKNOWN = 'UNKNOWN',
}

export enum TimelineEventType {
  CASE_CREATED = 'CASE_CREATED',
  CASE_UPDATED = 'CASE_UPDATED',
  CASE_STATUS_CHANGED = 'CASE_STATUS_CHANGED',
  INVESTIGATION_CREATED = 'INVESTIGATION_CREATED',
  INVESTIGATION_UPDATED = 'INVESTIGATION_UPDATED',
  ENTITY_ADDED = 'ENTITY_ADDED',
  ENTITY_UPDATED = 'ENTITY_UPDATED',
  EVIDENCE_COLLECTED = 'EVIDENCE_COLLECTED',
  EVIDENCE_VERIFIED = 'EVIDENCE_VERIFIED',
  RELATIONSHIP_CREATED = 'RELATIONSHIP_CREATED',
  RELATIONSHIP_UPDATED = 'RELATIONSHIP_UPDATED',
  ANALYST_NOTE = 'ANALYST_NOTE',
  ASSIGNMENT_CHANGED = 'ASSIGNMENT_CHANGED',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  REPORT_GENERATED = 'REPORT_GENERATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
}
