# SCAMNET - Architecture Assessment

## A. Current State

### Repository Status
- **Location**: `/Users/raejae/Desktop/Monara-Sentinel`
- **Status**: Empty repository - greenfield project
- **Existing Stack**: None
- **Existing Applications**: None
- **Existing Packages**: None
- **Existing Database**: None
- **Existing Authentication**: None
- **Existing Tests**: None
- **Existing Infrastructure**: None

### Assessment
This is a completely new project with no existing code, configurations, or infrastructure. This provides a clean slate to implement SCAMNET according to the master instruction without technical debt or legacy constraints.

---

## B. Missing Components

All components of SCAMNET are currently missing and must be implemented:

### Core Infrastructure
- Monorepo structure
- Package management
- TypeScript configuration
- ESLint/Prettier configuration
- Docker infrastructure
- Environment configuration
- Logging infrastructure
- Error handling infrastructure

### Database Layer
- PostgreSQL database
- Prisma ORM
- Database migrations
- Seed data
- Connection pooling
- Database indexing strategy

### Authentication & Authorization
- User authentication system
- Organization/multi-tenancy
- Role-based access control (RBAC)
- Permission system
- Session management
- Secure password handling
- API authentication

### Backend API
- Fastify server
- REST API endpoints
- OpenAPI documentation
- Request validation (Zod)
- Rate limiting
- CORS configuration
- Security headers

### Frontend Application
- Next.js application
- React components
- TypeScript integration
- Tailwind CSS
- TanStack Query for data fetching
- React Flow for investigation graphs
- Authentication UI
- Responsive design

### Investigation Core
- Case management
- Investigation tracking
- Entity management (Person, Organization, Username, Email, Phone, etc.)
- Evidence collection and storage
- Source management
- Timeline events
- Audit logging

### Intelligence Services
- DNS intelligence
- RDAP/domain information
- TLS/certificate analysis
- URL analysis
- Website analysis
- Public profile analysis
- Safe URL fetching with SSRF protection

### Image Intelligence
- Secure file upload
- MIME detection
- SHA-256/SHA-512 hashing
- Perceptual hashing (pHash, dHash, aHash)
- EXIF extraction
- OCR capabilities
- Duplicate detection
- Similarity analysis
- Reverse image search integration

### Relationship Graph
- Relationship model
- Graph queries
- Evidence-backed relationships
- Confidence scoring
- Graph visualization

### Risk Engine
- Configurable risk scoring
- Evidence-backed indicators
- Explainable calculations
- Confidence-aware scoring
- Risk categories

### Reporting System
- Report generation
- PDF export
- HTML export
- JSON export
- Evidence packages
- Professional formatting

### Disruption Center
- Report preparation
- Multiple destination templates
- Approval workflow
- Submission tracking
- Response management

### Monitoring System
- Monitoring targets
- Scheduled checks
- Alert generation
- Change detection
- Notification system

### Background Processing
- Redis integration
- BullMQ job queues
- Job scheduling
- Error handling
- Retry logic

### Testing Infrastructure
- Vitest configuration
- Playwright configuration
- Integration test setup
- API test setup
- Database test setup
- E2E test setup

---

## C. Target Architecture

### System Architecture

SCAMNET will follow a monorepo architecture with clear separation of concerns:

```
Monara-Sentinel/
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── api/                 # Fastify backend API
├── packages/
│   ├── database/            # Prisma schema and migrations
│   ├── shared/              # Shared TypeScript types and utilities
│   ├── auth/                # Authentication library
│   ├── validation/          # Zod schemas
│   ├── intelligence/        # Intelligence service integrations
│   ├── image-analysis/      # Image processing utilities
│   ├── risk-engine/         # Risk scoring engine
│   └── reporting/           # Report generation utilities
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   └── docker-compose.yml
│   └── nginx/
├── scripts/
│   ├── seed.ts
│   └── migrate.ts
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── OPERATIONS.md
├── .github/
│   └── workflows/
├── package.json
├── turbo.json
├── tsconfig.json
└── .env.example
```

### Technology Stack

