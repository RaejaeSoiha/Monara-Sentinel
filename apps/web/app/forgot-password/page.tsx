'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleApiError } from '../../lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3002/api/v1/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Request failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(handleApiError(err));
      setLoading(false);
    }
  };

  if (success) {
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
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-accent-primary)', marginBottom: 8 }}>
            Check Your Email
          </h2>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            If the email exists, a password reset link has been sent.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="monara-button monara-button-primary"
            style={{ padding: '8px 16px', fontSize: 11 }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

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
            Reset your password
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
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
            style={{ padding: '10px', fontSize: 11, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              fontSize: 10,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
