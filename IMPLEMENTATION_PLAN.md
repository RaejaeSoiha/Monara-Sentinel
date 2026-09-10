# SCAMNET - Implementation Plan

## Overview

This document provides a detailed implementation plan for building SCAMNET in phases. Each phase contains specific tasks with acceptance criteria and dependencies.

---

## Phase 0: Repository Assessment ✅

**Status**: Completed

**Deliverables**:
- [x] ARCHITECTURE.md
- [x] IMPLEMENTATION_PLAN.md (this document)
- [ ] SECURITY_PLAN.md
- [ ] DATABASE_PLAN.md

**Acceptance Criteria**:
- All planning documents created
- Architecture reviewed and approved
- Implementation roadmap confirmed
- Technology stack finalized

---

## Phase 1: Foundation

**Goal**: Establish the core infrastructure for SCAMNET including monorepo structure, database, authentication, API, and frontend foundation.

### 1.1 Monorepo Structure Setup

**Tasks**:
1. Create directory structure:
   ```
   Monara-Sentinel/
   ├── apps/
   │   ├── web/
   │   └── api/
   ├── packages/
   │   ├── database/
   │   ├── shared/
   │   ├── auth/
   │   ├── validation/
   │   ├── intelligence/
   │   ├── image-analysis/
   │   ├── risk-engine/
   │   └── reporting/
   ├── infrastructure/
   │   ├── docker/
   │   └── nginx/
   ├── scripts/
   ├── docs/
   └── .github/
   ```

2. Initialize root package.json with workspaces
3. Install Turbo for monorepo management
4. Configure .gitignore
5. Create .env.example with all required environment variables

**Acceptance Criteria**:
- Directory structure created
- Root package.json configured with workspaces
- Turbo installed and configured
- .gitignore properly configured
- .env.example contains all required variables

### 1.2 TypeScript Configuration

**Tasks**:
1. Create root tsconfig.json with base configuration
2. Create tsconfig.json for each package/app
3. Configure path aliases
4. Set up strict type checking
5. Configure ESLint with TypeScript support
6. Configure Prettier
7. Add pre-commit hooks (husky + lint-staged)

**Acceptance Criteria**:
- TypeScript compiles without errors
- ESLint runs without errors
- Prettier formats code consistently
- Pre-commit hooks work
- Path aliases resolve correctly

### 1.3 Database Setup

**Tasks**:
1. Initialize packages/database package
2. Install Prisma and PostgreSQL client
3. Create Docker Compose configuration for PostgreSQL
4. Create Docker Compose configuration for Redis
5. Initialize Prisma schema
6. Create initial migration
7. Set up database connection pooling
8. Create database seed script
9. Add Prisma to turbo pipeline

**Acceptance Criteria**:
- PostgreSQL runs via Docker Compose
- Redis runs via Docker Compose
- Prisma client generates successfully
- Migrations run successfully
- Seed script populates test data
- Database connection works

### 1.4 Core Database Schema (Foundation)

**Tasks**:
1. Create User model:
   - id, email, password_hash, name, created_at, updated_at, deleted_at
   - Unique constraint on email
   - Index on email

2. Create Organization model:
   - id, name, slug, created_at, updated_at, deleted_at
   - Unique constraint on slug
   - Index on slug

3. Create Membership model:
   - id, user_id, organization_id, role_id, created_at, updated_at
   - Foreign keys to User and Organization
   - Unique constraint on (user_id, organization_id)

4. Create Role model:
   - id, name, description, created_at, updated_at
   - Default roles: OWNER, ADMIN, INVESTIGATOR, VIEWER

5. Create Permission model:
   - id, name, description, resource, action, created_at, updated_at
   - Example: cases:read, cases:write, evidence:upload, etc.

6. Create RolePermission join table:
   - role_id, permission_id
   - Composite primary key

7. Create Session model:
   - id, user_id, token_hash, expires_at, created_at
   - Index on user_id
   - Index on token_hash

8. Create and run migration

**Acceptance Criteria**:
- All models created in Prisma schema
- Migration runs successfully
- Foreign key constraints work
- Indexes created
- Seed data includes default roles and permissions

### 1.5 Authentication System

**Tasks**:
1. Create packages/auth package
2. Implement password hashing using Argon2
3. Implement JWT token generation
4. Implement JWT token validation
5. Implement refresh token logic
6. Implement session management
7. Create authentication middleware for API
8. Create authentication utilities for frontend

**Acceptance Criteria**:
- Passwords hashed with Argon2
- JWT tokens generated and validated
- Refresh tokens work
- Sessions stored in Redis
- Middleware protects API routes
- Frontend can authenticate users

### 1.6 Authorization System (RBAC)

**Tasks**:
1. Implement permission checking logic
2. Create authorization middleware for API
3. Implement tenant isolation middleware
4. Create authorization utilities for frontend
5. Add role-based UI component guards
6. Test permission checks

**Acceptance Criteria**:
- Permissions checked correctly
- Middleware prevents unauthorized access
- Tenant isolation enforced at database level
- Frontend UI respects permissions
- Tests verify authorization

### 1.7 API Foundation (Fastify)

**Tasks**:
1. Initialize apps/api package
2. Install Fastify and dependencies
3. Create Fastify server instance
4. Configure CORS
5. Configure rate limiting
6. Configure security headers
7. Set up Zod validation integration
8. Create health check endpoint
9. Create error handler
10. Set up logging (pino)
11. Configure OpenAPI/Swagger documentation
12. Create API route structure

**Acceptance Criteria**:
- Fastify server starts
- Health check endpoint responds
- CORS configured
- Rate limiting works
- Security headers present
- OpenAPI documentation available
- Errors handled gracefully
- Logging outputs structured logs

### 1.8 Authentication API Endpoints

**Tasks**:
1. POST /api/auth/register
   - Validate input (Zod)
   - Hash password
   - Create user
   - Create default organization
   - Create membership
   - Generate tokens
   - Return tokens

2. POST /api/auth/login
   - Validate input
   - Find user by email
   - Verify password
   - Generate tokens
   - Create session
   - Return tokens

3. POST /api/auth/refresh
   - Validate refresh token
   - Generate new access token
   - Return new tokens

4. POST /api/auth/logout
   - Invalidate session
   - Clear tokens

5. GET /api/auth/me
   - Validate access token
   - Return user profile

**Acceptance Criteria**:
- Registration works
- Login works
- Token refresh works
- Logout works
- Profile retrieval works
- All endpoints validate input
- All endpoints documented in OpenAPI

### 1.9 Organization API Endpoints

**Tasks**:
1. POST /api/organizations
   - Create organization
   - Assign creator as owner
   - Return organization

2. GET /api/organizations
   - List user's organizations
   - Pagination support

3. GET /api/organizations/:id
   - Get organization details
   - Verify membership

4. PUT /api/organizations/:id
   - Update organization
   - Verify owner/admin role

5. POST /api/organizations/:id/members
   - Invite member
   - Verify owner/admin role
   - Send invitation (future)

6. PUT /api/organizations/:id/members/:id
   - Update member role
   - Verify owner role

7. DELETE /api/organizations/:id/members/:id
   - Remove member
   - Verify owner/admin role

**Acceptance Criteria**:
- Organizations can be created
- Organizations can be listed
- Organization details can be retrieved
- Organizations can be updated
- Members can be invited
- Member roles can be updated
- Members can be removed
- All endpoints enforce authorization
- Tenant isolation verified

### 1.10 Frontend Foundation (Next.js)

**Tasks**:
1. Initialize apps/web package with Next.js 14
2. Configure TypeScript
3. Configure Tailwind CSS
4. Install React dependencies
5. Set up app directory structure
6. Configure environment variables
7. Create root layout
8. Create authentication context
9. Create authentication hooks
10. Set up TanStack Query
11. Configure API client
12. Create error boundary
13. Create loading states
14. Set up routing

**Acceptance Criteria**:
- Next.js app starts
- TypeScript compiles
- Tailwind CSS works
- Authentication context works
- API client configured
- TanStack Query configured
- Routing works
- Error boundary works

### 1.11 Authentication UI

**Tasks**:
1. Create login page
2. Create registration page
3. Create logout functionality
4. Create protected route wrapper
5. Create authentication forms with validation
6. Add error handling
7. Add loading states
8. Create user profile display

**Acceptance Criteria**:
- Login page works
- Registration page works
- Logout works
- Protected routes redirect to login
- Forms validate input
- Errors displayed
- Loading states shown
- Profile displays correctly

### 1.12 Organization UI

**Tasks**:
1. Create organization list page
2. Create organization detail page
3. Create organization creation form
4. Create organization edit form
5. Create member management UI
6. Add permission-based UI guards
7. Add loading and error states

