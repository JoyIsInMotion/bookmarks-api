'use client';

import AdminShell, { useAdminAuth } from '../admin-shell';
import { useCallback, useEffect, useState, useRef } from 'react';

type AdminBookmark = {
  id: string;
  userId: string;
  userEmail: string;
  url: string;
  description?: string;
  createdAt: string;
};

type UserOption = {
  id: string;
  email: string;
};

const emptyForm = {
  userId: '',
  url: '',
  description: '',
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./i, '');
  } catch {
    return value;
  }
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function BookmarksContent() {
  const { token, session } = useAdminAuth();
  const [bookmarks, setBookmarks] = useState<AdminBookmark[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const formRef = useRef<HTMLFormElement | null>(null);

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [bookmarksResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/bookmarks?page=1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const bookmarksPayload = await bookmarksResponse.json();
      const usersPayload = await usersResponse.json();

      if (!bookmarksResponse.ok) {
        throw new Error(bookmarksPayload.error || 'Failed to load bookmarks');
      }

      if (!usersResponse.ok) {
        throw new Error(usersPayload.error || 'Failed to load users');
      }

      setBookmarks(bookmarksPayload.data || []);
      setUsers(usersPayload.data || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  function beginEdit(bookmark: AdminBookmark) {
    setEditingId(bookmark.id);
    setForm({
      userId: bookmark.userId,
      url: bookmark.url,
      description: bookmark.description || '',
    });
    setMessage(null);
    setError(null);
    // Scroll the admin edit form into view and focus first control
    setTimeout(() => {
      const el = formRef.current as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const first = el.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');
        first?.focus();
      }
    }, 50);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const payload = {
      userId: form.userId,
      url: normalizeUrl(form.url),
      description: form.description.trim(),
    };

    if (!payload.userId || !payload.url) {
      setError('Select a user and enter a URL.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(editingId ? `/api/admin/bookmarks/${editingId}` : '/api/admin/bookmarks', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save bookmark');
      }

      setMessage(editingId ? 'Bookmark updated.' : 'Bookmark created.');
      resetForm();
      await loadData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to save bookmark');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token || !window.confirm('Delete this bookmark?')) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/bookmarks/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete bookmark');
      }

      if (editingId === id) {
        resetForm();
      }

      setMessage('Bookmark deleted.');
      await loadData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to delete bookmark');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">Bookmarks</div>
            <h2 className="mt-1 text-2xl font-semibold text-black">Manage bookmarks</h2>
            <p className="mt-2 text-sm text-black/60">View, create, edit, and delete bookmarks across every user.</p>
          </div>
          <div className="text-sm text-black/55">{bookmarks.length} bookmarks loaded</div>
        </div>

        {session?.email ? <p className="mt-4 text-xs uppercase tracking-[0.28em] text-black/40">Signed in as {session.email}</p> : null}

        <form ref={formRef} className="mt-6 grid gap-3 rounded-[24px] border border-black/10 bg-white p-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="text-black/55">User</span>
              <select
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                value={form.userId}
                onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm md:col-span-2">
              <span className="text-black/55">URL</span>
              <input
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                value={form.url}
                onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                placeholder="example.com/article"
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="text-black/55">Description</span>
            <textarea
              className="min-h-24 rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Optional note"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {editingId ? 'Update bookmark' : 'Create bookmark'}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black">
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        {loading ? (
          <div className="py-12 text-center text-sm text-black/55">Loading bookmarks...</div>
        ) : bookmarks.length === 0 ? (
          <div className="py-12 text-center text-sm text-black/55">No bookmarks yet.</div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <article key={bookmark.id} className="rounded-[24px] border border-black/10 bg-white px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-black">{getHostname(bookmark.url)}</div>
                    <a href={bookmark.url} target="_blank" rel="noreferrer" className="break-words text-sm text-black/65 underline decoration-black/20 underline-offset-4">
                      {bookmark.url}
                    </a>
                    <p className="mt-2 text-sm text-black/60">{bookmark.description || 'No description'}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.28em] text-black/40">
                      {bookmark.userEmail} · {formatTimestamp(bookmark.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 admin-actions">
                    <button type="button" onClick={() => beginEdit(bookmark)} className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black">
                      Edit
                    </button>
                    <button type="button" onClick={() => void handleDelete(bookmark.id)} className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminBookmarksPage() {
  return (
    <AdminShell>
      <BookmarksContent />
    </AdminShell>
  );
}