**Frontend**
- Next.js 14+ (App Router)
- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- TanStack Query
- React Flow
- React Hook Form
- Zod

**Backend**
- Node.js 20+
- TypeScript 5+
- Fastify 4+
- Zod
- Prisma 5+
- PostgreSQL 15+
- Redis 7+
- BullMQ

**Infrastructure**
- Docker
- Docker Compose
- Nginx (reverse proxy)

**Testing**
- Vitest
- Playwright
- @faker-js/faker (test data)

### Data Flow

1. **User Authentication**
   - Frontend → Auth package → API → Database
   - JWT tokens for API authentication
   - Session management via Redis

2. **Investigation Workflow**
   - Frontend → API → Domain Layer → Database
   - Evidence collection → Background jobs → External APIs
   - Real-time updates via polling/WebSockets

3. **Intelligence Gathering**
   - API → Intelligence services → External APIs
   - Safe URL fetching with SSRF protection
   - Rate limiting and caching

4. **Image Processing**
   - Frontend upload → API → Background job → Image analysis
   - Hash calculation → Similarity comparison → Database storage

5. **Risk Scoring**
   - API → Risk engine → Evidence retrieval → Calculation
   - Configurable rules and weights
   - Explainable output

6. **Report Generation**
   - API → Reporting service → Template engine → Export
   - Evidence packaging → PDF/HTML/JSON generation

### Security Layers

1. **Application Security**
   - Authentication (JWT + refresh tokens)
   - Authorization (RBAC)
   - Multi-tenancy isolation
   - Input validation (Zod)
   - Output sanitization

2. **Network Security**
   - HTTPS/TLS
   - CORS controls
   - Rate limiting
   - Security headers
   - CSRF protection

3. **Data Security**
   - Encryption at rest (sensitive fields)
   - Encryption in transit
   - Secure password hashing (Argon2)
   - Secret management

4. **Infrastructure Security**
   - SSRF protection
   - Private network blocking
   - Container security
   - Dependency scanning

---

## D. Database Schema

### Core Entities

**Authentication & Organization**
- User
- Organization
- Membership
- Role
- Permission
- Session

**Investigation Core**
- Case
- Investigation
- Person
- OrganizationEntity
- Username
- Email
- Phone
- Domain
- URL
- IPAddress
- Certificate
- Website
- SocialProfile
- CryptoAddress
- PaymentIdentifier
- Evidence
- Source
- TimelineEvent

**Relationships & Graph**
- Relationship
- RelationshipEvidence

**Risk & Scoring**
- RiskIndicator
- RiskScore

**Reporting & Disruption**
- Report
- ReportSubmission
- DisruptionTarget

**Monitoring**
- MonitoringTarget
- Alert
- ChangeDetection

**Audit**
- AuditLog

### Key Relationships

- Organization → Cases (1:N)
- User → Memberships (1:N)
- User → Created Cases (1:N)
- Case → Investigations (1:N)
- Investigation → Entities (N:M)
- Entity → Evidence (N:M)
- Entity → Relationships (N:M)
- Evidence → RiskIndicators (1:N)
- Case → RiskScores (1:N)
- Organization → Memberships (1:N)
- Role → Permissions (N:M)

### Database Design Principles

1. **Immutable Evidence**: Evidence records should be append-only where possible
2. **Tenant Isolation**: All tenant-owned resources must have organization_id
3. **Audit Trail**: Important actions must generate audit records
4. **Indexing Strategy**: Optimize for common query patterns
5. **Foreign Keys**: Enforce referential integrity
6. **Soft Deletes**: Use deleted_at for important records instead of hard deletes

---

## E. Security Requirements

### Critical Security Controls

1. **Authentication**
   - Strong password policies
   - Secure password hashing (Argon2id)
   - JWT with short expiration
   - Refresh token rotation
   - Multi-factor authentication (future)

2. **Authorization**
   - Role-based access control (RBAC)
   - Permission-based API access
   - Tenant isolation at database level
   - Object-level ownership checks

3. **Input Validation**
   - Zod schemas for all API inputs
   - SQL injection prevention (Prisma)
   - XSS prevention
   - Command injection prevention

