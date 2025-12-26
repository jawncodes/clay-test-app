'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/clay-entries';

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/verify?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`);
      }, 1000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#333' }}>
          Login
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || success}
              placeholder="Enter your email"
            />
          </div>

          {error && <div className="error">{error}</div>}
          {success && (
            <div className="success">
              OTP code sent! Check your email (and console logs in development).
              Redirecting...
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || success}
          >
            {loading ? 'Sending Code...' : 'Send Login Code'}
          </button>
        </form>

        <div className="text-center mt-2">
          <p style={{ color: '#666' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

