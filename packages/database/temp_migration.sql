-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CaseSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PERSON', 'ORGANIZATION', 'USERNAME', 'EMAIL', 'PHONE', 'DOMAIN', 'URL', 'IP_ADDRESS', 'WEBSITE', 'SOCIAL_PROFILE', 'CRYPTO_ADDRESS', 'PAYMENT_IDENTIFIER');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('USES', 'OWNS', 'MENTIONS', 'LINKS_TO', 'HOSTED_ON', 'RESOLVES_TO', 'REDIRECTS_TO', 'SHARES', 'REUSES', 'REFERENCES', 'ASSOCIATED_WITH', 'POSSIBLY_ASSOCIATED_WITH');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISPUTED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "EvidenceVerificationStatus" AS ENUM ('OBSERVED', 'VERIFIED', 'CORROBORATED', 'INFERENCE', 'HYPOTHESIS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('CASE_CREATED', 'CASE_UPDATED', 'CASE_STATUS_CHANGED', 'INVESTIGATION_CREATED', 'INVESTIGATION_UPDATED', 'ENTITY_ADDED', 'ENTITY_UPDATED', 'EVIDENCE_COLLECTED', 'EVIDENCE_VERIFIED', 'EVIDENCE_ASSOCIATED', 'EVIDENCE_DISSOCIATED', 'RELATIONSHIP_CREATED', 'RELATIONSHIP_UPDATED', 'ANALYST_NOTE', 'ASSIGNMENT_CHANGED', 'RISK_ASSESSMENT', 'REPORT_GENERATED', 'STATUS_CHANGED', 'INTELLIGENCE_REQUESTED', 'DNS_COLLECTED', 'RDAP_COLLECTED', 'TLS_COLLECTED', 'URL_ANALYZED', 'WEBSITE_ANALYZED', 'INDICATOR_CREATED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "case_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "CaseSeverity" NOT NULL DEFAULT 'MEDIUM',
    "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assigned_to" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'ACTIVE',
    "severity" "CaseSeverity" NOT NULL DEFAULT 'MEDIUM',
    "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "case_id" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "value" TEXT NOT NULL,
    "display_name" TEXT,
    "metadata" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_evidence" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "source_entity_id" TEXT NOT NULL,
    "target_entity_id" TEXT NOT NULL,
    "type" "RelationshipType" NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "status" "RelationshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "first_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidence_id" TEXT,
    "source_url" TEXT,
    "explanation" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "source_url" TEXT,
    "source_type" TEXT,
    "source_title" TEXT,
    "observed_at" TIMESTAMP(3),
    "retrieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT,
    "excerpt" TEXT,
    "artifact_url" TEXT,
    "sha256" TEXT,
    "mime_type" TEXT,
    "collection_method" TEXT,
    "collector_id" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "verification_status" "EvidenceVerificationStatus" NOT NULL DEFAULT 'OBSERVED',
    "provenance" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "entity_id" TEXT,
    "evidence_id" TEXT,
    "event_type" "TimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intelligence_jobs" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "result" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intelligence_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_indicators" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "indicator_type" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "evidence_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "calculation" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_deleted_at_idx" ON "organizations"("deleted_at");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE INDEX "memberships_organization_id_idx" ON "memberships"("organization_id");

-- CreateIndex
CREATE INDEX "memberships_role_id_idx" ON "memberships"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_organization_id_key" ON "memberships"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_hash_idx" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "cases_organization_id_idx" ON "cases"("organization_id");

-- CreateIndex
CREATE INDEX "cases_case_number_idx" ON "cases"("case_number");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_severity_idx" ON "cases"("severity");

-- CreateIndex
CREATE INDEX "cases_priority_idx" ON "cases"("priority");

-- CreateIndex
CREATE INDEX "cases_assigned_to_idx" ON "cases"("assigned_to");

-- CreateIndex
CREATE INDEX "cases_created_by_idx" ON "cases"("created_by");

-- CreateIndex
CREATE INDEX "cases_deleted_at_idx" ON "cases"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "cases_organization_id_case_number_key" ON "cases"("organization_id", "case_number");

-- CreateIndex
CREATE INDEX "investigations_case_id_idx" ON "investigations"("case_id");

-- CreateIndex
CREATE INDEX "investigations_status_idx" ON "investigations"("status");

-- CreateIndex
CREATE INDEX "investigations_assigned_to_idx" ON "investigations"("assigned_to");

-- CreateIndex
CREATE INDEX "investigations_created_by_idx" ON "investigations"("created_by");

-- CreateIndex
CREATE INDEX "investigations_deleted_at_idx" ON "investigations"("deleted_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_case_id_idx" ON "audit_logs"("case_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "entities_case_id_idx" ON "entities"("case_id");

-- CreateIndex
CREATE INDEX "entities_type_idx" ON "entities"("type");

-- CreateIndex
CREATE INDEX "entities_value_idx" ON "entities"("value");

-- CreateIndex
CREATE INDEX "entities_created_by_idx" ON "entities"("created_by");

-- CreateIndex
CREATE INDEX "entities_deleted_at_idx" ON "entities"("deleted_at");

-- CreateIndex
CREATE INDEX "entity_evidence_entity_id_idx" ON "entity_evidence"("entity_id");

-- CreateIndex
CREATE INDEX "entity_evidence_evidence_id_idx" ON "entity_evidence"("evidence_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_evidence_entity_id_evidence_id_key" ON "entity_evidence"("entity_id", "evidence_id");

-- CreateIndex
CREATE INDEX "relationships_case_id_idx" ON "relationships"("case_id");

-- CreateIndex
CREATE INDEX "relationships_source_entity_id_idx" ON "relationships"("source_entity_id");

-- CreateIndex
CREATE INDEX "relationships_target_entity_id_idx" ON "relationships"("target_entity_id");

-- CreateIndex
CREATE INDEX "relationships_type_idx" ON "relationships"("type");

-- CreateIndex
CREATE INDEX "relationships_confidence_idx" ON "relationships"("confidence");

-- CreateIndex
CREATE INDEX "relationships_status_idx" ON "relationships"("status");

-- CreateIndex
CREATE INDEX "relationships_created_by_idx" ON "relationships"("created_by");

-- CreateIndex
CREATE INDEX "relationships_deleted_at_idx" ON "relationships"("deleted_at");

-- CreateIndex
CREATE INDEX "evidence_case_id_idx" ON "evidence"("case_id");

-- CreateIndex
CREATE INDEX "evidence_sha256_idx" ON "evidence"("sha256");

-- CreateIndex
CREATE INDEX "evidence_source_type_idx" ON "evidence"("source_type");

-- CreateIndex
CREATE INDEX "evidence_verification_status_idx" ON "evidence"("verification_status");

-- CreateIndex
CREATE INDEX "evidence_collector_id_idx" ON "evidence"("collector_id");

-- CreateIndex
CREATE INDEX "evidence_deleted_at_idx" ON "evidence"("deleted_at");

-- CreateIndex
CREATE INDEX "timeline_events_case_id_idx" ON "timeline_events"("case_id");

-- CreateIndex
CREATE INDEX "timeline_events_entity_id_idx" ON "timeline_events"("entity_id");

-- CreateIndex
CREATE INDEX "timeline_events_evidence_id_idx" ON "timeline_events"("evidence_id");

-- CreateIndex
CREATE INDEX "timeline_events_event_type_idx" ON "timeline_events"("event_type");

-- CreateIndex
CREATE INDEX "timeline_events_occurred_at_idx" ON "timeline_events"("occurred_at");

-- CreateIndex
CREATE INDEX "timeline_events_created_by_idx" ON "timeline_events"("created_by");

-- CreateIndex
CREATE INDEX "intelligence_jobs_case_id_idx" ON "intelligence_jobs"("case_id");

-- CreateIndex
CREATE INDEX "intelligence_jobs_organization_id_idx" ON "intelligence_jobs"("organization_id");

-- CreateIndex
CREATE INDEX "intelligence_jobs_user_id_idx" ON "intelligence_jobs"("user_id");

-- CreateIndex
CREATE INDEX "intelligence_jobs_status_idx" ON "intelligence_jobs"("status");

-- CreateIndex
CREATE INDEX "intelligence_jobs_type_idx" ON "intelligence_jobs"("type");

-- CreateIndex
CREATE INDEX "intelligence_jobs_created_at_idx" ON "intelligence_jobs"("created_at");

-- CreateIndex
CREATE INDEX "risk_indicators_case_id_idx" ON "risk_indicators"("case_id");

-- CreateIndex
CREATE INDEX "risk_indicators_organization_id_idx" ON "risk_indicators"("organization_id");

-- CreateIndex
CREATE INDEX "risk_indicators_indicator_type_idx" ON "risk_indicators"("indicator_type");

-- CreateIndex
CREATE INDEX "risk_indicators_confidence_idx" ON "risk_indicators"("confidence");

-- CreateIndex
CREATE INDEX "risk_indicators_created_by_idx" ON "risk_indicators"("created_by");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_evidence" ADD CONSTRAINT "entity_evidence_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_evidence" ADD CONSTRAINT "entity_evidence_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_source_entity_id_fkey" FOREIGN KEY ("source_entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_target_entity_id_fkey" FOREIGN KEY ("target_entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intelligence_jobs" ADD CONSTRAINT "intelligence_jobs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intelligence_jobs" ADD CONSTRAINT "intelligence_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intelligence_jobs" ADD CONSTRAINT "intelligence_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_indicators" ADD CONSTRAINT "risk_indicators_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_indicators" ADD CONSTRAINT "risk_indicators_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_indicators" ADD CONSTRAINT "risk_indicators_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

