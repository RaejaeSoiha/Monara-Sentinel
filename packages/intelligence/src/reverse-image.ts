/**
 * Reverse Image Provider Abstraction
 * 
 * This interface defines the contract for reverse image search providers.
 * Implementations must not:
 * - Bypass CAPTCHA
 * - Bypass authentication
 * - Scrape prohibited services
 * - Violate Terms of Service
 * - Evade rate limits
 */

export interface ReverseImageProvider {
  name: string;
  version: string;
  
  /**
   * Search for similar images
   */
  searchImage(options: ReverseImageSearchOptions): Promise<ReverseImageSearchResult>;
}

export interface ReverseImageSearchOptions {
  imageUrl?: string;
  imageData?: Buffer;
  mimeType?: string;
  sha256?: string;
  phash?: string;
  dhash?: string;
  ahash?: string;
  organizationId: string;
  caseId: string;
}

export interface ReverseImageSearchResult {
  provider: string;
  queryId: string;
  matches: ReverseImageMatch[];
  totalMatches: number;
  searchTimestamp: Date;
  providerConfidence: number;
}

export interface ReverseImageMatch {
  imageUrl: string;
  title?: string;
  sourceUrl?: string;
  publishedDate?: Date;
  observedDate: Date;
  matchType: 'EXACT_MATCH' | 'NEAR_DUPLICATE' | 'POSSIBLE_MATCH' | 'NO_MATCH';
  similarity: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Mock Reverse Image Provider for Development/Testing
 * 
 * This provider returns mock results for development and testing purposes.
 * In production, integrate with legitimate reverse image search providers
 * that respect their Terms of Service and authentication requirements.
 */
export class MockReverseImageProvider implements ReverseImageProvider {
  name = 'mock';
  version = '1.0.0';

  async searchImage(_options: ReverseImageSearchOptions): Promise<ReverseImageSearchResult> {
    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return empty result for mock
    return {
      provider: this.name,
      queryId: `mock-${Date.now()}`,
      matches: [],
      totalMatches: 0,
      searchTimestamp: new Date(),
      providerConfidence: 0,
    };
  }
}

/**
 * Factory to create reverse image providers
 */
export function createReverseImageProvider(providerName: string): ReverseImageProvider {
  switch (providerName) {
    case 'mock':
      return new MockReverseImageProvider();
    default:
      throw new Error(`Unknown reverse image provider: ${providerName}`);
  }
}

/**
 * Match result classifications
 */
export enum MatchClassification {
  EXACT_MATCH = 'EXACT_MATCH',
  NEAR_DUPLICATE = 'NEAR_DUPLICATE',
  POSSIBLE_MATCH = 'POSSIBLE_MATCH',
  NO_MATCH = 'NO_MATCH',
}

/**
 * Source quality classification
 */
export enum SourceQuality {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Determine match classification based on similarity and confidence
 */
export function classifyMatch(similarity: number, confidence: number): MatchClassification {
  if (similarity >= 0.95 && confidence >= 90) {
    return MatchClassification.EXACT_MATCH;
  }
  if (similarity >= 0.80 && confidence >= 70) {
    return MatchClassification.NEAR_DUPLICATE;
  }
  if (similarity >= 0.60 && confidence >= 50) {
    return MatchClassification.POSSIBLE_MATCH;
  }
  return MatchClassification.NO_MATCH;
}

/**
 * Normalize provider results to standard format
 */
export function normalizeProviderResult(
  providerResult: any,
  providerName: string
): ReverseImageSearchResult {
  return {
    provider: providerName,
    queryId: providerResult.queryId || `query-${Date.now()}`,
    matches: (providerResult.matches || []).map((match: any) => ({
      imageUrl: match.imageUrl || match.url || '',
      title: match.title,
      sourceUrl: match.sourceUrl || match.pageUrl,
      publishedDate: match.publishedDate ? new Date(match.publishedDate) : undefined,
      observedDate: match.observedDate ? new Date(match.observedDate) : new Date(),
      matchType: match.matchType || MatchClassification.POSSIBLE_MATCH,
      similarity: match.similarity || 0,
      confidence: match.confidence || 50,
      metadata: match.metadata,
    })),
    totalMatches: providerResult.totalMatches || 0,
    searchTimestamp: providerResult.searchTimestamp ? new Date(providerResult.searchTimestamp) : new Date(),
    providerConfidence: providerResult.providerConfidence || 50,
  };
}
