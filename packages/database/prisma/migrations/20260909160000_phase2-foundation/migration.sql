-- CreateEnum
CREATE TYPE "CaseSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PERSON', 'ORGANIZATION', 'USERNAME', 'EMAIL', 'PHONE', 'DOMAIN', 'URL', 'IP_ADDRESS', 'WEBSITE', 'SOCIAL_PROFILE', 'CRYPTO_ADDRESS', 'PAYMENT_IDENTIFIER');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('USES', 'OWNS', 'MENTIONS', 'LINKS_TO', 'HOSTED_ON', 'RESOLVES_TO', 'SHARES', 'REUSES', 'REFERENCES', 'ASSOCIATED_WITH', 'POSSIBLY_ASSOCIATED_WITH');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISPUTED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "EvidenceVerificationStatus" AS ENUM ('OBSERVED', 'VERIFIED', 'CORROBORATED', 'INFERENCE', 'HYPOTHESIS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('CASE_CREATED', 'CASE_UPDATED', 'CASE_STATUS_CHANGED', 'INVESTIGATION_CREATED', 'INVESTIGATION_UPDATED', 'ENTITY_ADDED', 'ENTITY_UPDATED', 'EVIDENCE_COLLECTED', 'EVIDENCE_VERIFIED', 'RELATIONSHIP_CREATED', 'RELATIONSHIP_UPDATED', 'ANALYST_NOTE', 'ASSIGNMENT_CHANGED', 'RISK_ASSESSMENT', 'REPORT_GENERATED', 'STATUS_CHANGED');

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "assigned_to" TEXT,
ADD COLUMN     "case_number" TEXT NOT NULL,
ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "severity" "CaseSeverity" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "investigations" ADD COLUMN     "assigned_to" TEXT,
ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "severity" "CaseSeverity" NOT NULL DEFAULT 'MEDIUM';

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
CREATE INDEX "cases_case_number_idx" ON "cases"("case_number");

-- CreateIndex
CREATE INDEX "cases_severity_idx" ON "cases"("severity");

-- CreateIndex
CREATE INDEX "cases_assigned_to_idx" ON "cases"("assigned_to");

-- CreateIndex
CREATE UNIQUE INDEX "cases_organization_id_case_number_key" ON "cases"("organization_id", "case_number");

-- CreateIndex
CREATE INDEX "investigations_assigned_to_idx" ON "investigations"("assigned_to");

-- CreateIndex
CREATE INDEX "investigations_created_by_idx" ON "investigations"("created_by");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

