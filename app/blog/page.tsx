import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on GPU programming, systems, and ML engineering.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="max-w-3xl mx-auto px-5 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Blog</h1>
      <p className="text-[var(--color-muted)] mb-12">
        Notes on GPU programming, systems, and ML engineering. Mostly written
        when I&apos;ve finally figured something out.
      </p>

      {posts.length === 0 ? (
        <p className="mono text-sm text-[var(--color-dim)]">
          // no posts yet — first one coming soon.
        </p>
      ) : (
        <ol className="space-y-8">
          {posts.map((p) => (
            <li key={p.slug}>
              <article>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                  <h2 className="text-xl font-semibold tracking-tight">
                    <Link
                      href={`/blog/${p.slug}`}
                      className="no-underline hover:text-[var(--color-accent)]"
                    >
                      {p.title}
                    </Link>
                  </h2>
                  <time className="mono text-xs text-[var(--color-dim)] shrink-0">
                    {p.date}
                  </time>
                </div>
                {p.description && (
                  <p className="text-[var(--color-muted)] leading-relaxed">
                    {p.description}
                  </p>
                )}
                {p.tags && p.tags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <li
                        key={t}
                        className="mono text-[11px] px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-dim)]"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
