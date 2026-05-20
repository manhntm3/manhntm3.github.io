import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostSlugs } from "@/lib/posts";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-5 py-12 sm:py-16">
      <div className="mb-6 mono text-xs text-[var(--color-dim)]">
        <Link href="/blog" className="no-underline hover:text-[var(--color-fg)]">
          ← blog
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
          {post.title}
        </h1>
        <div className="flex flex-wrap gap-3 mono text-xs text-[var(--color-dim)]">
          <time>{post.date}</time>
          <span>·</span>
          <span>{post.readingTime} min read</span>
          {post.tags && post.tags.length > 0 && (
            <>
              <span>·</span>
              <span>{post.tags.join(", ")}</span>
            </>
          )}
        </div>
      </header>

      <div
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  );
}
