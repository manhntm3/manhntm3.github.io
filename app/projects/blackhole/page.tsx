import type { Metadata } from "next";
import Link from "next/link";
import BlackHole from "@/components/BlackHole";

export const metadata: Metadata = {
  title: "Black Hole — WebGPU Raymarcher",
  description:
    "A real-time WebGPU black hole raymarcher rendering gravitational lensing per pixel via the Schwarzschild geodesic ODE.",
};

export default function BlackHolePage() {
  return (
    <div>
      <div className="relative w-full h-[100svh] overflow-hidden border-b border-[var(--color-border)]">
        <BlackHole />
      </div>

      <div className="max-w-3xl mx-auto px-5 py-16">
        <div className="mb-2 mono text-xs text-[var(--color-dim)]">
          <Link
            href="/projects"
            className="no-underline hover:text-[var(--color-fg)]"
          >
            ← projects
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          Black Hole, in your browser
        </h1>
        <p className="text-[var(--color-muted)] text-lg leading-relaxed mb-8">
          A real-time raymarcher that integrates the Schwarzschild geodesic ODE
          per pixel — straight through a WebGPU fragment shader. No textures
          baked, no precomputed light maps. Drag to orbit, scroll to zoom.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <Stat label="resolution" value="window × DPR" />
          <Stat label="integrator" value="RK4, adaptive Δφ" />
          <Stat label="steps / ray" value="up to 300 × 8" />
        </div>

        <Section title="How it works">
          <p>
            Light rays follow null geodesics around the black hole. In
            Schwarzschild coordinates, the equation for the inverse radius{" "}
            <code>u = 1/r</code> as a function of orbital angle{" "}
            <code>φ</code> reduces to a clean second-order ODE:
          </p>
          <pre className="my-4">
            <code>{`d²u/dφ² = (3/2) · r_s · u² − u`}</code>
          </pre>
          <p>
            For each pixel, the fragment shader sets up an orbital plane from
            the camera position and ray direction, then RK4-integrates that
            ODE with an adaptive step size — coarser when the ray is far from
            the hole, denser near the photon sphere where bending is steep.
          </p>
          <p>
            Whenever a step crosses the equatorial plane inside the disk band,
            the integrator switches to volumetric marching: sampling a tiled
            noise texture warped by Keplerian angular velocity{" "}
            <code>ω ∝ r^(-3/2)</code>, with a Gaussian vertical profile and a
            radial falloff for the disk density. Beer&apos;s law accumulates
            opacity along the way.
          </p>
          <p>
            Rays that cross the event horizon are swallowed. Rays that escape
            the universe radius (60 r_s) hit an HDR star map (lat/long
            sampled), giving the characteristic Einstein-ring distortion of
            the background as light bends around the hole.
          </p>
        </Section>

        <Section title="WebGPU pipeline">
          <p>
            The whole thing runs as a single fullscreen draw — a 3-vertex
            triangle covering the clip space, with all the heavy work in the
            fragment shader. Uniforms hold the camera frame in viewport form
            (pixel00 origin + ΔW, ΔH per-pixel basis vectors), so the shader
            reconstructs one ray per fragment without ever touching a matrix.
          </p>
          <ul>
            <li>
              <strong>Shader:</strong> WGSL, ~380 lines (
              <Link href="https://github.com/manhntm3" className="no-underline">
                source on github
              </Link>
              )
            </li>
            <li>
              <strong>Bindings:</strong> uniform buffer, stars texture, noise
              texture, two samplers
            </li>
            <li>
              <strong>Camera:</strong> orbit camera in TypeScript with
              latitude/longitude/distance
            </li>
          </ul>
        </Section>

        <Section title="Why I built this">
          <p>
            I&apos;ve been working with CUDA kernels professionally for years
            but had never written a raymarcher from first principles. This
            project was an excuse to: (1) pick up WebGPU and WGSL properly,
            (2) work through general relativity to the point I could actually
            re-derive a ray-tracing ODE, and (3) build something that looks{" "}
            <em>great</em> as a portfolio piece — physics-correct enough to
            satisfy me, fast enough to ship as a webpage.
          </p>
        </Section>

        <div className="mt-10 flex flex-wrap gap-2">
          {[
            "WebGPU",
            "WGSL",
            "TypeScript",
            "RK4",
            "Raymarching",
            "Schwarzschild metric",
            "Volumetric rendering",
          ].map((t) => (
            <span
              key={t}
              className="mono text-xs px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-dim)]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mono text-sm text-[var(--color-muted)] uppercase tracking-wider mb-3">
        {title}
      </h2>
      <div className="prose-custom">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--color-border)] p-3 bg-[var(--color-bg-elev)]">
      <div className="mono text-[10px] uppercase tracking-wider text-[var(--color-dim)]">
        {label}
      </div>
      <div className="mono text-sm mt-1 text-[var(--color-fg)]">{value}</div>
    </div>
  );
}
