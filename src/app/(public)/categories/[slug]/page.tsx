import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { listBlogPosts, listCategories } from "@/server/queries";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categories = await listCategories();
  const category = categories.find((category) => category.slug === slug);
  if (!category) {
    notFound();
  }

  const posts = await listBlogPosts({ status: "published", categorySlug: slug });

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">{category.name}</h1>
        <p className="text-sm text-[hsl(var(--fg-muted))]">
          Posts filed under <span className="font-medium">{category.name}</span>.
        </p>
      </header>
      <section className="grid gap-6">
        {posts.length === 0 ? <p className="text-sm text-[hsl(var(--fg-muted))]">No posts yet.</p> : null}
        {posts.map((post) => (
          <article key={post.id} className="space-y-2 rounded-xl border border-[hsl(var(--border))] p-6">
            <Link href={`/blog/${post.slug}`} className="text-xl font-semibold">
              {post.title}
            </Link>
            <p className="text-sm text-[hsl(var(--fg-muted))]">{post.summary}</p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
