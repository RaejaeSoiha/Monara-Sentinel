# SCAMNET - Database Plan

## Overview

This document provides a comprehensive database schema design for SCAMNET, including all entities, relationships, indexes, constraints, and migration strategy.

---

## 1. Database Technology

### 1.1 Technology Choice

**Database**: PostgreSQL 15+

**Rationale**:
- ACID compliance for data integrity
- Advanced JSON support for flexible metadata
- Full-text search capabilities
- Strong indexing and query optimization
- Row-level security (RLS) support
- Excellent tooling and ecosystem
- Proven scalability
- Active community support

**ORM**: Prisma 5+

**Rationale**:
- Type-safe database access
- Excellent TypeScript integration
- Migration management
- Schema as code
- Excellent DX
- Strong community

### 1.2 Database Configuration

**Connection Pooling**:
- Pool size: 20 (configurable)
- Timeout: 30 seconds
- Idle timeout: 10 minutes
- Max lifetime: 1 hour

**Performance**:
- Connection pooling via Prisma
- Query optimization
- Index strategy
- Query result caching (Redis)

---

## 2. Core Schema Design

### 2.1 Authentication and Organization

#### User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password_hash String
  name          String?
  avatar_url    String?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  deleted_at    DateTime?

  memberships   Membership[]
  created_cases Case[]    @relation("CaseCreator")
  created_evidence Evidence[] @relation("EvidenceCreator")
  timeline_events TimelineEvent[] @relation("TimelineEventCreator")
  audit_logs    AuditLog[]
  sessions      Session[]

  @@index([email])
  @@index([deleted_at])
}
```

#### Organization
```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  logo_url    String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  memberships Membership[]
  cases       Case[]
  evidence    Evidence[]
  sources     Source[]
  timeline_events TimelineEvent[]
  audit_logs  AuditLog[]
  monitoring_targets MonitoringTarget[]
  alerts      Alert[]

  @@index([slug])
  @@index([deleted_at])
}
```

#### Membership
```prisma
model Membership {
  id             String      @id @default(cuid())
  user_id        String
  organization_id String
  role_id        String
  created_at     DateTime    @default(now())
  updated_at     DateTime    @updatedAt

  user           User        @relation(fields: [user_id], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  role           Role        @relation(fields: [role_id], references: [id])

  @@unique([user_id, organization_id])
  @@index([user_id])
  @@index([organization_id])
  @@index([role_id])
}
```

#### Role
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  memberships Membership[]
  permissions RolePermission[]

  @@index([name])
}
```

#### Permission
```prisma
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  resource    String
  action      String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  role_permissions RolePermission[]

  @@unique([resource, action])
  @@index([resource])
  @@index([action])
}
```

#### RolePermission
```prisma
model RolePermission {
  role_id       String
  permission_id String

  role          Role       @relation(fields: [role_id], references: [id], onDelete: Cascade)
  permission    Permission @relation(fields: [permission_id], references: [id], onDelete: Cascade)

  @@id([role_id, permission_id])
  @@index([role_id])
  @@index([permission_id])
}
```

#### Session
```prisma
model Session {
  id           String   @id @default(cuid())
  user_id      String
  token_hash   String   @unique
  expires_at   DateTime
  created_at   DateTime @default(now())

  user         User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([token_hash])
  @@index([expires_at])
}
```

### 2.2 Investigation Core

#### Case
```prisma
model Case {
  id          String   @id @default(cuid())
  organization_id String
  name        String
  description String?
  status      CaseStatus @default(OPEN)
  priority    CasePriority @default(MEDIUM)
  created_by  String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  organization Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  creator     User        @relation("CaseCreator", fields: [created_by], references: [id])
  investigations Investigation[]
  persons     Person[]
  organization_entities OrganizationEntity[]
  usernames   Username[]
  emails      Email[]
  phones      Phone[]
  domains     Domain[]
  urls        URL[]
  ip_addresses IPAddress[]
  certificates Certificate[]
  websites    Website[]
  social_profiles SocialProfile[]
  crypto_addresses CryptoAddress[]
  payment_identifiers PaymentIdentifier[]
  evidence    Evidence[]
  timeline_events TimelineEvent[]
  risk_scores RiskScore[]
  reports     Report[]
  monitoring_targets MonitoringTarget[]

  @@index([organization_id])
  @@index([status])
  @@index([priority])
  @@index([created_by])
  @@index([deleted_at])
}

enum CaseStatus {
  OPEN
  IN_PROGRESS
  CLOSED
  ARCHIVED
}

enum CasePriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

#### Investigation
```prisma
model Investigation {
  id          String   @id @default(cuid())
  case_id     String
  name        String
  description String?
  status      InvestigationStatus @default(ACTIVE)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  case        Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)

  @@index([case_id])
  @@index([status])
  @@index([deleted_at])
}

