import Link from "next/link";

const links: { href: string; label: string }[] = [
  { href: "/cv", label: "CV" },
  { href: "/work", label: "Work" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
];

export default function Nav() {
  return (
    <header className="border-b border-[var(--color-border)] sticky top-0 z-40 backdrop-blur-md bg-[color-mix(in_oklab,var(--color-bg)_85%,transparent)]">
      <nav className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="mono text-sm tracking-tight text-[var(--color-fg)] hover:text-[var(--color-accent)] no-underline"
        >
          martin<span className="text-[var(--color-accent)]">@</span>nguyen
        </Link>
        <ul className="flex items-center gap-1 sm:gap-2 mono text-[13px]">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="px-2.5 py-1.5 rounded text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-elev)] no-underline transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
