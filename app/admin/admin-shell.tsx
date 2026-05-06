'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AdminSession = {
  userId: string;
  email: string;
  isAdmin: boolean;
};

type AdminAuthContextValue = {
  token: string | null;
  session: AdminSession | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const STORAGE_KEY = 'bookmarks-api-token';
const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const tabs = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/bookmarks', label: 'Bookmarks' },
  { href: '/admin/users', label: 'Users' },
];

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminShell');
  }
  return context;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session on mount only
  useEffect(() => {
    let isMounted = true;
    const storedToken = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;

    if (!storedToken) {
      queueMicrotask(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
      return;
    }

    (async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!response.ok) throw new Error('Invalid session');
        const data = (await response.json()) as AdminSession;

        if (!data.isAdmin) throw new Error('Admin required');

        if (isMounted) {
          setToken(storedToken);
          setSession(data);
        }
      } catch {
        if (isMounted && typeof window !== 'undefined') {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setToken(null);
    setSession(null);
    router.push('/');
  };

  const activeTab = tabs.find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`))?.href || '/admin';

  return (
    <AdminAuthContext.Provider value={{ token, session, loading, logout }}>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(245,240,228,0.94)_40%,_rgba(236,229,213,0.99)_100%)] text-black">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="rounded-[28px] border border-black/10 bg-white/75 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">Admin Panel</div>
                <h1 className="text-2xl font-semibold text-black">Bookmarks API administration</h1>
                <p className="mt-1 text-sm text-black/60">Manage every bookmark and user from one place.</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Link href="/" className="rounded-full border border-black/12 px-4 py-2 font-medium text-black transition hover:border-black hover:bg-black hover:text-white">
                  Client app
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-full bg-black px-4 py-2 font-medium text-white transition hover:bg-black/85"
                >
                  Sign out
                </button>
              </div>
            </div>

            <nav className="mt-5 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab.href
                      ? 'bg-black text-white'
                      : 'border border-black/10 bg-white text-black/65 hover:border-black hover:text-black'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </header>

          <div className="flex-1 py-6">
            {loading ? (
              <div className="rounded-[28px] border border-black/10 bg-white/80 px-6 py-14 text-center text-sm text-black/55">
                Loading admin session...
              </div>
            ) : session?.isAdmin ? (
              children
            ) : (
              <div className="rounded-[28px] border border-black/10 bg-white/80 px-6 py-14 text-center">
                <div className="text-lg font-semibold text-black">Admin access required</div>
                <p className="mt-2 text-sm text-black/60">Sign in with an admin account.</p>
                <Link href="/" className="mt-5 inline-flex rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
                  Back to client
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </AdminAuthContext.Provider>
  );
}