**Acceptance Criteria**:
- Organizations listed
- Organization details shown
- Organizations can be created
- Organizations can be edited
- Members can be managed
- UI respects permissions
- Loading and error states work

### 1.13 Logging Infrastructure

**Tasks**:
1. Configure structured logging (pino)
2. Create log levels
3. Add request logging middleware
4. Add error logging
5. Add audit logging setup
6. Configure log rotation
7. Add correlation IDs

**Acceptance Criteria**:
- Logs are structured JSON
- Log levels work
- Requests logged
- Errors logged
- Audit events logged
- Logs rotate properly
- Correlation IDs trace requests

### 1.14 Error Handling

**Tasks**:
1. Create error classes
2. Create error handler middleware
3. Standardize error responses
4. Add error logging
5. Create frontend error handling
6. Add user-friendly error messages
7. Add error boundaries

**Acceptance Criteria**:
- Errors caught and handled
- Error responses standardized
- Errors logged
- Frontend displays errors appropriately
- Error boundaries prevent crashes

### 1.15 Testing Infrastructure

**Tasks**:
1. Install Vitest
2. Configure Vitest for monorepo
3. Install Playwright
4. Configure Playwright for E2E tests
5. Create test utilities
6. Create test database setup
7. Create API test helpers
8. Create frontend test helpers
9. Add test scripts to package.json

**Acceptance Criteria**:
- Vitest runs unit tests
- Playwright runs E2E tests
- Test database setup works
- Test helpers work
- Tests can run in CI

### 1.16 Phase 1 Testing

**Tasks**:
1. Write unit tests for authentication logic
2. Write unit tests for authorization logic
3. Write unit tests for password hashing
4. Write unit tests for JWT operations
5. Write API tests for auth endpoints
6. Write API tests for organization endpoints
7. Write E2E tests for login flow
8. Write E2E tests for registration flow
9. Write E2E tests for organization management
10. Write tenant isolation tests

**Acceptance Criteria**:
- All unit tests pass
- All API tests pass
- All E2E tests pass
- Tenant isolation verified
- Code coverage measured

### Phase 1 Acceptance Criteria

- [ ] Monorepo structure created
- [ ] All packages compile without errors
- [ ] PostgreSQL database runs via Docker
- [ ] Redis runs via Docker
- [ ] Prisma migrations work
- [ ] User registration/login works
- [ ] Organization creation works
- [ ] RBAC system works
- [ ] API serves OpenAPI documentation
- [ ] Frontend loads and authenticates
- [ ] Logging outputs structured logs
- [ ] Errors are handled gracefully
- [ ] Vitest runs unit tests
- [ ] Playwright runs E2E tests
- [ ] All Phase 1 tests pass

---

## Phase 2: Investigation Core

**Goal**: Implement the core investigation entities, evidence management, and audit logging.

### 2.1 Database Schema - Investigation Entities

**Tasks**:
1. Create Case model:
   - id, organization_id, name, description, status, priority, created_by, created_at, updated_at, deleted_at
   - Foreign key to Organization
   - Index on organization_id
   - Index on status
   - Index on created_by

2. Create Investigation model:
   - id, case_id, name, description, status, created_by, created_at, updated_at, deleted_at
   - Foreign key to Case
   - Index on case_id
   - Index on status

3. Create Person model:
   - id, case_id, name, aliases, notes, created_at, updated_at, deleted_at
   - Foreign key to Case
   - Index on case_id

4. Create OrganizationEntity model:
   - id, case_id, name, type, registration_number, notes, created_at, updated_at, deleted_at
   - Foreign key to Case
   - Index on case_id

5. Create Username model:
   - id, case_id, platform, username, url, notes, created_at, updated_at, deleted_at
   - Foreign key to Case
   - Index on case_id
   - Index on platform

6. Create Email model:
   - id, case_id, email, notes, created_at, updated_at, deleted_at
   - Foreign key to Case
   - Index on case_id
   - Index on email

7. Create Phone model:
   - id, case_id, phone, country_code, notes, created_at, updated_at, deleted_at
   - Foreign key to Case
   - Index on case_id
   - Index on phone

8. Create Domain model:
   - id, case_id, domain, registrar, registered_date, expiry_date, notes, created_at, updated_at, deleted_at
   - Foreign key to Case
   - Index on case_id
   - Index on domain

9. Create URL model:
   - id, case_id, url, domain_id, method, status_code, notes, created_at, updated_at, deleted_at
   - Foreign key to Case
   - Foreign key to Domain
   - Index on case_id
   - Index on domain_id

10. Create IPAddress model:
   - id, case_id, ip_address, type, asn, country, notes, created_at, updated_at, deleted_at
    - Foreign key to Case
    - Index on case_id
    - Index on ip_address

11. Create Certificate model:
   - id, case_id, domain_id, fingerprint, issuer, subject, valid_from, valid_to, notes, created_at, updated_at, deleted_at
    - Foreign key to Case
    - Foreign key to Domain
    - Index on case_id
    - Index on domain_id

12. Create Website model:
   - id, case_id, domain_id, url, title, description, screenshot_url, notes, created_at, updated_at, deleted_at
    - Foreign key to Case
    - Foreign key to Domain
    - Index on case_id
    - Index on domain_id

13. Create SocialProfile model:
   - id, case_id, platform, username, url, display_name, bio, followers, following, notes, created_at, updated_at, deleted_at
    - Foreign key to Case
    - Index on case_id
    - Index on platform

14. Create CryptoAddress model:
   - id, case_id, currency, address, notes, created_at, updated_at, deleted_at
    - Foreign key to Case
    - Index on case_id
    - Index on address

15. Create PaymentIdentifier model:
   - id, case_id, type, identifier, notes, created_at, updated_at, deleted_at
    - Foreign key to Case
    - Index on case_id

16. Create and run migration

**Acceptance Criteria**:
- All entity models created
- Migration runs successfully
- Foreign key constraints work
- Indexes created
- Tenant isolation via organization_id

### 2.2 Database Schema - Evidence and Sources

**Tasks**:
1. Create Source model:
   - id, type, url, title, description, reliability, created_at, updated_at
   - Index on type
   - Index on url

2. Create Evidence model:
   - id, case_id, source_id, type, content, excerpt, screenshot_url, hash, mime_type, metadata, collection_method, confidence, verification_status, observed_at, retrieved_at, created_by, created_at, updated_at
   - Foreign key to Case
   - Foreign key to Source
   - Index on case_id
   - Index on source_id
   - Index on hash
   - Index on type

3. Create EntityEvidence join table:
   - entity_type, entity_id, evidence_id
   - Composite primary key
   - Index on entity_type, entity_id
   - Index on evidence_id

4. Create TimelineEvent model:
   - id, case_id, entity_type, entity_id, event_type, title, description, occurred_at, created_by, created_at, updated_at
   - Foreign key to Case
   - Index on case_id
   - Index on occurred_at
   - Index on entity_type, entity_id

5. Create AuditLog model:
   - id, organization_id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at
   - Foreign key to Organization
   - Foreign key to User
   - Index on organization_id
   - Index on user_id
   - Index on entity_type, entity_id
   - Index on created_at

6. Create and run migration

**Acceptance Criteria**:
- Evidence and source models created
- Migration runs successfully
- Entity-evidence relationships work
- Timeline events work
- Audit logs work
- Indexes created

### 2.3 Case Management API

**Tasks**:
1. POST /api/cases
   - Create case
   - Validate organization access
   - Set creator
   - Return case

2. GET /api/cases
   - List cases (paginated)
   - Filter by organization
   - Filter by status
   - Filter by priority

3. GET /api/cases/:id
   - Get case details
   - Verify organization access

4. PUT /api/cases/:id
   - Update case
   - Verify organization access
   - Log changes

5. DELETE /api/cases/:id
   - Soft delete case
   - Verify organization access
   - Log deletion

**Acceptance Criteria**:
- Cases can be created
- Cases can be listed with filters
- Case details can be retrieved
- Cases can be updated
- Cases can be soft deleted
- All endpoints enforce tenant isolation
- All changes audited

### 2.4 Investigation Management API

**Tasks**:
1. POST /api/cases/:caseId/investigations
   - Create investigation
   - Verify case access
   - Return investigation

2. GET /api/cases/:caseId/investigations
   - List investigations
   - Verify case access

3. GET /api/investigations/:id
   - Get investigation details
   - Verify access

4. PUT /api/investigations/:id
   - Update investigation
   - Verify access
   - Log changes

5. DELETE /api/investigations/:id
   - Soft delete investigation
   - Verify access
   - Log deletion

**Acceptance Criteria**:
- Investigations can be created
- Investigations can be listed
- Investigation details can be retrieved
- Investigations can be updated
- Investigations can be soft deleted
- All endpoints enforce access control

### 2.5 Entity Management API

