import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { prisma } from '@monara-sentinel/database';
import { SecurityError } from '@monara-sentinel/security';
import {
  validateImageUpload,
  processImage,
  createImageEvidence,
  analyzeImageOrigin,
  type ImageUploadInput,
} from '@monara-sentinel/intelligence';

const UPLOAD_DIR = process.env['IMAGE_UPLOAD_DIR'] || '/tmp/monara-uploads';

export async function uploadImage(
  caseId: string,
  organizationId: string,
  userId: string,
  file: any,
  filename: string
) {
  // Verify case belongs to organization
  const caseRecord = await prisma.case.findFirst({
    where: { id: caseId, organization_id: organizationId, deleted_at: null },
  });
  if (!caseRecord) {
    throw new SecurityError('Case not found', 'NOT_FOUND');
  }

  // Read file buffer
  const buffer = await file.toBuffer();

  // Validate image
  const validation = validateImageUpload(buffer, file.mimetype);
  if (!validation.valid) {
    throw new SecurityError(validation.error || 'Invalid image', 'INVALID_IMAGE');
  }

  // Process image
  const processingResult = await processImage(buffer, file.mimetype);

  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  // Generate unique filename
  const uniqueFilename = `${processingResult.sha256}-${Date.now()}-${filename}`;
  const filePath = join(UPLOAD_DIR, uniqueFilename);

  // Store original file
  await writeFile(filePath, buffer);

  // Create evidence and analysis records
  const input: ImageUploadInput = {
    caseId,
    organizationId,
    userId,
    file: buffer,
    filename,
    mimeType: file.mimetype,
  };

  const result = await createImageEvidence(
    caseId,
    organizationId,
    userId,
    input,
    processingResult,
    filePath
  );

  return {
    evidence_id: result.evidence.id,
    image_analysis_id: result.imageAnalysis.id,
    entity_id: result.imageEntity.id,
    sha256: processingResult.sha256,
    sha512: processingResult.sha512,
    phash: processingResult.phash,
    dhash: processingResult.dhash,
    ahash: processingResult.ahash,
    width: processingResult.width,
    height: processingResult.height,
    mime_type: processingResult.mime_type,
    file_size: processingResult.file_size,
    exif: processingResult.exif,
  };
}

export async function getCaseImages(caseId: string, organizationId: string) {
  const caseRecord = await prisma.case.findFirst({
    where: { id: caseId, organization_id: organizationId, deleted_at: null },
  });
  if (!caseRecord) {
    throw new SecurityError('Case not found', 'NOT_FOUND');
  }

  const imageAnalyses = await prisma.imageAnalysis.findMany({
    where: { case_id: caseId },
    include: {
      evidence: true,
      metadata: true,
      matches: true,
      origin_observation: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return imageAnalyses;
}

export async function getImageAnalysis(imageAnalysisId: string, caseId: string, organizationId: string) {
  const imageAnalysis = await prisma.imageAnalysis.findFirst({
    where: {
      id: imageAnalysisId,
      case_id: caseId,
      case: {
        organization_id: organizationId,
      },
    },
    include: {
      evidence: true,
      metadata: true,
      matches: true,
      origin_observation: true,
      case: true,
    },
  });

  if (!imageAnalysis) {
    throw new SecurityError('Image analysis not found', 'NOT_FOUND');
  }

  return imageAnalysis;
}

export async function getImageOrigin(caseId: string, imageId: string, userId: string) {
  const imageAnalysis = await prisma.imageAnalysis.findFirst({
    where: {
      id: imageId,
      case_id: caseId,
    },
  });

  if (!imageAnalysis) {
    throw new SecurityError('Image analysis not found', 'NOT_FOUND');
  }

  // Run origin analysis
  const originResult = await analyzeImageOrigin(caseId, imageId, userId);

  // Return origin observation with analysis
  const originObservation = await prisma.imageOriginObservation.findUnique({
    where: { image_analysis_id: imageId },
  });

  return {
    analysis: originResult,
    observation: originObservation,
  };
}
