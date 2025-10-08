import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlogPostById, listCategories } from "@/server/queries";

import { PostEditorForm } from "../_components/post-editor-form";

interface PostEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostEditorPage({ params }: PostEditorPageProps) {
  const { id } = await params;
  const [post, categories] = await Promise.all([getBlogPostById(id), listCategories()]);

  if (!post) {
    notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit post</CardTitle>
      </CardHeader>
      <CardContent>
        <PostEditorForm initialData={post} categories={categories} />
      </CardContent>
    </Card>
  );
}
