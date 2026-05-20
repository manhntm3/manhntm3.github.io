export type Project = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  href: string;
  external?: boolean;
  featured?: boolean;
  accent?: "warm" | "cool" | "violet";
};

export const projects: Project[] = [
  {
    slug: "blackhole",
    name: "WebGPU Black Hole",
    tagline:
      "Real-time gravitational lensing in your browser, in WGSL.",
    description:
      "A from-scratch black hole raymarcher built on WebGPU. Per-pixel geodesic integration of the Schwarzschild metric, a procedural accretion disk with relativistic Doppler/beaming, and an HDR star field — all in a single compute-driven fragment shader.",
    tags: ["WebGPU", "WGSL", "Raymarching", "TypeScript"],
    href: "/projects/blackhole",
    featured: true,
    accent: "violet",
  },
  {
    slug: "weak-memory-gpu",
    name: "Weak Memory Behavior on GPUs",
    tagline: "Mapping the wild side of NVIDIA's memory model.",
    description:
      "Investigated weak memory consistency on NVIDIA GPUs using PTX and CUDA — identifying synchronization patterns that improve kernel reliability and performance under contention.",
    tags: ["PTX", "CUDA", "C++", "Memory Models"],
    href: "https://github.com/manhntm3/CS554FinalProject",
    external: true,
    accent: "cool",
  },
  {
    slug: "ebpf-firewall",
    name: "Dynamic eBPF Firewall",
    tagline: "DDoS mitigation in the Linux kernel, written in Rust.",
    description:
      "An eBPF-based network firewall in Rust that filters and rate-limits traffic in the kernel data path. Real-time IP filtering, hot-reloadable rules, and XDP fast-path attach.",
    tags: ["eBPF", "Rust", "XDP", "Linux"],
    href: "https://github.com/manhntm3/cs594-sp25-ebpf",
    external: true,
    accent: "warm",
  },
  {
    slug: "conversation-agent",
    name: "Conversational Agent on AWS Bedrock",
    tagline: "Distributed LLM training and serving on AWS.",
    description:
      "A distributed LLM training pipeline using Apache Spark, paired with RESTful and gRPC servers in Scala/Go for cloud integration. EC2 routes requests through Lambda to Bedrock, powering an agent built on LLaMA.",
    tags: ["AWS", "Spark", "Scala", "Go", "gRPC", "LLaMA"],
    href: "https://github.com/manhntm3/ConversationAgent",
    external: true,
    accent: "cool",
  },
];
