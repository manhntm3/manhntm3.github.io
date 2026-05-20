import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV",
  description: "Martin Nguyen's curriculum vitae.",
};

type Bullet = string;

const experience: {
  role: string;
  org: string;
  location?: string;
  dates: string;
  bullets: Bullet[];
}[] = [
  {
    role: "Founding Software Engineer",
    org: "Vizgard Ltd",
    location: "London, United Kingdom",
    dates: "Jul 2021 – Aug 2024",
    bullets: [
      "Contributed to the company's growth from early prototype to securing over $2.5M in venture funding.",
      "Led the design and development of a real-time computer vision system for surveillance and unmanned system automation. Architected an event-driven, lock-free MPMC double-buffer pipeline to optimize latency and minimize memory locality issues — achieving 6 simultaneous 1080p camera streams on NVIDIA Jetson and 40 streams across 4 NVIDIA Ada RTX 6000.",
      "Built and optimized pipelines for multiple deep learning models, including object detection (DETR/YOLO), object tracking (SiameseRPN++, DeepSORT), pose estimation (AlphaPose), and face redaction. Trained on GCP with PyTorch/TensorFlow; deployed with TensorRT for high-speed inference.",
      "Led performance optimization across the stack (profiling, memory locality, batching, async execution); accelerated critical paths by ~3× (measured in Nsight Systems / Remotery) by moving CPU stages to CUDA kernels without compromising model accuracy.",
      "Developed a low-latency WebRTC streaming server using GStreamer and Node.js to deliver real-time HD video to browsers and RTSP endpoints.",
    ],
  },
  {
    role: "Software Research Engineer",
    org: "VinAI Research (acquired by Qualcomm Research)",
    dates: "Jan 2020 – Jul 2021",
    bullets: [
      "Designed a two-stage infrared anti-spoofing system, achieving < 3% false acceptance rate (FAR).",
      "Improved the face recognition model using knowledge distillation and network optimization — delivering a 4× speed improvement with equivalent accuracy.",
    ],
  },
];

const projects: { name: string; tags: string; desc: string; url?: string }[] = [
  {
    name: "Weak Memory Behavior on GPUs",
    tags: "PTX · CUDA · C++",
    desc: "Investigated weak memory consistency behavior on NVIDIA GPUs using PTX and CUDA, identifying synchronization patterns to improve kernel reliability and performance.",
    url: "https://github.com/manhntm3/CS554FinalProject",
  },
  {
    name: "Dynamic eBPF Firewall for DDoS Mitigation in Rust",
    tags: "eBPF · Rust · Linux Network",
    desc: "Linux kernel module — a dynamic eBPF-based network firewall in Rust to block traffic and mitigate DDoS attacks via real-time IP filtering.",
    url: "https://github.com/manhntm3/cs594-sp25-ebpf",
  },
  {
    name: "Conversational Agent using AWS Bedrock",
    tags: "EC2 · Scala · Go · gRPC · Python · AWS Lambda",
    desc: "Distributed LLM training pipeline using Apache Spark; RESTful and gRPC servers for cloud integration. EC2 routes requests to Lambda and Bedrock, powering an agent built on LLaMA.",
    url: "https://github.com/manhntm3/ConversationAgent",
  },
  {
    name: "WebGPU Black Hole Raymarching",
    tags: "WebGPU · WGSL · TypeScript",
    desc: "Real-time black hole raymarcher in WGSL — accretion disk, gravitational lensing, and a Schwarzschild metric integrated per-pixel. Live demo on this site.",
    url: "/projects/blackhole",
  },
];

const skills: { label: string; items: string }[] = [
  { label: "Languages", items: "C/C++, Python, Java, JavaScript, Scala" },
  { label: "DL accelerators & inference", items: "CUDA, TensorRT, Triton, ONNX, GPU/TPU" },
  { label: "ML/DL frameworks", items: "PyTorch, JAX, TensorFlow, Scikit-Learn" },
  { label: "Systems", items: "Linux, eBPF/XDP, memory models, perf/Remotery/Nsight profiling" },
  { label: "Generative AI / multimodal", items: "LLMs, VLMs, Transformers, HuggingFace, LoRA/QLoRA, RAG" },
  { label: "Databases & big data", items: "MySQL, MongoDB, Redis, Spark, Hadoop" },
  { label: "MLOps", items: "Docker, Kubernetes, Jenkins, AWS, GCP, Azure" },
];

