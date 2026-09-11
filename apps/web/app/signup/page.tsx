'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleApiError } from '../../lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3002/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          organizationName: formData.organizationName || `${formData.name}'s Team`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
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
        maxWidth: 400,
        width: '100%',
        padding: 24,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.4px',
              color: 'var(--color-accent-primary)',
            }}>
              MONARA
            </div>
            <div style={{
              fontSize: 16,
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
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            display: 'inline-block',
            marginBottom: 16,
          }}>
            SCAMNET
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            Create your investigation account
          </div>
        </div>

        {error && (
          <div style={{
            padding: '8px 12px',
            background: 'var(--color-accent-red-subtle)',
            border: '1px solid var(--color-border-red)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-accent-red)',
            fontSize: 10,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: 11,
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
            <label style={{ display: 'block', fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: 11,
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
            <label style={{ display: 'block', fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Team Name (Optional)
            </label>
            <input
              type="text"
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              placeholder="Investigations Team"
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: 11,
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
            <label style={{ display: 'block', fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: 11,
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
            <label style={{ display: 'block', fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: 11,
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
              padding: '10px',
              fontSize: 11,
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
            Already have an account?
          </div>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-accent-primary)',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Sign In
          </button>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>
            DEFENSIVE INTELLIGENCE • EVIDENCE-FIRST ANALYSIS
          </div>
        </div>
      </div>
    </div>
  );
}
