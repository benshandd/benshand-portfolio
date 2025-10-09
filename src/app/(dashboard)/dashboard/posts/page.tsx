import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { deletePost, duplicatePost } from "@/server/actions/posts";
import { listBlogPosts } from "@/server/queries";

interface PostsPageProps {
  searchParams: Promise<{ status?: "draft" | "published" }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const posts = await listBlogPosts({ status: params.status });
  const session = await auth();
  const role = session?.user?.role ?? "viewer";
  const canEdit = role === "owner" || role === "editor";

  async function handleDuplicate(formData: FormData) {
    "use server";
    if (!canEdit) return;
    const id = formData.get("id");
    if (typeof id === "string") {
      await duplicatePost(id);
    }
  }

  async function handleDelete(formData: FormData) {
    "use server";
    if (role !== "owner") return;
    const id = formData.get("id");
    if (typeof id === "string") {
      await deletePost(id);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Posts</CardTitle>
        {canEdit ? (
          <Button asChild>
            <Link href="/dashboard/posts/new">New post</Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between pb-4 text-sm">
          <div className="space-x-2">
            <Link href="/dashboard/posts" className={params.status ? "text-[hsl(var(--fg-muted))]" : "font-medium"}>
              All
            </Link>
            <Link
              href="/dashboard/posts?status=draft"
              className={params.status === "draft" ? "font-medium" : "text-[hsl(var(--fg-muted))]"}
            >
              Drafts
            </Link>
            <Link
              href="/dashboard/posts?status=published"
              className={params.status === "published" ? "font-medium" : "text-[hsl(var(--fg-muted))]"}
            >
              Published
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="rounded-lg border border-[hsl(var(--border))] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <Link href={`/dashboard/posts/${post.id}`} className="text-lg font-semibold">
                    {post.title}
                  </Link>
                  <p className="text-sm text-[hsl(var(--fg-muted))]">{post.summary}</p>
                  <div className="mt-2 text-xs uppercase tracking-wide text-[hsl(var(--fg-muted))]">{post.status}</div>
                </div>
                <div className="flex gap-2">
                  {post.status === "published" ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                        View live
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/posts/${post.id}/preview`}>
                        Preview
                      </Link>
                    </Button>
                  )}
                  {canEdit ? (
                    <form action={handleDuplicate}>
                      <input type="hidden" name="id" value={post.id} />
                      <Button variant="outline" size="sm" type="submit">
                        Duplicate
                      </Button>
                    </form>
                  ) : null}
                  {role === "owner" ? (
                    <form action={handleDelete}>
                      <input type="hidden" name="id" value={post.id} />
                      <Button variant="destructive" size="sm" type="submit">
                        Delete
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