**Tasks**:
1. Create CRUD endpoints for each entity type:
   - Persons: /api/cases/:caseId/persons
   - Organizations: /api/cases/:caseId/organizations
   - Usernames: /api/cases/:caseId/usernames
   - Emails: /api/cases/:caseId/emails
   - Phones: /api/cases/:caseId/phones
   - Domains: /api/cases/:caseId/domains
   - URLs: /api/cases/:caseId/urls
   - IP Addresses: /api/cases/:caseId/ip-addresses
   - Certificates: /api/cases/:caseId/certificates
   - Websites: /api/cases/:caseId/websites
   - Social Profiles: /api/cases/:caseId/social-profiles
   - Crypto Addresses: /api/cases/:caseId/crypto-addresses
   - Payment Identifiers: /api/cases/:caseId/payment-identifiers

2. Each endpoint set includes:
   - POST (create)
   - GET (list with pagination)
   - GET :id (details)
   - PUT :id (update)
   - DELETE :id (soft delete)

**Acceptance Criteria**:
- All entity types can be created
- All entity types can be listed
- All entity types can be retrieved
- All entity types can be updated
- All entity types can be soft deleted
- All endpoints enforce tenant isolation
- All endpoints validate input

### 2.6 Evidence Management API

**Tasks**:
1. POST /api/cases/:caseId/evidence
   - Upload evidence
   - Calculate hash
   - Detect MIME type
   - Store file
   - Create evidence record
   - Link to entities

2. GET /api/cases/:caseId/evidence
   - List evidence
   - Filter by type
   - Filter by source
   - Pagination

3. GET /api/evidence/:id
   - Get evidence details
   - Verify access

4. PUT /api/evidence/:id
   - Update evidence metadata
   - Verify access
   - Log changes

5. DELETE /api/evidence/:id
   - Soft delete evidence
   - Verify access
   - Log deletion

6. POST /api/evidence/:id/entities
   - Link evidence to entities
   - Verify access

7. DELETE /api/evidence/:id/entities/:entityType/:entityId
   - Unlink evidence from entity
   - Verify access

**Acceptance Criteria**:
- Evidence can be uploaded
- Evidence can be listed
- Evidence details can be retrieved
- Evidence metadata can be updated
- Evidence can be soft deleted
- Evidence can be linked to entities
- Evidence can be unlinked from entities
- File uploads are secure
- Hashes calculated correctly

### 2.7 Source Management API

**Tasks**:
1. POST /api/sources
   - Create source
   - Return source

2. GET /api/sources
   - List sources
   - Filter by type

3. GET /api/sources/:id
   - Get source details

4. PUT /api/sources/:id
   - Update source
   - Log changes

**Acceptance Criteria**:
- Sources can be created
- Sources can be listed
- Source details can be retrieved
- Sources can be updated

### 2.8 Timeline API

**Tasks**:
1. POST /api/cases/:caseId/timeline-events
   - Create timeline event
   - Verify case access

2. GET /api/cases/:caseId/timeline-events
   - List timeline events
   - Sort by occurred_at
   - Filter by entity

3. GET /api/timeline-events/:id
   - Get timeline event details
   - Verify access

4. PUT /api/timeline-events/:id
   - Update timeline event
   - Verify access

5. DELETE /api/timeline-events/:id
   - Delete timeline event
   - Verify access

**Acceptance Criteria**:
- Timeline events can be created
- Timeline events can be listed
- Timeline event details can be retrieved
- Timeline events can be updated
- Timeline events can be deleted
- Events sorted correctly

### 2.9 Case Management UI

**Tasks**:
1. Create case list page
2. Create case detail page
3. Create case creation form
4. Create case edit form
5. Add case filters (status, priority)
6. Add case search
7. Add pagination
8. Add permission guards

**Acceptance Criteria**:
- Cases listed with filters
- Case details shown
- Cases can be created
- Cases can be edited
- Search works
- Pagination works
- UI respects permissions

### 2.10 Investigation Management UI

**Tasks**:
1. Create investigation list page (within case)
2. Create investigation detail page
3. Create investigation creation form
4. Create investigation edit form
5. Add investigation status tracking

**Acceptance Criteria**:
- Investigations listed
- Investigation details shown
- Investigations can be created
- Investigations can be edited
- Status tracked

### 2.11 Entity Management UI

**Tasks**:
1. Create entity management pages for each type
2. Create entity creation forms
3. Create entity detail views
4. Add entity search and filtering
5. Add entity type tabs
6. Add entity linking UI

**Acceptance Criteria**:
- All entity types can be managed
- Entities can be created
- Entity details shown
- Search and filtering work
- Entity linking works

### 2.12 Evidence Management UI

**Tasks**:
1. Create evidence list page
2. Create evidence upload component
3. Create evidence detail view
4. Add evidence filtering
5. Add evidence preview
6. Add entity linking UI
7. Add evidence notes

**Acceptance Criteria**:
- Evidence can be uploaded
- Evidence can be listed
- Evidence details shown
- Filtering works
- Preview works
- Entity linking works

### 2.13 Timeline UI

**Tasks**:
1. Create timeline view component
2. Add timeline filtering
3. Add timeline search
4. Add entity highlighting
5. Add timeline export

**Acceptance Criteria**:
- Timeline displayed chronologically
- Filtering works
- Search works
- Entities highlighted
- Export works

### 2.14 Audit Logging Implementation

**Tasks**:
1. Create audit logging middleware
2. Log important actions:
   - Case creation/modification/deletion
   - Entity creation/modification/deletion
   - Evidence upload/modification/deletion
   - Permission changes
   - Membership changes
3. Create audit log viewer
4. Add audit log filtering
5. Add audit log export

**Acceptance Criteria**:
- Important actions logged
- Audit logs captured correctly
- Audit log viewer works
- Filtering works
- Export works

### 2.15 Phase 2 Testing

**Tasks**:
1. Write unit tests for entity business logic
2. Write unit tests for evidence logic
3. Write API tests for case endpoints
4. Write API tests for investigation endpoints
5. Write API tests for entity endpoints
6. Write API tests for evidence endpoints
7. Write E2E tests for case management
8. Write E2E tests for entity management
9. Write E2E tests for evidence management
10. Write tenant isolation tests for all endpoints

**Acceptance Criteria**:
- All unit tests pass
- All API tests pass
- All E2E tests pass
- Tenant isolation verified
- Code coverage measured

### Phase 2 Acceptance Criteria

- [ ] Cases can be created/updated/deleted
- [ ] Investigations can be created/updated
- [ ] All entity types can be created
- [ ] Evidence can be uploaded and stored
- [ ] Sources can be tracked
- [ ] Timeline events can be recorded
- [ ] Audit logs record important actions
- [ ] UI allows case management
- [ ] UI allows entity management
- [ ] UI allows evidence upload
- [ ] Tenant isolation tested and verified
- [ ] All Phase 2 tests pass

---

## Phase 3: Intelligence Services

**Goal**: Implement intelligence gathering services for DNS, RDAP, TLS, URLs, websites, and public profiles with SSRF protection.

### 3.1 Intelligence Package Setup

**Tasks**:
1. Create packages/intelligence package
2. Install DNS lookup libraries
3. Install HTTP client libraries
4. Create provider abstraction layer
5. Create service interfaces
6. Add rate limiting infrastructure
7. Add caching infrastructure

**Acceptance Criteria**:
- Package created
- Dependencies installed
- Provider abstraction defined
- Rate limiting configured
- Caching configured

### 3.2 SSRF Protection

**Tasks**:
1. Create SSRF protection utility
2. Block private IP ranges:
   - 127.0.0.0/8 (loopback)
   - 10.0.0.0/8 (private)
   - 172.16.0.0/12 (private)
   - 192.168.0.0/16 (private)
   - 169.254.0.0/16 (link-local)
   - ::1/128 (IPv6 loopback)
   - fc00::/7 (IPv6 private)
   - fe80::/10 (IPv6 link-local)
3. Block cloud metadata endpoints:
   - 169.254.169.254 (AWS)
   - metadata.google.internal (GCP)
   - 169.254.169.254/metadata (Azure)
4. Implement DNS rebinding protection
5. Validate redirect chains
6. Block encoded IP addresses
7. Add tests for SSRF protection

**Acceptance Criteria**:
- Private IPs blocked
- Cloud metadata blocked
- DNS rebinding prevented
- Redirects validated
- Encoded IPs blocked
- SSRF tests pass

### 3.3 DNS Intelligence Service

**Tasks**:
1. Implement DNS lookup service
2. Add record types:
   - A
   - AAAA
   - MX
   - TXT
   - NS
   - CNAME
   - SOA
3. Add DNSSEC validation
4. Add caching
5. Add rate limiting
6. Create API endpoint
7. Add UI integration

