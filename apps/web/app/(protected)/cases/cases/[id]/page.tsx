'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface CaseDetail {
  id: string;
  case_number: string;
  name: string;
  description: string | null;
  status: string;
  severity: string;
  priority: string;
  tags: string[];
  created_at: string;
  creator?: { email: string; name: string | null };
}

interface Entity {
  id: string;
  type: string;
  value: string;
  display_name: string | null;
  created_at: string;
}

interface EvidenceItem {
  id: string;
  source_url: string | null;
  source_type: string | null;
  source_title: string | null;
  verification_status: string;
  confidence: number;
  sha256: string | null;
  excerpt: string | null;
  created_at: string;
}

interface Relationship {
  id: string;
  type: string;
  confidence: number;
  status: string;
  explanation: string | null;
  source_url: string | null;
  source_entity: Entity;
  target_entity: Entity;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  occurred_at: string;
  creator: { email: string };
}

interface IntelligenceJob {
  id: string;
  type: string;
  status: string;
  created_at: string;
  result: unknown;
  error: string | null;
}

interface RiskIndicator {
  id: string;
  indicator_type: string;
  explanation: string;
  confidence: number;
  created_at: string;
}

interface ImageAnalysis {
  id: string;
  sha256: string;
  sha512: string;
  phash: string;
  dhash: string;
  ahash: string;
  width: number;
  height: number;
  mime_type: string;
  file_size: number;
  status: string;
  created_at: string;
  evidence: {
    id: string;
    artifact_url: string | null;
    source_title: string | null;
  };
  metadata: {
    camera_make: string | null;
    camera_model: string | null;
    gps_latitude: number | null;
    gps_longitude: number | null;
  } | null;
  matches: {
    id: string;
    match_type: string;
    similarity: number | null;
    source_url: string | null;
  }[];
  origin_observation: {
    origin_type: string;
    earliest_observed_at: string | null;
    explanation: string | null;
  } | null;
}

type TabType = 'overview' | 'entities' | 'evidence' | 'relationships' | 'timeline' | 'intelligence' | 'images' | 'location' | 'device';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'OPEN': return <span className="status-badge status-badge-success">OPEN</span>;
    case 'IN_PROGRESS': return <span className="status-badge status-badge-running">RUNNING</span>;
    case 'CLOSED': return <span className="status-badge status-badge-pending">CLOSED</span>;
    case 'ARCHIVED': return <span className="status-badge status-badge-unknown">ARCHIVED</span>;
    default: return <span className="status-badge status-badge-unknown">{status}</span>;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'LOW': return <span className="status-badge" style={{ background: 'var(--color-severity-low)', color: 'var(--color-severity-low)', border: '1px solid var(--color-severity-low)' }}>LOW</span>;
    case 'MEDIUM': return <span className="status-badge" style={{ background: 'var(--color-severity-moderate)', color: 'var(--color-severity-moderate)', border: '1px solid var(--color-severity-moderate)' }}>MODERATE</span>;
    case 'HIGH': return <span className="status-badge" style={{ background: 'var(--color-severity-high)', color: 'var(--color-severity-high)', border: '1px solid var(--color-severity-high)' }}>HIGH</span>;
    case 'CRITICAL': return <span className="status-badge" style={{ background: 'var(--color-severity-critical)', color: 'var(--color-severity-critical)', border: '1px solid var(--color-severity-critical)' }}>CRITICAL</span>;
    default: return <span className="status-badge status-badge-unknown">{severity}</span>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'LOW': return <span className="status-badge status-badge-success">LOW</span>;
    case 'MEDIUM': return <span className="status-badge status-badge-warning">MEDIUM</span>;
    case 'HIGH': return <span className="status-badge status-badge-failed">HIGH</span>;
    default: return <span className="status-badge status-badge-unknown">{priority}</span>;
  }
};