4. **SSRF Protection**
   - Block private IP ranges
   - Block localhost/loopback
   - Block cloud metadata endpoints
   - DNS rebinding protection
   - Redirect chain validation

5. **File Upload Security**
   - MIME type validation
   - File size limits
   - Virus scanning (future)
   - Secure storage
   - Executable prevention

6. **Rate Limiting**
   - API endpoint rate limits
   - Per-user limits
   - Per-organization limits
   - DDoS protection

7. **Data Protection**
   - Encryption at rest for sensitive fields
   - TLS for all connections
   - Secure secret management
   - No logging of secrets

8. **Audit Logging**
   - All authentication events
   - All authorization changes
   - All evidence modifications
   - All report submissions
   - All permission changes

### Security Risks

1. **External API Abuse**
   - Rate limit exhaustion
   - API key exposure
   - Terms of service violations

2. **Data Exfiltration**
   - Tenant isolation bypass
   - Direct object reference attacks
   - Unauthorized data export

3. **Injection Attacks**
   - SQL injection (mitigated by Prisma)
   - NoSQL injection
   - Command injection

4. **Supply Chain Attacks**
   - Malicious dependencies
   - Outdated packages
   - Compromised containers

5. **Operational Security**
   - Secret management
   - Backup security
   - Access control to infrastructure

---

## F. Implementation Roadmap

### Phase 0: Repository Assessment ✅
- [x] Inspect repository
- [x] Create ARCHITECTURE.md
- [ ] Create IMPLEMENTATION_PLAN.md
- [ ] Create SECURITY_PLAN.md
- [ ] Create DATABASE_PLAN.md

### Phase 1: Foundation
- Set up monorepo structure
- Configure TypeScript
- Set up Prisma with PostgreSQL
- Create Docker infrastructure
- Implement User entity
- Implement Organization entity
- Implement Membership/Role/Permission
- Implement authentication system
- Implement RBAC
- Set up API foundation (Fastify)
- Set up frontend foundation (Next.js)
- Implement logging infrastructure
- Implement error handling
- Set up testing infrastructure

### Phase 2: Investigation Core
- Implement Case entity
- Implement Investigation entity
- Implement core entities (Person, OrganizationEntity, Username, Email, Phone)
- Implement network entities (Domain, URL, IPAddress, Certificate, Website)
- Implement social entities (SocialProfile)
- Implement financial entities (CryptoAddress, PaymentIdentifier)
- Implement Evidence entity
- Implement Source entity
- Implement TimelineEvent entity
- Implement AuditLog entity
- Create case management UI
- Create entity management UI
- Create evidence upload UI

### Phase 3: Intelligence Services
- Implement DNS intelligence service
- Implement RDAP service
- Implement TLS/certificate analysis
- Implement URL analysis
- Implement website analysis
- Implement safe URL fetching with SSRF protection
- Implement public profile analysis
- Create intelligence UI
- Add rate limiting and caching

### Phase 4: Image Intelligence
- Implement secure file upload
- Implement MIME detection
- Implement SHA-256/SHA-512 hashing
- Implement perceptual hashing (pHash, dHash, aHash)
- Implement EXIF extraction
- Implement OCR
- Implement duplicate detection
- Implement similarity analysis
- Create image analysis UI
- Implement reverse image search provider abstraction

### Phase 5: Graph and Risk
- Implement Relationship entity
- Implement RelationshipEvidence entity
- Implement graph query system
- Implement graph visualization (React Flow)
- Implement RiskIndicator entity
- Implement RiskScore entity
- Implement risk engine
- Implement explainable scoring
- Create graph investigation UI
- Create risk analysis UI

### Phase 6: Reporting
- Implement Report entity
- Implement ReportSubmission entity
- Implement report generation service
- Implement PDF export
- Implement HTML export
- Implement JSON export
- Implement evidence packaging
- Create report generation UI
- Implement Disruption Center
- Implement approval workflow
- Implement submission tracking

