'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  openCases: number;
  activeInvestigations: number;
  evidenceCollected: number;
  intelligenceJobs: number;
  highRiskCases: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    openCases: 0,
    activeInvestigations: 0,
    evidenceCollected: 0,
    intelligenceJobs: 0,
    highRiskCases: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading stats from API
    setTimeout(() => {
      setStats({
        openCases: 12,
        activeInvestigations: 8,
        evidenceCollected: 156,
        intelligenceJobs: 34,
        highRiskCases: 3,
      });
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
          Scam Intelligence & Investigation Platform Overview
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="metric-card">
          <div className="metric-label">OPEN CASES</div>
          <div className="metric-value">{loading ? '—' : stats.openCases}</div>
          <div className="metric-subtitle">Active investigations</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">EVIDENCE COLLECTED</div>
          <div className="metric-value">{loading ? '—' : stats.evidenceCollected}</div>
          <div className="metric-subtitle">Evidence items preserved</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">INTELLIGENCE JOBS</div>
          <div className="metric-value">{loading ? '—' : stats.intelligenceJobs}</div>
          <div className="metric-subtitle">Safe collection runs</div>
        </div>

        <div className="metric-card" style={{ borderLeft: '3px solid var(--color-risk-critical)' }}>
          <div className="metric-label" style={{ color: 'var(--color-risk-critical)' }}>HIGH RISK CASES</div>
          <div className="metric-value" style={{ color: 'var(--color-risk-critical)' }}>
            {loading ? '—' : stats.highRiskCases}
          </div>
          <div className="metric-subtitle">Require attention</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="monara-card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>
            Recent Cases
          </h2>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: 24, textAlign: 'center' }}>
            Case data will appear here after database migration
          </div>
        </div>

        <div className="monara-card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>
            System Status
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }}></span>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>API v1 — Operational</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }}></span>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Database — Connected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }}></span>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Redis — Connected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-warning)' }}></span>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Worker — Idle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 3 Features */}
      <div className="monara-card monara-card-accent" style={{ marginTop: 24, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--color-accent-primary)' }}>
          Phase 3 Intelligence Features Available
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔍</span>
            <span>DNS Intelligence</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🌐</span>
            <span>RDAP Registration</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <span>TLS Certificate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔗</span>
            <span>URL Analysis</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📄</span>
            <span>Website Metadata</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🛡️</span>
            <span>SSRF Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
}