**Acceptance Criteria**:
- DNS lookups work
- All record types supported
- DNSSEC validated
- Results cached
- Rate limited
- API endpoint works
- UI displays DNS data

### 3.4 RDAP Service

**Tasks**:
1. Implement RDAP client
2. Query domain registration data
3. Parse RDAP responses
4. Extract:
   - Registrar
   - Registration date
   - Expiry date
   - Name servers
   - Status
   - Registrant contacts
5. Add caching
6. Add rate limiting
7. Create API endpoint
8. Add UI integration

**Acceptance Criteria**:
- RDAP queries work
- Data parsed correctly
- All fields extracted
- Results cached
- Rate limited
- API endpoint works
- UI displays RDAP data

### 3.5 TLS/Certificate Analysis

**Tasks**:
1. Implement TLS certificate fetcher
2. Extract certificate data:
   - Subject
   - Issuer
   - Valid from/to
   - Fingerprints (SHA-256, SHA-1)
   - Serial number
   - Public key info
   - Extensions
3. Check certificate validity
4. Check certificate chain
5. Add caching
6. Create API endpoint
7. Add UI integration

**Acceptance Criteria**:
- Certificates fetched
- Data extracted correctly
- Validity checked
- Chain verified
- Results cached
- API endpoint works
- UI displays certificate data

### 3.6 URL Analysis

**Tasks**:
1. Implement URL analyzer
2. Extract URL components:
   - Protocol
   - Domain
   - Path
   - Query parameters
   - Fragment
3. Detect suspicious patterns:
   - IP address in URL
   - Non-standard ports
   - Suspicious TLDs
   - Long URLs
   - URL encoding abuse
4. Parse query parameters
5. Add caching
6. Create API endpoint
7. Add UI integration

**Acceptance Criteria**:
- URLs analyzed
- Components extracted
- Suspicious patterns detected
- Parameters parsed
- Results cached
- API endpoint works
- UI displays URL analysis

### 3.7 Website Analysis

**Tasks**:
1. Implement safe website fetcher (with SSRF protection)
2. Extract metadata:
   - Title
   - Description
   - Keywords
   - Headers
   - Robots.txt
   - Sitemap.xml
3. Capture screenshot (future)
4. Analyze content:
   - Links
   - Forms
   - Scripts
   - Iframes
5. Detect:
   - Phishing indicators
   - Suspicious content
   - Malware indicators
6. Add caching
7. Add rate limiting
8. Create API endpoint
9. Add UI integration

**Acceptance Criteria**:
- Websites fetched safely
- Metadata extracted
- Links analyzed
- Suspicious content detected
- Results cached
- Rate limited
- API endpoint works
- UI displays website data

### 3.8 Public Profile Analysis

**Tasks**:
1. Implement public profile fetchers:
   - Twitter/X
   - Facebook
   - LinkedIn
   - Instagram
   - Other platforms
2. Extract profile data:
   - Username
   - Display name
   - Bio
   - Followers
   - Following
   - Posts
   - Join date
3. Respect rate limits
4. Respect terms of service
5. Add caching
6. Create API endpoint
7. Add UI integration

**Acceptance Criteria**:
- Profiles fetched
- Data extracted
- Rate limits respected
- Terms respected
- Results cached
- API endpoint works
- UI displays profile data

### 3.9 Intelligence API Endpoints

**Tasks**:
1. POST /api/intelligence/dns
   - Perform DNS lookup
   - Return DNS records

2. POST /api/intelligence/rdap
   - Perform RDAP query
   - Return domain information

3. POST /api/intelligence/certificate
   - Fetch TLS certificate
   - Return certificate data

4. POST /api/intelligence/url
   - Analyze URL
   - Return URL analysis

5. POST /api/intelligence/website
   - Fetch and analyze website
   - Return website data

6. POST /api/intelligence/profile
   - Fetch public profile
   - Return profile data

**Acceptance Criteria**:
- All endpoints work
- All endpoints use SSRF protection
- All endpoints rate limited
- All endpoints cached
- All endpoints documented

### 3.10 Intelligence UI

**Tasks**:
1. Create intelligence dashboard
2. Add DNS lookup component
3. Add RDAP query component
4. Add certificate analysis component
5. Add URL analysis component
6. Add website analysis component
7. Add profile analysis component
8. Add results display
9. Add history tracking

**Acceptance Criteria**:
- Dashboard works
- All components functional
- Results displayed
- History tracked
- UI responsive

### 3.11 Phase 3 Testing

**Tasks**:
1. Write unit tests for DNS service
2. Write unit tests for RDAP service
3. Write unit tests for certificate analysis
4. Write unit tests for URL analysis
5. Write unit tests for website analysis
6. Write unit tests for SSRF protection
7. Write API tests for intelligence endpoints
8. Write E2E tests for intelligence features
9. Write SSRF bypass tests

**Acceptance Criteria**:
- All unit tests pass
- All API tests pass
- All E2E tests pass
- SSRF protection verified
- Code coverage measured

### Phase 3 Acceptance Criteria

- [ ] DNS intelligence returns valid data
- [ ] RDAP returns domain information
- [ ] TLS analysis returns certificate data
- [ ] URL analysis extracts metadata
- [ ] Website analysis works
- [ ] SSRF protection blocks private networks
- [ ] Public profile analysis works
- [ ] Rate limiting prevents abuse
- [ ] Caching reduces external API calls
- [ ] UI displays intelligence data
- [ ] All Phase 3 tests pass

---

## Phase 4: Image Intelligence

**Goal**: Implement secure image upload, hashing, OCR, metadata extraction, duplicate detection, and similarity analysis.

### 4.1 Image Analysis Package Setup

**Tasks**:
1. Create packages/image-analysis package
2. Install image processing libraries:
   - sharp (image processing)
   - exif-reader (EXIF extraction)
   - image-hash (perceptual hashing)
   - tesseract.js (OCR)
3. Create file validation utilities
4. Create storage abstraction
5. Add job queue integration

**Acceptance Criteria**:
- Package created
- Dependencies installed
- File validation works
- Storage abstraction defined
- Job queue integrated

### 4.2 Secure File Upload

**Tasks**:
1. Implement file upload validation:
   - MIME type detection (magic numbers)
   - File size limits
   - File type whitelist
   - Filename sanitization
2. Implement virus scanning integration (future)
3. Implement secure storage:
   - Random filenames
   - Separate storage directory
   - Permission controls
4. Create upload API endpoint
5. Add progress tracking
6. Add error handling

**Acceptance Criteria**:
- MIME types validated
- File sizes limited
- File types filtered
- Filenames sanitized
- Files stored securely
- Upload endpoint works
- Progress tracked

### 4.3 Cryptographic Hashing

**Tasks**:
1. Implement SHA-256 hashing
2. Implement SHA-512 hashing
3. Calculate hashes on upload
4. Store hashes in database
5. Add hash indexing
6. Add hash search

**Acceptance Criteria**:
- SHA-256 calculated
- SHA-512 calculated
- Hashes stored
- Hashes indexed
- Hash search works

### 4.4 Perceptual Hashing

**Tasks**:
1. Implement pHash (perceptual hash)
2. Implement dHash (difference hash)
3. Implement aHash (average hash)
4. Calculate all hashes on upload
5. Store hashes in database
6. Add hash indexing
7. Implement similarity comparison:
   - Hamming distance
   - Similarity threshold
8. Add duplicate detection
9. Add near-duplicate detection

**Acceptance Criteria**:
- pHash calculated
- dHash calculated
- aHash calculated
- Hashes stored
- Similarity compared
- Duplicates detected
- Near-duplicates detected

### 4.5 EXIF Metadata Extraction

**Tasks**:
1. Implement EXIF extraction
2. Extract common EXIF fields:
   - Camera make/model
   - GPS coordinates
   - Date/time
   - Orientation
   - Software
3. Handle missing EXIF data
4. Sanitize EXIF data
5. Store EXIF in database
6. Add EXIF display in UI
7. Add GPS coordinates to map (future)

**Acceptance Criteria**:
- EXIF data extracted
- Missing data handled
- Data sanitized
- Data stored
- UI displays EXIF
- GPS shown on map

### 4.6 OCR (Optical Character Recognition)

**Tasks**:
1. Implement OCR using Tesseract.js
2. Extract text from images
3. Handle multiple languages
4. Store extracted text
5. Add text search
6. Add text highlighting
7. Optimize OCR performance

**Acceptance Criteria**:
- Text extracted
- Multiple languages supported
- Text stored
- Text searchable
- Text highlighted
- Performance optimized

### 4.7 Image Metadata

**Tasks**:
1. Extract image metadata:
   - Dimensions
   - Format
   - Color space
   - Bit depth
   - Compression
2. Store metadata in database
3. Display metadata in UI