### Phase 7: Monitoring
- Implement MonitoringTarget entity
- Implement Alert entity
- Implement ChangeDetection entity
- Implement scheduled checks
- Implement alert generation
- Implement notification system
- Create monitoring UI
- Implement change detection

### Phase 8: Security and QA
- Security review
- Tenant isolation tests
- SSRF protection tests
- Upload security tests
- API security tests
- Database tests
- End-to-end tests
- Performance testing
- Failure testing
- Dependency scanning

### Phase 9: Production Readiness
- Clean installation verification
- Database migration verification
- Seed process verification
- Environment configuration
- Docker deployment
- Health checks
- Logging verification
- Backup procedures
- Recovery procedures
- Documentation completion
- Test suite verification
- Build verification
- Lint verification
- Type checking verification

---

## G. Dependencies

### Critical Path Dependencies

1. **Phase 1 (Foundation) must complete before:**
   - All subsequent phases
   - Cannot build features without auth, database, API, and frontend

2. **Phase 2 (Investigation Core) must complete before:**
   - Phase 5 (Relationships depend on entities)
   - Phase 6 (Reports depend on evidence)
   - Phase 7 (Monitoring depends on entities)

3. **Phase 3 (Intelligence) can run in parallel with:**
   - Phase 4 (Image Intelligence)
   - Both depend on Phase 2 but are independent of each other

4. **Phase 5 (Graph and Risk) must complete before:**
   - Phase 6 (Reports use risk scores and relationships)

5. **Phase 6 (Reporting) must complete before:**
   - Phase 7 (Monitoring can monitor reports)

6. **Phase 8 (Security and QA) requires:**
   - All feature phases complete

7. **Phase 9 (Production Readiness) requires:**
   - All previous phases complete

### Parallel Development Opportunities

- Phase 3 and Phase 4 can be developed in parallel
- Frontend UI for each phase can be developed alongside backend
- Documentation can be written throughout development

---

## H. Acceptance Criteria

### Phase 0 Acceptance Criteria
- [x] ARCHITECTURE.md created and reviewed
- [ ] IMPLEMENTATION_PLAN.md created with detailed tasks
- [ ] SECURITY_PLAN.md with security controls
- [ ] DATABASE_PLAN.md with complete schema
- [ ] Technology stack confirmed
- [ ] Architecture approved

### Phase 1 Acceptance Criteria
- [ ] Monorepo structure created
- [ ] All packages compile without errors
- [ ] PostgreSQL database runs via Docker
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

### Phase 7 Acceptance Criteria
- [ ] Monitoring targets can be created
- [ ] Scheduled checks run
- [ ] Alerts generated on changes
- [ ] Change detection works
- [ ] Notifications sent
- [ ] UI displays monitoring data
- [ ] UI manages alerts

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

## I. Risks

### Technical Risks

1. **Complexity Risk**
   - **Risk**: System complexity may become unmanageable
   - **Mitigation**: Modular architecture, clear boundaries, documentation
   - **Impact**: High

2. **Graph Query Performance**
   - **Risk**: Graph queries may become slow at scale
   - **Mitigation**: Query limits, pagination, indexing, consider Neo4j if needed
   - **Impact**: Medium

3. **External API Dependencies**
   - **Risk**: External APIs may change or become unavailable
   - **Mitigation**: Provider abstraction, rate limiting, fallbacks
   - **Impact**: Medium

4. **Image Processing Performance**
   - **Risk**: Image processing may be CPU/memory intensive
   - **Mitigation**: Background jobs, queue management, sizing limits
   - **Impact**: Medium

5. **Database Performance**
   - **Risk**: Database may become bottleneck
   - **Mitigation**: Indexing, query optimization, connection pooling
   - **Impact**: High

### Security Risks

1. **SSRF Bypass**
   - **Risk**: Attackers may bypass SSRF protections
   - **Mitigation**: Defense in depth, multiple validation layers
   - **Impact**: Critical

2. **Tenant Isolation Failure**
   - **Risk**: Users may access other organizations' data
   - **Mitigation**: Database-level isolation, comprehensive testing
   - **Impact**: Critical

