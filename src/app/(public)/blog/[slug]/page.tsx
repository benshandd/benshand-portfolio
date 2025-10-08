import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { EditorRenderer } from "@/components/editor/renderer";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { getAdjacentPosts, getBlogPostBySlug, listCategories } from "@/server/queries";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post || post.status !== "published") {
    return {
      title: "Post not found",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  const url = `${siteUrl}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      url,
      images: post.heroImageUrl ? [{ url: post.heroImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: post.heroImageUrl ? [post.heroImageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post || post.status !== "published") {
    notFound();
  }

  const [categories, adjacent] = await Promise.all([
    listCategories(),
    getAdjacentPosts(post.id),
  ]);

  const category = categories.find((category) => category.id === post.categoryId);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    image: post.heroImageUrl,
    author: {
      "@type": "Person",
      name: siteConfig.name,
    },
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.publishedAt ?? undefined,
    url: `${siteUrl}/blog/${post.slug}`,
  };

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-wide text-[hsl(var(--fg-muted))]">
          {category ? <span>{category.name}</span> : null}
          {post.publishedAt ? <span>{formatDate(post.publishedAt)}</span> : null}
          {post.readingTimeMinutes ? <span>{post.readingTimeMinutes} min read</span> : null}
        </div>
        <h1 className="text-4xl font-semibold leading-tight text-balance">{post.title}</h1>
        <p className="text-base text-[hsl(var(--fg-muted))]">{post.summary}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      </header>

      {post.heroImageUrl ? (
        <Image
          src={post.heroImageUrl}
          alt={post.title}
          width={1440}
          height={720}
          className="w-full rounded-2xl border border-[hsl(var(--border))]"
        />
      ) : null}

      <EditorRenderer content={post.contentJson} />

      <nav className="flex flex-col gap-4 border-t border-[hsl(var(--border))] pt-6 text-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          {adjacent.previous ? (
            <Link href={`/blog/${adjacent.previous.slug}`} className="text-[hsl(var(--brand))] hover:underline">
              ← {adjacent.previous.title}
            </Link>
          ) : (
            <span />
          )}
          {adjacent.next ? (
            <Link href={`/blog/${adjacent.next.slug}`} className="text-[hsl(var(--brand))] hover:underline">
              {adjacent.next.title} →
            </Link>
          ) : null}
        </div>
      </nav>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