**Acceptance Criteria**:
- Metadata extracted
- Metadata stored
- UI displays metadata

### 4.8 Duplicate Detection

**Tasks**:
1. Implement exact duplicate detection (SHA-256)
2. Implement near-duplicate detection (perceptual hashes)
3. Add similarity threshold configuration
4. Create duplicate reports
5. Add duplicate management UI
6. Add merge/resolve functionality

**Acceptance Criteria**:
- Exact duplicates detected
- Near-duplicates detected
- Thresholds configurable
- Reports generated
- UI manages duplicates
- Merge works

### 4.9 Reverse Image Search Integration

**Tasks**:
1. Create provider abstraction for reverse image search
2. Implement Google Images integration (if TOS allows)
3. Implement TinEye integration
4. Implement other providers
5. Add provider selection
6. Add result aggregation
7. Add result display

**Acceptance Criteria**:
- Provider abstraction works
- Multiple providers supported
- Provider selection works
- Results aggregated
- Results displayed

### 4.10 Image Analysis API

**Tasks**:
1. POST /api/images/upload
   - Upload image
   - Validate file
   - Calculate hashes
   - Extract metadata
   - Run OCR
   - Create image record
   - Return image data

2. GET /api/images/:id
   - Get image details
   - Return all analysis data

3. GET /api/images/:id/hash
   - Get image hashes
   - Return cryptographic and perceptual hashes

4. GET /api/images/:id/exif
   - Get EXIF data
   - Return metadata

5. GET /api/images/:id/text
   - Get OCR text
   - Return extracted text

6. POST /api/images/:id/reverse-search
   - Perform reverse image search
   - Return results

7. GET /api/images/duplicates
   - Find duplicates
   - Return duplicate list

**Acceptance Criteria**:
- All endpoints work
- All endpoints validate input
- All endpoints enforce authorization
- All endpoints documented

### 4.11 Image Analysis UI

**Tasks**:
1. Create image upload component
2. Create image detail view
3. Add image preview
4. Add metadata display
5. Add EXIF display
6. Add OCR text display
7. Add hash display
8. Add duplicate detection UI
9. Add reverse image search UI
10. Add similarity comparison

**Acceptance Criteria**:
- Upload works
- Preview works
- Metadata displayed
- EXIF displayed
- OCR text displayed
- Hashes displayed
- Duplicates shown
- Reverse search works
- Similarity shown

### 4.12 Phase 4 Testing

**Tasks**:
1. Write unit tests for file validation
2. Write unit tests for hashing
3. Write unit tests for EXIF extraction
4. Write unit tests for OCR
5. Write unit tests for duplicate detection
6. Write API tests for image endpoints
7. Write E2E tests for image upload
8. Write security tests for file upload

**Acceptance Criteria**:
- All unit tests pass
- All API tests pass
- All E2E tests pass
- Security tests pass
- Code coverage measured

### Phase 4 Acceptance Criteria

- [ ] File upload validates MIME types
- [ ] SHA-256/SHA-512 hashes calculated
- [ ] Perceptual hashes calculated
- [ ] EXIF data extracted
- [ ] OCR extracts text from images
- [ ] Duplicate detection works
- [ ] Similarity analysis works
- [ ] UI displays image analysis
- [ ] Reverse image search abstraction works
- [ ] All Phase 4 tests pass

---

## Phase 5: Graph and Risk

**Goal**: Implement relationship graph, graph visualization, risk indicators, risk scoring, and explainable risk engine.

### 5.1 Database Schema - Relationships and Risk

**Tasks**:
1. Create Relationship model:
   - id, source_type, source_id, target_type, target_id, relationship_type, confidence, status, first_seen, last_seen, evidence_count, created_at, updated_at
   - Index on (source_type, source_id)
   - Index on (target_type, target_id)
   - Index on relationship_type
   - Index on confidence

2. Create RelationshipEvidence join table:
   - relationship_id, evidence_id
   - Composite primary key
   - Index on relationship_id
   - Index on evidence_id

3. Create RiskIndicator model:
   - id, case_id, entity_type, entity_id, indicator_type, description, weight, confidence, evidence_ids, calculation, created_at, updated_at
   - Foreign key to Case
   - Index on case_id
   - Index on (entity_type, entity_id)
   - Index on indicator_type

4. Create RiskScore model:
   - id, case_id, entity_type, entity_id, score, category, indicators, confidence, calculation, created_at, updated_at
   - Foreign key to Case
   - Index on case_id
   - Index on (entity_type, entity_id)
   - Index on score

5. Create and run migration

**Acceptance Criteria**:
- Relationship model created
- Risk models created
- Migration runs successfully
- Indexes created

### 5.2 Relationship Engine

**Tasks**:
1. Implement relationship creation logic
2. Implement relationship types:
   - USES
   - OWNS
   - MENTIONS
   - LINKS_TO
   - HOSTED_ON
   - RESOLVES_TO
   - SHARES
   - REUSES
   - REFERENCES
   - ASSOCIATED_WITH
   - POSSIBLY_ASSOCIATED_WITH
3. Implement confidence calculation
4. Implement relationship inference
5. Implement relationship validation
6. Add relationship CRUD API

**Acceptance Criteria**:
- Relationships created
- All types supported
- Confidence calculated
- Inference works
- Validation works
- API endpoints work

### 5.3 Graph Query System

**Tasks**:
1. Implement graph query builder
2. Implement relationship traversal
3. Implement depth limits
4. Implement node limits
5. Implement filtering:
   - By relationship type
   - By confidence
   - By entity type
   - By time range
6. Implement pagination
7. Add query safety limits
8. Create graph query API

**Acceptance Criteria**:
- Graph queries work
- Traversal works
- Limits enforced
- Filtering works
- Pagination works
- Safety limits enforced
- API endpoint works

### 5.4 Graph Visualization (React Flow)

**Tasks**:
1. Install React Flow
2. Create graph visualization component
3. Implement node rendering by type
4. Implement edge rendering by relationship
5. Add node selection
6. Add node details panel
7. Add graph filtering
8. Add graph search
9. Add graph export
10. Add performance optimization

**Acceptance Criteria**:
- Graph renders
- Nodes display correctly
- Edges display correctly
- Selection works
- Details shown
- Filtering works
- Search works
- Export works
- Performance optimized

### 5.5 Risk Engine

**Tasks**:
1. Create packages/risk-engine package
2. Define risk categories:
   - Minimal (0-20)
   - Low (21-40)
   - Moderate (41-60)
   - High (61-80)
   - Critical (81-100)
3. Implement risk indicators:
   - Suspicious domain patterns
   - Suspicious URL patterns
   - Known bad IPs
   - Self-signed certificates
   - Duplicate images
   - Similar profiles
   - Payment fraud patterns
   - Social engineering indicators
4. Implement risk calculation:
   - Weighted sum
   - Confidence adjustment
   - Evidence backing
5. Make risk rules configurable
6. Implement explainable output
7. Create risk calculation API

**Acceptance Criteria**:
- Risk categories defined
- Indicators implemented
- Calculation works
- Rules configurable
- Output explainable
- API endpoint works

### 5.6 Risk Indicators Implementation

**Tasks**:
1. Implement domain risk indicators:
   - Newly registered domains
   - Suspicious TLDs
   - Domain age
   - DNS anomalies

2. Implement URL risk indicators:
   - IP addresses in URL
   - Long URLs
   - URL encoding abuse
   - Suspicious parameters

3. Implement IP risk indicators:
   - Known bad IPs
   - VPN/proxy detection
   - Geolocation risks

4. Implement certificate risk indicators:
   - Self-signed certificates
   - Expired certificates
   - Weak encryption
   - Mismatched domains

5. Implement image risk indicators:
   - Duplicate images
   - Stock photos
   - Manipulation indicators

6. Implement profile risk indicators:
   - New profiles
   - Low follower counts
   - Suspicious activity

7. Implement financial risk indicators:
   - Known bad addresses
   - Transaction patterns
   - Payment fraud indicators

**Acceptance Criteria**:
- All indicator types implemented
- Indicators evidence-backed
- Indicators confidence-aware
- Indicators explainable

### 5.7 Relationship API

**Tasks**:
1. POST /api/relationships
   - Create relationship
   - Validate entities
   - Calculate confidence
   - Return relationship

2. GET /api/relationships
   - List relationships
   - Filter by type
   - Filter by entities
   - Pagination

3. GET /api/relationships/:id
   - Get relationship details
   - Return evidence

4. PUT /api/relationships/:id
   - Update relationship
   - Update confidence
   - Update status

5. DELETE /api/relationships/:id
   - Delete relationship

6. POST /api/relationships/:id/evidence
   - Add evidence to relationship

**Acceptance Criteria**:
- Relationships can be created
- Relationships can be listed
- Relationship details shown
- Relationships can be updated
- Relationships can be deleted
- Evidence can be linked

