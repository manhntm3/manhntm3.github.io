import type { Metadata } from "next";
import Link from "next/link";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Personal projects and experiments.",
};

const accentMap: Record<string, string> = {
  warm: "var(--color-warm)",
  cool: "var(--color-accent)",
  violet: "var(--color-accent-2)",
};

export default function ProjectsPage() {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <div className="max-w-3xl mx-auto px-5 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Projects</h1>
      <p className="text-[var(--color-muted)] mb-12">
        Side projects and experiments — usually the kind where I&apos;m trying
        to actually understand something instead of just use it.
      </p>

      {featured.length > 0 && (
        <section className="mb-14">
          <h2 className="mono text-sm text-[var(--color-muted)] uppercase tracking-wider mb-5">
            [ featured ]
          </h2>
          <div className="grid gap-6">
            {featured.map((p) => (
              <FeaturedCard
                key={p.slug}
                href={p.href}
                external={p.external}
                accent={accentMap[p.accent ?? "cool"]}
                project={p}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mono text-sm text-[var(--color-muted)] uppercase tracking-wider mb-5">
          [ archive ]
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {rest.map((p) => (
            <li key={p.slug}>
              <ProjectCard
                href={p.href}
                external={p.external}
                accent={accentMap[p.accent ?? "cool"]}
                project={p}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function FeaturedCard({
  project,
  href,
  external,
  accent,
}: {
  project: (typeof projects)[number];
  href: string;
  external?: boolean;
  accent: string;
}) {
  const className =
    "group block relative overflow-hidden rounded-lg border border-[var(--color-border)] hover:border-[var(--color-fg)] transition-colors no-underline p-6 sm:p-7";
  const style = {
    background:
      "radial-gradient(at 30% 0%, color-mix(in oklab, var(--color-accent-2) 14%, transparent), transparent 50%), var(--color-bg-elev)",
  };
  const body = (
    <>
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none"
        style={{
          background:
            "radial-gradient(800px circle at 100% 100%, color-mix(in oklab, var(--color-accent) 25%, transparent), transparent 50%)",
        }}
      />
      <div className="relative">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <span
            className="mono text-[11px] uppercase tracking-wider"
            style={{ color: accent }}
          >
            ▸ live demo
          </span>
          <span className="mono text-xs text-[var(--color-dim)] group-hover:text-[var(--color-fg)] transition-colors">
            {external ? "↗" : "→"}
          </span>
        </div>
        <h3 className="text-2xl font-semibold tracking-tight mb-2">
          {project.name}
        </h3>
        <p className="text-[var(--color-fg)] mb-3">{project.tagline}</p>
        <p className="text-[var(--color-muted)] leading-relaxed mb-5">
          {project.description}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {project.tags.map((t) => (
            <li
              key={t}
              className="mono text-[11px] px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-dim)]"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className={className}
        style={style}
      >
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className={className} style={style}>
      {body}
    </Link>
  );
}

function ProjectCard({
  project,
  href,
  external,
  accent,
}: {
  project: (typeof projects)[number];
  href: string;
  external?: boolean;
  accent: string;
}) {
  const className =
    "group block h-full rounded-lg border border-[var(--color-border)] hover:border-[var(--color-fg)] bg-[var(--color-bg-elev)] p-5 transition-colors no-underline";
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3
          className="font-semibold tracking-tight"
          style={{ color: "var(--color-fg)" }}
        >
          {project.name}
        </h3>
        <span
          className="mono text-xs shrink-0 transition-colors"
          style={{ color: accent }}
        >
          {external ? "↗" : "→"}
        </span>
      </div>
      <p className="text-[var(--color-muted)] text-sm leading-relaxed mb-4 min-h-[2.5em]">
        {project.tagline}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {project.tags.slice(0, 4).map((t) => (
          <li
            key={t}
            className="mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-dim)]"
          >
            {t}
          </li>
        ))}
      </ul>
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener" className={className}>
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
