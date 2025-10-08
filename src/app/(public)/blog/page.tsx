import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listBlogPosts, listCategories } from "@/server/queries";

interface BlogPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tag?: string;
  }>;
}

export const revalidate = 60;

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const [posts, categories] = await Promise.all([
    listBlogPosts({
      status: "published",
      query: params.q,
      categorySlug: params.category,
      tag: params.tag,
    }),
    listCategories(),
  ]);

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold">Writing</h1>
        <p className="max-w-2xl text-sm text-[hsl(var(--fg-muted))]">
          Essays and notes on building developer tools, neuroscience-inspired systems, and the craft of teaching.
        </p>
        <form className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto]" method="get">
          <Input
            name="q"
            defaultValue={params.q}
            placeholder="Search posts"
            className="md:col-span-1"
            aria-label="Search posts"
          />
          <select
            name="category"
            defaultValue={params.category ?? ""}
            className="h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <Input name="tag" defaultValue={params.tag} placeholder="Tag" className="md:w-40" aria-label="Filter by tag" />
          <Button type="submit">Apply</Button>
        </form>
      </header>

      <section className="grid gap-6">
        {posts.length === 0 ? <p className="text-sm text-[hsl(var(--fg-muted))]">No posts found.</p> : null}
        {posts.map((post) => (
          <article key={post.id} className="space-y-3 rounded-xl border border-[hsl(var(--border))] p-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--fg-muted))]">
              {post.publishedAt ? <span>{new Date(post.publishedAt).toLocaleDateString()}</span> : null}
              <div className="flex gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Link href={`/blog/${post.slug}`} className="text-2xl font-semibold leading-tight">
              {post.title}
            </Link>
            <p className="text-sm text-[hsl(var(--fg-muted))]">{post.summary}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
