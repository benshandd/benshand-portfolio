import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { TiptapRenderer } from "@/features/renderer/tiptap";
import { getBlogPostById, listCategories } from "@/server/queries";
import { requireAuth } from "@/server/session";

interface PostPreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPreviewPage({ params }: PostPreviewPageProps) {
  await requireAuth(["owner", "editor"]);
  const { id } = await params;
  const post = await getBlogPostById(id);

  if (!post) {
    notFound();
  }

  const categories = await listCategories();
  const category = categories.find((item) => item.id === post.categoryId);
  const isPublished = post.status === "published";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--fg-muted))]">
            <Badge variant="outline">{post.status}</Badge>
            {post.updatedAt ? <span>Last saved {formatDate(post.updatedAt)}</span> : null}
            {post.publishedAt ? <span>Published {formatDate(post.publishedAt)}</span> : null}
          </div>
          <h1 className="text-2xl font-semibold">{post.title}</h1>
          <p className="text-sm text-[hsl(var(--fg-muted))]">{post.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          {isPublished ? (
            <Button asChild variant="outline">
              <Link href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                View live
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost">
            <Link href={`/dashboard/posts/${post.id}`}>Back to editor</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-[hsl(var(--fg-muted))]">
            {category ? <span>{category.name}</span> : null}
            {post.tags?.length ? post.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>) : null}
          </div>
          {post.heroImageUrl ? (
            <Image
              src={post.heroImageUrl}
              alt={post.title}
              width={1440}
              height={720}
              className="w-full rounded-xl border border-[hsl(var(--border))]"
            />
          ) : null}
          <TiptapRenderer content={post.contentJson} />
        </CardContent>
      </Card>
    </div>
  );
}