enum InvestigationStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}
```

#### Person
```prisma
model Person {
  id          String   @id @default(cuid())
  case_id     String
  name        String
  aliases     String[]
  notes       String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  case        Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([deleted_at])
}
```

#### OrganizationEntity
```prisma
model OrganizationEntity {
  id                  String   @id @default(cuid())
  case_id             String
  name                String
  type                String
  registration_number String?
  notes               String?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  deleted_at          DateTime?

  case                Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  entity_evidences    EntityEvidence[]

  @@index([case_id])
  @@index([type])
  @@index([deleted_at])
}
```

#### Username
```prisma
model Username {
  id          String   @id @default(cuid())
  case_id     String
  platform    String
  username    String
  url         String?
  notes       String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  case        Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([platform])
  @@index([username])
  @@index([deleted_at])
}
```

#### Email
```prisma
model Email {
  id          String   @id @default(cuid())
  case_id     String
  email       String
  notes       String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  case        Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([email])
  @@index([deleted_at])
}
```

#### Phone
```prisma
model Phone {
  id           String   @id @default(cuid())
  case_id      String
  phone        String
  country_code String?
  notes        String?
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
  deleted_at   DateTime?

  case         Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([phone])
  @@index([deleted_at])
}
```

#### Domain
```prisma
model Domain {
  id               String   @id @default(cuid())
  case_id          String
  domain           String
  registrar        String?
  registered_date  DateTime?
  expiry_date      DateTime?
  nameservers      String[]
  dns_records      Json?
  whois_data       Json?
  notes            String?
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
  deleted_at       DateTime?

  case             Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  urls             URL[]
  certificates     Certificate[]
  websites         Website[]
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([domain])
  @@index([deleted_at])
}
```

#### URL
```prisma
model URL {
  id           String   @id @default(cuid())
  case_id      String
  url          String
  domain_id    String?
  method       String?
  status_code  Int?
  headers      Json?
  analysis     Json?
  notes        String?
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
  deleted_at   DateTime?

  case         Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  domain       Domain?  @relation(fields: [domain_id], references: [id], onDelete: SetNull)
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([domain_id])
  @@index([deleted_at])
}
```

#### IPAddress
```prisma
model IPAddress {
  id          String   @id @default(cuid())
  case_id     String
  ip_address  String
  type        IPType
  asn         String?
  country     String?
  city        String?
  geo_data    Json?
  notes       String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  case        Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([ip_address])
  @@index([deleted_at])
}

