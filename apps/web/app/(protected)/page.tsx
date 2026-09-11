'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  activeCases: number;
  evidenceItems: number;
  intelligenceJobs: number;
  highRiskCases: number;
  imagesAnalyzed: number;
  domainsAnalyzed: number;
  ipsObserved: number;
  relationshipsDiscovered: number;
}

interface IntelligenceActivity {
  id: string;
  type: 'IMAGE_ANALYZED' | 'DOMAIN_ANALYZED' | 'LOCATION_OBSERVED' | 'RELATIONSHIP_DISCOVERED' | 'RISK_INDICATOR';
  title: string;
  subtitle: string;
  evidence_state: 'OBSERVED' | 'CORROBORATED' | 'INFERENCE' | 'HYPOTHESIS' | 'UNKNOWN';
  confidence?: number;
  timestamp: string;
  caseReference?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeCases: 0,
    evidenceItems: 0,
    intelligenceJobs: 0,
    highRiskCases: 0,
    imagesAnalyzed: 0,
    domainsAnalyzed: 0,
    ipsObserved: 0,
    relationshipsDiscovered: 0,
  });
  const [activities, setActivities] = useState<IntelligenceActivity[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<IntelligenceActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '+') {
        e.preventDefault();
        setZoom(prev => Math.min(prev + 10, 200));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoom(prev => Math.max(prev - 10, 50));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Simulate loading stats from API
    setTimeout(() => {
      setStats({
        activeCases: 24,
        evidenceItems: 342,
        intelligenceJobs: 89,
        highRiskCases: 5,
        imagesAnalyzed: 67,
        domainsAnalyzed: 156,
        ipsObserved: 89,
        relationshipsDiscovered: 234,
      });
      setActivities([
        {
          id: '1',
          type: 'IMAGE_ANALYZED',
          title: 'Suspicious image processed',
          subtitle: 'EXIF analysis complete',
          evidence_state: 'OBSERVED',
          confidence: 92,
          caseReference: 'CASE-0042',
          timestamp: '14:32:18',
        },
        {
          id: '2',
          type: 'DOMAIN_ANALYZED',
          title: 'example-scam-domain.com',
          subtitle: 'DNS + RDAP + TLS analysis',
          evidence_state: 'OBSERVED',
          confidence: 88,
          caseReference: 'CASE-0041',
          timestamp: '14:31:52',
        },
        {
          id: '3',
          type: 'LOCATION_OBSERVED',
          title: 'EXIF GPS coordinates',
          subtitle: '37.7749, -122.4194',
          evidence_state: 'OBSERVED',
          confidence: 95,
          caseReference: 'CASE-0042',
          timestamp: '14:30:44',
        },
        {
          id: '4',
          type: 'RELATIONSHIP_DISCOVERED',
          title: 'Image → URL correlation',
          subtitle: 'Evidence-backed relationship',
          evidence_state: 'CORROBORATED',
          confidence: 91,
          caseReference: 'CASE-0042',
          timestamp: '14:29:12',
        },
        {
          id: '5',
          type: 'RISK_INDICATOR',
          title: 'IMAGE_REUSE detected',
          subtitle: 'Multiple similar images across cases',
          evidence_state: 'INFERENCE',
          confidence: 78,
          caseReference: 'CASE-0042',
          timestamp: '14:28:04',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getActivityIcon = (type: IntelligenceActivity['type']) => {
    switch (type) {
      case 'IMAGE_ANALYZED': return '🖼️';
      case 'DOMAIN_ANALYZED': return '🌐';
      case 'LOCATION_OBSERVED': return '📍';
      case 'RELATIONSHIP_DISCOVERED': return '🔗';
      case 'RISK_INDICATOR': return '⚠️';
      default: return '📊';
    }
  };

  const getEvidenceStateClass = (state: IntelligenceActivity['evidence_state']) => {
    switch (state) {
      case 'OBSERVED': return 'evidence-state-observed';
      case 'CORROBORATED': return 'evidence-state-corroborated';
      case 'INFERENCE': return 'evidence-state-inference';
      case 'HYPOTHESIS': return 'evidence-state-hypothesis';
      case 'UNKNOWN': return 'evidence-state-unknown';
      default: return 'evidence-state-unknown';
    }
  };

  const getConfidenceClass = (confidence?: number) => {
    if (!confidence) return 'confidence-unknown';
    if (confidence >= 80) return 'confidence-high';
    if (confidence >= 50) return 'confidence-medium';
    return 'confidence-low';
  };

  return (
    <div>
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 3, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 11, margin: 0, letterSpacing: '0.2px' }}>
            Scam Intelligence & Investigation Platform
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 10, 50))}
            disabled={zoom <= 50}
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              cursor: zoom > 50 ? 'pointer' : 'not-allowed',
              opacity: zoom <= 50 ? 0.5 : 1,
            }}
          >
            −
          </button>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', minWidth: 45, textAlign: 'center' }}>
            {zoom}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 10, 200))}
            disabled={zoom >= 200}
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              cursor: zoom < 200 ? 'pointer' : 'not-allowed',
              opacity: zoom >= 200 ? 0.5 : 1,
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(100)}
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-secondary)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Global Intelligence Search Placeholder */}
      <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', transition: 'transform 0.2s ease' }}>
        <div className="scamnet-panel" style={{ marginBottom: 14, padding: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', letterSpacing: '0.4px' }}>SEARCH SCAMNET</span>
          <input
            type="text"
            placeholder="Image, URL, Domain, IP, Email, Phone, Username, Case, Evidence..."
            disabled
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              cursor: 'not-allowed'
            }}
          />
          <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)', letterSpacing: '0.3px' }}>COMING SOON</span>
        </div>
      </div>

      {/* Premium Compact Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
        <div className="metric-card metric-card-compact">
          <div className="metric-label">ACTIVE CASES</div>
          <div className="metric-value">{loading ? '—' : stats.activeCases}</div>
          <div className="metric-subtitle">Open investigations</div>
        </div>

        <div className="metric-card metric-card-compact">
          <div className="metric-label">EVIDENCE</div>
          <div className="metric-value">{loading ? '—' : stats.evidenceItems}</div>
          <div className="metric-subtitle">Preserved items</div>
        </div>

        <div className="metric-card metric-card-compact">
          <div className="metric-label">INTELLIGENCE</div>
          <div className="metric-value">{loading ? '—' : stats.intelligenceJobs}</div>
          <div className="metric-subtitle">Collection jobs</div>
        </div>

        <div className="metric-card metric-card-compact" style={{ borderLeft: '2px solid var(--color-accent-red)' }}>
          <div className="metric-label" style={{ color: 'var(--color-accent-red)' }}>HIGH RISK</div>
          <div className="metric-value" style={{ color: 'var(--color-accent-red)' }}>
            {loading ? '—' : stats.highRiskCases}
          </div>
          <div className="metric-subtitle">Cases flagged</div>
        </div>
      </div>

      {/* Risk Overview Panel */}
      <div className="scamnet-panel" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: 'var(--color-text-primary)', letterSpacing: '0.4px', margin: 0 }}>
          RISK OVERVIEW
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent-red)' }}></span>
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>CRITICAL</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-red)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
              {loading ? '—' : '2'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent-amber)' }}></span>
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>HIGH</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-amber)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
              {loading ? '—' : '5'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent-amber)' }}></span>
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>MODERATE</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-amber)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
              {loading ? '—' : '11'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent-primary)' }}></span>
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>LOW</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-primary)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
              {loading ? '—' : '18'}
            </span>
          </div>
        </div>
      </div>

      {/* Premium Live Intelligence Feed */}
      <div className="scamnet-panel" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '0.4px', margin: 0 }}>
            LIVE INTELLIGENCE
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent-primary)', animation: 'pulse 2s infinite' }}></div>
            <span style={{ fontSize: 9, color: 'var(--color-accent-primary)', letterSpacing: '0.3px' }}>LIVE</span>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 11 }}>
            Loading intelligence feed...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 6,
                  background: 'var(--color-bg-card-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-subtle)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span style={{ fontSize: 11 }}>{getActivityIcon(activity.type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 1 }}>
                    {activity.title}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                    {activity.subtitle}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`evidence-state ${getEvidenceStateClass(activity.evidence_state)}`}>
                    {activity.evidence_state}
                  </span>
                  {activity.confidence && (
                    <span className={`confidence-level ${getConfidenceClass(activity.confidence)}`}>
                      {activity.confidence}%
                    </span>
                  )}
                  <button 
                    className="show-evidence-button"
                    onClick={() => setSelectedEvidence(activity)}
                  >
                    SHOW EVIDENCE
                  </button>
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {activity.caseReference && <span style={{ marginRight: 4 }}>{activity.caseReference}</span>}
                  {activity.timestamp}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Location Intelligence Panel */}
      <div className="scamnet-panel scamnet-panel-cyan" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-cyan)', letterSpacing: '0.4px', margin: 0 }}>
            LOCATION INTELLIGENCE
          </h2>
          <button className="show-evidence-button" style={{ padding: '2px 6px', fontSize: 8 }}>
            SHOW ALL
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, fontSize: 10, color: 'var(--color-text-secondary)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>EXIF GPS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span className="evidence-state evidence-state-observed">OBSERVED</span>
              <span className="confidence-level confidence-high">95%</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              37.7749, -122.4194
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>NETWORK GEO</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span className="evidence-state evidence-state-inference">APPROXIMATE</span>
              <span className="confidence-level confidence-medium">68%</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              United States
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>ASN</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span className="evidence-state evidence-state-observed">OBSERVED</span>
              <span className="confidence-level confidence-high">100%</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              AS15169
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>PUBLIC PROFILE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span className="evidence-state evidence-state-observed">OBSERVED</span>
              <span className="confidence-level confidence-medium">72%</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Location reference
            </div>
          </div>
        </div>
      </div>

      {/* Device Intelligence Panel */}
      <div className="scamnet-panel scamnet-panel-purple" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-purple)', letterSpacing: '0.4px', margin: 0 }}>
            DEVICE INTELLIGENCE
          </h2>
          <button className="show-evidence-button" style={{ padding: '2px 6px', fontSize: 8 }}>
            SHOW ALL
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, fontSize: 10, color: 'var(--color-text-secondary)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>CAMERA</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span className="evidence-state evidence-state-observed">OBSERVED</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Apple iPhone
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>MODEL</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span className="evidence-state evidence-state-observed">OBSERVED</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              iPhone 13 Pro
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>SOFTWARE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span className="evidence-state evidence-state-observed">OBSERVED</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              iOS 16.4
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>DEVICE CLASS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span className="evidence-state evidence-state-inference">INFERRED</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Mobile Device
            </div>
          </div>
        </div>
      </div>

      {/* Premium System Status + Intelligence Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="scamnet-panel">
          <h2 style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: 'var(--color-text-primary)', letterSpacing: '0.4px', margin: 0 }}>
            SYSTEM STATUS
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-status-success)' }}></span>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>API Operational</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-status-success)' }}></span>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Database Connected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-status-success)' }}></span>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Redis Connected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-status-running)' }}></span>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Worker Processing</span>
            </div>
          </div>
        </div>

        <div className="scamnet-panel scamnet-panel-accent">
          <h2 style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: 'var(--color-accent-primary)', letterSpacing: '0.4px', margin: 0 }}>
            SCAMNET INTELLIGENCE
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 10, color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-primary)', fontSize: 8 }}>◆</span>
              <span>Image Intelligence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-primary)', fontSize: 8 }}>◆</span>
              <span>DNS Intelligence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-primary)', fontSize: 8 }}>◆</span>
              <span>RDAP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-primary)', fontSize: 8 }}>◆</span>
              <span>TLS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-primary)', fontSize: 8 }}>◆</span>
              <span>URL Analysis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-primary)', fontSize: 8 }}>◆</span>
              <span>Website Analysis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-cyan)', fontSize: 8 }}>◆</span>
              <span>Location Intelligence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-purple)', fontSize: 8 }}>◆</span>
              <span>Device Intelligence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-primary)', fontSize: 8 }}>◆</span>
              <span>OCR</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-primary)', fontSize: 8 }}>◆</span>
              <span>Image Matching</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-primary)', fontSize: 8 }}>◆</span>
              <span>Origin Analysis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--color-accent-primary)', fontSize: 8 }}>◆</span>
              <span>Evidence Graph</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Evidence Detail Modal */}
      {selectedEvidence && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 10, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div className="scamnet-panel" style={{
            maxWidth: 600,
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '0.4px', margin: 0 }}>
                EVIDENCE DETAIL
              </h3>
              <button
                onClick={() => setSelectedEvidence(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-tertiary)',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span className={`evidence-state ${getEvidenceStateClass(selectedEvidence.evidence_state)}`}>
                {selectedEvidence.evidence_state}
              </span>
              {selectedEvidence.confidence && (
                <span className={`confidence-level ${getConfidenceClass(selectedEvidence.confidence)}`}>
                  {selectedEvidence.confidence}% CONFIDENCE
                </span>
              )}
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>TYPE</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                {selectedEvidence.type}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>TITLE</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-primary)' }}>
                {selectedEvidence.title}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>DETAIL</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                {selectedEvidence.subtitle}
              </div>
            </div>
            {selectedEvidence.caseReference && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>CASE</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {selectedEvidence.caseReference}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>TIMESTAMP</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {selectedEvidence.timestamp}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}