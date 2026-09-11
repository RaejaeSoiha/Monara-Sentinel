'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface IntelligenceJob {
  id: string;
  type: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  result: unknown;
  error: string | null;
}

interface Evidence {
  id: string;
  source_type: string;
  source_url: string | null;
  created_at: string;
  sha256: string | null;
  verification_status: string;
}

interface RiskIndicator {
  id: string;
  indicator_type: string;
  explanation: string;
  confidence: number;
  created_at: string;
}

type CollectionType = 'DNS' | 'RDAP' | 'TLS' | 'URL' | 'WEBSITE';

const intelligenceTypes: CollectionType[] = ['DNS', 'RDAP', 'TLS', 'URL', 'WEBSITE'];

const intelligenceConfig = {
  DNS: {
    icon: '🔍',
    title: 'DNS Intelligence',
    description: 'Collect public DNS records including A, AAAA, MX, NS, TXT, and CNAME records',
    placeholder: 'example.com',
    inputLabel: 'Domain',
    color: 'var(--color-accent-primary)'
  },
  RDAP: {
    icon: '🌐',
    title: 'RDAP Registration',
    description: 'Retrieve domain registration information through RDAP protocol',
    placeholder: 'example.com',
    inputLabel: 'Domain',
    color: 'var(--color-accent-intelligence)'
  },
  TLS: {
    icon: '🔒',
    title: 'TLS Certificate',
    description: 'Collect TLS certificate metadata including subject, issuer, SANs, and validity',
    placeholder: 'example.com',
    inputLabel: 'Hostname',
    color: 'var(--color-success)'
  },
  URL: {
    icon: '🔗',
    title: 'URL Analysis',
    description: 'Analyze URL structure, redirects, security headers, and response metadata',
    placeholder: 'https://example.com',
    inputLabel: 'URL',
    color: 'var(--color-warning)'
  },
  WEBSITE: {
    icon: '📄',
    title: 'Website Metadata',
    description: 'Collect website metadata including title, description, headers, and server information',
    placeholder: 'https://example.com',
    inputLabel: 'URL',
    color: 'var(--color-error)'
  }
};

