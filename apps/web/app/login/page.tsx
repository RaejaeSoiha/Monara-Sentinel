'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleApiError } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3002/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('organization', JSON.stringify(data.organization));

      router.push('/');
    } catch (err) {
      setError(handleApiError(err));
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-app)',
      padding: 20,
    }}>
      <div className="scamnet-panel" style={{
        maxWidth: 450,
        width: '100%',
        padding: 32,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.4px',
              color: 'var(--color-accent-primary)',
            }}>
              MONARA
            </div>
            <div style={{
              fontSize: 22,
              fontWeight: 400,
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.8px'
            }}>
              SENTINEL
            </div>
          </div>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.8px',
            color: 'var(--color-accent-primary)',
            border: '1px solid var(--color-border-accent)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            display: 'inline-block',
            marginBottom: 16,
          }}>
            SCAMNET
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }}>
            Scam Intelligence & Investigation Platform
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--color-accent-red-subtle)',
            border: '1px solid var(--color-border-red)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-accent-red)',
            fontSize: 13,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 500 }}>
              Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: 15,
                outline: 'none',
                transition: 'all var(--transition-fast)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-border-accent)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border-subtle)';
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: 15,
                outline: 'none',
                transition: 'all var(--transition-fast)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-border-accent)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border-subtle)';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="monara-button monara-button-primary"
            style={{
              padding: '14px',
              fontSize: 15,
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            {loading ? 'Authenticating...' : 'Access SCAMNET'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            onClick={() => router.push('/forgot-password')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              fontSize: 13,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Forgot password?
          </button>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
            Don't have an account?
          </div>
          <button
            onClick={() => router.push('/signup')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-accent-primary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Sign Up
          </button>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            DEFENSIVE INTELLIGENCE • EVIDENCE-FIRST ANALYSIS
          </div>
        </div>
      </div>
    </div>
  );
}
