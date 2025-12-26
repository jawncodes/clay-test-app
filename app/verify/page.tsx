'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const redirectTo = searchParams.get('redirect') || '/clay-entries';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      router.push(redirectTo);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="container">
        <div className="card">
          <div className="error">Email is required. Please start over.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#333' }}>
          Enter Verification Code
        </h1>

        <p style={{ marginBottom: '1.5rem', color: '#666', textAlign: 'center' }}>
          We sent a 6-digit code to <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              disabled={loading}
              placeholder="000000"
              maxLength={6}
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      </div>
    </div>
  );
}