enum IPType {
  IPV4
  IPV6
}
```

#### Certificate
```prisma
model Certificate {
  id           String   @id @default(cuid())
  case_id      String
  domain_id    String?
  fingerprint  String
  issuer       String
  subject      String
  valid_from   DateTime
  valid_to     DateTime
  serial_number String?
  public_key   Json?
  extensions   Json?
  notes        String?
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
  deleted_at   DateTime?

  case         Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  domain       Domain?  @relation(fields: [domain_id], references: [id], onDelete: SetNull)
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([domain_id])
  @@index([fingerprint])
  @@index([deleted_at])
}
```

#### Website
```prisma
model Website {
  id            String   @id @default(cuid())
  case_id       String
  domain_id     String?
  url           String
  title         String?
  description   String?
  content       String?
  metadata      Json?
  screenshot_url String?
  analysis      Json?
  notes         String?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  deleted_at    DateTime?

  case          Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  domain        Domain?  @relation(fields: [domain_id], references: [id], onDelete: SetNull)
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([domain_id])
  @@index([deleted_at])
}
```

#### SocialProfile
```prisma
model SocialProfile {
  id          String   @id @default(cuid())
  case_id     String
  platform    String
  username    String
  url         String?
  display_name String?
  bio         String?
  followers   Int?
  following   Int?
  posts       Int?
  joined_date DateTime?
  profile_data Json?
  notes       String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  case        Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([platform])
  @@index([username])
  @@index([deleted_at])
}
```

#### CryptoAddress
```prisma
model CryptoAddress {
  id          String   @id @default(cuid())
  case_id     String
  currency    String
  address     String
  label       String?
  balance     Decimal?
  transactions Json?
  notes       String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  case        Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([currency])
  @@index([address])
  @@index([deleted_at])
}
```

#### PaymentIdentifier
```prisma
model PaymentIdentifier {
  id          String   @id @default(cuid())
  case_id     String
  type        String
  identifier  String
  label       String?
  notes       String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  case        Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  entity_evidences EntityEvidence[]

  @@index([case_id])
  @@index([type])
  @@index([identifier])
  @@index([deleted_at])
}
```

### 2.3 Evidence and Sources

#### Source
```prisma
model Source {
  id          String   @id @default(cuid())
  type        String
  url         String?
  title       String?
  description String?
  reliability Int?     @default(50)
  metadata    Json?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  organization Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  organization_id String
  evidence    Evidence[]

  @@index([type])
  @@index([url])
  @@index([organization_id])
}
```

#### Evidence
```prisma
model Evidence {
  id                String   @id @default(cuid())
  case_id           String
  source_id         String?
  type              EvidenceType
  content           String?  @db.Text
  excerpt           String?  @db.Text
  file_url          String?
  file_name         String?
  file_size         Int?
  file_mime_type    String?
  hash_sha256       String?  @unique
  hash_sha512       String?
  hash_phash        String?
  hash_dhash        String?
  hash_ahash        String?
  exif_data         Json?
  ocr_text          String?  @db.Text
  metadata          Json?
  collection_method String?
  confidence        Int?     @default(50)
  verification_status VerificationStatus @default(UNVERIFIED)
  observed_at       DateTime?
  retrieved_at      DateTime @default(now())
  created_by        String
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?

  case              Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  source            Source?  @relation(fields: [source_id], references: [id], onDelete: SetNull)
  creator           User     @relation("EvidenceCreator", fields: [created_by], references: [id])
  entity_evidences  EntityEvidence[]
  relationship_evidences RelationshipEvidence[]

  @@index([case_id])
  @@index([source_id])
  @@index([hash_sha256])
  @@index([type])
  @@index([created_by])
  @@index([deleted_at])
}

enum EvidenceType {
  TEXT
  IMAGE
  DOCUMENT
  SCREENSHOT
  HAR
  PACKET_CAPTURE
  OTHER
}

