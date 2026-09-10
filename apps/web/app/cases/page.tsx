'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CaseItem {
  id: string;
  case_number: string;
  name: string;
  description: string | null;
  status: string;
  severity: string;
  priority: string;
  tags: string[];
  created_at: string;
}

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

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  async function fetchCases() {
    const t = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = t ? { Authorization: `Bearer ${t}` } : {};
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3002/api/v1/cases', {
        headers,
      });
      if (res.status === 401) {
        setError('Not authenticated — please login at /login');
        setCases([]);
        return;
      }
      const data = await res.json();
      setCases(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCases();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const t = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const authHeaders: Record<string, string> = t ? { Authorization: `Bearer ${t}` } : {};
    const res = await fetch('http://localhost:3002/api/v1/cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ name: newName, description: newDesc || null, severity: 'MEDIUM', priority: 'MEDIUM' }),
    });
    if (res.ok) {
      setNewName('');
      setNewDesc('');
      fetchCases();
    } else {
      const data = await res.json();
      setError(data.message || 'Failed to create case');
    }
  }

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.case_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesSeverity = filterSeverity === 'ALL' || c.severity === filterSeverity;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const highRiskCases = cases.filter(c => c.severity === 'HIGH' || c.severity === 'CRITICAL').length;
  const openCases = cases.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
          Cases
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
          Tenant-scoped case management with evidence-backed investigation
        </p>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="metric-card">
          <div className="metric-label">TOTAL CASES</div>
          <div className="metric-value">{loading ? '—' : cases.length}</div>
          <div className="metric-subtitle">All cases in organization</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">OPEN CASES</div>
          <div className="metric-value">{loading ? '—' : openCases}</div>
          <div className="metric-subtitle">Active investigations</div>
        </div>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--color-risk-critical)' }}>
          <div className="metric-label" style={{ color: 'var(--color-risk-critical)' }}>HIGH RISK</div>
          <div className="metric-value" style={{ color: 'var(--color-risk-critical)' }}>
            {loading ? '—' : highRiskCases}
          </div>
          <div className="metric-subtitle">Require attention</div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="monara-card" style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px', minWidth: 200 }}>
            <input
              type="text"
              placeholder="Search cases by name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="monara-input"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="monara-select"
            style={{ minWidth: 120 }}
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CLOSED">Closed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="monara-select"
            style={{ minWidth: 120 }}
          >
            <option value="ALL">All Severity</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('ALL');
              setFilterSeverity('ALL');
            }}
            className="monara-button monara-button-ghost"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Create Case Form */}
      <div className="monara-card monara-card-elevated" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>
          Create New Case
        </h3>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px', minWidth: 200 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: 500, 
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.5px'
              }}>
                CASE TITLE
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter case title"
                required
                className="monara-input"
              />
            </div>
            <div style={{ flex: '2 1 300px', minWidth: 250 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: 500, 
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.5px'
              }}>
                DESCRIPTION (OPTIONAL)
              </label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Case description"
                className="monara-input"
              />
            </div>
            <button 
              type="submit" 
              className="monara-button monara-button-primary"
            >
              <span>📁</span>
              Create Case
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="monara-card" style={{ 
          padding: 16, 
          marginBottom: 24, 
          background: 'var(--color-error-subtle)', 
          border: '1px solid var(--color-error)',
          color: 'var(--color-error)'
        }}>
          {error}
        </div>
      )}

      {/* Cases List */}
      {loading ? (
        <div className="monara-card" style={{ padding: 24, textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 20, width: '60%', margin: '0 auto 12px' }}></div>
          <div className="skeleton" style={{ height: 16, width: '40%', margin: '0 auto' }}></div>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="monara-card" style={{ 
          padding: 48, 
          textAlign: 'center',
          border: '1px dashed var(--color-border-default)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            No cases found
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 24 }}>
            {searchTerm || filterStatus !== 'ALL' || filterSeverity !== 'ALL' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first case to begin investigation'}
          </div>
          {!searchTerm && filterStatus === 'ALL' && filterSeverity === 'ALL' && (
            <button 
              onClick={() => setNewName('')}
              className="monara-button monara-button-primary"
            >
              <span>➕</span>
              Create First Case
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredCases.map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="monara-card" style={{ 
                padding: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all var(--transition-normal)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: 15, 
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.5px'
                    }}>
                      {c.case_number}
                    </span>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: 15, 
                      color: 'var(--color-text-primary)' 
                    }}>
                      —
                    </span>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: 15, 
                      color: 'var(--color-text-primary)' 
                    }}>
                      {c.name}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {getStatusBadge(c.status)}
                    {getSeverityBadge(c.severity)}
                    {getPriorityBadge(c.priority)}
                    {c.tags.length > 0 && (
                      c.tags.map((tag) => (
                        <span key={tag} style={{ 
                          padding: '2px 8px', 
                          borderRadius: 4, 
                          fontSize: 11, 
                          fontWeight: 500,
                          background: 'var(--color-accent-primary-subtle)', 
                          color: 'var(--color-accent-primary)'
                        }}>
                          {tag}
                        </span>
                      ))
                    )}
                    <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                      • {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {c.description && (
                    <div style={{ 
                      fontSize: 13, 
                      color: 'var(--color-text-secondary)', 
                      lineHeight: 1.4,
                      maxWidth: 600
                    }}>
                      {c.description}
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  padding: '8px 16px', 
                  background: 'var(--color-bg-card-elevated)', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: 12, 
                  color: 'var(--color-accent-primary)', 
                  fontWeight: 500,
                  marginLeft: 16,
                  border: '1px solid var(--color-border-default)'
                }}>
                  View →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}