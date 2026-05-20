import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts().slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-5 py-14 sm:py-20">
      {/* Header — name, role, affiliation */}
      <header className="mb-14 sm:mb-16">
        <div className="flex items-start gap-5 sm:gap-7">
          <Monogram />
          <div className="min-w-0">
            <h1 className="serif text-[2.25rem] sm:text-[2.6rem] font-medium tracking-tight leading-[1.1]">
              Martin Nguyen
            </h1>
            <p className="mt-1 text-[var(--color-muted)]">
              M.S. Computer Science,{" "}
              <span className="text-[var(--color-fg)]">
                University of Illinois at Chicago
              </span>
            </p>
            <p className="mt-0.5 text-[var(--color-muted)] text-[0.95rem]">
              Software engineer · GPU & systems performance
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 mono text-[12px] text-[var(--color-dim)]">
              <li>
                <a href="mailto:manhntm3@gmail.com">manhntm3@gmail.com</a>
              </li>
              <li>
                <a href="https://github.com/manhntm3">github</a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/manhntm3/">linkedin</a>
              </li>
              <li>
                <Link href="/cv" className="no-underline hover:underline">
                  cv
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Bio — prose, no shell prompt */}
      <section className="mb-16">
        <h2 className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)] mb-4">
          About
        </h2>
        <div className="serif space-y-4 text-[var(--color-fg)]/85 text-[1.05rem] leading-[1.75] max-w-[64ch]">
          <p>
            I&apos;m a software engineer with a system-oriented mindset and a
            focus on performance. My work sits at the intersection of{" "}
            <span className="text-[var(--color-fg)]">low-level systems</span>,{" "}
            <span className="text-[var(--color-fg)]">GPU programming</span>,
            and{" "}
            <span className="text-[var(--color-fg)]">machine learning</span> —
            building runtimes, kernels, and event-driven pipelines that hold
            up under real workloads.
          </p>
          <p>
            Before UIC I was a founding engineer at{" "}
            <Link href="/work" className="no-underline hover:underline">
              Vizgard
            </Link>
            {" "}in London, where I led the design of a real-time computer
            vision pipeline serving dozens of HD camera streams on a single
            box, and earlier did research engineering at{" "}
            <span className="text-[var(--color-fg)]">VinAI Research</span>{" "}
            (since acquired by Qualcomm) on efficient face analytics models.
          </p>
          <p>
            I&apos;m currently a graduate student at UIC, working on
            Transformer inference and GPU memory consistency.
          </p>
        </div>
      </section>

      {/* Research / Engineering Interests */}
      <section className="mb-16">
        <h2 className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)] mb-5">
          Research & Engineering Interests
        </h2>
        <ul className="space-y-3 text-[var(--color-muted)] leading-relaxed max-w-[64ch]">
          <Interest title="High-performance GPU inference">
            Custom CUDA / Triton kernels, paged attention, weak memory models,
            and the boring-but-essential work of profiling traces until they
            tell you the truth.
          </Interest>
          <Interest title="Real-time ML systems">
            Lock-free pipelines, event-driven architectures, and the latency
            ceiling that separates a demo from a deployed product.
          </Interest>
          <Interest title="Kernel-level networking">
            eBPF / XDP for in-kernel packet processing and the kinds of
            policies that are too hot for userspace.
          </Interest>
          <Interest title="Generative & multimodal models">
            LLM / VLM serving, distillation, quantization — making large
            models fit where they otherwise wouldn&apos;t.
          </Interest>
        </ul>
      </section>

      {/* Selected Work */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Selected Work
          </h2>
          <Link
            href="/projects"
            className="mono text-[11px] text-[var(--color-dim)] hover:text-[var(--color-fg)] no-underline"
          >
            all projects →
          </Link>
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          <SelectedItem
            href="/projects/blackhole"
            title="Black Hole Raymarcher"
            meta="WebGPU · WGSL · 2025"
            body="A real-time gravitational-lensing renderer that integrates the Schwarzschild geodesic ODE per pixel — entirely in a WebGPU fragment shader, with a procedural accretion disk and HDR star map."
          />
          <SelectedItem
            href="https://github.com/manhntm3/CS554FinalProject"
            external
            title="Weak Memory Behavior on GPUs"
            meta="PTX · CUDA · 2025"
            body="An empirical study of NVIDIA's weak memory model — characterizing the synchronization primitives needed for correctness under contention, and the performance cost of getting them right."
          />
          <SelectedItem
            href="https://github.com/manhntm3/cs594-sp25-ebpf"
            external
            title="Dynamic eBPF Firewall for DDoS Mitigation"
            meta="Rust · eBPF / XDP · 2025"
            body="An XDP-attached firewall written in Rust with hot-reloadable rules, used to study trade-offs between in-kernel filtering and userspace policy engines."
          />
        </ul>
      </section>

      {/* Recent Writing */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Recent Writing
          </h2>
          <Link
            href="/blog"
            className="mono text-[11px] text-[var(--color-dim)] hover:text-[var(--color-fg)] no-underline"
          >
            all posts →
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="mono text-sm text-[var(--color-dim)]">
            No posts yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group block py-3 no-underline"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <span className="text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors">
                      {p.title}
                    </span>
                    <time className="mono text-[11px] text-[var(--color-dim)] shrink-0">
                      {p.date}
                    </time>
                  </div>
                  {p.description && (
                    <p className="text-[var(--color-muted)] text-[0.95rem] mt-1 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Contact */}
      <section className="pt-8 border-t border-[var(--color-border)]">
        <h2 className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)] mb-3">
          Contact
        </h2>
        <p className="text-[var(--color-muted)] max-w-[64ch] leading-relaxed">
          Best reached by email at{" "}
          <a href="mailto:manhntm3@gmail.com">manhntm3@gmail.com</a>. For
          collaboration, code, or research conversations — open issues or
          DMs are welcome.
        </p>
      </section>
    </div>
  );
}

function Monogram() {
  return (
    <div
      aria-hidden
      className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-[var(--color-border)] grid place-items-center mono text-[var(--color-muted)] tracking-tight"
      style={{
        background:
          "radial-gradient(circle at 30% 25%, color-mix(in oklab, var(--color-accent) 18%, transparent), transparent 60%), var(--color-bg-elev)",
      }}
    >
      <span className="text-base sm:text-lg">MN</span>
    </div>
  );
}

function Interest({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="leading-relaxed">
      <span className="text-[var(--color-fg)]">{title}.</span>{" "}
      <span>{children}</span>
    </li>
  );
}

function SelectedItem({
  title,
  meta,
  body,
  href,
  external,
}: {
  title: string;
  meta: string;
  body: string;
  href: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
        <h3 className="text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors font-medium">
          {title}
        </h3>
        <span className="mono text-[11px] text-[var(--color-dim)]">
          {meta} {external ? "↗" : "→"}
        </span>
      </div>
      <p className="text-[var(--color-muted)] text-[0.95rem] leading-relaxed">
        {body}
      </p>
    </>
  );
  if (external) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className="group block py-4 no-underline"
        >
          {inner}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link href={href} className="group block py-4 no-underline">
        {inner}
      </Link>
    </li>
  );
}
