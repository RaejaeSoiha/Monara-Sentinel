-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EntityType" ADD VALUE 'IMAGE';
ALTER TYPE "EntityType" ADD VALUE 'DEVICE_CLUE';
ALTER TYPE "EntityType" ADD VALUE 'LOCATION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RelationshipType" ADD VALUE 'FOUND_ON';
ALTER TYPE "RelationshipType" ADD VALUE 'MATCHES';
ALTER TYPE "RelationshipType" ADD VALUE 'POSSIBLY_MATCHES';
ALTER TYPE "RelationshipType" ADD VALUE 'DERIVED_FROM';
ALTER TYPE "RelationshipType" ADD VALUE 'CONTAINS';
ALTER TYPE "RelationshipType" ADD VALUE 'HAS_DEVICE_CLUE';
ALTER TYPE "RelationshipType" ADD VALUE 'GEOLOCATED_TO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TimelineEventType" ADD VALUE 'IMAGE_RECEIVED';
ALTER TYPE "TimelineEventType" ADD VALUE 'IMAGE_ANALYZED';
ALTER TYPE "TimelineEventType" ADD VALUE 'EXIF_EXTRACTED';
ALTER TYPE "TimelineEventType" ADD VALUE 'OCR_COMPLETED';
ALTER TYPE "TimelineEventType" ADD VALUE 'IMAGE_MATCH_FOUND';
ALTER TYPE "TimelineEventType" ADD VALUE 'LOCATION_OBSERVED';
ALTER TYPE "TimelineEventType" ADD VALUE 'DEVICE_OBSERVED';

-- CreateTable
CREATE TABLE "image_analyses" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sha256" TEXT,
    "sha512" TEXT,
    "phash" TEXT,
    "dhash" TEXT,
    "ahash" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "processing_started_at" TIMESTAMP(3),
    "processing_completed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_metadata" (
    "id" TEXT NOT NULL,
    "image_analysis_id" TEXT NOT NULL,
    "camera_make" TEXT,
    "camera_model" TEXT,
    "lens" TEXT,
    "software" TEXT,
    "capture_timestamp" TIMESTAMP(3),
    "timezone" TEXT,
    "gps_latitude" DOUBLE PRECISION,
    "gps_longitude" DOUBLE PRECISION,
    "gps_altitude" DOUBLE PRECISION,
    "orientation" INTEGER,
    "focal_length" DOUBLE PRECISION,
    "iso" INTEGER,
    "exposure_time" DOUBLE PRECISION,
    "f_number" DOUBLE PRECISION,
    "color_space" TEXT,
    "exif_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_matches" (
    "id" TEXT NOT NULL,
    "image_analysis_id" TEXT NOT NULL,
    "matched_image_id" TEXT,
    "match_type" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION,
    "source_url" TEXT,
    "provider" TEXT,
    "observed_timestamp" TIMESTAMP(3),
    "published_timestamp" TIMESTAMP(3),
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "evidence_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_origin_observations" (
    "id" TEXT NOT NULL,
    "image_analysis_id" TEXT NOT NULL,
    "origin_type" TEXT NOT NULL,
    "earliest_observed_at" TIMESTAMP(3),
    "earliest_source_url" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "evidence_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_origin_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_observations" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "evidence_id" TEXT,
    "source" TEXT NOT NULL,
    "location_type" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "timezone" TEXT,
    "asn" TEXT,
    "isp" TEXT,
    "hosting_provider" TEXT,
    "description" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_observations" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "evidence_id" TEXT,
    "source" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "os" TEXT,
    "os_version" TEXT,
    "browser" TEXT,
    "browser_version" TEXT,
    "user_agent" TEXT,
    "screen_width" INTEGER,
    "screen_height" INTEGER,
    "timezone" TEXT,
    "language" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "observation_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "image_analyses_evidence_id_key" ON "image_analyses"("evidence_id");

-- CreateIndex
CREATE INDEX "image_analyses_case_id_idx" ON "image_analyses"("case_id");

-- CreateIndex
CREATE INDEX "image_analyses_evidence_id_idx" ON "image_analyses"("evidence_id");

-- CreateIndex
CREATE INDEX "image_analyses_status_idx" ON "image_analyses"("status");

-- CreateIndex
CREATE INDEX "image_analyses_sha256_idx" ON "image_analyses"("sha256");

-- CreateIndex
CREATE INDEX "image_analyses_phash_idx" ON "image_analyses"("phash");

-- CreateIndex
CREATE UNIQUE INDEX "image_metadata_image_analysis_id_key" ON "image_metadata"("image_analysis_id");

-- CreateIndex
CREATE INDEX "image_metadata_image_analysis_id_idx" ON "image_metadata"("image_analysis_id");

-- CreateIndex
CREATE INDEX "image_matches_image_analysis_id_idx" ON "image_matches"("image_analysis_id");

-- CreateIndex
CREATE INDEX "image_matches_match_type_idx" ON "image_matches"("match_type");

-- CreateIndex
CREATE INDEX "image_matches_similarity_idx" ON "image_matches"("similarity");

-- CreateIndex
CREATE UNIQUE INDEX "image_origin_observations_image_analysis_id_key" ON "image_origin_observations"("image_analysis_id");

-- CreateIndex
CREATE INDEX "image_origin_observations_image_analysis_id_idx" ON "image_origin_observations"("image_analysis_id");

-- CreateIndex
CREATE INDEX "image_origin_observations_origin_type_idx" ON "image_origin_observations"("origin_type");

-- CreateIndex
CREATE INDEX "location_observations_case_id_idx" ON "location_observations"("case_id");

-- CreateIndex
CREATE INDEX "location_observations_evidence_id_idx" ON "location_observations"("evidence_id");

-- CreateIndex
CREATE INDEX "location_observations_source_idx" ON "location_observations"("source");

-- CreateIndex
CREATE INDEX "location_observations_location_type_idx" ON "location_observations"("location_type");

-- CreateIndex
CREATE INDEX "location_observations_confidence_idx" ON "location_observations"("confidence");

-- CreateIndex
CREATE INDEX "device_observations_case_id_idx" ON "device_observations"("case_id");

-- CreateIndex
CREATE INDEX "device_observations_evidence_id_idx" ON "device_observations"("evidence_id");

-- CreateIndex
CREATE INDEX "device_observations_source_idx" ON "device_observations"("source");

-- CreateIndex
CREATE INDEX "device_observations_device_type_idx" ON "device_observations"("device_type");

-- CreateIndex
CREATE INDEX "device_observations_confidence_idx" ON "device_observations"("confidence");

-- AddForeignKey
ALTER TABLE "image_analyses" ADD CONSTRAINT "image_analyses_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_analyses" ADD CONSTRAINT "image_analyses_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_metadata" ADD CONSTRAINT "image_metadata_image_analysis_id_fkey" FOREIGN KEY ("image_analysis_id") REFERENCES "image_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_matches" ADD CONSTRAINT "image_matches_image_analysis_id_fkey" FOREIGN KEY ("image_analysis_id") REFERENCES "image_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_origin_observations" ADD CONSTRAINT "image_origin_observations_image_analysis_id_fkey" FOREIGN KEY ("image_analysis_id") REFERENCES "image_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_observations" ADD CONSTRAINT "location_observations_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_observations" ADD CONSTRAINT "device_observations_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