### 5.8 Graph API

**Tasks**:
1. POST /api/graph/query
   - Execute graph query
   - Apply filters
   - Apply limits
   - Return graph data

2. GET /api/cases/:caseId/graph
   - Get case graph
   - Return all entities and relationships

3. GET /api/entities/:type/:id/graph
   - Get entity graph
   - Return connected entities

**Acceptance Criteria**:
- Graph queries work
- Case graphs retrieved
- Entity graphs retrieved
- Limits enforced
- Filters work

### 5.9 Risk API

**Tasks**:
1. POST /api/risk/calculate
   - Calculate risk score
   - Return indicators
   - Return explanation

2. GET /api/cases/:caseId/risk
   - Get case risk scores
   - Return all entity risks

3. GET /api/entities/:type/:id/risk
   - Get entity risk score
   - Return indicators
   - Return explanation

4. POST /api/risk/rules
   - Create/update risk rules
   - Validate rules

**Acceptance Criteria**:
- Risk calculated
- Indicators returned
- Explanation provided
- Case risks retrieved
- Entity risks retrieved
- Rules configurable

### 5.10 Graph and Risk UI

**Tasks**:
1. Create graph investigation page
2. Integrate React Flow
3. Add graph controls
4. Add graph filtering
5. Add graph search
6. Add node details panel
7. Add relationship creation UI
8. Create risk analysis page
9. Add risk score display
10. Add risk indicator breakdown
11. Add risk explanation
12. Add risk rule configuration

**Acceptance Criteria**:
- Graph displayed
- Controls work
- Filtering works
- Search works
- Details shown
- Relationships can be created
- Risk scores displayed
- Indicators shown
- Explanation provided
- Rules configurable

### 5.11 Phase 5 Testing

**Tasks**:
1. Write unit tests for relationship logic
2. Write unit tests for graph queries
3. Write unit tests for risk calculation
4. Write unit tests for risk indicators
5. Write API tests for relationship endpoints
6. Write API tests for graph endpoints
7. Write API tests for risk endpoints
8. Write E2E tests for graph visualization
9. Write E2E tests for risk analysis

**Acceptance Criteria**:
- All unit tests pass
- All API tests pass
- All E2E tests pass
- Code coverage measured

### Phase 5 Acceptance Criteria

- [ ] Relationships can be created
- [ ] Relationship evidence tracked
- [ ] Graph queries return correct data
- [ ] Graph visualization displays correctly
- [ ] Risk indicators calculated
- [ ] Risk scores explainable
- [ ] Risk engine configurable
- [ ] UI displays graph
- [ ] UI displays risk scores
- [ ] All Phase 5 tests pass

---

## Phase 6: Reporting

**Goal**: Implement report generation, multiple export formats, evidence packaging, and Disruption Center with approval workflow.

### 6.1 Database Schema - Reporting

**Tasks**:
1. Create Report model:
   - id, case_id, title, summary, scope, entities, evidence, relationships, timeline, risk_score, sources, confidence, limitations, recommendations, format, status, created_by, created_at, updated_at
   - Foreign key to Case
   - Index on case_id
   - Index on status

2. Create ReportSubmission model:
   - id, report_id, destination, destination_type, subject, summary, evidence_urls, indicators, attachments, approver, approval_timestamp, submitter, submission_status, external_reference, response, follow_up_status, created_at, updated_at
   - Foreign key to Report
   - Index on report_id
   - Index on submission_status

3. Create DisruptionTarget model:
   - id, type, name, contact_info, template, requirements, created_at, updated_at
   - Index on type

4. Create and run migration

**Acceptance Criteria**:
- Report model created
- ReportSubmission model created
- DisruptionTarget model created
- Migration runs successfully

### 6.2 Reporting Package Setup

**Tasks**:
1. Create packages/reporting package
2. Install report generation libraries:
   - PDF generation (pdfkit or puppeteer)
   - HTML templating
   - JSON formatting
3. Create report templates
4. Create report generators
5. Add evidence packaging logic

**Acceptance Criteria**:
- Package created
- Dependencies installed
- Templates created
- Generators implemented
- Evidence packaging works

### 6.3 Report Generation

**Tasks**:
1. Implement report data collection:
   - Case information
   - Entity summary
   - Evidence summary
   - Relationship summary
   - Timeline
   - Risk scores
   - Sources
   - Confidence levels
   - Limitations
   - Recommendations

2. Implement PDF generation:
   - Cover page
   - Table of contents
   - Executive summary
   - Investigation scope
   - Entities section
   - Evidence section
   - Relationships section
   - Timeline section
   - Risk analysis section
   - Sources section
   - Limitations section
   - Recommendations section
   - Appendix

3. Implement HTML generation:
   - Responsive design
   - Same sections as PDF
   - Interactive elements
   - Print-friendly

4. Implement JSON generation:
   - Structured data
   - All report data
   - Machine-readable

**Acceptance Criteria**:
- Data collected correctly
- PDF generated
- HTML generated
- JSON generated
- All sections included
- Formatting professional

### 6.4 Evidence Packaging

**Tasks**:
1. Implement evidence collection:
   - Gather all evidence files
   - Generate evidence manifest
   - Calculate hashes
   - Verify integrity

2. Implement evidence packaging:
   - Create ZIP archive
   - Include evidence files
   - Include manifest
   - Include metadata
   - Include chain of custody

3. Implement package verification:
   - Verify hashes
   - Verify manifest
   - Verify integrity

**Acceptance Criteria**:
- Evidence collected
- Manifest generated
- Hashes verified
- Package created
- Integrity verified

### 6.5 Report API

**Tasks**:
1. POST /api/reports
   - Generate report
   - Collect data
   - Create report record
   - Return report

2. GET /api/reports/:id
   - Get report details
   - Return report data

3. GET /api/reports/:id/download
   - Download report
   - Support formats: PDF, HTML, JSON

4. GET /api/reports/:id/evidence
   - Download evidence package
   - Return ZIP file

5. DELETE /api/reports/:id
   - Delete report
   - Verify access

**Acceptance Criteria**:
- Reports can be generated
- Report details retrieved
- Reports downloadable
- Evidence packages downloadable
- Reports can be deleted

### 6.6 Disruption Center

**Tasks**:
1. Implement disruption target management:
   - Create targets
   - Manage templates
   - Manage requirements

2. Implement report preparation:
   - Select destination
   - Fill template
   - Attach evidence
   - Add indicators
   - Add notes

3. Implement approval workflow:
   - Submit for approval
   - Approver review
   - Approve/reject
   - Record approval

4. Implement submission tracking:
   - Submit to destination
   - Track status
   - Record response
   - Follow-up management

**Acceptance Criteria**:
- Targets managed
- Reports prepared
- Approval workflow works
- Submission tracked
- Responses recorded

### 6.7 Disruption API

**Tasks**:
1. GET /api/disruption/targets
   - List disruption targets
   - Filter by type

2. POST /api/disruption/targets
   - Create disruption target
   - Validate template

3. POST /api/reports/:id/prepare-disruption
   - Prepare disruption report
   - Select destination
   - Fill template

4. POST /api/disruption/submissions/:id/submit
   - Submit for approval
   - Notify approver

5. POST /api/disruption/submissions/:id/approve
   - Approve submission
   - Record approval

6. POST /api/disruption/submissions/:id/reject
   - Reject submission
   - Record rejection

7. POST /api/disruption/submissions/:id/submit-external
   - Submit to external destination
   - Track status

8. PUT /api/disruption/submissions/:id/response
   - Record response
   - Update status

**Acceptance Criteria**:
- Targets can be managed
- Reports can be prepared
- Approval workflow works
- External submission works
- Responses can be recorded

### 6.8 Reporting UI

**Tasks**:
1. Create report generation page
2. Add report configuration
3. Add format selection
4. Add section selection
5. Add preview
6. Add download buttons
7. Create report list page
8. Add report filtering
9. Add report status tracking

**Acceptance Criteria**:
- Reports can be generated
- Configuration works
- Format selection works
- Preview displayed
- Download works
- Reports listed
- Filtering works
- Status tracked

### 6.9 Disruption Center UI

**Tasks**:
1. Create disruption center page
2. Add target management
3. Add report preparation form
4. Add approval queue
5. Add submission tracking
6. Add response management
7. Add follow-up management

**Acceptance Criteria**:
- Targets managed
- Reports prepared
- Approval queue shown
- Submissions tracked
- Responses managed
- Follow-ups managed

### 6.10 Phase 6 Testing

**Tasks**:
1. Write unit tests for report generation
2. Write unit tests for evidence packaging
3. Write unit tests for approval workflow
4. Write API tests for report endpoints
5. Write API tests for disruption endpoints
6. Write E2E tests for report generation
7. Write E2E tests for disruption workflow

