import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-24 sm:py-32 text-center">
      <p className="mono text-xs text-[var(--color-dim)] mb-3">
        $ ls /this/path
      </p>
      <h1 className="text-4xl font-semibold tracking-tight mb-4">
        404 — not here
      </h1>
      <p className="text-[var(--color-muted)] mb-8">
        The page you&apos;re looking for has fallen past the event horizon.
      </p>
      <Link
        href="/"
        className="mono text-sm border border-[var(--color-border)] rounded px-3 py-2 hover:border-[var(--color-accent)] no-underline"
      >
        ← back home
      </Link>
    </div>
  );
}
