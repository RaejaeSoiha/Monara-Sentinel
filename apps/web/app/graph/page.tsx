'use client';

export default function GraphPage() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
          Investigation Graph
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
          Entity relationship visualization • Evidence-backed connections
        </p>
      </div>

      <div className="monara-card" style={{ 
        padding: 48, 
        textAlign: 'center',
        border: '1px dashed var(--color-border-default)'
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔗</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)' }}>
          Graph Visualization
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
          Access the investigation graph from within a case to visualize entity relationships and evidence connections.
        </p>
        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          Navigate to a case → Open Graph tab
        </div>
      </div>

      <div className="monara-card" style={{ marginTop: 24, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)' }}>
          Planned Graph Features
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🏷️</span>
            <span>Entity nodes by type</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔗</span>
            <span>Relationship edges</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📄</span>
            <span>Evidence linking</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔍</span>
            <span>Interactive exploration</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🎯</span>
            <span>Path tracing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚙️</span>
            <span>Filter controls</span>
          </div>
        </div>
      </div>
    </div>
  );
}