**Acceptance Criteria**:
- All unit tests pass
- All API tests pass
- All E2E tests pass
- Code coverage measured

### Phase 6 Acceptance Criteria

- [ ] Reports can be generated
- [ ] PDF export works
- [ ] HTML export works
- [ ] JSON export works
- [ ] Evidence packages created
- [ ] Disruption Center creates reports
- [ ] Approval workflow works
- [ ] Submission tracking works
- [ ] UI generates reports
- [ ] UI manages disruption workflow
- [ ] All Phase 6 tests pass

---

## Phase 7: Monitoring

**Goal**: Implement monitoring targets, scheduled checks, alert generation, change detection, and notification system.

### 7.1 Database Schema - Monitoring

**Tasks**:
1. Create MonitoringTarget model:
   - id, case_id, entity_type, entity_id, check_type, check_config, schedule, status, last_check, next_check, created_by, created_at, updated_at
   - Foreign key to Case
   - Index on case_id
   - Index on status
   - Index on next_check

2. Create Alert model:
   - id, monitoring_target_id, alert_type, severity, message, data, acknowledged, acknowledged_by, acknowledged_at, created_at, updated_at
   - Foreign key to MonitoringTarget
   - Index on monitoring_target_id
   - Index on severity
   - Index on acknowledged

3. Create ChangeDetection model:
   - id, monitoring_target_id, change_type, previous_value, current_value, diff, detected_at, created_at
   - Foreign key to MonitoringTarget
   - Index on monitoring_target_id
   - Index on detected_at

4. Create and run migration

**Acceptance Criteria**:
- Monitoring models created
- Migration runs successfully
- Indexes created

### 7.2 Background Job Setup

**Tasks**:
1. Install BullMQ
2. Create job queue infrastructure
3. Create job processors
4. Create job schedulers
5. Add retry logic
6. Add error handling
7. Add job monitoring

**Acceptance Criteria**:
- BullMQ installed
- Queues created
- Processors work
- Schedulers work
- Retry logic works
- Errors handled
- Jobs monitored

### 7.3 Monitoring System

**Tasks**:
1. Implement monitoring target management:
   - Create targets
   - Configure checks
   - Set schedules
   - Enable/disable

2. Implement check types:
   - DNS monitoring
   - HTTP monitoring
   - SSL certificate monitoring
   - WHOIS monitoring
   - Profile monitoring
   - Website monitoring

3. Implement scheduled checks:
   - Cron scheduling
   - Interval scheduling
   - One-time checks

4. Implement change detection:
   - Detect DNS changes
   - Detect HTTP changes
   - Detect SSL changes
   - Detect WHOIS changes
   - Detect profile changes
   - Detect website changes

5. Implement alert generation:
   - Generate alerts on changes
   - Generate alerts on failures
   - Generate alerts on thresholds

**Acceptance Criteria**:
- Targets managed
- Checks configured
- Schedules work
- Changes detected
- Alerts generated

### 7.4 Notification System

**Tasks**:
1. Implement notification channels:
   - In-app notifications
   - Email notifications (future)
   - Webhook notifications (future)
   - SMS notifications (future)

2. Implement notification rules:
   - Severity-based routing
   - User preferences
   - Organization settings

3. Implement notification delivery:
   - Queue notifications
   - Deliver notifications
   - Track delivery
   - Retry failures

**Acceptance Criteria**:
- Channels work
- Rules configured
- Notifications delivered
- Delivery tracked

### 7.5 Monitoring API

**Tasks**:
1. POST /api/monitoring/targets
   - Create monitoring target
   - Configure check
   - Set schedule

2. GET /api/monitoring/targets
   - List monitoring targets
   - Filter by case
   - Filter by status

3. GET /api/monitoring/targets/:id
   - Get target details
   - Show check history

4. PUT /api/monitoring/targets/:id
   - Update target
   - Modify configuration

5. DELETE /api/monitoring/targets/:id
   - Delete target
   - Stop checks

6. POST /api/monitoring/targets/:id/check
   - Run immediate check
   - Return results

7. GET /api/monitoring/alerts
   - List alerts
   - Filter by severity
   - Filter by acknowledged

8. PUT /api/monitoring/alerts/:id/acknowledge
   - Acknowledge alert
   - Record acknowledger

9. GET /api/monitoring/changes
   - List changes
   - Filter by target
   - Filter by type

**Acceptance Criteria**:
- Targets can be created
- Targets can be listed
- Target details shown
- Targets can be updated
- Targets can be deleted
- Immediate checks work
- Alerts listed
- Alerts acknowledged
- Changes listed

### 7.6 Monitoring UI

**Tasks**:
1. Create monitoring dashboard
2. Add target creation form
3. Add target list
4. Add target details view
5. Add check history
6. Add alert list
7. Add alert details
8. Add change history
9. Add notification settings

**Acceptance Criteria**:
- Dashboard works
- Targets created
- Targets listed
- Details shown
- History displayed
- Alerts shown
- Changes shown
- Settings configured

### 7.7 Phase 7 Testing

**Tasks**:
1. Write unit tests for monitoring logic
2. Write unit tests for change detection
3. Write unit tests for alert generation
4. Write API tests for monitoring endpoints
5. Write E2E tests for monitoring features
6. Write job queue tests

**Acceptance Criteria**:
- All unit tests pass
- All API tests pass
- All E2E tests pass
- Job queue tests pass
- Code coverage measured

### Phase 7 Acceptance Criteria

- [ ] Monitoring targets can be created
- [ ] Scheduled checks run
- [ ] Alerts generated on changes
- [ ] Change detection works
- [ ] Notifications sent
- [ ] UI displays monitoring data
- [ ] UI manages alerts
- [ ] All Phase 7 tests pass

---

## Phase 8: Security and QA

**Goal**: Perform comprehensive security review, testing, and quality assurance.

### 8.1 Security Review

**Tasks**:
1. Review authentication implementation
2. Review authorization implementation
3. Review tenant isolation
4. Review SSRF protection
5. Review input validation
6. Review output encoding
7. Review file upload security
8. Review secret management
9. Review logging practices
10. Review error handling
11. Review API security
12. Review database security
13. Review dependency security
14. Document findings
15. Address issues

**Acceptance Criteria**:
- Security review completed
- Findings documented
- Issues addressed
- Residual risks documented

### 8.2 Tenant Isolation Testing

**Tasks**:
1. Write comprehensive tenant isolation tests
2. Test organization data access
3. Test case data access
4. Test evidence access
5. Test entity access
6. Test API endpoint isolation
7. Test database query isolation
8. Test frontend data isolation
9. Test cross-tenant attacks
10. Verify no data leakage

**Acceptance Criteria**:
- All isolation tests pass
- No data leakage found
- Cross-tenant attacks blocked

### 8.3 SSRF Protection Testing

**Tasks**:
1. Write SSRF protection tests
2. Test private IP blocking
3. Test localhost blocking
4. Test cloud metadata blocking
5. Test DNS rebinding protection
6. Test redirect validation
7. Test encoded IP blocking
8. Test bypass attempts
9. Verify protection effectiveness

**Acceptance Criteria**:
- All SSRF tests pass
- Private IPs blocked
- Cloud metadata blocked
- DNS rebinding prevented
- Bypass attempts blocked

### 8.4 Upload Security Testing

**Tasks**:
1. Write upload security tests
2. Test MIME type validation
3. Test file size limits
4. Test file type filtering
5. Test filename sanitization
6. Test malicious file upload
7. Test executable blocking
8. Test virus scanning (if implemented)
9. Verify upload security

**Acceptance Criteria**:
- All upload tests pass
- MIME types validated
- File sizes limited
- File types filtered
- Malicious files blocked
- Executables blocked

### 8.5 API Security Testing

**Tasks**:
1. Write API security tests
2. Test authentication bypass
3. Test authorization bypass
4. Test rate limiting
5. Test input validation
6. Test SQL injection
7. Test XSS
8. Test CSRF
9. Test mass assignment
10. Test IDOR

**Acceptance Criteria**:
- All API security tests pass
- Authentication enforced
- Authorization enforced
- Rate limiting works
- Input validated
- Injection attacks blocked
- XSS prevented
- CSRF prevented
- IDOR prevented

### 8.6 Database Testing

**Tasks**:
1. Write database tests
2. Test connection pooling
3. Test transaction handling
4. Test migration rollback
5. Test foreign key constraints
6. Test index usage
7. Test query performance
8. Test data integrity
9. Test concurrent access

**Acceptance Criteria**:
- All database tests pass
- Connections pooled
- Transactions handled
- Migrations rollback
- Constraints enforced
- Indexes used
- Performance acceptable
- Integrity maintained

### 8.7 End-to-End Testing

