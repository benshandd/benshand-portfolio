import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProfileSettings, listBlogPosts, listBooks, listCourses } from "@/server/queries";

export const dynamic = "force-static";

export default async function HomePage() {
  const [settings, posts, books, courses] = await Promise.all([
    getProfileSettings(),
    listBlogPosts({ status: "published", pageSize: 3 }),
    listBooks(),
    listCourses(),
  ]);

  return (
    <div className="space-y-16">
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Badge className="w-fit">Portfolio</Badge>
          <h1 className="text-4xl font-semibold leading-tight text-balance lg:text-5xl">
            {settings?.heroText ?? "Builder, educator, and lifelong learner."}
          </h1>
          <p className="max-w-2xl text-base text-[hsl(var(--fg-muted))]">
            Welcome to my corner of the internet where I document experiments, curate learning resources, and share the
            tools that power my work.
          </p>
          {settings?.contactEmail ? (
            <Button asChild>
              <Link href={`mailto:${settings.contactEmail}`}>Say hello</Link>
            </Button>
          ) : null}
        </div>
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-muted))] p-6 text-sm text-[hsl(var(--fg-muted))]">
          <p className="font-medium text-[hsl(var(--fg))]">Currently exploring</p>
          <ul className="mt-3 space-y-2">
            <li>• Edge-native workflows with Supabase + Vercel</li>
            <li>• Accessible content creation with Editor.js</li>
            <li>• Teaching through long-form writing and courses</li>
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Latest writing</h2>
          <Button asChild variant="ghost">
            <Link href="/blog">View all</Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="space-y-3 rounded-xl border border-[hsl(var(--border))] p-5 transition hover:border-[hsl(var(--brand))]">
              <div className="text-xs uppercase tracking-wide text-[hsl(var(--fg-muted))]">
                {formatDate(post.publishedAt)}
              </div>
              <Link href={`/blog/${post.slug}`} className="text-lg font-semibold leading-tight">
                {post.title}
              </Link>
              <p className="text-sm text-[hsl(var(--fg-muted))] line-clamp-3">{post.summary}</p>
              <div className="flex flex-wrap gap-2 text-xs text-[hsl(var(--fg-muted))]">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-[hsl(var(--bg-muted))] px-2 py-1">
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
          {posts.length === 0 ? (
            <p className="text-sm text-[hsl(var(--fg-muted))]">No published posts yet. Check back soon!</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Bookshelf</h2>
          <ul className="space-y-3">
            {books.slice(0, 4).map((book) => (
              <li key={book.id} className="rounded-lg border border-[hsl(var(--border))] p-4">
                <p className="font-medium">{book.title}</p>
                <p className="text-sm text-[hsl(var(--fg-muted))]">{book.author}</p>
              </li>
            ))}
          </ul>
          <Button asChild variant="ghost">
            <Link href="/books">Browse books</Link>
          </Button>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Course notes</h2>
          <ul className="space-y-3">
            {courses.slice(0, 4).map((course) => (
              <li key={course.id} className="rounded-lg border border-[hsl(var(--border))] p-4">
                <p className="font-medium">{course.name}</p>
                <p className="text-sm text-[hsl(var(--fg-muted))]">
                  {course.code} · {course.discipline}
                </p>
              </li>
            ))}
          </ul>
          <Button asChild variant="ghost">
            <Link href="/courses">Explore courses</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
