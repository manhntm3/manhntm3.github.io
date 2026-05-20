import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work",
  description: "Professional experience and roles.",
};

type Role = {
  company: string;
  url?: string;
  role: string;
  location?: string;
  dates: string;
  blurb: string;
  highlights: string[];
  stack: string[];
};

const roles: Role[] = [
  {
    company: "Vizgard Ltd",
    url: "https://vizgard.com",
    role: "Founding Software Engineer",
    location: "London, United Kingdom",
    dates: "Jul 2021 – Aug 2024",
    blurb:
      "Joined as one of the earliest engineers and helped take the company from research prototype to a venture-funded computer vision platform. Owned the real-time CV pipeline end-to-end — from camera ingest through model inference to WebRTC delivery.",
    highlights: [
      "Architected an event-driven, lock-free MPMC double-buffer pipeline that hit 6 simultaneous 1080p streams on a single NVIDIA Jetson and 40 streams across 4× Ada RTX 6000.",
      "Cut critical-path latency by ~3× (measured in Nsight Systems / Remotery) by moving CPU stages into custom CUDA kernels with no loss of model accuracy.",
      "Trained and deployed object detection (DETR/YOLO), tracking (SiameseRPN++, DeepSORT), pose estimation (AlphaPose), and face redaction — PyTorch/TensorFlow on GCP, TensorRT in production.",
      "Built the low-latency WebRTC streaming server (GStreamer + Node.js) that delivers HD video to browsers and RTSP endpoints.",
      "Contributed to the company's growth from early prototype to securing over $2.5M in venture funding.",
    ],
    stack: [
      "C++",
      "CUDA",
      "TensorRT",
      "PyTorch",
      "GStreamer",
      "WebRTC",
      "Node.js",
      "Jetson",
      "GCP",
    ],
  },
  {
    company: "VinAI Research",
    role: "Software Research Engineer",
    dates: "Jan 2020 – Jul 2021",
    blurb:
      "Research engineer on the face analytics team at VinAI (later acquired by Qualcomm Research). Focused on the production gap between research models and on-device inference.",
    highlights: [
      "Designed a two-stage infrared anti-spoofing system, achieving < 3% false acceptance rate (FAR).",
      "Optimized the face recognition model via knowledge distillation and network pruning — 4× faster at equivalent accuracy.",
    ],
    stack: ["Python", "PyTorch", "TensorFlow", "Knowledge Distillation", "ONNX"],
  },
];

export default function WorkPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">
        Professional Work
      </h1>
      <p className="text-[var(--color-muted)] mb-12">
        Where I&apos;ve worked, what I shipped, and what I learned doing it.
      </p>

      <div className="relative">
        <div
          aria-hidden
          className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--color-border)]"
        />
        <ol className="space-y-12">
          {roles.map((r) => (
            <li key={r.company} className="relative pl-8">
              <span
                aria-hidden
                className="absolute left-0 top-2 w-[15px] h-[15px] rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-accent)]"
              />

              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                <h2 className="text-xl font-semibold">
                  {r.url ? (
                    <a href={r.url} className="no-underline hover:underline">
                      {r.company}
                    </a>
                  ) : (
                    r.company
                  )}
                </h2>
                <span className="mono text-xs text-[var(--color-dim)]">
                  {r.dates}
                </span>
              </div>
              <p className="text-[var(--color-muted)] mb-1">
                <span className="text-[var(--color-fg)]">{r.role}</span>
                {r.location && (
                  <>
                    {" "}
                    <span className="text-[var(--color-dim)]">·</span>{" "}
                    <span className="mono text-xs">{r.location}</span>
                  </>
                )}
              </p>

              <p className="text-[var(--color-muted)] mt-3 leading-relaxed">
                {r.blurb}
              </p>

              <ul className="mt-4 space-y-2">
                {r.highlights.map((h, i) => (
                  <li
                    key={i}
                    className="text-[var(--color-muted)] leading-relaxed flex gap-2"
                  >
                    <span className="mono text-[var(--color-warm)] shrink-0">
                      →
                    </span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <ul className="mt-5 flex flex-wrap gap-1.5">
                {r.stack.map((s) => (
                  <li
                    key={s}
                    className="mono text-xs px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-dim)]"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
