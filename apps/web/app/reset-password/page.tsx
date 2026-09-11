'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleApiError } from '../../lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3002/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Password reset failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
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
            Password Reset Successful
          </h2>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            Redirecting to login...
          </p>
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

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            style={{ padding: '8px 16px', fontSize: 11, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a
            href="/login"
            style={{
              fontSize: 10,
              color: 'var(--color-text-tertiary)',
              textDecoration: 'none',
            }}
          >
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
