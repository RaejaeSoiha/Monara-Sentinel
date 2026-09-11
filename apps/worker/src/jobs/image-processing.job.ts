import { Job } from 'bullmq';
import { logger } from '../lib/logger';
import { processImage } from '@monara-sentinel/intelligence';
import { prisma } from '@monara-sentinel/database';

export const IMAGE_PROCESSING_QUEUE = 'image-processing';

export interface ImageProcessingJobData {
  caseId: string;
  imageAnalysisId: string;
  filePath: string;
  filename: string;
  mimeType: string;
  [key: string]: any; // BullMQ JobData constraint
}

export async function processImageProcessingJob(job: Job) {
  const { caseId, imageAnalysisId, filePath, filename, mimeType } = job.data;

  logger.info({ jobId: job.id, caseId, filename }, 'Processing image job');

  try {
    // Check if image analysis already completed
    const existingAnalysis = await prisma.imageAnalysis.findUnique({
      where: { id: imageAnalysisId },
    });

    if (existingAnalysis?.status === 'COMPLETED') {
      logger.info({ jobId: job.id, imageAnalysisId }, 'Image analysis already completed, skipping');
      return { status: 'skipped', reason: 'already_completed' };
    }

    // Update status to PROCESSING
    await prisma.imageAnalysis.update({
      where: { id: imageAnalysisId },
      data: { status: 'PROCESSING', processing_started_at: new Date() },
    });

    // Read file and process
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(filePath);

    const processingResult = await processImage(buffer, mimeType);

    // Update image analysis with processing results
    await prisma.imageAnalysis.update({
      where: { id: imageAnalysisId },
      data: {
        status: 'COMPLETED',
        sha256: processingResult.sha256,
        sha512: processingResult.sha512,
        phash: processingResult.phash,
        dhash: processingResult.dhash,
        ahash: processingResult.ahash,
        width: processingResult.width,
        height: processingResult.height,
        mime_type: processingResult.mime_type,
        file_size: processingResult.file_size,
        processing_completed_at: new Date(),
      },
    });

    logger.info({ jobId: job.id, imageAnalysisId }, 'Image processing job completed');

    return {
      status: 'completed',
      sha256: processingResult.sha256,
      width: processingResult.width,
      height: processingResult.height,
    };
  } catch (error) {
    logger.error({ jobId: job.id, error }, 'Image processing job failed');

    // Update status to FAILED
    await prisma.imageAnalysis.update({
      where: { id: imageAnalysisId },
      data: { status: 'FAILED' },
    }).catch((err) => {
      logger.error({ err }, 'Failed to update image analysis status to FAILED');
    });

    throw error;
  }
}
