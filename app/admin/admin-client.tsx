'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'flagged' | 'blocked';
  created_at: string;
  enrichment?: any;
}

export default function AdminClient() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/clay-entries');
          return;
        }
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, newStatus: 'active' | 'flagged' | 'blocked') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#28a745';
      case 'flagged':
        return '#ffc107';
      case 'blocked':
        return '#dc3545';
      default:
        return '#666';
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#333' }}>Admin Panel</h1>
          <button
            onClick={() => router.push('/clay-entries')}
            className="btn btn-secondary"
          >
            Back to Entries
          </button>
        </div>

        {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading users...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#666' }}>ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#666' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#666' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#666' }}>Role</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#666' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#666' }}>Created</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#666' }}>Enrichment</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#666' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '1rem' }}>{user.id}</td>
                    <td style={{ padding: '1rem' }}>{user.name}</td>
                    <td style={{ padding: '1rem' }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: user.role === 'admin' ? '#667eea' : '#e0e0e0',
                        color: user.role === 'admin' ? 'white' : '#333',
                        fontSize: '0.875rem',
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: getStatusColor(user.status),
                        color: 'white',
                        fontSize: '0.875rem',
                      }}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {user.enrichment ? (
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ color: '#667eea', fontSize: '0.875rem' }}>
                            View Data
                          </summary>
                          <pre style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            background: '#f8f9fa',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxWidth: '300px',
                            maxHeight: '200px',
                          }}>
                            {JSON.stringify(user.enrichment, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span style={{ color: '#999', fontSize: '0.875rem' }}>No data</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {user.status !== 'flagged' && (
                          <button
                            onClick={() => handleStatusChange(user.id, 'flagged')}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                          >
                            Flag
                          </button>
                        )}
                        {user.status !== 'blocked' && (
                          <button
                            onClick={() => handleStatusChange(user.id, 'blocked')}
                            className="btn btn-danger"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                          >
                            Block
                          </button>
                        )}
                        {user.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(user.id, 'active')}
                            className="btn btn-success"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                          >
                            Unblock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

