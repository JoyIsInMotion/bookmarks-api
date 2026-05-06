'use client';

import Link from 'next/link';
import AdminShell, { useAdminAuth } from './admin-shell';

function OverviewContent() {
  const { session } = useAdminAuth();

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">Overview</div>
        <h2 className="mt-1 text-3xl font-semibold text-black">Welcome, {session?.email}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">
          Use the tabs to manage shared bookmarks and user accounts. Bookmark admin actions can target any user,
          and user actions can create or revoke access immediately.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/admin/bookmarks" className="rounded-3xl border border-black/10 bg-white px-5 py-4 transition hover:border-black">
            <div className="text-sm font-semibold text-black">Manage bookmarks</div>
            <div className="mt-1 text-sm text-black/55">View, create, edit, and delete bookmarks across every user.</div>
          </Link>
          <Link href="/admin/users" className="rounded-3xl border border-black/10 bg-white px-5 py-4 transition hover:border-black">
            <div className="text-sm font-semibold text-black">Manage users</div>
            <div className="mt-1 text-sm text-black/55">Create accounts, change admin status, or remove users.</div>
          </Link>
        </div>
      </div>

      <div className="rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">Notes</div>
        <h2 className="mt-1 text-2xl font-semibold text-black">Admin workflow</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-black/65">
          <li>Admin access comes from the `isAdmin` flag in the JSON storage and JWT payload.</li>
          <li>The first admin is created manually in `data/db.json`.</li>
          <li>Client-side navigation to the admin panel appears only after admin login.</li>
        </ul>
      </div>
    </section>
  );
}

export default function AdminPage() {
  return (
    <AdminShell>
      <OverviewContent />
    </AdminShell>
  );
}