export default function CaseIntelligencePage() {
  const params = useParams();
  const caseId = (params['id'] as string) || '';

  const [selectedType, setSelectedType] = useState<CollectionType>('DNS');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<IntelligenceJob[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [indicators, setIndicators] = useState<RiskIndicator[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchIntelligence = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/v1/cases/${caseId}/intelligence`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch intelligence');
      const data = await response.json();
      setJobs(data.jobs || []);
      setEvidence(data.evidence || []);
      setIndicators(data.indicators || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load intelligence');
    }
  };

  useEffect(() => {
    fetchIntelligence();
    const interval = setInterval(fetchIntelligence, 5000);
    return () => clearInterval(interval);
  }, [caseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const endpoint = `/api/v1/cases/${caseId}/intelligence/${selectedType.toLowerCase()}`;
      const body = selectedType === 'DNS' || selectedType === 'RDAP'
        ? { domain: input }
        : selectedType === 'TLS'
        ? { hostname: input }
        : { url: input };

      const response = await fetch(`http://localhost:3002${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to submit intelligence');

      await fetchIntelligence();
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit intelligence');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="status-badge status-badge-success">✓ COMPLETED</span>;
      case 'FAILED': return <span className="status-badge status-badge-error">✗ FAILED</span>;
      case 'RUNNING': return <span className="status-badge status-badge-info pulse">● RUNNING</span>;
      case 'QUEUED': return <span className="status-badge status-badge-info">○ QUEUED</span>;
      default: return <span className="status-badge status-badge-info">{status}</span>;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <span className="status-badge status-badge-success">VERIFIED</span>;
      case 'CORROBORATED': return <span className="status-badge status-badge-success">CORROBORATED</span>;
      case 'OBSERVED': return <span className="status-badge status-badge-warning">OBSERVED</span>;
      case 'INFERENCE': return <span className="status-badge status-badge-info">INFERENCE</span>;
      case 'HYPOTHESIS': return <span className="status-badge status-badge-error">HYPOTHESIS</span>;
      default: return <span className="status-badge status-badge-info">{status}</span>;
    }
  };

  const activeJobs = jobs.filter(j => j.status === 'RUNNING' || j.status === 'QUEUED');

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <Link href={`/cases/${caseId}`} style={{ fontSize: 13, color: 'var(--color-accent-primary)', textDecoration: 'none' }}>
          ← Back to Case
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
          Intelligence Operations
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
          Safe intelligence collection console • Evidence-first analysis
        </p>
      </div>

      {error && (
        <div className="monara-card" style={{ 
          padding: 16, 
          marginBottom: 24, 
          background: 'var(--color-error-subtle)', 
          border: '1px solid var(--color-error)',
          color: 'var(--color-error)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>INTELLIGENCE COLLECTION FAILED</div>
          <div style={{ fontSize: 13 }}>{error}</div>
        </div>
      )}

      {/* Intelligence Collection Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        {intelligenceTypes.map((type) => {
          const config = intelligenceConfig[type];
          const isActive = selectedType === type;
          const hasActiveJob = activeJobs.some(j => j.type === type);
          
          return (
            <div
              key={type}
              className="monara-card"
              style={{
                cursor: 'pointer',
                border: isActive ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-subtle)',
                background: isActive ? 'var(--color-bg-card-elevated)' : 'var(--color-bg-card)',
                position: 'relative'
              }}
              onClick={() => setSelectedType(type)}
            >
              {hasActiveJob && (
                <div style={{ 
                  position: 'absolute', 
                  top: 12, 
                  right: 12,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--color-accent-primary)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}></div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{config.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>
                    {config.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {type}
                  </div>
                </div>
              </div>
              
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
                {config.description}
              </div>
              
              <div style={{ 
                padding: 8, 
                background: 'var(--color-bg-input)', 
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-mono)'
              }}>
                {config.placeholder}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Collection Form */}
      <div className="monara-card monara-card-elevated" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>{intelligenceConfig[selectedType].icon}</span>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
              {intelligenceConfig[selectedType].title}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
              {intelligenceConfig[selectedType].description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontWeight: 500, 
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.5px'
            }}>
              {intelligenceConfig[selectedType].inputLabel.toUpperCase()}
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={intelligenceConfig[selectedType].placeholder}
              className="monara-input"
              style={{ 
                fontFamily: 'var(--font-mono)',
                fontSize: 13
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="monara-button monara-button-primary"
            style={{ 
              width: '100%',
              background: loading ? 'var(--color-bg-card-elevated)' : intelligenceConfig[selectedType].color,
              borderColor: loading ? 'var(--color-border-default)' : intelligenceConfig[selectedType].color,
              opacity: loading || !input.trim() ? 0.6 : 1
            }}
          >
            {loading ? (
              <>
                <span className="pulse">●</span>
                INITIATING COLLECTION...
              </>
            ) : (
              <>
                {intelligenceConfig[selectedType].icon}
                COLLECT {selectedType} INTELLIGENCE
              </>
            )}
          </button>
        </form>
      </div>

      {/* Intelligence Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Jobs Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
              Collection Jobs
            </h2>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              {jobs.length} total
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="monara-card" style={{ 
              padding: 32, 
              textAlign: 'center',
              background: 'var(--color-bg-card)',
              border: '1px dashed var(--color-border-default)'
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                No intelligence jobs yet
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                Start by selecting a collection type above
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jobs.map((job) => (
                <div key={job.id} className="monara-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{intelligenceConfig[job.type as CollectionType]?.icon || '📊'}</span>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>
                        {job.type}
                      </span>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                  
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
                    {new Date(job.created_at).toLocaleString()}
                  </div>
                  
                  {job.started_at && job.status === 'RUNNING' && (
                    <div style={{ 
                      padding: 8, 
                      background: 'var(--color-accent-primary-subtle)', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11,
                      color: 'var(--color-accent-primary)',
                      marginBottom: 8
                    }}>
                      <span className="pulse">●</span> Processing collection...
                    </div>
                  )}
                  
                  {job.error && (
                    <div style={{ 
                      padding: 8, 
                      background: 'var(--color-error-subtle)', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11,
                      color: 'var(--color-error)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      Error: {String(job.error)}
                    </div>
                  )}
                  
                  {job.status === 'COMPLETED' && job.result != null && (
                    <div style={{ 
                      padding: 8, 
                      background: 'var(--color-success-subtle)', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11,
                      color: 'var(--color-success)'
                    }}>
                      ✓ Collection completed successfully
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evidence & Indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Evidence Summary */}
          <div className="monara-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
                Evidence
              </h3>
              <span className="status-badge status-badge-success">{evidence.length}</span>
            </div>
            
            {evidence.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 16 }}>
                No evidence collected
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {evidence.slice(0, 5).map((ev) => (
                  <div key={ev.id} style={{ 
                    padding: 8, 
                    background: 'var(--color-bg-input)', 
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                        {ev.source_type}
                      </span>
                      {getVerificationBadge(ev.verification_status)}
                    </div>
                    {ev.source_url && (
                      <div style={{ 
                        fontSize: 10, 
                        color: 'var(--color-text-tertiary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {ev.source_url}
                      </div>
                    )}
                  </div>
                ))}
                {evidence.length > 5 && (
                  <div style={{ fontSize: 11, color: 'var(--color-accent-primary)', textAlign: 'center', paddingTop: 4 }}>
                    +{evidence.length - 5} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Risk Indicators */}
          <div className="monara-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
                Risk Indicators
              </h3>
              <span className="status-badge status-badge-warning">{indicators.length}</span>
            </div>
            
            {indicators.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 16 }}>
                No indicators generated
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {indicators.slice(0, 3).map((ind) => (
                  <div key={ind.id} style={{ 
                    padding: 8, 
                    background: 'var(--color-warning-subtle)', 
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    <div style={{ fontWeight: 500, fontSize: 11, color: 'var(--color-warning)', marginBottom: 4 }}>
                      {ind.indicator_type}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                      {ind.explanation.slice(0, 60)}...
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                      {ind.confidence}% confidence
                    </div>
                  </div>
                ))}
                {indicators.length > 3 && (
                  <div style={{ fontSize: 11, color: 'var(--color-accent-primary)', textAlign: 'center', paddingTop: 4 }}>
                    +{indicators.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}