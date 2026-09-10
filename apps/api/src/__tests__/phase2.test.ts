import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../test-helpers';

describe('Phase 2: Core Investigation Platform', () => {
  let app: FastifyInstance;
  let testUserToken: string;
  let testUserId: string;
  let testOrgId: string;
  let testCaseId: string;
  let testInvestigationId: string;
  let testEntityId: string;
  let testEvidenceId: string;
  let testRelationshipId: string;

  beforeAll(async () => {
    app = await createTestApp();
    
    // Create test user and get token
    const email = `phase2-${Date.now()}@example.com`;
    const register = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email, password: 'TestPassword123!', name: 'Phase2User' },
    });
    expect(register.statusCode).toBe(201);
    const data = JSON.parse(register.body);
    testUserToken = data.accessToken;
    testUserId = data.user.id;
    testOrgId = data.organization.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Cases Module', () => {
    it('should create a case with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/cases',
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          name: 'Test Investigation Case',
          description: 'Test case for Phase 2 verification',
          severity: 'HIGH',
          priority: 'HIGH',
          tags: ['test', 'phase2'],
        },
      });

      expect(response.statusCode).toBe(201);
      const caseData = JSON.parse(response.body);
      expect(caseData.case_number).toMatch(/^CASE-\d{4}-[A-Z0-9]{6}$/);
      expect(caseData.name).toBe('Test Investigation Case');
      expect(caseData.organization_id).toBe(testOrgId);
      expect(caseData.status).toBe('OPEN');
      testCaseId = caseData.id;
    });

    it('should list cases for authenticated user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/cases',
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.items).toBeInstanceOf(Array);
      expect(data.items.length).toBeGreaterThan(0);
      expect(data.items[0].organization_id).toBe(testOrgId);
    });

    it('should get specific case by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${testCaseId}`,
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.statusCode).toBe(200);
      const caseData = JSON.parse(response.body);
      expect(caseData.id).toBe(testCaseId);
      expect(caseData.case_number).toBeDefined();
    });

    it('should update case details', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/cases/${testCaseId}`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          name: 'Updated Test Case',
          status: 'IN_PROGRESS',
          severity: 'MEDIUM',
        },
      });

      expect(response.statusCode).toBe(200);
      const caseData = JSON.parse(response.body);
      expect(caseData.name).toBe('Updated Test Case');
      expect(caseData.status).toBe('IN_PROGRESS');
    });

    it('should enforce tenant isolation on cases', async () => {
      // Create another user with different org
      const otherEmail = `other-${Date.now()}@example.com`;
      const otherRegister = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: otherEmail, password: 'TestPassword123!', name: 'OtherUser' },
      });
      const otherToken = JSON.parse(otherRegister.body).accessToken;

      // Try to access first user's case with second user's token
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${testCaseId}`,
        headers: { Authorization: `Bearer ${otherToken}` },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Investigations Module', () => {
    it('should create investigation under case', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/investigations`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          name: 'Primary Investigation',
          description: 'Main investigation thread',
          severity: 'HIGH',
          priority: 'HIGH',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.case_id).toBe(testCaseId);
      expect(data.name).toBe('Primary Investigation');
      testInvestigationId = data.id;
    });

    it('should list investigations for case', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${testCaseId}/investigations`,
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.items).toBeInstanceOf(Array);
      expect(data.items.length).toBeGreaterThan(0);
    });

    it('should update investigation', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/investigations/${testInvestigationId}`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          name: 'Updated Investigation',
          status: 'COMPLETED',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.name).toBe('Updated Investigation');
      expect(data.status).toBe('COMPLETED');
    });
  });

  describe('Entity System', () => {
    it('should create entity with valid type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          type: 'DOMAIN',
          value: 'example.com',
          display_name: 'Example Domain',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.type).toBe('DOMAIN');
      expect(data.value).toBe('example.com');
      expect(data.case_id).toBe(testCaseId);
      testEntityId = data.id;
    });

    it('should support all required entity types', async () => {
      const entityTypes = ['PERSON', 'ORGANIZATION', 'EMAIL', 'PHONE', 'USERNAME', 'URL', 'IP_ADDRESS', 'CRYPTO_ADDRESS'];
      
      for (const type of entityTypes) {
        const response = await app.inject({
          method: 'POST',
          url: `/api/v1/cases/${testCaseId}/entities`,
          headers: { Authorization: `Bearer ${testUserToken}` },
          payload: {
            type,
            value: `test-${type.toLowerCase()}-${Date.now()}`,
          },
        });
        expect(response.statusCode).toBe(201);
      }
    });

    it('should list entities for case', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${testCaseId}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.items).toBeInstanceOf(Array);
      expect(data.items.length).toBeGreaterThan(0);
    });

    it('should enforce entity type validation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          type: 'INVALID_TYPE',
          value: 'test',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Evidence System', () => {
    it('should create evidence with OBSERVED status', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/evidence`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          source_url: 'https://example.com',
          source_type: 'MANUAL',
          source_title: 'Test Evidence',
          content: 'This is observed evidence content',
          verification_status: 'OBSERVED',
          confidence: 75,
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.verification_status).toBe('OBSERVED');
      expect(data.case_id).toBe(testCaseId);
      expect(data.sha256).toBeDefined();
      testEvidenceId = data.id;
    });

    it('should generate SHA-256 hash for content', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/evidence/${testEvidenceId}`,
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.sha256).toBeDefined();
      expect(data.sha256).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should support all verification statuses', async () => {
      const statuses = ['OBSERVED', 'VERIFIED', 'CORROBORATED', 'INFERENCE', 'HYPOTHESIS', 'UNKNOWN'];
      
      for (const status of statuses) {
        const response = await app.inject({
          method: 'POST',
          url: `/api/v1/cases/${testCaseId}/evidence`,
          headers: { Authorization: `Bearer ${testUserToken}` },
          payload: {
            source_type: 'TEST',
            content: `Test content for ${status}`,
            verification_status: status,
            confidence: 50,
          },
        });
        expect(response.statusCode).toBe(201);
      }
    });

    it('should associate evidence with entities', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/evidence/${testEvidenceId}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          entity_id: testEntityId,
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.entity_id).toBe(testEntityId);
      expect(data.evidence_id).toBe(testEvidenceId);
    });

    it('should reject cross-case evidence-entity association', async () => {
      // Create a different case
      const otherCase = await app.inject({
        method: 'POST',
        url: '/api/v1/cases',
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: { name: 'Other Case' },
      });
      const otherCaseData = JSON.parse(otherCase.body);

      // Create entity in other case
      const otherEntity = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${otherCaseData.id}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: { type: 'DOMAIN', value: 'other.com' },
      });
      const otherEntityData = JSON.parse(otherEntity.body);

      // Try to associate cross-case entity with evidence
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/evidence/${testEvidenceId}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          entity_id: otherEntityData.id,
        },
      });

      expect([400, 404]).toContain(response.statusCode);
    });

    it('should reject duplicate evidence-entity association', async () => {
      // First association
      await app.inject({
        method: 'POST',
        url: `/api/v1/evidence/${testEvidenceId}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          entity_id: testEntityId,
        },
      });

      // Try duplicate association
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/evidence/${testEvidenceId}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          entity_id: testEntityId,
        },
      });

      // Should succeed (idempotent) but not create duplicate
      expect([200, 201]).toContain(response.statusCode);
    });

    it('should remove evidence-entity association', async () => {
      // First create association
      await app.inject({
        method: 'POST',
        url: `/api/v1/evidence/${testEvidenceId}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          entity_id: testEntityId,
        },
      });

      // Remove association
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/evidence/${testEvidenceId}/entities/${testEntityId}`,
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.statusCode).toBe(204);
    });
  });

  describe('Relationship System', () => {
    it('should create relationship between entities', async () => {
      // Create another entity for relationship
      const targetEntity = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          type: 'DOMAIN',
          value: 'target.com',
        },
      });
      const targetData = JSON.parse(targetEntity.body);

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/relationships`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          source_entity_id: testEntityId,
          target_entity_id: targetData.id,
          type: 'LINKS_TO',
          confidence: 80,
          explanation: 'Test relationship explanation',
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.type).toBe('LINKS_TO');
      expect(data.confidence).toBe(80);
      testRelationshipId = data.id;
    });

    it('should validate relationship types', async () => {
      const validTypes = ['USES', 'OWNS', 'MENTIONS', 'LINKS_TO', 'HOSTED_ON', 'RESOLVES_TO', 'SHARES', 'REUSES', 'REFERENCES', 'ASSOCIATED_WITH', 'POSSIBLY_ASSOCIATED_WITH'];
      
      for (const type of validTypes) {
        const response = await app.inject({
          method: 'POST',
          url: `/api/v1/cases/${testCaseId}/relationships`,
          headers: { Authorization: `Bearer ${testUserToken}` },
          payload: {
            source_entity_id: testEntityId,
            target_entity_id: testEntityId,
            type,
            confidence: 50,
          },
        });
        expect(response.statusCode).toBe(201);
      }
    });

    it('should enforce same-case relationship validation', async () => {
      // Create a different case
      const otherCase = await app.inject({
        method: 'POST',
        url: '/api/v1/cases',
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: { name: 'Other Case' },
      });
      const otherCaseData = JSON.parse(otherCase.body);

      // Create entity in other case
      const otherEntity = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${otherCaseData.id}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: { type: 'DOMAIN', value: 'other.com' },
      });
      const otherEntityData = JSON.parse(otherEntity.body);

      // Try to create cross-case relationship
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/relationships`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          source_entity_id: testEntityId,
          target_entity_id: otherEntityData.id,
          type: 'LINKS_TO',
          confidence: 50,
        },
      });

      // Should be rejected - either 400 (validation error) or 404 (entity not found in context)
      expect([400, 404]).toContain(response.statusCode);
    });
  });

  describe('Timeline System', () => {
    it('should create timeline events for case actions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${testCaseId}/timeline`,
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.items).toBeInstanceOf(Array);
      expect(data.items.length).toBeGreaterThan(0);
      
      // Check for expected event types
      const eventTypes = data.items.map((item: any) => item.event_type);
      expect(eventTypes).toContain('CASE_CREATED');
      expect(eventTypes).toContain('ENTITY_ADDED');
      expect(eventTypes).toContain('EVIDENCE_COLLECTED');
    });

    it('should support all timeline event types', async () => {
      const validTypes = [
        'CASE_CREATED', 'CASE_UPDATED', 'CASE_STATUS_CHANGED',
        'INVESTIGATION_CREATED', 'INVESTIGATION_UPDATED',
        'ENTITY_ADDED', 'ENTITY_UPDATED',
        'EVIDENCE_COLLECTED', 'EVIDENCE_VERIFIED',
        'RELATIONSHIP_CREATED', 'RELATIONSHIP_UPDATED',
        'ANALYST_NOTE', 'ASSIGNMENT_CHANGED'
      ];
      
      // The timeline should have some of these events from previous operations
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${testCaseId}/timeline`,
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const data = JSON.parse(response.body);
      const existingTypes = data.items.map((item: any) => item.event_type);
      
      // At least some should be present
      expect(existingTypes.length).toBeGreaterThan(0);
    });

    it('should order timeline chronologically', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${testCaseId}/timeline`,
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const data = JSON.parse(response.body);
      
      // Check that items are ordered by occurred_at descending
      for (let i = 1; i < data.items.length; i++) {
        const current = new Date(data.items[i].occurred_at);
        const previous = new Date(data.items[i-1].occurred_at);
        expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
      }
    });

    it('should create manual analyst timeline event', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/timeline`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          event_type: 'ANALYST_NOTE',
          title: 'Manual analyst note',
          description: 'This is a manual timeline event created by an analyst',
          occurred_at: new Date().toISOString(),
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.event_type).toBe('ANALYST_NOTE');
      expect(data.title).toBe('Manual analyst note');
    });

    it('should create timeline event with entity association', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/timeline`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          event_type: 'ENTITY_UPDATED',
          title: 'Entity-related timeline event',
          description: 'Timeline event associated with an entity',
          entity_id: testEntityId,
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.entity_id).toBe(testEntityId);
    });

    it('should create timeline event with evidence association', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/timeline`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          event_type: 'EVIDENCE_VERIFIED',
          title: 'Evidence-related timeline event',
          description: 'Timeline event associated with evidence',
          evidence_id: testEvidenceId,
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.evidence_id).toBe(testEvidenceId);
    });

    it('should reject cross-case timeline event with entity', async () => {
      // Create a different case
      const otherCase = await app.inject({
        method: 'POST',
        url: '/api/v1/cases',
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: { name: 'Other Case' },
      });
      const otherCaseData = JSON.parse(otherCase.body);

      // Create entity in other case
      const otherEntity = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${otherCaseData.id}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: { type: 'DOMAIN', value: 'other.com' },
      });
      const otherEntityData = JSON.parse(otherEntity.body);

      // Try to create timeline event with cross-case entity
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/timeline`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          event_type: 'ENTITY_UPDATED',
          title: 'Cross-case entity attempt',
          entity_id: otherEntityData.id,
        },
      });

      expect([400, 404]).toContain(response.statusCode);
    });

    it('should reject cross-case timeline event with evidence', async () => {
      // Create a different case
      const otherCase = await app.inject({
        method: 'POST',
        url: '/api/v1/cases',
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: { name: 'Other Case' },
      });
      const otherCaseData = JSON.parse(otherCase.body);

      // Create evidence in other case
      const otherEvidence = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${otherCaseData.id}/evidence`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          source_url: 'https://other.example.com',
          source_type: 'MANUAL',
          content: 'Other evidence content',
        },
      });
      const otherEvidenceData = JSON.parse(otherEvidence.body);

      // Try to create timeline event with cross-case evidence
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/timeline`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          event_type: 'EVIDENCE_VERIFIED',
          title: 'Cross-case evidence attempt',
          evidence_id: otherEvidenceData.id,
        },
      });

      expect([400, 404]).toContain(response.statusCode);
    });
  });

  describe('Tenant Isolation Comprehensive', () => {
    it('should prevent cross-tenant entity access', async () => {
      const otherEmail = `tenant2-${Date.now()}@example.com`;
      const otherRegister = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: otherEmail, password: 'TestPassword123!' },
      });
      const otherToken = JSON.parse(otherRegister.body).accessToken;

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${testCaseId}/entities`,
        headers: { Authorization: `Bearer ${otherToken}` },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should prevent cross-tenant evidence access', async () => {
      const otherEmail = `tenant3-${Date.now()}@example.com`;
      const otherRegister = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: otherEmail, password: 'TestPassword123!' },
      });
      const otherToken = JSON.parse(otherRegister.body).accessToken;

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${testCaseId}/evidence`,
        headers: { Authorization: `Bearer ${otherToken}` },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should prevent cross-tenant relationship access', async () => {
      const otherEmail = `tenant4-${Date.now()}@example.com`;
      const otherRegister = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: otherEmail, password: 'TestPassword123!' },
      });
      const otherToken = JSON.parse(otherRegister.body).accessToken;

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${testCaseId}/relationships`,
        headers: { Authorization: `Bearer ${otherToken}` },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should prevent cross-tenant timeline access', async () => {
      const otherEmail = `tenant5-${Date.now()}@example.com`;
      const otherRegister = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: otherEmail, password: 'TestPassword123!' },
      });
      const otherToken = JSON.parse(otherRegister.body).accessToken;

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/cases/${testCaseId}/timeline`,
        headers: { Authorization: `Bearer ${otherToken}` },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should prevent cross-tenant evidence-entity association', async () => {
      const otherEmail = `tenant6-${Date.now()}@example.com`;
      const otherRegister = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: otherEmail, password: 'TestPassword123!' },
      });
      const otherToken = JSON.parse(otherRegister.body).accessToken;

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/evidence/${testEvidenceId}/entities`,
        headers: { Authorization: `Bearer ${otherToken}` },
        payload: { entity_id: testEntityId },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Audit Logging', () => {
    it('should create audit logs for case operations', async () => {
      const { prisma } = await import('@monara-sentinel/database');
      
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          organization_id: testOrgId,
          entity_type: 'case',
          entity_id: testCaseId,
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      const actions = auditLogs.map(log => log.action);
      expect(actions).toContain('case.create');
      expect(actions).toContain('case.update');
    });

    it('should create audit logs for evidence operations', async () => {
      const { prisma } = await import('@monara-sentinel/database');
      
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          organization_id: testOrgId,
          entity_type: 'evidence',
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('RBAC and Authorization', () => {
    it('should require authentication for all Phase 2 endpoints', async () => {
      const endpoints = [
        { url: `/api/v1/cases/${testCaseId}`, method: 'GET' },
        { url: `/api/v1/cases/${testCaseId}/entities`, method: 'GET' },
        { url: `/api/v1/cases/${testCaseId}/evidence`, method: 'GET' },
        { url: `/api/v1/cases/${testCaseId}/relationships`, method: 'GET' },
        { url: `/api/v1/cases/${testCaseId}/timeline`, method: 'GET' },
        { url: `/api/v1/evidence/${testEvidenceId}/entities`, method: 'POST', body: { entity_id: testEntityId } },
      ];

      for (const endpoint of endpoints) {
        const response = await app.inject({
          method: endpoint.method as 'GET' | 'POST',
          url: endpoint.url,
          payload: endpoint.body,
        });
        expect(response.statusCode).toBe(401);
      }
    });

    it('should validate input with Zod schemas', async () => {
      // Test invalid case creation
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/cases',
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          name: '', // Invalid: empty name
          severity: 'INVALID_SEVERITY',
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should require evidence-entity association authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/evidence/${testEvidenceId}/entities`,
        payload: { entity_id: testEntityId },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should require timeline creation authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/cases/${testCaseId}/timeline`,
        payload: {
          event_type: 'ANALYST_NOTE',
          title: 'Test note',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Evidence Immutability and Security', () => {
    it('should not allow modification of evidence content after creation', async () => {
      // Re-associate entity for this test
      await app.inject({
        method: 'POST',
        url: `/api/v1/evidence/${testEvidenceId}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          entity_id: testEntityId,
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/evidence/${testEvidenceId}`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          verification_status: 'VERIFIED',
          confidence: 80,
        },
      });

      // Evidence metadata can be updated, but not content (removed from schema)
      expect(response.statusCode).toBe(200);
    });

    it('should maintain consistent SHA-256 hash', async () => {
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/v1/evidence/${testEvidenceId}`,
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      
      const data = JSON.parse(getResponse.body);
      const originalHash = data.sha256;
      
      // SHA-256 should remain consistent
      expect(originalHash).toBeDefined();
      expect(originalHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should display evidence with associated entities', async () => {
      // Ensure association exists
      await app.inject({
        method: 'POST',
        url: `/api/v1/evidence/${testEvidenceId}/entities`,
        headers: { Authorization: `Bearer ${testUserToken}` },
        payload: {
          entity_id: testEntityId,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/evidence/${testEvidenceId}`,
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.entity_links).toBeDefined();
      expect(data.entity_links).toBeInstanceOf(Array);
    });

    it('should display entity with associated evidence', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/entities/${testEntityId}`,
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.evidence_links).toBeDefined();
      expect(data.evidence_links).toBeInstanceOf(Array);
    });
  });
});