enum VerificationStatus {
  UNVERIFIED
  VERIFIED
  CORROBORATED
  DISPUTED
}
```

#### EntityEvidence
```prisma
model EntityEvidence {
  id          String   @id @default(cuid())
  entity_type String
  entity_id   String
  evidence_id String
  created_at  DateTime @default(now())

  evidence    Evidence @relation(fields: [evidence_id], references: [id], onDelete: Cascade)

  @@unique([entity_type, entity_id, evidence_id])
  @@index([entity_type, entity_id])
  @@index([evidence_id])
}
```

#### TimelineEvent
```prisma
model TimelineEvent {
  id          String   @id @default(cuid())
  case_id     String
  entity_type String?
  entity_id   String?
  event_type  String
  title       String
  description String?  @db.Text
  occurred_at DateTime
  created_by  String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  case        Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  creator     User     @relation("TimelineEventCreator", fields: [created_by], references: [id])

  @@index([case_id])
  @@index([occurred_at])
  @@index([entity_type, entity_id])
}
```

### 2.4 Relationships and Graph

#### Relationship
```prisma
model Relationship {
  id             String   @id @default(cuid())
  source_type    String
  source_id      String
  target_type    String
  target_id      String
  relationship_type String
  confidence     Int      @default(50)
  status         RelationshipStatus @default(ACTIVE)
  first_seen     DateTime @default(now())
  last_seen      DateTime @default(now())
  evidence_count Int      @default(0)
  notes          String?  @db.Text
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  relationship_evidences RelationshipEvidence[]

  @@index([source_type, source_id])
  @@index([target_type, target_id])
  @@index([relationship_type])
  @@index([confidence])
  @@index([status])
}

enum RelationshipStatus {
  ACTIVE
  INACTIVE
  DISPUTED
  CONFIRMED
}
```

#### RelationshipEvidence
```prisma
model RelationshipEvidence {
  id             String   @id @default(cuid())
  relationship_id String
  evidence_id    String
  created_at     DateTime @default(now())

  relationship   Relationship @relation(fields: [relationship_id], references: [id], onDelete: Cascade)
  evidence       Evidence      @relation(fields: [evidence_id], references: [id], onDelete: Cascade)

  @@unique([relationship_id, evidence_id])
  @@index([relationship_id])
  @@index([evidence_id])
}
```

### 2.5 Risk and Scoring

#### RiskIndicator
```prisma
model RiskIndicator {
  id          String   @id @default(cuid())
  case_id     String
  entity_type String?
  entity_id   String?
  indicator_type String
  description String   @db.Text
  weight      Int      @default(50)
  confidence  Int      @default(50)
  evidence_ids String[]
  calculation Json
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@index([case_id])
  @@index([entity_type, entity_id])
  @@index([indicator_type])
}
```

#### RiskScore
```prisma
model RiskScore {
  id          String   @id @default(cuid())
  case_id     String
  entity_type String?
  entity_id   String?
  score       Int
  category    RiskCategory
  indicators  Json
  confidence  Int
  calculation Json
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@index([case_id])
  @@index([entity_type, entity_id])
  @@index([score])
  @@index([category])
}

enum RiskCategory {
  MINIMAL
  LOW
  MODERATE
  HIGH
  CRITICAL
}
```

### 2.6 Reporting and Disruption

#### Report
```prisma
model Report {
  id                String   @id @default(cuid())
  case_id           String
  title             String
  summary           String   @db.Text
  scope             String   @db.Text
  entities          Json
  evidence          Json
  relationships     Json
  timeline          Json
  risk_score        Json
  sources           Json
  confidence        String
  limitations       String   @db.Text
  recommendations   String   @db.Text
  format            ReportFormat
  status            ReportStatus @default(DRAFT)
  created_by        String
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  case              Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  submissions       ReportSubmission[]

  @@index([case_id])
  @@index([status])
  @@index([created_by])
}

enum ReportFormat {
  PDF
  HTML
  JSON
}

enum ReportStatus {
  DRAFT
  GENERATING
  COMPLETED
  FAILED
}
```

#### ReportSubmission
```prisma
model ReportSubmission {
  id                String   @id @default(cuid())
  report_id         String
  destination       String
  destination_type  String
  subject           String
  summary           String   @db.Text
  evidence_urls     String[]
  indicators        Json
  attachments       String[]
  approver          String?
  approval_timestamp DateTime?
  submitter         String
  submission_status SubmissionStatus @default(PENDING)
  external_reference String?
  response          String?  @db.Text
  follow_up_status  String?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  report            Report   @relation(fields: [report_id], references: [id], onDelete: Cascade)

  @@index([report_id])
  @@index([submission_status])
}

enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
  SUBMITTED
  IN_PROGRESS
  COMPLETED
  FAILED
}
```

#### DisruptionTarget
```prisma
model DisruptionTarget {
  id           String   @id @default(cuid())
  type         String
  name         String
  contact_info Json
  template     Json
  requirements Json
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  @@index([type])
}
```

### 2.7 Monitoring

#### MonitoringTarget
```prisma
model MonitoringTarget {
  id          String   @id @default(cuid())
  case_id     String
  entity_type String
  entity_id   String
  check_type  String
  check_config Json
  schedule    String
  status      MonitoringStatus @default(ACTIVE)
  last_check  DateTime?
  next_check  DateTime
  created_by  String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  case        Case     @relation(fields: [case_id], references: [id], onDelete: Cascade)
  alerts      Alert[]
  change_detections ChangeDetection[]

  @@index([case_id])
  @@index([status])
  @@index([next_check])
}

enum MonitoringStatus {
  ACTIVE
  PAUSED
  DISABLED
  ERROR
}
```

#### Alert
```prisma
model Alert {
  id                  String   @id @default(cuid())
  monitoring_target_id String
  alert_type          String
  severity            AlertSeverity
  message             String   @db.Text
  data                Json
  acknowledged        Boolean  @default(false)
  acknowledged_by     String?
  acknowledged_at     DateTime?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  monitoring_target   MonitoringTarget @relation(fields: [monitoring_target_id], references: [id], onDelete: Cascade)
  organization        Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  organization_id     String

  @@index([monitoring_target_id])
  @@index([severity])
  @@index([acknowledged])
  @@index([organization_id])
}

