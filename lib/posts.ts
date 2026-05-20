import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description?: string;
  tags?: string[];
};

export type Post = PostMeta & {
  html: string;
  readingTime: number;
};

function ensureDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }
}

export function getAllPosts(): PostMeta[] {
  ensureDir();
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const { data } = matter(raw);
    const slug = file.replace(/\.mdx?$/, "");
    return {
      slug,
      title: String(data.title ?? slug),
      date: String(data.date ?? ""),
      description: data.description ? String(data.description) : undefined,
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
    };
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostSlugs(): string[] {
  ensureDir();
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  ensureDir();
  const candidates = [
    path.join(POSTS_DIR, `${slug}.md`),
    path.join(POSTS_DIR, `${slug}.mdx`),
  ];
  const file = candidates.find((p) => fs.existsSync(p));
  if (!file) return null;

  const raw = fs.readFileSync(file, "utf-8");
  const { data, content } = matter(raw);

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypePrettyCode, {
      theme: "github-dark-dimmed",
      keepBackground: false,
    })
    .use(rehypeStringify);

  const html = String(await processor.process(content));

  const words = content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(words / 200));

  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ""),
    description: data.description ? String(data.description) : undefined,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
    html,
    readingTime,
  };
}
