'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot field
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, website }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sign up failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#333' }}>
          Sign Up
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>

          {/* Honeypot field - hidden from users but visible to bots */}
          <div className="form-group">
            <label htmlFor="website" className="honeypot">Website (leave blank)</label>
            <input
              type="text"
              id="website"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="honeypot"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {error && <div className="error">{error}</div>}
          {success && (
            <div className="success">Account created successfully! Redirecting to login...</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || success}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-2">
          <p style={{ color: '#666' }}>
            Already have an account?{' '}
            <Link href="/login" className="link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