enum AlertSeverity {
  INFO
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

#### ChangeDetection
```prisma
model ChangeDetection {
  id                  String   @id @default(cuid())
  monitoring_target_id String
  change_type         String
  previous_value      Json
  current_value       Json
  diff                Json?
  detected_at         DateTime @default(now())
  created_at          DateTime @default(now())

  monitoring_target   MonitoringTarget @relation(fields: [monitoring_target_id], references: [id], onDelete: Cascade)

  @@index([monitoring_target_id])
  @@index([detected_at])
}
```

### 2.8 Audit

#### AuditLog
```prisma
model AuditLog {
  id           String   @id @default(cuid())
  organization_id String
  user_id      String?
  action       String
  entity_type  String
  entity_id    String?
  changes      Json?
  ip_address   String?
  user_agent   String?
  created_at   DateTime @default(now())

  organization Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  user        User?       @relation(fields: [user_id], references: [id], onDelete: SetNull)

  @@index([organization_id])
  @@index([user_id])
  @@index([entity_type, entity_id])
  @@index([created_at])
  @@index([action])
}
```

---

## 3. Index Strategy

### 3.1 Index Design Principles

1. **Foreign Key Indexes**: All foreign keys have indexes
2. **Query Pattern Indexes**: Indexes based on common query patterns
3. **Composite Indexes**: For multi-column queries
4. **Unique Indexes**: For uniqueness constraints
5. **Partial Indexes**: For filtered queries (PostgreSQL feature)
6. **Covering Indexes**: For frequent queries (PostgreSQL feature)

### 3.2 Critical Indexes

**Authentication**:
- User.email (unique)
- Session.token_hash (unique)
- Session.expires_at

**Organization**:
- Organization.slug (unique)
- Membership.user_id, organization_id (composite unique)

**Investigation**:
- Case.organization_id, status (composite)
- Case.created_by
- Evidence.case_id, type (composite)
- Evidence.hash_sha256 (unique)

**Graph**:
- Relationship.source_type, source_id (composite)
- Relationship.target_type, target_id (composite)
- Relationship.relationship_type

**Risk**:
- RiskScore.case_id, score (composite)
- RiskIndicator.case_id, indicator_type (composite)

**Monitoring**:
- MonitoringTarget.next_check
- Alert.monitoring_target_id, severity (composite)

**Audit**:
- AuditLog.organization_id, created_at (composite)
- AuditLog.entity_type, entity_id (composite)

### 3.3 Index Maintenance

**Regular Maintenance**:
- Analyze index usage
- Remove unused indexes
- Rebuild fragmented indexes
- Update statistics

**Monitoring**:
- Monitor index size
- Monitor index hit ratio
- Monitor slow queries
- Monitor index bloat

---

## 4. Data Integrity

### 4.1 Constraints

**Primary Keys**:
- All tables have primary keys (cuid())

**Foreign Keys**:
- All foreign keys have ON DELETE CASCADE or SET NULL
- Referential integrity enforced

**Unique Constraints**:
- User.email
- Organization.slug
- Membership.user_id, organization_id
- Evidence.hash_sha256
- Session.token_hash

**Check Constraints**:
- Enums for status fields
- Range validation (via application)

### 4.2 Data Validation

**Application-Level Validation**:
- Zod schemas for all inputs
- Business logic validation
- Data type validation

**Database-Level Validation**:
- NOT NULL constraints
- UNIQUE constraints
- FOREIGN KEY constraints
- CHECK constraints (where applicable)

### 4.3 Soft Deletes

**Soft Delete Pattern**:
- deleted_at timestamp
- Queries filter WHERE deleted_at IS NULL
- Hard delete only for truly temporary data

**Benefits**:
- Data recovery
- Audit trail
- No data loss

**Considerations**:
- Index on deleted_at
- Periodic cleanup of old soft-deleted data
- GDPR right to be forgotten (hard delete required)

---

## 5. Migration Strategy

### 5.1 Migration Workflow

**Development**:
```bash
# Create migration
npx prisma migrate dev --name add_feature

# Reset database (development only)
npx prisma migrate reset

# Generate client
npx prisma generate
```

**Staging/Production**:
```bash
# Create migration
npx prisma migrate dev --name add_feature

# Review migration
# Edit migration file if needed

# Apply to staging
npx prisma migrate deploy

# Test staging
# Verify data integrity

# Apply to production
npx prisma migrate deploy
```

### 5.2 Migration Best Practices

**Before Migration**:
- Backup database
- Test migration on staging
- Review migration SQL
- Plan rollback procedure

**During Migration**:
- Monitor performance
- Monitor errors
- Verify data integrity
- Check application functionality

**After Migration**:
- Verify indexes created
- Verify constraints applied
- Update documentation
- Monitor for issues

### 5.3 Rollback Strategy

**Rollback Procedure**:
1. Identify migration to rollback
2. Create rollback migration
3. Test rollback on staging
4. Apply rollback to production
5. Verify data integrity
6. Monitor for issues

**Rollback Migration**:
```prisma
// Example: Add new field
// Migration: add_field_to_table

// Rollback: remove_field_from_table
```

### 5.4 Data Migrations

**When to Use**:
- Schema changes requiring data transformation
- Data format changes
- Data cleanup
- Data consolidation

**Data Migration Pattern**:
```typescript
// In migration file
async function migrateData(prisma) {
  const records = await prisma.old_table.findMany();
  for (const record of records) {
    await prisma.new_table.create({
      data: transformData(record),
    });
  }
}
```

---

## 6. Performance Optimization

### 6.1 Query Optimization

**Strategies**:
- Use indexes effectively
- Avoid SELECT *
- Use pagination
- Use connection pooling
- Use query result caching
- Optimize N+1 queries

**Example**:
```typescript
// Bad: N+1 query
const cases = await prisma.case.findMany();
for (const case of cases) {
  const evidence = await prisma.evidence.findMany({
    where: { case_id: case.id },
  });
}

// Good: Include relation
const cases = await prisma.case.findMany({
  include: {
    evidence: true,
  },
});
```

### 6.2 Connection Pooling

**Configuration**:
```prisma
datasource db {
  url = env("DATABASE_URL")
  // Connection pooling via connection string
  // postgresql://user:pass@host:port/db?connection_limit=20
}
```

**Best Practices**:
- Set appropriate pool size
- Set connection timeout
- Set idle timeout
- Monitor pool usage

### 6.3 Caching Strategy

**Redis Caching**:
- Cache frequent queries
- Cache user sessions
- Cache permission checks
- Cache configuration data

**Cache Invalidation**:
- Invalidate on data changes
- Time-based expiration
- Manual invalidation

### 6.4 Database Configuration

**PostgreSQL Configuration**:
```ini
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB

# WAL
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Query Planning
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000
```

---

## 7. Backup and Recovery

### 7.1 Backup Strategy

**Backup Types**:
- Full backups (daily)
- Incremental backups (hourly)
- WAL archives (continuous)

**Backup Schedule**:
- Full backup: Daily at 2 AM
- Incremental: Every hour
- WAL: Continuous

**Backup Retention**:
- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

### 7.2 Backup Procedure

**Using pg_dump**:
```bash
# Full backup
pg_dump -h localhost -U user -d scamnet > backup.sql

# Compressed backup
pg_dump -h localhost -U user -d scamnet | gzip > backup.sql.gz

# Schema only
pg_dump -h localhost -U user -d scamnet --schema-only > schema.sql
```

**Using pgBackRest** (Recommended for production):
```bash
# Full backup
pgbackrest --stanza=scamnet backup

# Incremental backup
pgbackrest --stanza=scamnet --type=incr backup
```

### 7.3 Recovery Procedure

**Restore from Backup**:
```bash
# Restore from SQL
psql -h localhost -U user -d scamnet < backup.sql

# Restore from compressed
gunzip < backup.sql.gz | psql -h localhost -U user -d scamnet
```

**Point-in-Time Recovery**:
1. Restore full backup
2. Apply WAL archives
3. Recover to specific time

### 7.4 Backup Testing

**Testing Schedule**:
- Test restore monthly
- Test integrity weekly
- Test backup process daily

**Testing Procedure**:
1. Restore to test environment
2. Verify data integrity
3. Verify application functionality
4. Document results

---

## 8. Security Considerations

### 8.1 Database Security

**User Permissions**:
- Application user: SELECT, INSERT, UPDATE, DELETE
- Migration user: ALTER, CREATE, DROP
- Read replica user: SELECT only

**Network Security**:
- TLS for connections
- Database in private network
- VPN for admin access
- Firewall rules

### 8.2 Data Encryption

**Encryption at Rest**:
- PostgreSQL TDE (if available)
- File system encryption
- Backup encryption

**Encryption in Transit**:
- TLS for all connections
- Certificate validation
- Strong cipher suites

### 8.3 Sensitive Data

**Sensitive Fields**:
- Consider encryption for:
  - Personal identifiers
  - Contact information
  - Financial information
  - Notes with sensitive data

**Encryption Pattern**:
```typescript
// Application-level encryption
const encrypted = encrypt(sensitiveData);
await prisma.evidence.create({
  data: {
    content: encrypted,
  },
});
```

---

## 9. Monitoring and Maintenance

### 9.1 Database Monitoring

**Metrics to Monitor**:
- Connection pool usage
- Query performance
- Index usage
- Table bloat
- Lock contention
- Replication lag

**Monitoring Tools**:
- pg_stat_statements
- pg_stat_activity
- pg_stat_user_tables
- pg_stat_user_indexes

### 9.2 Regular Maintenance

**Daily**:
- Monitor slow queries
- Monitor connection pool
- Check disk space
- Check backup status

**Weekly**:
- Analyze index usage
- Check table bloat
- Review query performance
- Update statistics

**Monthly**:
- Rebuild fragmented indexes
- Vacuum full if needed
- Review and tune configuration
- Update statistics

### 9.3 Capacity Planning

**Metrics to Track**:
- Database size growth
- Table size growth
- Index size growth
- Query performance trends
- Storage capacity

**Planning**:
- Project growth 6-12 months
- Plan storage capacity
- Plan performance upgrades
- Plan scaling strategy

---

## 10. Disaster Recovery

### 10.1 Recovery Time Objective (RTO)

**Target RTO**: 4 hours

**Recovery Steps**:
1. Detect failure
2. Identify cause
3. Initiate recovery
4. Restore from backup
5. Verify integrity
6. Resume operations

### 10.2 Recovery Point Objective (RPO)

**Target RPO**: 1 hour

**Achieved By**:
- Hourly incremental backups
- Continuous WAL archiving
- Point-in-time recovery

### 10.3 Failover Procedure

**Primary Failure**:
1. Promote replica to primary
2. Update application configuration
3. Redirect traffic
4. Monitor performance
5. Rebuild failed primary

**Testing**:
- Test failover quarterly
- Document results
- Update procedures

---

## 11. Data Retention and Archival

### 11.1 Retention Policy

**Data Types**:
- Evidence: As long as legally required
- User data: 3 years after account closure
- Audit logs: 1 year
- System logs: 30 days
- Monitoring data: 90 days

### 11.2 Archival Strategy

**Cold Storage**:
- Move old data to cold storage
- Compress archived data
- Maintain access capability
- Document retrieval procedure

**Archival Triggers**:
- Time-based (age)
- Case closure
- Account closure

---

## 12. Database Schema Evolution

### 12.1 Schema Versioning

**Version Control**:
- All schema changes in migrations
- Migrations versioned in git
- Schema documented

**Change Log**:
- Document all schema changes
- Include rationale
- Include impact analysis

### 12.2 Backward Compatibility

**API Compatibility**:
- Maintain API compatibility
- Version API if breaking changes
- Deprecate old versions

**Data Compatibility**:
- Support data migration
- Support data transformation
- Test data compatibility

---

## 13. Testing

### 13.1 Database Testing

**Unit Tests**:
- Test data models
- Test relationships
- Test constraints
- Test business logic

**Integration Tests**:
- Test database operations
- Test migrations
- Test data integrity
- Test performance

**E2E Tests**:
- Test complete workflows
- Test data consistency
- Test error handling

### 13.2 Test Data

**Test Database**:
- Separate test database
- Reset between tests
- Seed with test data
- Isolate from production

**Test Data Generation**:
- Use Faker for test data
- Generate realistic data
- Cover edge cases
- Test with various data sizes

---

## 14. Documentation

### 14.1 Schema Documentation

**Documentation Tools**:
- Prisma Studio
- ER diagrams
- Schema comments
- API documentation

**Documentation Content**:
- Table descriptions
- Field descriptions
- Relationship descriptions
- Index descriptions
- Constraint descriptions

### 14.2 Operational Documentation

**Documentation Topics**:
- Backup procedures
- Recovery procedures
- Migration procedures
- Monitoring procedures
- Troubleshooting guides

---

## 15. Conclusion

This database plan provides a comprehensive schema design for SCAMNET, including:

- Complete entity definitions
- Relationship mappings
- Index strategy
- Data integrity constraints
- Migration strategy
- Performance optimization
- Backup and recovery
- Security considerations
- Monitoring and maintenance
- Disaster recovery

The schema is designed to:
- Support the full SCAMNET feature set
- Ensure data integrity
- Provide excellent performance
- Enable tenant isolation
- Support auditability
- Scale as needed

**Next Steps**:
1. Review and approve this schema
2. Implement in Prisma
3. Create initial migration
4. Set up database infrastructure
5. Implement data access layer
6. Test schema and migrations

---

## Appendix A: ER Diagram

[ER Diagram to be created using a tool like dbdiagram.io or Mermaid]

---

## Appendix B: Migration Commands

```bash
# Development
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio

# Production
npx prisma migrate deploy
npx prisma generate

# Reset (development only)
npx prisma migrate reset

# Seed
npx prisma db seed
```

---

## Appendix C: Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/scamnet"
DIRECT_URL="postgresql://user:password@localhost:5432/scamnet_direct"
```

---

## Appendix D: Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-09-08 | Initial database plan | Devin |