export default function CaseDetailPage() {
  const params = useParams();
  const id = (params?.['id'] as string) || '';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [intelJobs, setIntelJobs] = useState<IntelligenceJob[]>([]);
  const [intelIndicators, setIntelIndicators] = useState<RiskIndicator[]>([]);
  const [images, setImages] = useState<ImageAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  async function fetchCase() {
    const res = await fetch(`http://localhost:3002/api/v1/cases/${id}`, { headers });
    if (res.ok) setCaseData(await res.json());
    else setError(`Case fetch ${res.status}`);
  }

  async function fetchEntities() {
    const res = await fetch(`http://localhost:3002/api/v1/cases/${id}/entities`, { headers });
    if (res.ok) {
      const data = await res.json();
      setEntities(data.items || []);
    }
  }

  async function fetchEvidence() {
    const res = await fetch(`http://localhost:3002/api/v1/cases/${id}/evidence`, { headers });
    if (res.ok) {
      const data = await res.json();
      setEvidence(data.items || []);
    }
  }

  async function fetchRelationships() {
    const res = await fetch(`http://localhost:3002/api/v1/cases/${id}/relationships`, { headers });
    if (res.ok) {
      const data = await res.json();
      setRelationships(data.items || []);
    }
  }

  async function fetchTimeline() {
    const res = await fetch(`http://localhost:3002/api/v1/cases/${id}/timeline`, { headers });
    if (res.ok) {
      const data = await res.json();
      setTimeline(data.items || []);
    }
  }

  async function fetchIntelligence() {
    const res = await fetch(`http://localhost:3002/api/v1/cases/${id}/intelligence`, { headers });
    if (res.ok) {
      const data = await res.json();
      setIntelJobs(data.jobs || []);
      setIntelIndicators(data.indicators || []);
    }
  }

  async function fetchImages() {
    const res = await fetch(`http://localhost:3002/api/v1/cases/${id}/images`, { headers });
    if (res.ok) {
      const data = await res.json();
      setImages(data.items || []);
    }
  }

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([fetchCase(), fetchEntities(), fetchEvidence(), fetchRelationships(), fetchTimeline(), fetchIntelligence(), fetchImages()])
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (error) return <div className="monara-card" style={{ padding: 16, background: 'var(--color-error-subtle)', border: '1px solid var(--color-error)', color: 'var(--color-error)' }}>{error}</div>;
  if (loading) return (
    <div className="monara-card" style={{ padding: 24, textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 24, width: '40%', margin: '0 auto 16px' }}></div>
      <div className="skeleton" style={{ height: 16, width: '60%', margin: '0 auto' }}></div>
    </div>
  );
  if (!caseData) return <div className="monara-card" style={{ padding: 16 }}>Case not found</div>;

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'entities', label: 'Entities', icon: '🏷️' },
    { id: 'evidence', label: 'Evidence', icon: '📄' },
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'intelligence', label: 'Intelligence', icon: '🧠' },
    { id: 'relationships', label: 'Relationships', icon: '🔗' },
    { id: 'location', label: 'Location', icon: '�' },
    { id: 'device', label: 'Device', icon: '📱' },
    { id: 'timeline', label: 'Timeline', icon: '�' },
  ];

  return (
    <div>
      {/* Premium Breadcrumb */}
      <div style={{ marginBottom: 12 }}>
        <Link href="/cases" style={{ fontSize: 11, color: 'var(--color-accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
          ← Cases
        </Link>
      </div>

      {/* Premium Case Header */}
      <div className="scamnet-panel scamnet-panel-elevated" style={{ marginBottom: 14, padding: 14, borderLeft: caseData.severity === 'CRITICAL' ? '2px solid var(--color-accent-red)' :
                  caseData.severity === 'HIGH' ? '2px solid var(--color-accent-amber)' :
                  caseData.severity === 'MEDIUM' ? '2px solid var(--color-accent-amber)' :
                  '2px solid var(--color-accent-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)', letterSpacing: '-0.3px', fontFamily: 'var(--font-mono)' }}>
              {caseData.case_number}
            </h1>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: '3px 0 0 0', color: 'var(--color-text-primary)' }}>
              {caseData.name}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {getStatusBadge(caseData.status)}
            {getSeverityBadge(caseData.severity)}
            {getPriorityBadge(caseData.priority)}
          </div>
        </div>

        {caseData.description && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 11, lineHeight: 1.4, margin: '0 0 12px 0' }}>
            {caseData.description}
          </p>
        )}

        {caseData.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {caseData.tags.map((t) => (
              <span key={t} style={{
                background: 'var(--color-accent-primary-subtle)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 9,
                color: 'var(--color-accent-primary)',
                fontWeight: 600,
                letterSpacing: '0.4px'
              }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Premium Compact Tabs */}
      <div className="scamnet-panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border-subtle)',
          background: 'var(--color-bg-card-elevated)'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: activeTab === tab.id ? 'var(--color-bg-card)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                fontSize: 10,
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all var(--transition-fast)',
                letterSpacing: '0.3px'
              }}
            >
              <span style={{ fontSize: 11 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 14 }}>
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)', letterSpacing: '0.4px' }}>CASE OVERVIEW</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
                <div className="metric-card metric-card-compact">
                  <div className="metric-label">ENTITIES</div>
                  <div className="metric-value">{entities.length}</div>
                  <div className="metric-subtitle">Tracked entities</div>
                </div>
                <div className="metric-card metric-card-compact">
                  <div className="metric-label">EVIDENCE</div>
                  <div className="metric-value">{evidence.length}</div>
                  <div className="metric-subtitle">Collected evidence</div>
                </div>
                <div className="metric-card metric-card-compact">
                  <div className="metric-label">RELATIONSHIPS</div>
                  <div className="metric-value" style={{ fontSize: 24 }}>{relationships.length}</div>
                  <div className="metric-subtitle">Entity connections</div>
                </div>
                <div className="metric-card metric-card-compact">
                  <div className="metric-label">TIMELINE</div>
                  <div className="metric-value">{timeline.length}</div>
                  <div className="metric-subtitle">Investigation events</div>
                </div>
                <div className="metric-card metric-card-compact">
                  <div className="metric-label">INTELLIGENCE</div>
                  <div className="metric-value">{intelJobs.length}</div>
                  <div className="metric-subtitle">Collection jobs</div>
                </div>
                <div className="metric-card metric-card-compact" style={{ borderLeft: '2px solid var(--color-accent-amber)' }}>
                  <div className="metric-label" style={{ color: 'var(--color-accent-amber)' }}>RISK INDICATORS</div>
                  <div className="metric-value" style={{ color: 'var(--color-accent-amber)' }}>{intelIndicators.length}</div>
                  <div className="metric-subtitle">Generated indicators</div>
                </div>
              </div>

              <div className="scamnet-panel scamnet-panel-accent" style={{ padding: 12 }}>
                <h4 style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: 'var(--color-accent-primary)', letterSpacing: '0.4px', margin: 0 }}>QUICK ACTIONS</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('intelligence')}
                    className="monara-button monara-button-xs"
                  >
                    <span>🧠</span>
                    Collect Intelligence
                  </button>
                  <button
                    onClick={() => setActiveTab('relationships')}
                    className="monara-button monara-button-secondary monara-button-xs"
                  >
                    <span>🔗</span>
                    View Relationships
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className="monara-button monara-button-secondary monara-button-xs"
                  >
                    <span>📅</span>
                    View Timeline
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'entities' && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)', letterSpacing: '0.5px' }}>
                ENTITIES ({entities.length})
              </h3>
              {entities.length === 0 ? (
                <div className="monara-card" style={{
                  padding: 32,
                  textAlign: 'center',
                  border: '1px dashed var(--color-border-default)'
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🏷️</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    NO ENTITIES YET
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    Entities will be created during intelligence collection
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {entities.map((en) => (
                    <div key={en.id} className="monara-card" style={{
                      padding: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <span style={{
                        fontWeight: 600,
                        background: 'var(--color-accent-intelligence-subtle)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 10,
                        color: 'var(--color-accent-intelligence)',
                        letterSpacing: '0.5px'
                      }}>
                        {en.type}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {en.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)', letterSpacing: '0.5px' }}>
                EVIDENCE ({evidence.length})
              </h3>
              {evidence.length === 0 ? (
                <div className="monara-card" style={{
                  padding: 32,
                  textAlign: 'center',
                  border: '1px dashed var(--color-border-default)'
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    NO EVIDENCE COLLECTED YET
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    Collect intelligence to generate evidence
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {evidence.map((ev) => (
                    <div key={ev.id} className="monara-card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>
                          {ev.source_type || 'MANUAL'}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 10,
                          fontWeight: 600,
                          background: ev.verification_status === 'OBSERVED' ? 'var(--color-warning-subtle)' : 'var(--color-success-subtle)',
                          color: ev.verification_status === 'OBSERVED' ? 'var(--color-warning)' : 'var(--color-success)',
                          letterSpacing: '0.5px'
                        }}>
                          {ev.verification_status}
                        </span>
                      </div>
                      {ev.source_url && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8, wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                          {ev.source_url}
                        </div>
                      )}
                      {ev.excerpt && (
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
                          {ev.excerpt}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                        SHA-256: {ev.sha256?.slice(0, 32)}...
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                        {new Date(ev.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'relationships' && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)', letterSpacing: '0.5px' }}>
                RELATIONSHIPS ({relationships.length})
              </h3>
              {relationships.length === 0 ? (
                <div className="monara-card" style={{
                  padding: 32,
                  textAlign: 'center',
                  border: '1px dashed var(--color-border-default)'
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    NO RELATIONSHIPS YET
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    Relationships will be discovered during intelligence collection
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {relationships.map((r) => (
                    <div key={r.id} className="monara-card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {r.source_entity.value}
                        </span>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: 'var(--radius-sm)', 
                          fontSize: 11, 
                          fontWeight: 600,
                          background: 'var(--color-accent-primary-subtle)',
                          color: 'var(--color-accent-primary)'
                        }}>
                          {r.type}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {r.target_entity.value}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                          {r.confidence}% confidence
                        </span>
                      </div>
                      {r.explanation && (
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                          {r.explanation}
                        </div>
                      )}
                      {r.source_url && (
                        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                          {r.source_url}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)', letterSpacing: '0.5px' }}>
                TIMELINE ({timeline.length})
              </h3>
              {timeline.length === 0 ? (
                <div className="monara-card" style={{
                  padding: 32,
                  textAlign: 'center',
                  border: '1px dashed var(--color-border-default)'
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    NO TIMELINE EVENTS YET
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    Timeline will populate as investigation progresses
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {timeline.map((t) => (
                    <div key={t.id} style={{
                      padding: 12,
                      borderLeft: '2px solid var(--color-accent-primary)',
                      paddingLeft: 16,
                      background: 'var(--color-bg-card)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {t.event_type} • {new Date(t.occurred_at).toLocaleString()} • {t.creator.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'intelligence' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
                  Intelligence Jobs ({intelJobs.length})
                </h3>
                <Link 
                  href={`/cases/${id}/intelligence`}
                  className="monara-button monara-button-primary"
                >
                  <span>🔍</span>
                  Collect Intelligence
                </Link>
              </div>
              
              {intelJobs.length === 0 ? (
                <div className="monara-card" style={{ 
                  padding: 48, 
                  textAlign: 'center',
                  border: '1px dashed var(--color-border-default)'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    No intelligence jobs yet
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    Start collecting intelligence to build the investigation
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {intelJobs.map((job) => (
                    <div key={job.id} className="monara-card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>
                          {job.type}
                        </span>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: 'var(--radius-sm)', 
                          fontSize: 11, 
                          fontWeight: 600,
                          background: job.status === 'COMPLETED' ? 'var(--color-success-subtle)' : job.status === 'FAILED' ? 'var(--color-error-subtle)' : 'var(--color-accent-primary-subtle)',
                          color: job.status === 'COMPLETED' ? 'var(--color-success)' : job.status === 'FAILED' ? 'var(--color-error)' : 'var(--color-accent-primary)'
                        }}>
                          {job.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
                        {new Date(job.created_at).toLocaleString()}
                      </div>
                      {job.error && (
                        <div style={{ 
                          padding: 8, 
                          background: 'var(--color-error-subtle)', 
                          borderRadius: 'var(--radius-sm)', 
                          fontSize: 11, 
                          color: 'var(--color-error)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          Error: {job.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {intelIndicators.length > 0 && (
                <>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 32, marginBottom: 20, color: 'var(--color-text-primary)' }}>
                    Risk Indicators ({intelIndicators.length})
                  </h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {intelIndicators.map((ind) => (
                      <div key={ind.id} className="monara-card" style={{ 
                        padding: 20, 
                        background: 'var(--color-warning-subtle)', 
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-warning)' }}>
                            {ind.indicator_type}
                          </span>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: 'var(--radius-sm)', 
                            fontSize: 11, 
                            fontWeight: 600,
                            background: 'var(--color-warning)',
                            color: 'var(--color-bg-app)'
                          }}>
                            {ind.confidence}%
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                          {ind.explanation}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                          {new Date(ind.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'images' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '0.4px', margin: 0 }}>
                  IMAGES ({images.length})
                </h3>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      const res = await fetch(`http://localhost:3002/api/v1/cases/${id}/images`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                      });
                      if (res.ok) {
                        await fetchImages();
                      } else {
                        alert('Upload failed');
                      }
                    };
                    input.click();
                  }}
                  className="monara-button monara-button-xs"
                >
                  <span>📤</span>
                  Upload
                </button>
              </div>

              {images.length === 0 ? (
                <div className="scamnet-panel" style={{
                  padding: 24,
                  textAlign: 'center',
                  border: '1px dashed var(--color-border-default)'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>🖼️</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                    No images uploaded yet
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                    Upload images to analyze for intelligence
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {images.map((img) => (
                    <div key={img.id} className="scamnet-panel scamnet-panel-purple" style={{ padding: 12 }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                        {img.evidence.artifact_url && (
                          <img
                            src={img.evidence.artifact_url}
                            alt="Analyzed image"
                            style={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border-subtle)'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--color-text-primary)' }}>
                              {img.evidence.source_title || 'Image'}
                            </span>
                            <span className={`status-badge status-badge-${img.status === 'COMPLETED' ? 'success' : 'pending'}`}>
                              {img.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                            {img.width}x{img.height} • {(img.file_size / 1024).toFixed(1)} KB
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                            SHA-256: {img.sha256.slice(0, 32)}...
                          </div>
                        </div>
                      </div>

                      {img.metadata && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, color: 'var(--color-accent-purple)', letterSpacing: '0.3px' }}>
                            METADATA
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 6, fontSize: 10 }}>
                            {img.metadata.camera_make && (
                              <div style={{ color: 'var(--color-text-secondary)' }}>
                                <span style={{ fontWeight: 500 }}>Camera:</span> {img.metadata.camera_make}
                              </div>
                            )}
                            {img.metadata.gps_latitude && (
                              <div style={{ color: 'var(--color-text-secondary)' }}>
                                <span style={{ fontWeight: 500 }}>GPS:</span> {img.metadata.gps_latitude.toFixed(6)}, {img.metadata.gps_longitude.toFixed(6)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {img.matches.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, color: 'var(--color-accent-primary)', letterSpacing: '0.3px' }}>
                            MATCHES ({img.matches.length})
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {img.matches.map((match) => (
                              <span key={match.id} style={{
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 9,
                                fontWeight: 600,
                                background: match.match_type === 'EXACT_MATCH' ? 'var(--color-accent-red-subtle)' : 'var(--color-accent-amber-subtle)',
                                color: match.match_type === 'EXACT_MATCH' ? 'var(--color-accent-red)' : 'var(--color-accent-amber)'
                              }}>
                                {match.match_type} {match.similarity ? `(${Math.round(match.similarity * 100)}%)` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                        {new Date(img.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'location' && (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)', letterSpacing: '0.4px' }}>
                LOCATION INTELLIGENCE
              </h3>
              <div className="scamnet-panel scamnet-panel-cyan">
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                  No location observations recorded yet.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'device' && (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)', letterSpacing: '0.4px' }}>
                DEVICE INTELLIGENCE
              </h3>
              <div className="scamnet-panel scamnet-panel-purple">
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                  No device observations recorded yet.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}