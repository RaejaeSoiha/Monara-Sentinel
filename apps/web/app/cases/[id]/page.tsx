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

type TabType = 'overview' | 'entities' | 'evidence' | 'relationships' | 'timeline' | 'intelligence';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'OPEN': return <span className="status-badge status-badge-info">OPEN</span>;
    case 'IN_PROGRESS': return <span className="status-badge status-badge-warning">IN PROGRESS</span>;
    case 'CLOSED': return <span className="status-badge status-badge-success">CLOSED</span>;
    case 'ARCHIVED': return <span className="status-badge" style={{ background: 'var(--color-bg-card-elevated)', color: 'var(--color-text-tertiary)' }}>ARCHIVED</span>;
    default: return <span className="status-badge">{status}</span>;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'LOW': return <span className="status-badge risk-badge-low">LOW</span>;
    case 'MEDIUM': return <span className="status-badge risk-badge-moderate">MEDIUM</span>;
    case 'HIGH': return <span className="status-badge risk-badge-high">HIGH</span>;
    case 'CRITICAL': return <span className="status-badge risk-badge-critical">CRITICAL</span>;
    default: return <span className="status-badge">{severity}</span>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'LOW': return <span className="status-badge" style={{ background: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>LOW</span>;
    case 'MEDIUM': return <span className="status-badge" style={{ background: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }}>MEDIUM</span>;
    case 'HIGH': return <span className="status-badge" style={{ background: 'var(--color-error-subtle)', color: 'var(--color-error)' }}>HIGH</span>;
    default: return <span className="status-badge">{priority}</span>;
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

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([fetchCase(), fetchEntities(), fetchEvidence(), fetchRelationships(), fetchTimeline(), fetchIntelligence()])
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
    { id: 'relationships', label: 'Relationships', icon: '🔗' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'intelligence', label: 'Intelligence', icon: '🔍' },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <Link href="/cases" style={{ fontSize: 13, color: 'var(--color-accent-primary)', textDecoration: 'none' }}>
          ← Back to Cases
        </Link>
      </div>

      {/* Case Header */}
      <div className="monara-card monara-card-elevated" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              {caseData.case_number}
            </h1>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '8px 0 0 0', color: 'var(--color-text-secondary)' }}>
              {caseData.name}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {getStatusBadge(caseData.status)}
            {getSeverityBadge(caseData.severity)}
            {getPriorityBadge(caseData.priority)}
          </div>
        </div>
        
        {caseData.description && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px 0' }}>
            {caseData.description}
          </p>
        )}
        
        {caseData.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {caseData.tags.map((t) => (
              <span key={t} style={{ 
                background: 'var(--color-accent-primary-subtle)', 
                padding: '4px 10px', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: 11,
                color: 'var(--color-accent-primary)',
                fontWeight: 500
              }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="monara-card" style={{ padding: 0, overflow: 'hidden' }}>
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
                padding: '14px 16px',
                background: activeTab === tab.id ? 'var(--color-bg-card)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all var(--transition-fast)'
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--color-text-primary)' }}>Case Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div className="metric-card">
                  <div className="metric-label">ENTITIES</div>
                  <div className="metric-value">{entities.length}</div>
                  <div className="metric-subtitle">Tracked entities</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">EVIDENCE</div>
                  <div className="metric-value">{evidence.length}</div>
                  <div className="metric-subtitle">Collected evidence</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">RELATIONSHIPS</div>
                  <div className="metric-value">{relationships.length}</div>
                  <div className="metric-subtitle">Entity connections</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">TIMELINE</div>
                  <div className="metric-value">{timeline.length}</div>
                  <div className="metric-subtitle">Investigation events</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">INTELLIGENCE</div>
                  <div className="metric-value">{intelJobs.length}</div>
                  <div className="metric-subtitle">Collection jobs</div>
                </div>
                <div className="metric-card" style={{ borderLeft: '3px solid var(--color-warning)' }}>
                  <div className="metric-label" style={{ color: 'var(--color-warning)' }}>RISK INDICATORS</div>
                  <div className="metric-value" style={{ color: 'var(--color-warning)' }}>{intelIndicators.length}</div>
                  <div className="metric-subtitle">Generated indicators</div>
                </div>
              </div>
              
              <div className="monara-card monara-card-accent" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--color-accent-primary)' }}>Quick Actions</h4>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link 
                    href={`/cases/${id}/intelligence`}
                    className="monara-button monara-button-primary"
                  >
                    <span>🔍</span>
                    Collect Intelligence
                  </Link>
                  <Link 
                    href={`/cases/${id}/graph`}
                    className="monara-button monara-button-secondary"
                  >
                    <span>🔗</span>
                    View Graph
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'entities' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--color-text-primary)' }}>
                Entities ({entities.length})
              </h3>
              {entities.length === 0 ? (
                <div className="monara-card" style={{ 
                  padding: 48, 
                  textAlign: 'center',
                  border: '1px dashed var(--color-border-default)'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    No entities yet
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    Entities will be created during intelligence collection
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {entities.map((en) => (
                    <div key={en.id} className="monara-card" style={{ 
                      padding: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <span style={{ 
                        fontWeight: 600, 
                        background: 'var(--color-bg-card-elevated)', 
                        padding: '4px 10px', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: 11,
                        color: 'var(--color-accent-primary)',
                        letterSpacing: '0.5px'
                      }}>
                        {en.type}
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
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
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--color-text-primary)' }}>
                Evidence ({evidence.length})
              </h3>
              {evidence.length === 0 ? (
                <div className="monara-card" style={{ 
                  padding: 48, 
                  textAlign: 'center',
                  border: '1px dashed var(--color-border-default)'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    No evidence collected yet
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    Collect intelligence to generate evidence
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {evidence.map((ev) => (
                    <div key={ev.id} className="monara-card" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>
                          {ev.source_type || 'MANUAL'}
                        </span>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: 'var(--radius-sm)', 
                          fontSize: 11, 
                          fontWeight: 600,
                          background: ev.verification_status === 'OBSERVED' ? 'var(--color-warning-subtle)' : 'var(--color-success-subtle)',
                          color: ev.verification_status === 'OBSERVED' ? 'var(--color-warning)' : 'var(--color-success)'
                        }}>
                          {ev.verification_status}
                        </span>
                      </div>
                      {ev.source_url && (
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                          {ev.source_url}
                        </div>
                      )}
                      {ev.excerpt && (
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
                          {ev.excerpt}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
                        SHA-256: {ev.sha256?.slice(0, 32)}...
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
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
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--color-text-primary)' }}>
                Relationships ({relationships.length})
              </h3>
              {relationships.length === 0 ? (
                <div className="monara-card" style={{ 
                  padding: 48, 
                  textAlign: 'center',
                  border: '1px dashed var(--color-border-default)'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    No relationships yet
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    Relationships will be discovered during intelligence collection
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {relationships.map((r) => (
                    <div key={r.id} className="monara-card" style={{ padding: 20 }}>
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
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--color-text-primary)' }}>
                Timeline ({timeline.length})
              </h3>
              {timeline.length === 0 ? (
                <div className="monara-card" style={{ 
                  padding: 48, 
                  textAlign: 'center',
                  border: '1px dashed var(--color-border-default)'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    No timeline events yet
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    Timeline will populate as investigation progresses
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {timeline.map((t) => (
                    <div key={t.id} style={{ 
                      padding: 16, 
                      borderLeft: '3px solid var(--color-accent-primary)', 
                      paddingLeft: 20, 
                      background: 'var(--color-bg-card)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
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
        </div>
      </div>
    </div>
  );
}