3. **Secret Exposure**
   - **Risk**: API keys or secrets may be exposed
   - **Mitigation**: Secret management, no logging, environment variables
   - **Impact**: Critical

4. **File Upload Exploits**
   - **Risk**: Malicious files may be uploaded
   - **Mitigation**: MIME validation, size limits, no execution
   - **Impact**: High

5. **Injection Attacks**
   - **Risk**: SQL or command injection
   - **Mitigation**: Prisma ORM, input validation, parameterized queries
   - **Impact**: High

### Scalability Risks

1. **Storage Growth**
   - **Risk**: Evidence storage may grow rapidly
   - **Mitigation**: Storage quotas, lifecycle policies, compression
   - **Impact**: Medium

2. **Background Job Backlog**
   - **Risk**: Job queue may become overwhelmed
   - **Mitigation**: Scaling workers, job prioritization, monitoring
   - **Impact**: Medium

3. **Concurrent User Load**
   - **Risk**: System may not handle high concurrent load
   - **Mitigation**: Load testing, caching, database optimization
   - **Impact**: Medium

### Operational Risks

1. **Deployment Complexity**
   - **Risk**: Deployment may be complex and error-prone
   - **Mitigation**: Docker, CI/CD, deployment scripts
   - **Impact**: Medium

2. **Backup and Recovery**
   - **Risk**: Data loss may occur
   - **Mitigation**: Automated backups, recovery procedures, testing
   - **Impact**: Critical

3. **Monitoring Gaps**
   - **Risk**: Issues may not be detected quickly
   - **Mitigation**: Comprehensive monitoring, alerting, logging
   - **Impact**: Medium

### Legal and Compliance Risks

1. **Data Privacy**
   - **Risk**: Personal data may be mishandled
   - **Mitigation**: Data minimization, retention policies, access controls
   - **Impact**: High

2. **Terms of Service Violations**
   - **Risk**: External API usage may violate terms
   - **Mitigation**: Rate limiting, terms review, compliance monitoring
   - **Impact**: Medium

3. **Evidence Chain of Custody**
   - **Risk**: Evidence integrity may be questioned
   - **Mitigation**: Immutable records, audit trails, hashing
   - **Impact**: High

---

## J. Recommendation

### Recommendation: Build from Scratch

**Rationale:**

1. **Clean Slate**: The repository is empty, providing an opportunity to implement SCAMNET according to best practices without technical debt

2. **Alignment with Requirements**: The master instruction specifies a comprehensive platform that requires a specific architecture. Building from scratch allows perfect alignment with these requirements

3. **Modern Stack**: Starting fresh allows use of current best practices and modern frameworks (Next.js 14, Fastify 4, Prisma 5, etc.)

4. **Security First**: Building from scratch allows security to be designed in from the beginning, not added later

5. **Evidence-First Design**: The core principle of "SHOW ME THE EVIDENCE" can be baked into the architecture from day one

6. **Multi-Tenancy**: Proper tenant isolation can be designed into the data model and API layer from the start

7. **Phased Development**: The complexity is manageable through the phased approach outlined in the implementation roadmap

### Alternative Considered: Extend Existing Code

**Rejected Because:**
- No existing code exists to extend
- Even if there were code, it would likely not align with SCAMNET's specific requirements
- Refactoring existing code often takes longer than building correctly from scratch

### Conclusion

**Build SCAMNET from scratch in the Monara-Sentinel directory using the phased development approach outlined in this architecture document.**

This recommendation is based on:
- Empty repository status
- Comprehensive requirements
- Security-first approach
- Evidence-first design principles
- Phased development methodology
- Clear acceptance criteria
- Risk mitigation strategies

The phased approach ensures:
- Working software at each stage
- Regular testing and verification
- Manageable complexity
- Clear progress metrics
- Ability to adjust course if needed

---

## Next Steps

1. Review and approve this ARCHITECTURE.md
2. Create IMPLEMENTATION_PLAN.md with detailed Phase 1 tasks
3. Create SECURITY_PLAN.md with detailed security controls
4. Create DATABASE_PLAN.md with complete schema design
5. Begin Phase 1 implementation
