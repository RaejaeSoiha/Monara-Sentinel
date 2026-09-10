'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Logging in...');

    try {
      const res = await fetch('http://localhost:3002/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(`Error: ${data.message || data.error}`);
        return;
      }

      setStatus(`Success! Welcome ${data.user.email}. Token stored (demo).`);
      // In production, store in httpOnly cookie or secure storage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    } catch (err) {
      setStatus(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', background: 'white', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Login</h1>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
        Monara Sentinel — use seeded account <code>test@example.com / TestPassword123!</code>
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="test@example.com"
            style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••••••"
            style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: '10px 16px',
            background: '#0f172a',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Login
        </button>
      </form>

      {status && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: '#f1f5f9',
            borderRadius: 6,
            fontSize: 13,
            wordBreak: 'break-word',
          }}
        >
          {status}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: '#64748b' }}>
        API: <code>POST /api/v1/auth/login</code> — validated with Zod, Argon2id, JWT
      </div>
    </div>
  );
}
