'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Investigation {
  id: string;
  case_id: string;
  name: string;
  description: string | null;
  status: string;
  severity: string;
  priority: string;
  created_at: string;
  case?: {
    id: string;
    case_number: string;
    name: string;
  };
}

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  async function fetchInvestigations() {
    setLoading(true);
    setError(null);
    try {
      // First get all cases, then get investigations for each case
      const casesRes = await fetch('http://localhost:3002/api/v1/cases', { headers });
      if (casesRes.status === 401) {
        setError('Not authenticated — please login at /login');
        setInvestigations([]);
        return;
      }
      
      const casesData = await casesRes.json();
      const cases = casesData.items || [];
      
      // Get investigations for each case
      const allInvestigations: Investigation[] = [];
      for (const caseItem of cases) {
        const invRes = await fetch(`http://localhost:3002/api/v1/cases/${caseItem.id}/investigations`, { headers });
        if (invRes.ok) {
          const invData = await invRes.json();
          const invItems = Array.isArray(invData) ? invData : (invData.items || []);
          const withCase = invItems.map((inv: Investigation) => ({ ...inv, case: caseItem }));
          allInvestigations.push(...withCase);
        }
      }
      
      setInvestigations(allInvestigations);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvestigations();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Investigations</h1>
      <p style={{ color: '#64748b', marginBottom: 16 }}>
        All investigations across your cases. {investigations.length} investigation(s) total.
      </p>

      {error && <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#991b1b', marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>Loading...</div>
      ) : investigations.length === 0 ? (
        <div style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', color: '#64748b' }}>
          No investigations yet. Create a case first, then add investigations from the case detail page.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {investigations.map((inv) => (
            <Link key={inv.id} href={`/cases/${inv.case_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{inv.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {inv.case?.case_number} • {inv.case?.name} • {inv.status} • {inv.severity} • {inv.priority} • {new Date(inv.created_at).toLocaleDateString()}
                  </div>
                  {inv.description && <div style={{ fontSize: 13, marginTop: 4 }}>{inv.description}</div>}
                </div>
                <div style={{ fontSize: 12, color: '#2563eb' }}>View Case →</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
