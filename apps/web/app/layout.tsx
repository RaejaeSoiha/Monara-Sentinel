import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monara Sentinel - Scam Intelligence & Investigation Platform',
  description: 'Defensive scam-intelligence and fraud-investigation platform with evidence-first analysis',
};

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊', available: true },
  { href: '/cases', label: 'Cases', icon: '📁', available: true },
  { href: '/investigations', label: 'Investigations', icon: '🔍', available: true },
  { href: '/evidence', label: 'Evidence', icon: '📋', available: true },
  { href: '/graph', label: 'Graph', icon: '🔗', available: true },
  { href: '/timeline', label: 'Timeline', icon: '📅', available: true },
  { href: '/reports', label: 'Reports', icon: '📄', available: false },
  { href: '/monitoring', label: 'Monitoring', icon: '📡', available: false },
  { href: '/settings', label: 'Settings', icon: '⚙️', available: true },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg-app)' }}>
          {/* Top Bar */}
          <header
            style={{
              background: 'var(--color-bg-sidebar)',
              color: 'var(--color-text-primary)',
              padding: '0 24px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-border-subtle)',
              position: 'sticky',
              top: 0,
              zIndex: 'var(--z-sticky)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  fontSize: 18, 
                  fontWeight: 700, 
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-intelligence))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  MONARA
                </div>
                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 400, 
                  color: 'var(--color-text-secondary)',
                  letterSpacing: '2px'
                }}>
                  SENTINEL
                </div>
                <span
                  style={{
                    background: 'var(--color-accent-primary-dim)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    color: 'var(--color-accent-primary)',
                  }}
                >
                  PHASE 3
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Defensive Intelligence Platform</div>
              <nav style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                <Link href="/login" style={{ color: 'var(--color-accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
                  Login
                </Link>
              </nav>
            </div>
          </header>

          <div style={{ display: 'flex', flex: 1 }}>
            {/* Sidebar */}
            <aside
              style={{
                width: 240,
                background: 'var(--color-bg-sidebar)',
                borderRight: '1px solid var(--color-border-subtle)',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: '56px',
                height: 'calc(100vh - 56px)',
                overflowY: 'auto',
              }}
            >
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 12, fontWeight: 600, letterSpacing: '1px', paddingLeft: 8 }}>
                INVESTIGATION
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      color: item.available ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                      background: item.available ? 'transparent' : 'var(--color-bg-card)',
                      fontSize: 13,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all var(--transition-fast)',
                      border: '1px solid transparent',
                    }}
                    className="nav-item"
                  >
                    <span style={{ fontSize: 16, opacity: item.available ? 1 : 0.5 }}>{item.icon}</span>
                    <span>{item.label}</span>
                    {!item.available && <span style={{ fontSize: 10, marginLeft: 'auto', color: 'var(--color-text-muted)' }}>SOON</span>}
                  </Link>
                ))}
              </nav>

              <div
                style={{
                  marginTop: 'auto',
                  padding: 12,
                  background: 'var(--color-bg-card)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 11,
                  color: 'var(--color-text-tertiary)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Environment</div>
                <div>Development</div>
                <div style={{ marginTop: 8, fontSize: 10, color: 'var(--color-text-muted)' }}>v0.1.0 • Phase 3</div>
              </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                {children}
              </div>
            </main>
          </div>

          {/* Footer */}
          <footer
            style={{
              padding: '12px 24px',
              fontSize: 11,
              color: 'var(--color-text-tertiary)',
              borderTop: '1px solid var(--color-border-subtle)',
              background: 'var(--color-bg-sidebar)',
              textAlign: 'center',
            }}
          >
            Monara Sentinel — Evidence-first defensive intelligence. No fabricated conclusions.
          </footer>
        </div>
      </body>
    </html>
  );
}