export default function CV() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12 sm:py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
        <h1 className="text-3xl font-semibold tracking-tight">Curriculum Vitae</h1>
        <a
          href="/cv.pdf"
          className="mono text-sm border border-[var(--color-border)] rounded px-3 py-1.5 hover:border-[var(--color-accent)] no-underline"
        >
          download pdf ↓
        </a>
      </div>
      <p className="text-[var(--color-muted)] mb-12">
        A dedicated and results-driven software engineer with a
        system-oriented mindset and expertise in performance engineering.
        Experienced in lock-free concurrency, event-driven architectures,
        kernel-level networking (eBPF), low-level optimization of GPU model
        inference, and GPU memory models.
      </p>

      <Section title="Contact">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 mono text-sm text-[var(--color-muted)]">
          <li>+1 872-294-1416</li>
          <li>
            <a href="mailto:manhntm3@gmail.com">manhntm3@gmail.com</a>
          </li>
          <li>
            github · <a href="https://github.com/manhntm3">manhntm3</a>
          </li>
          <li>
            linkedin · <a href="https://www.linkedin.com/in/manhntm3/">manhntm3</a>
          </li>
          <li>Chicago, IL</li>
        </ul>
      </Section>

      <Section title="Education">
        <Entry
          title="The University of Illinois at Chicago"
          subtitle="M.S. Computer Science · GPA 3.9 / 4.0"
          right="Aug 2024 – May 2026"
        />
        <Entry
          title="FPT University"
          subtitle="B.S. Computer Science · Full-ride scholarship"
          right="Aug 2017 – Aug 2021"
        />
      </Section>

      <Section title="Experience">
        {experience.map((e) => (
          <article key={`${e.org}-${e.dates}`} className="mb-8 last:mb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
              <h3 className="font-medium text-[var(--color-fg)]">
                {e.role} <span className="text-[var(--color-muted)]">· {e.org}</span>
              </h3>
              <span className="mono text-xs text-[var(--color-dim)] shrink-0">
                {e.dates}
              </span>
            </div>
            {e.location && (
              <p className="mono text-xs text-[var(--color-dim)] mb-2">{e.location}</p>
            )}
            <ul className="list-disc pl-5 space-y-1.5 text-[var(--color-muted)] text-[0.95rem] leading-relaxed">
              {e.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </Section>

      <Section title="Projects">
        <ul className="space-y-5">
          {projects.map((p) => (
            <li key={p.name}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                <h3 className="font-medium">
                  {p.url ? <a href={p.url}>{p.name}</a> : p.name}
                </h3>
                <span className="mono text-xs text-[var(--color-dim)]">{p.tags}</span>
              </div>
              <p className="text-[var(--color-muted)] text-[0.95rem] leading-relaxed">
                {p.desc}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Skills">
        <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
          {skills.map((s) => (
            <div
              key={s.label}
              className="contents text-[0.95rem]"
            >
              <dt className="mono text-xs text-[var(--color-dim)] uppercase tracking-wider pt-1">
                {s.label}
              </dt>
              <dd className="text-[var(--color-muted)]">{s.items}</dd>
            </div>
          ))}
        </dl>
      </Section>
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
    <section className="mb-12">
      <h2 className="mono text-sm text-[var(--color-muted)] uppercase tracking-wider mb-5 pb-2 border-b border-[var(--color-border)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Entry({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-medium">{title}</h3>
        {right && <span className="mono text-xs text-[var(--color-dim)]">{right}</span>}
      </div>
      {subtitle && (
        <p className="text-[var(--color-muted)] text-[0.95rem]">{subtitle}</p>
      )}
    </div>
  );
}
