import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createTestApp } from '../test-helpers';
import { prisma } from '@monara-sentinel/database';
import { validateUrl, isBlockedIp, decodeIP } from '@monara-sentinel/ssrf';

describe('Phase 3: Safe Intelligence & OSINT', () => {
  let app: FastifyInstance<typeof ZodTypeProvider>;
  let authToken: string;
  let organizationId: string;
  let userId: string;
  let caseId: string;

  beforeAll(async () => {
    app = await createTestApp();
    
    // Register and login
    const email = `phase3-${Date.now()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email,
        password: 'Phase3Test123!',
        name: 'Phase 3 Test User',
      },
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email,
        password: 'Phase3Test123!',
      },
    });

    const loginData = JSON.parse(loginRes.body);
    authToken = loginData.accessToken;
    userId = loginData.user.id;
    organizationId = loginData.organization.id;

    // Create a case
    const caseRes = await app.inject({
      method: 'POST',
      url: '/api/v1/cases',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        name: 'Phase 3 Test Case',
        description: 'Testing intelligence collection',
        severity: 'MEDIUM',
        priority: 'MEDIUM',
      },
    });

    const caseData = JSON.parse(caseRes.body);
    caseId = caseData.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.evidence.deleteMany({ where: { case_id: caseId } });
    await prisma.entity.deleteMany({ where: { case_id: caseId } });
    await prisma.relationship.deleteMany({ where: { case_id: caseId } });
    await prisma.riskIndicator.deleteMany({ where: { case_id: caseId } });
    await prisma.intelligenceJob.deleteMany({ where: { case_id: caseId } });
    await prisma.timelineEvent.deleteMany({ where: { case_id: caseId } });
    await prisma.case.deleteMany({ where: { id: caseId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  describe('SSRF Protection (Unit Tests)', () => {
    it('should block 127.0.0.1', () => {
      expect(isBlockedIp('127.0.0.1')).toBe(true);
    });

    it('should block 0.0.0.0', () => {
      expect(isBlockedIp('0.0.0.0')).toBe(true);
    });

    it('should block 10.0.0.1', () => {
      expect(isBlockedIp('10.0.0.1')).toBe(true);
    });

    it('should block 192.168.1.1', () => {
      expect(isBlockedIp('192.168.1.1')).toBe(true);
    });

    it('should block 172.16.0.1', () => {
      expect(isBlockedIp('172.16.0.1')).toBe(true);
    });

    it('should block 169.254.169.254', () => {
      expect(isBlockedIp('169.254.169.254')).toBe(true);
    });

    it('should block ::1', () => {
      expect(isBlockedIp('::1')).toBe(true);
    });

    it('should allow public IPv4', () => {
      expect(isBlockedIp('8.8.8.8')).toBe(false);
    });

    it('should decode decimal IP 2130706433 to 127.0.0.1', () => {
      expect(decodeIP('2130706433')).toBe('127.0.0.1');
    });

    it('should decode hex IP 0x7f000001 to 127.0.0.1', () => {
      expect(decodeIP('0x7f000001')).toBe('127.0.0.1');
    });

    it('should block localhost URL', () => {
      expect(() => validateUrl('http://localhost')).toThrow();
    });

    it('should block 127.0.0.1 URL', () => {
      expect(() => validateUrl('http://127.0.0.1')).toThrow();
    });

    it('should block .local domain', () => {
      expect(() => validateUrl('http://example.local')).toThrow();
    });

    it('should allow valid public URL', () => {
      const url = validateUrl('https://example.com');
      expect(url.hostname).toBe('example.com');
    });
  });

  describe('Database Models', () => {
    it('should have IntelligenceJob model', async () => {
      // Verify the IntelligenceJob model exists in database
      const jobs = await prisma.intelligenceJob.findMany();
      expect(Array.isArray(jobs)).toBe(true);
    });

    it('should have RiskIndicator model', async () => {
      // Verify the RiskIndicator model exists in database
      const indicators = await prisma.riskIndicator.findMany();
      expect(Array.isArray(indicators)).toBe(true);
    });
  });

  describe('Timeline Events', () => {
    it('should support new Phase 3 event types', async () => {
      // Test that new timeline event types are valid
      const event = await prisma.timelineEvent.create({
        data: {
          case_id: caseId,
          event_type: 'INTELLIGENCE_REQUESTED',
          title: 'Test intelligence requested',
          created_by: userId,
        },
      });

      expect(event.event_type).toBe('INTELLIGENCE_REQUESTED');

      // Cleanup
      await prisma.timelineEvent.delete({ where: { id: event.id } });
    });
  });

  describe('Security - Authentication', () => {
    it('should require authentication for intelligence endpoints', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${caseId}/intelligence/dns`,
        payload: { domain: 'example.com' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should require authentication for intelligence retrieval', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${caseId}/intelligence`,
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
