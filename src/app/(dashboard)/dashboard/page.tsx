import { count, eq } from "drizzle-orm";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db/client";
import { blogPosts, books, courses } from "@/db/schema";
import { listBlogPosts } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const [totalPostsResult, publishedPostsResult, totalBooksResult, totalCoursesResult] = await Promise.all([
    db.select({ value: count() }).from(blogPosts),
    db.select({ value: count() }).from(blogPosts).where(eq(blogPosts.status, "published")),
    db.select({ value: count() }).from(books),
    db.select({ value: count() }).from(courses),
  ]);

  const totalPosts = totalPostsResult[0]?.value ?? 0;
  const publishedPosts = publishedPostsResult[0]?.value ?? 0;
  const totalBooks = totalBooksResult[0]?.value ?? 0;
  const totalCourses = totalCoursesResult[0]?.value ?? 0;

  const recentPosts = await listBlogPosts({ pageSize: 5 });

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Posts</CardTitle>
            <CardDescription>Published vs drafts</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {publishedPosts} / {totalPosts}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Library</CardTitle>
            <CardDescription>Books and courses tracked</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {totalBooks} books · {totalCourses} courses
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest updates across posts</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {recentPosts.map((post) => (
              <li key={post.id} className="flex items-center justify-between">
                <span className="font-medium">{post.title}</span>
                <span className="text-[hsl(var(--fg-muted))]">{post.status}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
