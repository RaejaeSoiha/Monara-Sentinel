'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Evidence {
  id: string;
  case_id: string;
  source_url: string | null;
  source_type: string | null;
  source_title: string | null;
  verification_status: string;
  confidence: number;
  sha256: string | null;
  excerpt: string | null;
  created_at: string;
  case?: {
    id: string;
    case_number: string;
    name: string;
  };
}

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  async function fetchEvidence() {
    setLoading(true);
    setError(null);
    try {
      // Get all cases, then evidence for each case
      const casesRes = await fetch('http://localhost:3002/api/v1/cases', { headers });
      if (casesRes.status === 401) {
        setError('Not authenticated — please login at /login');
        setEvidence([]);
        return;
      }
      
      const casesData = await casesRes.json();
      const cases = casesData.items || [];
      
      // Get evidence for each case
      const allEvidence: Evidence[] = [];
      for (const caseItem of cases) {
        const evRes = await fetch(`http://localhost:3002/api/v1/cases/${caseItem.id}/evidence`, { headers });
        if (evRes.ok) {
          const evData = await evRes.json();
          const evItems = Array.isArray(evData) ? evData : (evData.items || []);
          const withCase = evItems.map((ev: Evidence) => ({ ...ev, case: caseItem }));
          allEvidence.push(...withCase);
        }
      }
      
      setEvidence(allEvidence);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvidence();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OBSERVED': return '#0ea5e9';
      case 'VERIFIED': return '#16a34a';
      case 'CORROBORATED': return '#059669';
      case 'INFERENCE': return '#f59e0b';
      case 'HYPOTHESIS': return '#d97706';
      default: return '#64748b';
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Evidence</h1>
      <p style={{ color: '#64748b', marginBottom: 16 }}>
        All collected evidence across your cases. {evidence.length} evidence item(s) total.
      </p>

      <div style={{ marginBottom: 16, padding: 12, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, fontSize: 12, color: '#0369a1' }}>
        <strong>Evidence distinction:</strong> OBSERVED (raw), VERIFIED (checked), CORROBORATED (multiple sources), INFERENCE, HYPOTHESIS, UNKNOWN — never auto-label "scammer".
      </div>

      {error && <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#991b1b', marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>Loading...</div>
      ) : evidence.length === 0 ? (
        <div style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', color: '#64748b' }}>
          No evidence yet. Add evidence from case detail pages. Evidence is immutable and SHA-256 hashed.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {evidence.map((ev) => (
            <Link key={ev.id} href={`/cases/${ev.case_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: getStatusColor(ev.verification_status), background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                    {ev.verification_status}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    {ev.source_type || 'MANUAL'} • {ev.confidence}% confidence
                  </span>
                </div>
                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  {ev.source_title || ev.source_url || 'No source title'}
                </div>
                {ev.excerpt && (
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, background: '#f8fafc', padding: 8, borderRadius: 4 }}>
                    {ev.excerpt.length > 200 ? ev.excerpt.substring(0, 200) + '...' : ev.excerpt}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{ev.case?.case_number} • {ev.case?.name}</span>
                  <span>{new Date(ev.created_at).toLocaleString()}</span>
                </div>
                {ev.sha256 && (
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                    SHA-256: {ev.sha256.slice(0, 16)}...
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