**Tasks**:
1. Write comprehensive E2E tests
2. Test user registration
3. Test organization creation
4. Test case creation
5. Test investigation workflow
6. Test evidence upload
7. Test intelligence gathering
8. Test image analysis
9. Test graph investigation
10. Test risk analysis
11. Test report generation
12. Test disruption workflow
13. Test monitoring
14. Test all major user flows

**Acceptance Criteria**:
- All E2E tests pass
- Major flows tested
- User journeys verified

### 8.8 Performance Testing

**Tasks**:
1. Set up performance testing
2. Test API response times
3. Test database query performance
4. Test graph query performance
5. Test image processing performance
6. Test concurrent user load
7. Test file upload performance
8. Identify bottlenecks
9. Optimize performance
10. Set performance baselines

**Acceptance Criteria**:
- Performance tests pass
- Response times acceptable
- Queries optimized
- Graph queries performant
- Image processing optimized
- Load handled
- Uploads performant
- Baselines established

### 8.9 Failure Testing

**Tasks**:
1. Test database failure
2. Test Redis failure
3. Test external API failure
4. Test file system failure
5. Test network failure
6. Test job queue failure
7. Test graceful degradation
8. Test error recovery
9. Test data consistency
10. Test rollback procedures

**Acceptance Criteria**:
- Failures handled gracefully
- Degradation works
- Recovery successful
- Consistency maintained
- Rollback works

### 8.10 Dependency Scanning

**Tasks**:
1. Run dependency scanner
2. Review vulnerable dependencies
3. Update dependencies
4. Verify no critical vulnerabilities
5. Document any acceptable risks
6. Set up ongoing scanning

**Acceptance Criteria**:
- Scanner run
- Vulnerabilities reviewed
- Dependencies updated
- No critical vulnerabilities
- Ongoing scanning configured

### Phase 8 Acceptance Criteria

- [ ] Security review completed
- [ ] Tenant isolation tests pass
- [ ] SSRF protection tests pass
- [ ] Upload security tests pass
- [ ] API security tests pass
- [ ] Database tests pass
- [ ] E2E tests pass
- [ ] Performance tests meet requirements
- [ ] Failure tests pass
- [ ] Dependency scan passes

---

## Phase 9: Production Readiness

**Goal**: Verify production readiness including deployment, documentation, and operational procedures.

### 9.1 Clean Installation

**Tasks**:
1. Test clean installation from scratch
2. Verify setup instructions
3. Verify all dependencies install
4. Verify database setup
5. Verify environment configuration
6. Verify build process
7. Fix any installation issues

**Acceptance Criteria**:
- Clean installation works
- Setup instructions accurate
- Dependencies install
- Database sets up
- Environment configures
- Build succeeds

### 9.2 Database Migration Verification

**Tasks**:
1. Test all migrations from scratch
2. Test migration rollback
3. Test migration idempotency
4. Test data seeding
5. Verify data integrity
6. Document migration procedures

**Acceptance Criteria**:
- Migrations run cleanly
- Rollback works
- Idempotency verified
- Seeding works
- Integrity maintained
- Procedures documented

### 9.3 Seed Process Verification

**Tasks**:
1. Test seed data generation
2. Verify default roles
3. Verify default permissions
4. Verify test data
5. Verify seed idempotency
6. Document seed process

**Acceptance Criteria**:
- Seed data generates
- Roles created
- Permissions created
- Test data valid
- Idempotency verified
- Process documented

### 9.4 Environment Configuration

**Tasks**:
1. Document all environment variables
2. Create .env.example
3. Validate environment variables
4. Add environment validation
5. Document configuration options
6. Add configuration documentation

**Acceptance Criteria**:
- Variables documented
- Example file complete
- Validation works
- Options documented
- Configuration clear

### 9.5 Docker Deployment

**Tasks**:
1. Create Dockerfile for web
2. Create Dockerfile for API
3. Create docker-compose.yml
4. Test Docker build
5. Test Docker deployment
6. Test Docker networking
7. Test Docker volumes
8. Document Docker deployment
9. Add deployment scripts

**Acceptance Criteria**:
- Dockerfiles work
- Compose works
- Build succeeds
- Deployment works
- Networking works
- Volumes work
- Deployment documented
- Scripts work

### 9.6 Health Checks

**Tasks**:
1. Implement API health check
2. Implement database health check
3. Implement Redis health check
4. Implement job queue health check
5. Add health check endpoint
6. Add health check monitoring
7. Document health checks

**Acceptance Criteria**:
- Health checks implemented
- Endpoint works
- Monitoring works
- Checks documented

### 9.7 Logging Verification

**Tasks**:
1. Verify logging in development
2. Verify logging in production
3. Verify log levels
4. Verify log rotation
5. Verify log aggregation
6. Verify log retention
7. Document logging setup

**Acceptance Criteria**:
- Logging works in all environments
- Levels correct
- Rotation works
- Aggregation works
- Retention configured
- Setup documented

### 9.8 Backup and Recovery

**Tasks**:
1. Implement database backup
2. Implement file backup
3. Automate backups
4. Test backup restoration
5. Document backup procedures
6. Document recovery procedures
7. Test recovery procedures
8. Set up backup monitoring

**Acceptance Criteria**:
- Backups automated
- Restoration tested
- Procedures documented
- Recovery works
- Monitoring configured

### 9.9 Documentation

**Tasks**:
1. Complete API documentation
2. Complete deployment documentation
3. Complete operations documentation
4. Complete troubleshooting documentation
5. Complete security documentation
6. Complete user documentation
7. Complete developer documentation
8. Create README
9. Create CONTRIBUTING guide
10. Create CHANGELOG

**Acceptance Criteria**:
- API docs complete
- Deployment docs complete
- Operations docs complete
- Troubleshooting docs complete
- Security docs complete
- User docs complete
- Developer docs complete
- README complete
- Contributing guide complete
- Changelog maintained

### 9.10 Test Suite Verification

**Tasks**:
1. Run all unit tests
2. Run all integration tests
3. Run all API tests
4. Run all E2E tests
5. Run all security tests
6. Verify code coverage
7. Fix any test failures
8. Add missing tests

**Acceptance Criteria**:
- All tests pass
- Coverage measured
- Failures fixed
- Tests complete

### 9.11 Build Verification

**Tasks**:
1. Run production build
2. Verify build output
3. Test built application
4. Verify asset optimization
5. Verify bundle size
6. Fix build issues

**Acceptance Criteria**:
- Build succeeds
- Output verified
- Application works
- Assets optimized
- Size acceptable

### 9.12 Lint Verification

**Tasks**:
1. Run ESLint
2. Fix lint errors
3. Configure lint rules
4. Add pre-commit linting
5. Verify code style

**Acceptance Criteria**:
- Lint passes
- Errors fixed
- Rules configured
- Pre-commit works
- Style consistent

### 9.13 Type Checking Verification

**Tasks**:
1. Run TypeScript compiler
2. Fix type errors
3. Enable strict mode
4. Remove any usage
5. Verify type coverage
6. Add missing types

**Acceptance Criteria**:
- Type check passes
- Errors fixed
- Strict mode enabled
- No any usage
- Coverage high
- Types complete

### Phase 9 Acceptance Criteria

- [ ] Clean installation works
- [ ] Database migrations run cleanly
- [ ] Seed process works
- [ ] Environment configuration documented
- [ ] Docker deployment works
- [ ] Health checks pass
- [ ] Logging verified
- [ ] Backup procedures documented
- [ ] Recovery procedures tested
- [ ] Documentation complete
- [ ] Test suite passes
- [ ] Build succeeds
- [ ] Lint passes
- [ ] Type checking passes

---

## Summary

This implementation plan provides a detailed roadmap for building SCAMNET in 9 phases:

1. **Phase 0**: Repository Assessment and Planning
2. **Phase 1**: Foundation (auth, database, API, frontend)
3. **Phase 2**: Investigation Core (entities, evidence, audit)
4. **Phase 3**: Intelligence Services (DNS, RDAP, TLS, etc.)
5. **Phase 4**: Image Intelligence (hashing, OCR, similarity)
6. **Phase 5**: Graph and Risk (relationships, visualization, scoring)
7. **Phase 6**: Reporting (reports, evidence packages, disruption)
8. **Phase 7**: Monitoring (targets, alerts, change detection)
9. **Phase 8**: Security and QA (testing, review, hardening)
10. **Phase 9**: Production Readiness (deployment, documentation, verification)

Each phase has:
- Clear goals
- Detailed tasks
- Acceptance criteria
- Testing requirements

The phased approach ensures:
- Working software at each stage
- Regular testing and verification
- Manageable complexity
- Clear progress metrics
- Ability to adjust course if needed

**Next Step**: Begin Phase 1 implementation starting with monorepo structure setup.
