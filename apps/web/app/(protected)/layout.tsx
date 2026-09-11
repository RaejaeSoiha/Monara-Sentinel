'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../lib/api';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊', available: true },
  { href: '/cases', label: 'Cases', icon: '📁', available: true },
  { href: '/investigations', label: 'Investigations', icon: '🔍', available: true },
  { href: '/evidence', label: 'Evidence', icon: '📋', available: true },
  { href: '/images', label: 'Images', icon: '🖼️', available: true },
  { href: '/intelligence', label: 'Intelligence', icon: '🧠', available: true },
  { href: '/relationships', label: 'Relationships', icon: '🔗', available: true },
  { href: '/location', label: 'Location', icon: '📍', available: true },
  { href: '/device', label: 'Device', icon: '📱', available: true },
  { href: '/timeline', label: 'Timeline', icon: '📅', available: true },
  { href: '/reports', label: 'Reports', icon: '📊', available: true },
  { href: '/monitoring', label: 'Monitoring', icon: '📡', available: true },
];

const systemItems = [
  { href: '/settings', label: 'Settings', icon: '⚙️', available: true },
];

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string; role?: string; id?: string } | null>(null);
  const [organization, setOrganization] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [organizations, setOrganizations] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const orgData = localStorage.getItem('organization');
    if (token && userData) {
      setUser(JSON.parse(userData));
      if (orgData) {
        setOrganization(JSON.parse(orgData));
      }

      // Load user's organizations
      fetchWithAuth('/organizations')
        .then(res => res.json())
        .then(data => {
          if (data.organizations) {
            setOrganizations(data.organizations);
          }
        })
        .catch(err => console.error('Failed to load organizations:', err));

      // Set up session timeout check
      const checkSessionTimeout = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          const exp = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          const timeUntilExpiry = exp - now;

          if (timeUntilExpiry <= 0) {
            // Token already expired
            handleLogout();
          } else if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
            // Show warning or auto-refresh
            console.warn('Session expiring soon');
          }
        } catch (error) {
          console.error('Failed to check session timeout:', error);
        }
      };

      // Check immediately and then every minute
      checkSessionTimeout();
      const interval = setInterval(checkSessionTimeout, 60 * 1000);

      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
    }
  }, [mounted, user, router]);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    if (token && refreshToken) {
      try {
        await fetchWithAuth('/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    router.push('/login');
  };

  const handleSwitchOrganization = async (orgId: string) => {
    try {
      const response = await fetchWithAuth('/auth/switch-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('organization', JSON.stringify(data.organization));
        setOrganization(data.organization);
        setShowOrgDropdown(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  if (!mounted) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg-app)' }}>
      {/* Premium Minimal Header */}
      <header
        style={{
          background: 'var(--color-bg-sidebar)',
          color: 'var(--color-text-primary)',
          padding: '0 18px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.4px',
              color: 'var(--color-accent-primary)',
            }}>
              MONARA
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 400,
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.8px'
            }}>
              SENTINEL
            </div>
          </div>
          <div style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.8px',
            color: 'var(--color-accent-primary)',
            border: '1px solid var(--color-border-accent)',
            padding: '2px 5px',
            borderRadius: 'var(--radius-sm)',
          }}>
            SCAMNET
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', letterSpacing: '0.4px' }}>
            Scam Intelligence & Investigation
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent-primary)' }}></div>
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>DEV</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-card-elevated)', border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                👤
              </div>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{user.name}</span>
              {user.role === 'superadmin' && (
                <span style={{
                  fontSize: 8,
                  fontWeight: 600,
                  letterSpacing: '0.4px',
                  color: 'var(--color-accent-primary)',
                  border: '1px solid var(--color-border-accent)',
                  padding: '1px 4px',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  PLATFORM OWNER
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 8, borderLeft: '1px solid var(--color-border-subtle)', position: 'relative' }}>
              <div style={{ width: 20, height: 20, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-card-elevated)', border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                👥
              </div>
              <button
                onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: 10,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{organization?.name || 'No Team'}</span>
                <span style={{ fontSize: 8 }}>▼</span>
              </button>

              {showOrgDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  background: 'var(--color-bg-card-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 4,
                  minWidth: 200,
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleSwitchOrganization(org.id)}
                      style={{
                        width: '100%',
                        background: organization?.id === org.id ? 'var(--color-accent-primary-subtle)' : 'transparent',
                        border: organization?.id === org.id ? '1px solid var(--color-border-accent)' : '1px solid transparent',
                        color: organization?.id === org.id ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 10,
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginBottom: 2,
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-tertiary)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 9,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-default)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                e.currentTarget.style.color = 'var(--color-text-tertiary)';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Premium Compact Sidebar */}
        <aside
          style={{
            width: 180,
            background: 'var(--color-bg-sidebar)',
            borderRight: '1px solid var(--color-border-subtle)',
            padding: '10px 6px',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: '44px',
            height: 'calc(100vh - 44px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.8px', paddingLeft: 8 }}>
            INVESTIGATION
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  color: item.available ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                  background: item.available ? 'transparent' : 'var(--color-bg-card)',
                  fontSize: 11,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all var(--transition-fast)',
                  border: '1px solid transparent',
                  position: 'relative',
                }}
                className="nav-item"
              >
                <span style={{ fontSize: 12, opacity: item.available ? 1 : 0.4 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginBottom: 6, marginTop: 16, fontWeight: 600, letterSpacing: '0.8px', paddingLeft: 8 }}>
            SYSTEM
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {systemItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  color: item.available ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                  background: item.available ? 'transparent' : 'var(--color-bg-card)',
                  fontSize: 11,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all var(--transition-fast)',
                  border: '1px solid transparent',
                  position: 'relative',
                }}
                className="nav-item"
              >
                <span style={{ fontSize: 12, opacity: item.available ? 1 : 0.4 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '14px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Premium Footer */}
      <footer
        style={{
          background: 'var(--color-bg-sidebar)',
          borderTop: '1px solid var(--color-border-subtle)',
          padding: '8px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 9,
          color: 'var(--color-text-tertiary)',
        }}
      >
        <div>
          MONARA SENTINEL — SCAMNET • Evidence-first defensive intelligence. SHOW ME THE EVIDENCE.
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <span>v0.1.0</span>
          <span>Phase 3B</span>
        </div>
      </footer>
    </div>
  );
}
