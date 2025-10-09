import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlogPostById } from "@/server/queries";

import { PostEditorForm } from "../_components/post-editor-form";

interface PostEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostEditorPage({ params }: PostEditorPageProps) {
  const { id } = await params;
  const post = await getBlogPostById(id);

  if (!post) {
    notFound();
  }

  const initialData = {
    ...post,
    heroImageUrl: post.heroImageUrl ?? "",
    tags: post.tags ?? [],
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit post</CardTitle>
      </CardHeader>
      <CardContent>
        <PostEditorForm initialData={initialData} />
      </CardContent>
    </Card>
  );
}
