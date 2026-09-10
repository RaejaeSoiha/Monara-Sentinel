-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TimelineEventType" ADD VALUE 'EVIDENCE_ASSOCIATED';
ALTER TYPE "TimelineEventType" ADD VALUE 'EVIDENCE_DISSOCIATED';
ALTER TYPE "TimelineEventType" ADD VALUE 'INTELLIGENCE_REQUESTED';
ALTER TYPE "TimelineEventType" ADD VALUE 'DNS_COLLECTED';
ALTER TYPE "TimelineEventType" ADD VALUE 'RDAP_COLLECTED';
ALTER TYPE "TimelineEventType" ADD VALUE 'TLS_COLLECTED';
ALTER TYPE "TimelineEventType" ADD VALUE 'URL_ANALYZED';
ALTER TYPE "TimelineEventType" ADD VALUE 'WEBSITE_ANALYZED';
ALTER TYPE "TimelineEventType" ADD VALUE 'INDICATOR_CREATED';

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
