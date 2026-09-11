import { createHash } from 'crypto';
import sharp from 'sharp';
import exifReader from 'exif-reader';
import { Prisma } from '@prisma/client';
import { prisma } from '@monara-sentinel/database';
import { createExifGpsLocation } from './location';
import { createExifCameraDevice } from './device';

// Allowed MIME types for image upload
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_DIMENSION = 10000; // 10000x10000 pixels

// Magic bytes for common image formats
const MAGIC_BYTES: Record<string, Uint8Array> = {
  'image/jpeg': new Uint8Array([0xFF, 0xD8, 0xFF]),
  'image/png': new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  'image/gif': new Uint8Array([0x47, 0x49, 0x46, 0x38]),
  'image/webp': new Uint8Array([0x52, 0x49, 0x46, 0x46]),
};

export interface ImageProcessingResult {
  sha256: string;
  sha512: string;
  phash: string;
  dhash: string;
  ahash: string;
  width: number;
  height: number;
  mime_type: string;
  file_size: number;
  exif: {
    camera_make?: string;
    camera_model?: string;
    lens?: string;
    software?: string;
    capture_timestamp?: Date;
    timezone?: string;
    gps_latitude?: number;
    gps_longitude?: number;
    gps_altitude?: number;
    orientation?: number;
    focal_length?: number;
    iso?: number;
    exposure_time?: number;
    f_number?: number;
    color_space?: string;
    raw_exif?: Record<string, unknown>;
  };
}

export interface ImageUploadInput {
  caseId: string;
  organizationId: string;
  userId: string;
  file: Buffer;
  filename: string;
  mimeType: string;
}

/**
 * Validate magic bytes to prevent file type spoofing
 */
export function validateMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  const magic = MAGIC_BYTES[declaredMimeType];
  if (!magic) return false;

  for (let i = 0; i < magic.length; i++) {
    if (buffer[i] !== magic[i]) return false;
  }
  return true;
}

/**
 * Validate image upload constraints
 */
