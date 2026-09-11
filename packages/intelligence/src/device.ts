import { Prisma } from '@prisma/client';
import { prisma } from '@monara-sentinel/database';

export interface DeviceObservationInput {
  caseId: string;
  evidenceId?: string;
  source: string;
  deviceType: string;
  observationType: 'OBSERVED_DEVICE_DATA' | 'DEVICE_INFERENCE';
  make?: string;
  model?: string;
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  userAgent?: string;
  description?: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Create a device observation
 */
export async function createDeviceObservation(input: DeviceObservationInput) {
  const observation = await prisma.deviceObservation.create({
    data: {
      case_id: input.caseId,
      evidence_id: input.evidenceId,
      source: input.source,
      device_type: input.deviceType,
      observation_type: input.observationType,
      make: input.make,
      model: input.model,
      os: input.os,
      os_version: input.osVersion,
      browser: input.browser,
      browser_version: input.browserVersion,
      user_agent: input.userAgent,
      description: input.description,
      confidence: input.confidence,
      metadata: input.metadata as unknown as Prisma.InputJsonValue,
    },
  });

  return observation;
}

/**
 * Create device observation from EXIF camera metadata
 */
export async function createExifCameraDevice(
  caseId: string,
  evidenceId: string,
  cameraMake?: string,
  cameraModel?: string,
  lens?: string,
  software?: string
) {
  const parts = [];
  if (cameraMake) parts.push(cameraMake);
  if (cameraModel) parts.push(cameraModel);
  if (lens) parts.push(`with ${lens}`);

  const description = parts.length > 0
    ? `EXIF camera metadata: ${parts.join(' ')}. Image metadata does not prove device ownership.`
    : 'EXIF camera metadata present. Image metadata does not prove device ownership.';

  return createDeviceObservation({
    caseId,
    evidenceId,
    source: 'EXIF_CAMERA',
    deviceType: 'CAMERA',
    observationType: 'OBSERVED_DEVICE_DATA',
    make: cameraMake,
    model: cameraModel,
    description,
    confidence: 85,
    metadata: {
      cameraMake,
      cameraModel,
      lens,
      software,
      source: 'exif_camera',
    },
  });
}

/**
 * Create device observation from User-Agent
 */
export async function createUserAgentDevice(
  caseId: string,
  evidenceId: string,
  userAgent: string,
  browser?: string,
  browserVersion?: string,
  os?: string
) {
  const description = os
    ? `User-Agent indicates ${browser || 'browser'} ${browserVersion || ''} on ${os}. File may have been produced by this device class.`
    : `User-Agent: ${userAgent}. File may have been produced by this device class.`;

  return createDeviceObservation({
    caseId,
    evidenceId,
    source: 'USER_AGENT',
    deviceType: 'BROWSER',
    observationType: 'DEVICE_INFERENCE',
    browser,
    browserVersion,
    os,
    userAgent,
    description,
    confidence: 60,
    metadata: {
      userAgent,
      browser,
      browserVersion,
      os,
      source: 'user_agent',
    },
  });
}

/**
 * Create device observation from browser telemetry
 */
export async function createBrowserTelemetryDevice(
  caseId: string,
  evidenceId: string,
  deviceClass: string,
  os?: string,
  browser?: string
) {
  const description = `Authorized telemetry indicates device class: ${deviceClass}${os ? ` running ${os}` : ''}${browser ? ` with ${browser}` : ''}. File may have been produced by this device class.`;

  return createDeviceObservation({
    caseId,
    evidenceId,
    source: 'AUTHORIZED_TELEMETRY',
    deviceType: deviceClass.toUpperCase(),
    observationType: 'OBSERVED_DEVICE_DATA',
    os,
    browser,
    description,
    confidence: 90,
    metadata: {
      deviceClass,
      os,
      browser,
      source: 'authorized_telemetry',
    },
  });
}

/**
 * Create device observation from image characteristics
 */
export async function createImageCharacteristicsDevice(
  caseId: string,
  evidenceId: string,
  characteristics: {
    colorSpace?: string;
    orientation?: number;
    software?: string;
  }
) {
  const parts = [];
  if (characteristics.colorSpace) parts.push(`color space ${characteristics.colorSpace}`);
  if (characteristics.orientation) parts.push(`orientation ${characteristics.orientation}`);
  if (characteristics.software) parts.push(`processed with ${characteristics.software}`);

  const description = parts.length > 0
    ? `Image characteristics suggest ${parts.join(', ')}. File may have been produced by this device class.`
    : 'Image characteristics analyzed. File may have been produced by this device class.';

  return createDeviceObservation({
    caseId,
    evidenceId,
    source: 'IMAGE_CHARACTERISTICS',
    deviceType: 'UNKNOWN',
    observationType: 'DEVICE_INFERENCE',
    description,
    confidence: 40,
    metadata: {
      ...characteristics,
      source: 'image_characteristics',
    },
  });
}

/**
 * Get all device observations for a case
 */
export async function getCaseDeviceObservations(caseId: string) {
  const observations = await prisma.deviceObservation.findMany({
    where: { case_id: caseId },
    orderBy: { created_at: 'desc' },
  });

  return observations;
}

/**
 * Detect conflicting device observations
 */
export function detectDeviceConflicts(observations: any[]): Array<{
  type: string;
  description: string;
  observations: any[];
}> {
  const conflicts: Array<{ type: string; description: string; observations: any[] }> = [];

  // Group by make/model
  const byDevice = new Map<string, any[]>();
  for (const obs of observations) {
    const key = `${obs.make || 'unknown'}-${obs.model || 'unknown'}`;
    if (!byDevice.has(key)) {
      byDevice.set(key, []);
    }
    byDevice.get(key)!.push(obs);
  }

  // If multiple distinct high-confidence devices
  const highConfDevices = Array.from(byDevice.entries())
    .filter(([_, obs]) => obs.some((o) => o.confidence >= 70))
    .map(([device, _]) => device);

  if (highConfDevices.length > 1) {
    conflicts.push({
      type: 'MULTIPLE_DEVICES',
      description: `Evidence indicates multiple devices: ${highConfDevices.join(', ')}. This may indicate device sharing, multiple devices in use, or conflicting data sources.`,
      observations: observations.filter((o) => highConfDevices.includes(`${o.make || 'unknown'}-${o.model || 'unknown'}`)),
    });
  }

  // Check for OBSERVED_DEVICE_DATA vs DEVICE_INFERENCE conflicts
  const observedData = observations.filter((o) => o.observation_type === 'OBSERVED_DEVICE_DATA');
  const inferredData = observations.filter((o) => o.observation_type === 'DEVICE_INFERENCE');

  for (const observed of observedData) {
    for (const inferred of inferredData) {
      if (observed.make && inferred.make && observed.make !== inferred.make) {
        conflicts.push({
          type: 'OBSERVED_VS_INFERRED',
          description: `High-confidence OBSERVED_DEVICE_DATA (${observed.make}) conflicts with low-confidence inference (${inferred.make}). Prioritize observed data over inferences.`,
          observations: [observed, inferred],
        });
      }
    }
  }

  return conflicts;
}
