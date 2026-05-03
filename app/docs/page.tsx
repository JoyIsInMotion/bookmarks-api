import Link from 'next/link';

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-3xl border border-black/10 bg-[#0f172a] p-4 text-sm text-[#d1fae5] shadow-[0_10px_30px_rgba(15,23,42,0.14)]">
      <code>{code}</code>
    </pre>
  );
}

function Section({
  title,
  endpoint,
  copy,
  accent,
}: {
  title: string;
  endpoint: string;
  copy: string;
  accent: string;
}) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${accent}`}>
        {title}
      </div>
      <div className="font-mono text-sm text-black/55">{endpoint}</div>
      <p className="mt-3 text-sm leading-6 text-black/65">{copy}</p>
    </div>
  );
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(245,240,228,0.92)_40%,_rgba(236,229,213,0.98)_100%)] text-black">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[28px] border border-black/10 bg-white/75 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">API docs</div>
            <h1 className="text-2xl font-semibold text-black">Bookmarks API reference</h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-black/12 px-4 py-2 font-medium text-black transition hover:border-black hover:bg-black hover:text-white"
            >
              Open client app
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <Section
            title="Auth"
            endpoint="POST /api/auth/register | POST /api/auth/login | GET /api/auth/me | POST /api/auth/logout"
            copy="Register or log in to receive a JWT token, then send it as a Bearer token for authenticated requests."
            accent="bg-emerald-100 text-emerald-900"
          />
          <Section
            title="Bookmarks"
            endpoint="GET /api/bookmarks?page=1 | POST /api/bookmarks | GET /api/bookmarks/[id] | PUT /api/bookmarks/[id] | DELETE /api/bookmarks/[id]"
            copy="Bookmark endpoints are protected and return only the current user's data. Pagination defaults to 5 items per page."
            accent="bg-amber-100 text-amber-900"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">Examples</div>
            <h2 className="mt-1 text-2xl font-semibold text-black">Request shapes</h2>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 text-sm font-medium text-black/70">Register</div>
                <CodeBlock
                  code={`{
  "email": "user@example.com",
  "password": "secure-password"
}`}
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-black/70">Create bookmark</div>
                <CodeBlock
                  code={`{
  "url": "https://example.com",
  "description": "Optional note"
}`}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="text-[11px] uppercase tracking-[0.32em] text-black/45">Response model</div>
            <h2 className="mt-1 text-2xl font-semibold text-black">Bookmark payload</h2>
            <div className="mt-5">
              <CodeBlock
                code={`{
  "id": "bm-1",
  "userId": "user-1",
  "url": "https://example.com",
  "description": "optional",
  "createdAt": "2026-05-03T10:30:15.234Z"
}`}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-black/65">
              The client keeps the token in browser storage so refreshes stay signed in until you sign out or the token expires.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}