export function validateImageUpload(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds maximum of ${MAX_FILE_SIZE} bytes` };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: `MIME type ${mimeType} is not allowed` };
  }

  // Validate magic bytes
  if (!validateMagicBytes(buffer, mimeType)) {
    return { valid: false, error: 'File signature does not match declared MIME type' };
  }

  return { valid: true };
}

/**
 * Calculate SHA-256 hash of image data
 */
export function calculateSha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate SHA-512 hash of image data
 */
export function calculateSha512(buffer: Buffer): string {
  return createHash('sha512').update(buffer).digest('hex');
}

/**
 * Calculate perceptual hash (pHash)
 * Note: Using a simplified implementation based on aHash for now
 * In production, integrate with a proper pHash library
 */
export async function calculatePHash(buffer: Buffer): Promise<string> {
  // For now, use aHash as a substitute for pHash
  // TODO: Integrate with a proper pHash library like 'pHash' or implement full DCT-based pHash
  return calculateAHash(buffer);
}

/**
 * Calculate difference hash (dHash)
 */
export async function calculateDHash(buffer: Buffer): Promise<string> {
  // Convert to grayscale and resize
  const data = await sharp(buffer)
    .resize(9, 8, { fit: 'cover' })
    .grayscale()
    .raw()
    .toBuffer();

  // Calculate dHash
  let hash = 0n;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i] < data[i + 1]) {
      hash |= 1n << BigInt(i);
    }
  }

  return hash.toString(16).padStart(16, '0');
}

/**
 * Calculate average hash (aHash)
 */
export async function calculateAHash(buffer: Buffer): Promise<string> {
  // Convert to grayscale and resize
  const data = await sharp(buffer)
    .resize(8, 8, { fit: 'cover' })
    .grayscale()
    .raw()
    .toBuffer();

  // Calculate average
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const average = sum / data.length;

  // Calculate aHash
  let hash = 0n;
  for (let i = 0; i < data.length; i++) {
    if (data[i] > average) {
      hash |= 1n << BigInt(i);
    }
  }

  return hash.toString(16).padStart(16, '0');
}

/**
 * Extract EXIF metadata from image
 */
export function extractExif(buffer: Buffer): ImageProcessingResult['exif'] {
  try {
    const tags = exifReader(buffer) as unknown as Record<string, unknown>;
    const exif: ImageProcessingResult['exif'] = {
      raw_exif: tags,
    };

    // Extract camera information
    if (tags['Make']) exif.camera_make = String(tags['Make']);
    if (tags['Model']) exif.camera_model = String(tags['Model']);
    if (tags['LensModel']) exif.lens = String(tags['LensModel']);
    if (tags['Software']) exif.software = String(tags['Software']);

    // Extract capture timestamp
    if (tags['DateTimeOriginal']) {
      exif.capture_timestamp = new Date(String(tags['DateTimeOriginal']));
    }

    // Extract GPS coordinates
    if (tags['GPSLatitude'] && tags['GPSLongitude']) {
      const lat = tags['GPSLatitude'] as number[];
      const lon = tags['GPSLongitude'] as number[];
      const latRef = tags['GPSLatitudeRef'] as string;
      const lonRef = tags['GPSLongitudeRef'] as string;

      // Convert DMS to decimal
      const latDecimal = lat[0] + lat[1] / 60 + lat[2] / 3600;
      const lonDecimal = lon[0] + lon[1] / 60 + lon[2] / 3600;

      exif.gps_latitude = latRef === 'S' ? -latDecimal : latDecimal;
      exif.gps_longitude = lonRef === 'W' ? -lonDecimal : lonDecimal;
    }

    if (tags['GPSAltitude']) {
      exif.gps_altitude = Number(tags['GPSAltitude']);
    }

    // Extract other metadata
    if (tags['Orientation']) exif.orientation = Number(tags['Orientation']);
    if (tags['FocalLength']) exif.focal_length = Number(tags['FocalLength']);
    if (tags['ISOSpeedRatings']) exif.iso = Number(tags['ISOSpeedRatings']);
    if (tags['ExposureTime']) exif.exposure_time = Number(tags['ExposureTime']);
    if (tags['FNumber']) exif.f_number = Number(tags['FNumber']);
    if (tags['ColorSpace']) exif.color_space = String(tags['ColorSpace']);

    return exif;
  } catch (error) {
    // If EXIF extraction fails, return empty object
    return { raw_exif: {} };
  }
}

/**
 * Process image: calculate hashes, extract metadata, validate
 */
export async function processImage(buffer: Buffer, mimeType: string): Promise<ImageProcessingResult> {
  // Get image dimensions
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Validate dimensions
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new Error(`Image dimensions exceed maximum of ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}`);
  }

  // Calculate hashes
  const sha256 = calculateSha256(buffer);
  const sha512 = calculateSha512(buffer);
  const phash = await calculatePHash(buffer);
  const dhash = await calculateDHash(buffer);
  const ahash = await calculateAHash(buffer);

  // Extract EXIF
  const exif = extractExif(buffer);

  return {
    sha256,
    sha512,
    phash,
    dhash,
    ahash,
    width,
    height,
    mime_type: mimeType,
    file_size: buffer.length,
    exif,
  };
}

/**
 * Create image evidence and analysis record
 */
export async function createImageEvidence(
  caseId: string,
  _organizationId: string,
  userId: string,
  input: ImageUploadInput,
  processingResult: ImageProcessingResult,
  artifactUrl: string
) {
  // Create evidence record
  const evidence = await prisma.evidence.create({
    data: {
      case_id: caseId,
      source_url: artifactUrl,
      source_type: 'IMAGE_UPLOAD',
      source_title: input.filename,
      artifact_url: artifactUrl,
      sha256: processingResult.sha256,
      mime_type: processingResult.mime_type,
      collection_method: 'image_upload',
      collector_id: userId,
      confidence: 100,
      verification_status: 'VERIFIED',
      provenance: {
        file_size: processingResult.file_size,
        dimensions: {
          width: processingResult.width,
          height: processingResult.height,
        },
        hashes: {
          sha256: processingResult.sha256,
          sha512: processingResult.sha512,
          phash: processingResult.phash,
          dhash: processingResult.dhash,
          ahash: processingResult.ahash,
        },
        exif: processingResult.exif,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  // Create image analysis record
  const imageAnalysis = await prisma.imageAnalysis.create({
    data: {
      case_id: caseId,
      evidence_id: evidence.id,
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
      processing_started_at: new Date(),
      processing_completed_at: new Date(),
    },
  });

  // Create image metadata record if EXIF exists
  if (Object.keys(processingResult.exif).length > 0) {
    await prisma.imageMetadata.create({
      data: {
        image_analysis_id: imageAnalysis.id,
        camera_make: processingResult.exif.camera_make,
        camera_model: processingResult.exif.camera_model,
        lens: processingResult.exif.lens,
        software: processingResult.exif.software,
        capture_timestamp: processingResult.exif.capture_timestamp,
        gps_latitude: processingResult.exif.gps_latitude,
        gps_longitude: processingResult.exif.gps_longitude,
        gps_altitude: processingResult.exif.gps_altitude,
        orientation: processingResult.exif.orientation,
        focal_length: processingResult.exif.focal_length,
        iso: processingResult.exif.iso,
        exposure_time: processingResult.exif.exposure_time,
        f_number: processingResult.exif.f_number,
        color_space: processingResult.exif.color_space,
        exif_data: processingResult.exif.raw_exif as unknown as Prisma.InputJsonValue,
      },
    });

    // Create location observation if GPS exists
    if (processingResult.exif.gps_latitude && processingResult.exif.gps_longitude) {
      await createExifGpsLocation(
        caseId,
        evidence.id,
        processingResult.exif.gps_latitude,
        processingResult.exif.gps_longitude,
        processingResult.exif.gps_altitude
      );

      // Create timeline event for location observation
      await prisma.timelineEvent.create({
        data: {
          case_id: caseId,
          evidence_id: evidence.id,
          event_type: 'LOCATION_OBSERVED',
          title: 'GPS location observed',
          description: `EXIF GPS coordinates: ${processingResult.exif.gps_latitude.toFixed(6)}, ${processingResult.exif.gps_longitude.toFixed(6)}`,
          created_by: userId,
        },
      });
    }

    // Create device observation if camera metadata exists
    if (processingResult.exif.camera_make || processingResult.exif.camera_model) {
      await createExifCameraDevice(
        caseId,
        evidence.id,
        processingResult.exif.camera_make,
        processingResult.exif.camera_model,
        processingResult.exif.lens,
        processingResult.exif.software
      );

      // Create timeline event for device observation
      await prisma.timelineEvent.create({
        data: {
          case_id: caseId,
          evidence_id: evidence.id,
          event_type: 'DEVICE_OBSERVED',
          title: 'Camera device observed',
          description: `EXIF camera: ${processingResult.exif.camera_make || 'Unknown'} ${processingResult.exif.camera_model || ''}`,
          created_by: userId,
        },
      });
    }
  }

  // Create IMAGE entity
  const imageEntity = await prisma.entity.create({
    data: {
      case_id: caseId,
      type: 'IMAGE',
      value: processingResult.sha256,
      display_name: input.filename,
      metadata: {
        filename: input.filename,
        mime_type: processingResult.mime_type,
        width: processingResult.width,
        height: processingResult.height,
        file_size: processingResult.file_size,
      } as unknown as Prisma.InputJsonValue,
      created_by: userId,
    },
  });

  // Link entity to evidence
  await prisma.entityEvidence.create({
    data: {
      entity_id: imageEntity.id,
      evidence_id: evidence.id,
    },
  });

  // Create timeline event
  await prisma.timelineEvent.create({
    data: {
      case_id: caseId,
      entity_id: imageEntity.id,
      evidence_id: evidence.id,
      event_type: 'IMAGE_RECEIVED',
      title: `Image uploaded: ${input.filename}`,
      description: `Image analysis completed. SHA-256: ${processingResult.sha256.substring(0, 16)}...`,
      created_by: userId,
    },
  });

  // Perform image matching
  const matchingResult = await performImageMatching(
    caseId,
    _organizationId,
    userId,
    imageAnalysis.id,
    processingResult.sha256,
    processingResult.phash
  );

  // Create risk indicators based on image analysis
  const riskIndicators: string[] = [];
  const evidenceIds = [evidence.id];

  // Risk: Image reused across multiple cases (detected via matching)
  if (matchingResult.totalMatches > 0) {
    await prisma.riskIndicator.create({
      data: {
        case_id: caseId,
        organization_id: _organizationId,
        indicator_type: 'IMAGE_REUSE',
        explanation: `Image has ${matchingResult.totalMatches} matches across the system. This may indicate content reuse, template usage, or previous analysis.`,
        confidence: Math.min(60 + matchingResult.totalMatches * 10, 90),
        evidence_ids: evidenceIds,
        calculation: {
          exactMatches: matchingResult.exactMatches,
          nearDuplicateMatches: matchingResult.nearDuplicateMatches,
          totalMatches: matchingResult.totalMatches,
        } as unknown as Prisma.InputJsonValue,
        created_by: 'system',
      },
    });
    riskIndicators.push('IMAGE_REUSE');
  }

  // Risk: Metadata stripped or inconsistent
  if (Object.keys(processingResult.exif).length === 0) {
    await prisma.riskIndicator.create({
      data: {
        case_id: caseId,
        organization_id: _organizationId,
        indicator_type: 'METADATA_STRIPPED',
        explanation: 'Image has no EXIF metadata. This may indicate intentional metadata removal, screenshot capture, or image processing.',
        confidence: 50,
        evidence_ids: evidenceIds,
        calculation: { hasExif: false } as unknown as Prisma.InputJsonValue,
        created_by: 'system',
      },
    });
    riskIndicators.push('METADATA_STRIPPED');
  }

  // Risk: Low-resolution image (may indicate screenshot or processed image)
  if (processingResult.width < 800 || processingResult.height < 600) {
    await prisma.riskIndicator.create({
      data: {
        case_id: caseId,
        organization_id: _organizationId,
        indicator_type: 'LOW_RESOLUTION',
        explanation: `Image resolution is ${processingResult.width}x${processingResult.height}. Low resolution may indicate screenshot, resize, or compression artifacts.`,
        confidence: 40,
        evidence_ids: evidenceIds,
        calculation: {
          width: processingResult.width,
          height: processingResult.height,
        } as unknown as Prisma.InputJsonValue,
        created_by: 'system',
      },
    });
    riskIndicators.push('LOW_RESOLUTION');
  }

  // Risk: GPS coordinates present (potential location exposure)
  if (processingResult.exif.gps_latitude && processingResult.exif.gps_longitude) {
    await prisma.riskIndicator.create({
      data: {
        case_id: caseId,
        organization_id: _organizationId,
        indicator_type: 'GPS_PRESENT',
        explanation: `Image contains GPS coordinates: ${processingResult.exif.gps_latitude.toFixed(6)}, ${processingResult.exif.gps_longitude.toFixed(6)}. This may indicate location metadata was not stripped.`,
        confidence: 70,
        evidence_ids: evidenceIds,
        calculation: {
          hasGps: true,
          latitude: processingResult.exif.gps_latitude,
          longitude: processingResult.exif.gps_longitude,
        } as unknown as Prisma.InputJsonValue,
        created_by: 'system',
      },
    });
    riskIndicators.push('GPS_PRESENT');
  }

  // Create EXIF extracted timeline event if EXIF exists
  if (Object.keys(processingResult.exif).length > 0) {
    await prisma.timelineEvent.create({
      data: {
        case_id: caseId,
        entity_id: imageEntity.id,
        evidence_id: evidence.id,
        event_type: 'EXIF_EXTRACTED',
        title: 'EXIF metadata extracted',
        description: `Camera: ${processingResult.exif.camera_make || 'Unknown'} ${processingResult.exif.camera_model || ''}. GPS: ${processingResult.exif.gps_latitude ? 'Yes' : 'No'}.`,
        created_by: userId,
      },
    });
  }

  // Create location observation if GPS exists
  if (processingResult.exif.gps_latitude && processingResult.exif.gps_longitude) {
    await prisma.locationObservation.create({
      data: {
        case_id: caseId,
        source: 'EXIF_GPS',
        location_type: 'EXACT_METADATA',
        latitude: processingResult.exif.gps_latitude,
        longitude: processingResult.exif.gps_longitude,
        confidence: 90,
        description: 'GPS coordinates extracted from EXIF metadata. GPS metadata describes the analyzed file and does not by itself prove the sender\'s current location.',
        metadata: {
          source: 'EXIF',
          timestamp: processingResult.exif.capture_timestamp,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        case_id: caseId,
        entity_id: imageEntity.id,
        evidence_id: evidence.id,
        event_type: 'LOCATION_OBSERVED',
        title: 'GPS location observed',
        description: `EXIF GPS coordinates: ${processingResult.exif.gps_latitude}, ${processingResult.exif.gps_longitude}`,
        created_by: userId,
      },
    });
  }

  // Create device observation if camera metadata exists
  if (processingResult.exif.camera_make || processingResult.exif.camera_model) {
    await prisma.deviceObservation.create({
      data: {
        case_id: caseId,
        source: 'EXIF',
        device_type: 'CAMERA',
        make: processingResult.exif.camera_make,
        model: processingResult.exif.camera_model,
        observation_type: 'OBSERVED_DEVICE_DATA',
        confidence: 90,
        metadata: {
          source: 'EXIF',
          capture_timestamp: processingResult.exif.capture_timestamp,
          software: processingResult.exif.software,
          description: 'Camera metadata extracted from EXIF. Image may have been produced using this device model. This does not prove device ownership.',
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        case_id: caseId,
        entity_id: imageEntity.id,
        evidence_id: evidence.id,
        event_type: 'DEVICE_OBSERVED',
        title: 'Device metadata observed',
        description: `Camera: ${processingResult.exif.camera_make || 'Unknown'} ${processingResult.exif.camera_model || ''}`,
        created_by: userId,
      },
    });
  }

  return { evidence, imageAnalysis, imageEntity };
}

/**
 * Find exact matches by SHA-256 hash
 */
export async function findExactMatches(sha256: string, _organizationId: string) {
  const matches = await prisma.imageAnalysis.findMany({
    where: {
      sha256,
      case: {
        organization_id: _organizationId,
      },
    },
    include: {
      evidence: true,
      case: true,
    },
  });

  return matches;
}

/**
 * Find near-duplicate matches by perceptual hash
 */
export async function findNearDuplicateMatches(phash: string, _organizationId: string, threshold: number = 10) {
  // This is a simplified implementation
  // In production, you'd use a more sophisticated Hamming distance calculation
  const allImages = await prisma.imageAnalysis.findMany({
    where: {
      phash: { not: null },
      case: {
        organization_id: _organizationId,
      },
    },
    include: {
      evidence: true,
      case: true,
    },
  });

  // Calculate Hamming distance
  const matches = allImages
    .filter((img) => {
      if (!img.phash) return false;
      const distance = calculateHammingDistance(phash, img.phash);
      return distance <= threshold;
    })
    .map((img) => ({
      ...img,
      similarity: 1 - calculateHammingDistance(phash, img.phash!) / 64,
    }));

  return matches;
}

/**
 * Perform image matching and create match records
 */
export async function performImageMatching(
  caseId: string,
  organizationId: string,
  userId: string,
  imageAnalysisId: string,
  sha256: string,
  phash: string
) {
  // Find exact matches by SHA-256
  const exactMatches = await findExactMatches(sha256, organizationId);
  
  // Find near-duplicate matches by perceptual hash
  const nearDuplicateMatches = await findNearDuplicateMatches(phash, organizationId);

  // Create match records for exact matches
  for (const match of exactMatches) {
    if (match.id === imageAnalysisId) continue; // Skip self-match
    
    await prisma.imageMatch.create({
      data: {
        image_analysis_id: imageAnalysisId,
        matched_image_id: match.id,
        match_type: 'EXACT_MATCH',
        similarity: 100,
        source_url: match.evidence.artifact_url,
        provider: 'local_hash',
        observed_timestamp: match.created_at,
        confidence: 100,
        evidence_id: match.evidence_id,
      },
    });
  }

  // Create match records for near-duplicate matches
  for (const match of nearDuplicateMatches) {
    if (match.id === imageAnalysisId) continue; // Skip self-match
    
    await prisma.imageMatch.create({
      data: {
        image_analysis_id: imageAnalysisId,
        matched_image_id: match.id,
        match_type: 'NEAR_DUPLICATE',
        similarity: match.similarity || 0,
        source_url: match.evidence.artifact_url,
        provider: 'local_perceptual_hash',
        observed_timestamp: match.created_at,
        confidence: Math.round((match.similarity || 0) * 100),
        evidence_id: match.evidence_id,
      },
    });
  }

  // Create timeline event if matches found
  const totalMatches = exactMatches.length + nearDuplicateMatches.length;
  if (totalMatches > 0) {
    const evidenceForTimeline = await prisma.imageAnalysis.findUnique({
      where: { id: imageAnalysisId },
      select: { evidence_id: true },
    });
    
    if (evidenceForTimeline?.evidence_id) {
      await prisma.timelineEvent.create({
        data: {
          case_id: caseId,
          evidence_id: evidenceForTimeline.evidence_id,
          event_type: 'IMAGE_MATCH_FOUND',
          title: 'Image matches found',
          description: `Found ${exactMatches.length} exact matches and ${nearDuplicateMatches.length} near-duplicate matches.`,
          created_by: userId,
        },
      });
    }
  }

  return {
    exactMatches: exactMatches.length,
    nearDuplicateMatches: nearDuplicateMatches.length,
    totalMatches,
  };
}

/**
 * Calculate Hamming distance between two hex strings
 */
function calculateHammingDistance(hash1: string, hash2: string): number {
  const n1 = BigInt('0x' + hash1);
  const n2 = BigInt('0x' + hash2);
  let xor = n1 ^ n2;
  let distance = 0;
  while (xor > 0n) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return distance;
}

/**
 * Origin analysis result
 */
export interface OriginAnalysisResult {
  originType: 'EARLIEST_OBSERVED_OCCURRENCE' | 'POSSIBLE_EARLIER_OCCURRENCE' | 'REPOST' | 'DERIVED_COPY' | 'SOURCE_UNKNOWN';
  earliestObservedAt?: Date;
  earliestSourceUrl?: string;
  confidence: number;
  evidenceIds: string[];
  explanation: string;
}

/**
 * Analyze image origin using EXIF, hashes, matches, and reverse image results
 */
export async function analyzeImageOrigin(
  _caseId: string,
  imageAnalysisId: string,
  _userId: string
): Promise<OriginAnalysisResult> {
  // Get image analysis with metadata and matches
  const imageAnalysis = await prisma.imageAnalysis.findUnique({
    where: { id: imageAnalysisId },
    include: {
      metadata: true,
      matches: true,
      evidence: true,
    },
  });

  if (!imageAnalysis) {
    throw new Error('Image analysis not found');
  }

  const evidenceIds: string[] = [imageAnalysis.evidence_id];
  let earliestObservedAt: Date | undefined = imageAnalysis.created_at;
  let earliestSourceUrl: string | undefined = imageAnalysis.evidence.artifact_url || undefined;
  let originType: OriginAnalysisResult['originType'] = 'SOURCE_UNKNOWN';
  let confidence = 50;
  const explanationParts: string[] = [];

  // Check EXIF capture timestamp
  if (imageAnalysis.metadata?.capture_timestamp) {
    const exifDate = new Date(imageAnalysis.metadata.capture_timestamp);
    if (exifDate < earliestObservedAt) {
      earliestObservedAt = exifDate;
      explanationParts.push(`EXIF capture timestamp: ${exifDate.toISOString()}`);
    }
  }

  // Check image matches for earlier occurrences
  if (imageAnalysis.matches.length > 0) {
    for (const match of imageAnalysis.matches) {
      const matchDate = match.observed_timestamp;
      if (matchDate && matchDate < earliestObservedAt) {
        earliestObservedAt = matchDate;
        earliestSourceUrl = match.source_url || undefined;
        explanationParts.push(`Earlier match found at ${matchDate.toISOString()} from ${match.provider}`);
      }
    }

    // Determine origin type based on matches
    const exactMatches = imageAnalysis.matches.filter((m: any) => m.match_type === 'EXACT_MATCH');
    const nearDuplicates = imageAnalysis.matches.filter((m: any) => m.match_type === 'NEAR_DUPLICATE');

    if (exactMatches.length > 0) {
      originType = 'REPOST';
      confidence = 85;
      explanationParts.push(`Found ${exactMatches.length} exact matches elsewhere`);
    } else if (nearDuplicates.length > 0) {
      originType = 'DERIVED_COPY';
      confidence = 70;
      explanationParts.push(`Found ${nearDuplicates.length} near-duplicate matches`);
    }
  }

  // Check if we have an earlier observed occurrence
  if (earliestObservedAt && earliestObservedAt < imageAnalysis.created_at) {
    if (originType === 'SOURCE_UNKNOWN') {
      originType = 'POSSIBLE_EARLIER_OCCURRENCE';
      confidence = 60;
    }
    explanationParts.push(`Earliest observed occurrence: ${earliestObservedAt.toISOString()}`);
  } else {
    originType = 'EARLIEST_OBSERVED_OCCURRENCE';
    confidence = 80;
    explanationParts.push('No earlier occurrences found in current data');
  }

  // Build explanation
  const explanation = explanationParts.length > 0
    ? explanationParts.join('. ') + '.'
    : 'Insufficient data to determine origin.';

  // Create or update origin observation
  await prisma.imageOriginObservation.upsert({
    where: { image_analysis_id: imageAnalysisId },
    create: {
      image_analysis_id: imageAnalysisId,
      origin_type: originType,
      earliest_observed_at: earliestObservedAt,
      earliest_source_url: earliestSourceUrl,
      confidence,
      evidence_ids: evidenceIds,
      explanation,
    },
    update: {
      origin_type: originType,
      earliest_observed_at: earliestObservedAt,
      earliest_source_url: earliestSourceUrl,
      confidence,
      evidence_ids: evidenceIds,
      explanation,
    },
  });

  return {
    originType,
    earliestObservedAt,
    earliestSourceUrl,
    confidence,
    evidenceIds,
    explanation,
  };
}
