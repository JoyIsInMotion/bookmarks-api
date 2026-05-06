'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import type { Bookmark } from '@/lib/types';

type Session = {
  userId: string;
  email: string;
  isAdmin: boolean;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

const STORAGE_KEY = 'bookmarks-api-token';

const emptyPagination: Pagination = {
  page: 1,
  pageSize: 5,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const emptyForm = {
  url: '',
  description: '',
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/75 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="text-[11px] uppercase tracking-[0.28em] text-black/45">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-black">{value}</div>
    </div>
  );
}

export default function BookmarksClient() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password');
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [pagination, setPagination] = useState<Pagination>(emptyPagination);
  const [bookmarksBusy, setBookmarksBusy] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const formSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(STORAGE_KEY);

    if (!storedToken) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const user = (await response.json()) as Session;

        if (!active) {
          return;
        }

        setToken(storedToken);
        setSession(user);
        await loadBookmarks(storedToken, 1);
        setPage(1);
      } catch {
        if (!active) {
          return;
        }

        window.localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setSession(null);
        setBookmarks([]);
        setPagination(emptyPagination);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function loadBookmarks(authToken: string, nextPage: number) {
    setBookmarksBusy(true);
    setBookmarkError(null);

    try {
      const response = await fetch(`/api/bookmarks?page=${nextPage}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.localStorage.removeItem(STORAGE_KEY);
          setToken(null);
          setSession(null);
          setBookmarks([]);
          setPagination(emptyPagination);
        }

        throw new Error(data.error || 'Failed to load bookmarks');
      }

      setBookmarks(data.data);
      setPagination(data.pagination);
      setPage(data.pagination.page);
    } catch (error) {
      setBookmarkError(error instanceof Error ? error.message : 'Failed to load bookmarks');
    } finally {
      setBookmarksBusy(false);
    }
  }

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    setAuthMessage(null);

    const trimmedEmail = email.trim().toLowerCase();

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const nextToken = data.token as string;
      const nextSession = {
        userId: data.userId as string,
        email: trimmedEmail,
        isAdmin: Boolean(data.isAdmin),
      };

      window.localStorage.setItem(STORAGE_KEY, nextToken);
      setToken(nextToken);
      setSession(nextSession);
      setEditingId(null);
      setForm(emptyForm);
      setBookmarks([]);
      setPagination(emptyPagination);
      setPage(1);
      setAuthMessage(mode === 'login' ? 'Welcome back.' : 'Account created.');
      await loadBookmarks(nextToken, 1);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    const currentToken = token;

    if (currentToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
    }

    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setSession(null);
    setBookmarks([]);
    setPagination(emptyPagination);
    setForm(emptyForm);
    setEditingId(null);
    setBookmarkMessage('Signed out.');
  }

  function beginEdit(bookmark: Bookmark) {
    setEditingId(bookmark.id);
    setForm({
      url: bookmark.url,
      description: bookmark.description || '',
    });
    setBookmarkMessage('Editing bookmark.');
    setBookmarkError(null);
    // Scroll the edit form into view and focus the first control
    setTimeout(() => {
      const el = formSectionRef.current;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const first = el.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');
        first?.focus();
      }
    }, 50);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setBookmarkError(null);
    setBookmarkMessage(null);
  }

  async function handleBookmarkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const normalizedUrl = normalizeUrl(form.url);

    if (!normalizedUrl) {
      setBookmarkError('URL is required.');
      return;
    }

    setBookmarkBusy(true);
    setBookmarkError(null);
    setBookmarkMessage(null);

    const description = form.description.trim();
    const shouldEdit = Boolean(editingId);

    try {
      const response = await fetch(shouldEdit ? `/api/bookmarks/${editingId}` : '/api/bookmarks', {
        method: shouldEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: normalizedUrl,
          description: description || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save bookmark');
      }

      const nextPage = shouldEdit ? page : 1;

      setEditingId(null);
      setForm(emptyForm);
      setBookmarkMessage(shouldEdit ? 'Bookmark updated.' : 'Bookmark added.');

      if (!shouldEdit) {
        setPage(1);
      }

      await loadBookmarks(token, nextPage);
    } catch (error) {
      setBookmarkError(error instanceof Error ? error.message : 'Unable to save bookmark');
    } finally {
      setBookmarkBusy(false);
    }
  }

  async function handleDeleteBookmark(bookmarkId: string) {
    if (!token || !window.confirm('Delete this bookmark?')) {
      return;
    }

    const currentPage = page;
    const shouldMoveBack = currentPage > 1 && bookmarks.length === 1;

    setBookmarkBusy(true);
    setBookmarkError(null);

    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete bookmark');
      }

      const nextPage = shouldMoveBack ? currentPage - 1 : currentPage;

      if (editingId === bookmarkId) {
        cancelEdit();
      }

      setBookmarkMessage('Bookmark deleted.');
      await loadBookmarks(token, nextPage);
    } catch (error) {
      setBookmarkError(error instanceof Error ? error.message : 'Unable to delete bookmark');
    } finally {
      setBookmarkBusy(false);
    }
  }

  const showingSession = Boolean(session);
  const currentCount = bookmarks.length;
  const sessionEmail = session?.email || 'Unknown user';

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(245,240,228,0.92)_36%,_rgba(236,229,213,0.98)_100%)] text-black">
      <div className="absolute inset-0 -z-0 bg-[linear-gradient(135deg,rgba(11,15,20,0.03),transparent_40%,rgba(11,15,20,0.04))]" />
      <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-[#d6c29d]/30 blur-3xl" />
      <div className="absolute right-[-7rem] top-[18rem] h-80 w-80 rounded-full bg-[#9fc0d6]/25 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[28px] border border-black/10 bg-white/70 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white shadow-lg shadow-black/15">
              BK
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">Bookmarks Client</div>
              <div className="text-lg font-semibold text-black">Minimal workspace for your saved links</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/docs"
              className="rounded-full border border-black/12 px-4 py-2 font-medium text-black transition hover:border-black hover:bg-black hover:text-white"
            >
              API docs
            </Link>
            {session?.isAdmin ? (
              <Link
                href="/admin"
                className="rounded-full border border-black/12 px-4 py-2 font-medium text-black transition hover:border-black hover:bg-black hover:text-white"
              >
                Admin Panel
              </Link>
            ) : null}
            {showingSession ? (
              <button
                onClick={() => void handleLogout()}
                className="rounded-full bg-black px-4 py-2 font-medium text-white transition hover:bg-black/85"
              >
                Sign out
              </button>
            ) : (
              <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-black/60">
                Sign in to sync bookmarks
              </span>
            )}
          </div>
        </header>

        {!showingSession ? (
          <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-black/70 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                API-authenticated bookmark manager
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-6xl">
                  Keep bookmarks organized without the clutter.
                </h1>
                <p className="max-w-xl text-base leading-7 text-black/65 sm:text-lg">
                  Register, log in, and manage your saved links against the existing Next.js API.
                  The client stores your token locally and only fetches your own data.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/docs"
                  className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85"
                >
                  Open API docs
                </Link>
                <a
                  href="#auth"
                  className="rounded-full border border-black/12 bg-white/70 px-5 py-3 text-sm font-medium text-black transition hover:border-black hover:bg-white"
                >
                  Get started
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Auth" value="JWT" />
                <Stat label="Storage" value="JSON" />
                <Stat label="Items/page" value="5" />
              </div>
            </div>

            <div id="auth" className="rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">Account</div>
                  <h2 className="mt-1 text-2xl font-semibold text-black">
                    {mode === 'login' ? 'Welcome back' : 'Create account'}
                  </h2>
                </div>
                <div className="rounded-full border border-black/10 bg-black/5 p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`rounded-full px-3 py-1.5 transition ${mode === 'login' ? 'bg-black text-white' : 'text-black/55 hover:text-black'}`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`rounded-full px-3 py-1.5 transition ${mode === 'register' ? 'bg-black text-white' : 'text-black/55 hover:text-black'}`}
                  >
                    Register
                  </button>
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-black/70">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none transition placeholder:text-black/30 focus:border-black/30"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-black/70">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none transition placeholder:text-black/30 focus:border-black/30"
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </label>

                {authError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {authError}
                  </div>
                ) : null}

                {authMessage ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {authMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={authBusy}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-4 py-3 font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authBusy ? 'Working...' : mode === 'login' ? 'Login' : 'Register'}
                </button>
              </form>

              <p className="mt-4 text-sm leading-6 text-black/55">
                Try the seeded account with <span className="font-medium text-black">alice@example.com</span> and <span className="font-medium text-black">password</span>.
              </p>
            </div>
          </section>
        ) : (
          <section className="flex-1 py-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Signed in as" value={sessionEmail} />
              <Stat label="Bookmarks" value={String(pagination.total)} />
              <Stat label="Current page" value={String(pagination.page)} />
              <Stat label="Visible now" value={String(currentCount)} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
              <section ref={formSectionRef} className="rounded-[32px] border border-black/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur xl:sticky xl:top-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">
                      {editingId ? 'Edit bookmark' : 'Add bookmark'}
                    </div>
                    <h2 className="mt-1 text-2xl font-semibold text-black">
                      {editingId ? 'Update the saved link' : 'Save a new link'}
                    </h2>
                  </div>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/70 transition hover:border-black hover:text-black"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>

                <div className="mb-4 rounded-2xl border border-black/8 bg-[#fcfbf7] px-4 py-3 text-sm text-black/60">
                  {editingId ? 'You are editing an existing bookmark. Save changes or cancel to return to the list.' : 'Add a bookmark URL and an optional note.'}
                </div>

                <form onSubmit={handleBookmarkSubmit} className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-black/70">URL</span>
                    <input
                      type="url"
                      value={form.url}
                      onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none transition placeholder:text-black/30 focus:border-black/30"
                      placeholder="https://example.com"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-black/70">Description</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      className="min-h-28 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none transition placeholder:text-black/30 focus:border-black/30"
                      placeholder="Optional note about why this link matters"
                    />
                  </label>

                  {bookmarkError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {bookmarkError}
                    </div>
                  ) : null}

                  {bookmarkMessage ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {bookmarkMessage}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={bookmarkBusy}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-4 py-3 font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {bookmarkBusy ? 'Saving...' : editingId ? 'Save changes' : 'Add bookmark'}
                  </button>
                </form>
              </section>

              <section className="min-w-0 rounded-[32px] border border-black/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">Library</div>
                    <h2 className="mt-1 text-2xl font-semibold text-black">Your saved bookmarks</h2>
                  </div>
                  <div className="rounded-full border border-black/10 bg-black/5 px-4 py-2 text-sm text-black/65">
                    Page {pagination.page} of {Math.max(1, pagination.totalPages || 1)}
                  </div>
                </div>

                {bookmarksBusy ? (
                  <div className="rounded-3xl border border-dashed border-black/10 bg-white px-5 py-14 text-center text-sm text-black/55">
                    Loading bookmarks...
                  </div>
                ) : bookmarks.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-black/10 bg-white px-5 py-14 text-center">
                    <div className="text-lg font-semibold text-black">No bookmarks yet</div>
                    <p className="mt-2 text-sm leading-6 text-black/55">
                      Save your first link and it will appear here with edit and delete controls.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookmarks.map((bookmark) => (
                      <article
                        key={bookmark.id}
                        className="overflow-hidden rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-black/55">
                                {getHostname(bookmark.url)}
                              </div>
                              <span className="text-xs uppercase tracking-[0.2em] text-black/35">
                                Saved {formatTimestamp(bookmark.createdAt)}
                              </span>
                            </div>
                            <a
                              href={bookmark.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 block break-words text-base font-semibold leading-7 text-black transition hover:underline"
                            >
                              {bookmark.url}
                            </a>
                            <div className="mt-3 text-sm leading-6 text-black/65">
                              {bookmark.description ? bookmark.description : 'No description added.'}
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2 md:flex-col md:items-end lg:flex-row lg:items-start bookmark-actions">
                            <button
                              type="button"
                              onClick={() => beginEdit(bookmark)}
                              className="rounded-full border border-black/10 px-3 py-2 text-sm font-medium text-black/70 transition hover:border-black hover:text-black"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteBookmark(bookmark.id)}
                              className="rounded-full border border-transparent bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-black/85 disabled:opacity-60"
                              disabled={bookmarkBusy}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => void loadBookmarks(token as string, Math.max(1, page - 1))}
                    disabled={!pagination.hasPreviousPage || bookmarksBusy || !token}
                    className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/70 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <div className="text-sm text-black/45">
                    {pagination.total === 0 ? 'No results yet' : `${pagination.total} total bookmarks`}
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadBookmarks(token as string, page + 1)}
                    disabled={!pagination.hasNextPage || bookmarksBusy || !token}
                    className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/70 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </section>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}