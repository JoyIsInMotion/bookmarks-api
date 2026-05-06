'use client';

import AdminShell, { useAdminAuth } from '../admin-shell';
import { useCallback, useEffect, useState, useRef } from 'react';

type AdminUser = {
  id: string;
  email: string;
  isAdmin: boolean;
};

const emptyForm = {
  email: '',
  password: '',
  isAdmin: false,
};

function UsersContent() {
  const { token, session } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
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
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load users');
      }

      setUsers(payload.data || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load users');
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

  function beginEdit(user: AdminUser) {
    setEditingId(user.id);
    setForm({
      email: user.email,
      password: '',
      isAdmin: user.isAdmin,
    });
    setMessage(null);
    setError(null);
    // Scroll the users edit form into view and focus first control
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

    const payload: Record<string, string | boolean> = {
      email: form.email.trim().toLowerCase(),
      isAdmin: form.isAdmin,
    };

    if (!payload.email) {
      setError('Email is required.');
      return;
    }

    if (!editingId && !form.password.trim()) {
      setError('Password is required for new users.');
      return;
    }

    if (form.password.trim()) {
      payload.password = form.password;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(editingId ? `/api/admin/users/${editingId}` : '/api/admin/users', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user');
      }

      setMessage(editingId ? 'User updated.' : 'User created.');
      resetForm();
      await loadData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token || !window.confirm('Delete this user and their bookmarks?')) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      if (editingId === id) {
        resetForm();
      }

      setMessage('User deleted.');
      await loadData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to delete user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">Users</div>
            <h2 className="mt-1 text-2xl font-semibold text-black">Manage users</h2>
            <p className="mt-2 text-sm text-black/60">Create accounts, change admin status, or remove users.</p>
          </div>
          <div className="text-sm text-black/55">{users.length} users loaded</div>
        </div>

        {session?.email ? <p className="mt-4 text-xs uppercase tracking-[0.28em] text-black/40">Signed in as {session.email}</p> : null}

        <form ref={formRef} className="mt-6 grid gap-3 rounded-[24px] border border-black/10 bg-white p-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-black/55">Email</span>
              <input
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="user@example.com"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-black/55">Password {editingId ? '(optional)' : ''}</span>
              <input
                type="password"
                className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={editingId ? 'Leave blank to keep password' : 'Enter a password'}
              />
            </label>
          </div>
          <label className="flex items-center gap-3 text-sm text-black/70">
            <input
              type="checkbox"
              checked={form.isAdmin}
              onChange={(event) => setForm((current) => ({ ...current, isAdmin: event.target.checked }))}
              className="h-4 w-4 rounded border-black/20"
            />
            Admin access
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {editingId ? 'Update user' : 'Create user'}
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
          <div className="py-12 text-center text-sm text-black/55">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-black/55">No users yet.</div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <article key={user.id} className="rounded-[24px] border border-black/10 bg-white px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-black">{user.email}</div>
                    <p className="mt-1 text-xs uppercase tracking-[0.28em] text-black/40">{user.isAdmin ? 'Admin' : 'Standard user'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 admin-actions">
                    <button type="button" onClick={() => beginEdit(user)} className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black">
                      Edit
                    </button>
                    <button type="button" onClick={() => void handleDelete(user.id)} className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
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

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <UsersContent />
    </AdminShell>
  );
}
