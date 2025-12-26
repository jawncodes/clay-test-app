'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Entry {
  id: number;
  name: string;
  email: string;
  phone_number: string | null;
  job_title: string | null;
  company_size: string | null;
  budget: string | null;
  enrichment_status: 'pending' | 'queued' | 'enriched';
  enriched_at: string | null;
  enrichment_data: any | null;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function EntriesClient({ user }: { user: User }) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enriching, setEnriching] = useState(false);
  const [enrichingEntryId, setEnrichingEntryId] = useState<number | null>(null);
  const [clearingEnrichmentId, setClearingEnrichmentId] = useState<number | null>(null);
  const [enrichMessage, setEnrichMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    job_title: '',
    company_size: '',
    budget: '',
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/entries');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch entries');
      }
      const data = await response.json();
      setEntries(data.entries);
    } catch (err) {
      setError('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      job_title: '',
      company_size: '',
      budget: '',
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name,
      email: entry.email,
      phone_number: entry.phone_number || '',
      job_title: entry.job_title || '',
      company_size: entry.company_size || '',
      budget: entry.budget || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingEntry ? `/api/entries/${editingEntry.id}` : '/api/entries';
      const method = editingEntry ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save entry');
      }

      resetForm();
      fetchEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to save entry');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      fetchEntries();
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleEnrichAll = async () => {
    setEnriching(true);
    setEnrichMessage('');
    setError('');

    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setEnrichMessage(data.error || 'Failed to enrich entries');
        return;
      }

      setEnrichMessage(data.message || 'Entries queued for enrichment successfully!');
      fetchEntries(); // Refresh entries to show updated enrichment status
    } catch (err) {
      setEnrichMessage('An error occurred. Please try again.');
    } finally {
      setEnriching(false);
    }
  };

  const handleEnrichEntry = async (entryId: number) => {
    setEnrichingEntryId(entryId);
    setEnrichMessage('');
    setError('');

    try {
      const response = await fetch(`/api/entries/${entryId}/enrich`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setEnrichMessage(data.error || 'Failed to enrich entry');
        return;
      }

      setEnrichMessage('Entry queued for enrichment successfully!');
      fetchEntries(); // Refresh entries to show updated enrichment status
    } catch (err) {
      setEnrichMessage('An error occurred. Please try again.');
    } finally {
      setEnrichingEntryId(null);
    }
  };

  const handleClearEnrichment = async (entryId: number) => {
    if (!window.confirm('Are you sure you want to clear the enrichment data for this entry? It will reset to pending status.')) {
      return;
    }

    setClearingEnrichmentId(entryId);
    setEnrichMessage('');
    setError('');

    try {
      const response = await fetch(`/api/entries/${entryId}/clear-enrichment`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setEnrichMessage(data.error || 'Failed to clear enrichment data');
        return;
      }

      setEnrichMessage('Enrichment data cleared successfully!');
      fetchEntries(); // Refresh entries to show updated enrichment status
    } catch (err) {
      setEnrichMessage('An error occurred. Please try again.');
    } finally {
      setClearingEnrichmentId(null);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ color: '#333', marginBottom: '0.5rem' }}>User Entries</h1>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Welcome, {user.name}!</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleEnrichAll}
              className="btn btn-secondary"
              disabled={enriching}
              style={{ 
                background: enriching ? '#ccc' : undefined,
                cursor: enriching ? 'not-allowed' : 'pointer'
              }}
            >
              {enriching ? 'Enriching...' : 'Enrich All Entries'}
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="btn btn-secondary"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>

        {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {enrichMessage && (
          <div className={enrichMessage.includes('successfully') ? 'success' : 'error'} style={{ marginBottom: '1rem' }}>
            {enrichMessage}
          </div>
        )}

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '2rem' }}
          >
            Add New Entry
          </button>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <h2 style={{ marginBottom: '1rem', color: '#333' }}>
              {editingEntry ? 'Edit Entry' : 'New Entry'}
            </h2>

            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number</label>
              <input
                type="tel"
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="job_title">Job Title</label>
              <input
                type="text"
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="company_size">Company Size</label>
              <input
                type="text"
                id="company_size"
                value={formData.company_size}
                onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                placeholder="e.g., 1-10, 11-50, 51-200, etc."
              />
            </div>

            <div className="form-group">
              <label htmlFor="budget">Budget</label>
              <input
                type="text"
                id="budget"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g., $10k-$50k, $50k-$100k, etc."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
              >
                {editingEntry ? 'Update Entry' : 'Create Entry'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Loading entries...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No entries yet. Click &quot;Add New Entry&quot; to get started!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: '1.5rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{entry.name}</h3>
                    <p style={{ margin: '0 0 0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                      <strong>Email:</strong> {entry.email}
                    </p>
                    {entry.phone_number && (
                      <p style={{ margin: '0 0 0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                        <strong>Phone:</strong> {entry.phone_number}
                      </p>
                    )}
                    {entry.job_title && (
                      <p style={{ margin: '0 0 0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                        <strong>Job Title:</strong> {entry.job_title}
                      </p>
                    )}
                    {entry.company_size && (
                      <p style={{ margin: '0 0 0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                        <strong>Company Size:</strong> {entry.company_size}
                      </p>
                    )}
                    {entry.budget && (
                      <p style={{ margin: '0 0 0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                        <strong>Budget:</strong> {entry.budget}
                      </p>
                    )}
                    <div style={{ margin: '0.5rem 0 0 0', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, color: '#999', fontSize: '0.8rem' }}>
                        Created: {new Date(entry.created_at).toLocaleString()}
                      </p>
                      {(entry.enrichment_status === 'pending' || !entry.enrichment_status) && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          background: '#6c757d',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          ⏸️ Pending Enrichment
                        </span>
                      )}
                      {entry.enrichment_status === 'queued' && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          background: '#ffc107',
                          color: '#333',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          ⏳ Queued for Enrichment
                        </span>
                      )}
                      {entry.enrichment_status === 'enriched' && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          background: '#28a745',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          ✓ Enriched {entry.enriched_at ? `(${new Date(entry.enriched_at).toLocaleDateString()})` : ''}
                        </span>
                      )}
                    </div>
                    {entry.enrichment_status === 'enriched' && entry.enrichment_data && (
                      <details style={{ marginTop: '1rem', cursor: 'pointer' }}>
                        <summary style={{ 
                          color: '#667eea', 
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          padding: '0.5rem',
                          background: '#f0f0f0',
                          borderRadius: '4px'
                        }}>
                          View Enrichment Data
                        </summary>
                        <pre style={{
                          marginTop: '0.5rem',
                          padding: '1rem',
                          background: '#f8f9fa',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          maxHeight: '300px',
                          border: '1px solid #e0e0e0'
                        }}>
                          {JSON.stringify(entry.enrichment_data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(entry.enrichment_status === 'pending' || !entry.enrichment_status) && (
                      <button
                        onClick={() => handleEnrichEntry(entry.id)}
                        className="btn btn-secondary"
                        disabled={enrichingEntryId === entry.id}
                        style={{ 
                          padding: '0.5rem 1rem', 
                          fontSize: '0.875rem',
                          background: enrichingEntryId === entry.id ? '#ccc' : undefined,
                          cursor: enrichingEntryId === entry.id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {enrichingEntryId === entry.id ? 'Enriching...' : 'Enrich User'}
                      </button>
                    )}
                    {(entry.enrichment_status === 'enriched' || entry.enrichment_status === 'queued') && (
                      <button
                        onClick={() => handleClearEnrichment(entry.id)}
                        className="btn btn-secondary"
                        disabled={clearingEnrichmentId === entry.id}
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          background: clearingEnrichmentId === entry.id ? '#ccc' : undefined,
                          cursor: clearingEnrichmentId === entry.id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {clearingEnrichmentId === entry.id ? 'Clearing...' : 'Clear Enrichment'}
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(entry)}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="btn btn-danger"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

