import { Prisma } from '@prisma/client';
import { prisma } from '@monara-sentinel/database';

export interface LocationObservationInput {
  caseId: string;
  evidenceId?: string;
  source: string;
  locationType: 'EXACT_METADATA' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  latitude?: number;
  longitude?: number;
  country?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  timezone?: string;
  asn?: string;
  isp?: string;
  hostingProvider?: string;
  description?: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Create a location observation
 */
export async function createLocationObservation(input: LocationObservationInput) {
  const observation = await prisma.locationObservation.create({
    data: {
      case_id: input.caseId,
      evidence_id: input.evidenceId,
      source: input.source,
      location_type: input.locationType,
      latitude: input.latitude,
      longitude: input.longitude,
      country: input.country,
      region: input.region,
      city: input.city,
      postal_code: input.postalCode,
      timezone: input.timezone,
      asn: input.asn,
      isp: input.isp,
      hosting_provider: input.hostingProvider,
      description: input.description,
      confidence: input.confidence,
      metadata: input.metadata as unknown as Prisma.InputJsonValue,
    },
  });

  return observation;
}

/**
 * Create location observation from EXIF GPS data
 */
export async function createExifGpsLocation(
  caseId: string,
  evidenceId: string,
  latitude: number,
  longitude: number,
  altitude?: number
) {
  const description = altitude
    ? `GPS coordinates from image EXIF metadata: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} at ${altitude}m altitude. GPS metadata describes the analyzed file and does not by itself prove the sender's current location.`
    : `GPS coordinates from image EXIF metadata: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}. GPS metadata describes the analyzed file and does not by itself prove the sender's current location.`;

  return createLocationObservation({
    caseId,
    evidenceId,
    source: 'EXIF_GPS',
    locationType: 'EXACT_METADATA',
    latitude,
    longitude,
    description,
    confidence: 90,
    metadata: { altitude, source: 'exif_gps' },
  });
}

/**
 * Create location observation from IP geolocation
 */
export async function createIpGeolocation(
  caseId: string,
  evidenceId: string,
  ip: string,
  country: string,
  region?: string,
  city?: string,
  isp?: string,
  asn?: string
) {
  const description = `Approximate network geolocation for IP ${ip}: ${city ? `${city}, ` : ''}${region ? `${region}, ` : ''}${country}. IP geolocation is not exact physical location and represents approximate network routing information.`;

  return createLocationObservation({
    caseId,
    evidenceId,
    source: 'APPROXIMATE_NETWORK_GEOLOCATION',
    locationType: 'MEDIUM',
    country,
    region,
    city,
    isp,
    asn,
    description,
    confidence: 60,
    metadata: { ip, source: 'ip_geolocation' },
  });
}

/**
 * Create location observation from public profile
 */
export async function createPublicProfileLocation(
  caseId: string,
  evidenceId: string,
  location: string,
  profileSource: string
) {
  const description = `Public profile location "${location}" from ${profileSource}. This is self-reported information and may not be accurate or current.`;

  return createLocationObservation({
    caseId,
    evidenceId,
    source: 'PUBLIC_PROFILE_LOCATION',
    locationType: 'LOW',
    description,
    confidence: 40,
    metadata: { location, profileSource, source: 'public_profile' },
  });
}

/**
 * Create location observation from timezone inference
 */
export async function createTimezoneLocation(
  caseId: string,
  evidenceId: string,
  timezone: string,
  inferredRegion?: string
) {
  const description = inferredRegion
    ? `Weak inference from timezone ${timezone}: possibly in ${inferredRegion}. Timezone is a weak indicator and does not confirm physical location.`
    : `Weak inference from timezone ${timezone}. Timezone is a weak indicator and does not confirm physical location.`;

  return createLocationObservation({
    caseId,
    evidenceId,
    source: 'WEAK_INFERENCE',
    locationType: 'LOW',
    timezone,
    description,
    confidence: 30,
    metadata: { timezone, inferredRegion, source: 'timezone_inference' },
  });
}

/**
 * Get all location observations for a case
 */
export async function getCaseLocationObservations(caseId: string) {
  const observations = await prisma.locationObservation.findMany({
    where: { case_id: caseId },
    orderBy: { created_at: 'desc' },
  });

  return observations;
}

/**
 * Detect conflicting location observations
 */
export function detectLocationConflicts(observations: any[]): Array<{
  type: string;
  description: string;
  observations: any[];
}> {
  const conflicts: Array<{ type: string; description: string; observations: any[] }> = [];

  // Group by country
  const byCountry = new Map<string, any[]>();
  for (const obs of observations) {
    if (obs.country) {
      if (!byCountry.has(obs.country)) {
        byCountry.set(obs.country, []);
      }
      byCountry.get(obs.country)!.push(obs);
    }
  }

  // If multiple countries with high confidence
  const highConfCountries = Array.from(byCountry.entries())
    .filter(([_, obs]) => obs.some((o) => o.confidence >= 70))
    .map(([country, _]) => country);

  if (highConfCountries.length > 1) {
    conflicts.push({
      type: 'MULTIPLE_COUNTRIES',
      description: `Evidence indicates presence in multiple countries: ${highConfCountries.join(', ')}. This may indicate travel, VPN usage, or conflicting data sources.`,
      observations: observations.filter((o) => highConfCountries.includes(o.country)),
    });
  }

  // Group by source type
  const bySource = new Map<string, any[]>();
  for (const obs of observations) {
    if (!bySource.has(obs.source)) {
      bySource.set(obs.source, []);
    }
    bySource.get(obs.source)!.push(obs);
  }

  // Check for EXACT_METADATA vs low confidence sources in different locations
  const exactMetadataObs = observations.filter((o) => o.location_type === 'EXACT_METADATA');
  const lowConfObs = observations.filter((o) => o.location_type === 'LOW' || o.location_type === 'UNKNOWN');

  for (const exact of exactMetadataObs) {
    for (const low of lowConfObs) {
      if (exact.country && low.country && exact.country !== low.country) {
        conflicts.push({
          type: 'CONFIDENCE_MISMATCH',
          description: `High-confidence EXACT_METADATA location (${exact.country}) conflicts with low-confidence observation (${low.country}). Prioritize exact metadata over weak inferences.`,
          observations: [exact, low],
        });
      }
    }
  }

  return conflicts;
}
