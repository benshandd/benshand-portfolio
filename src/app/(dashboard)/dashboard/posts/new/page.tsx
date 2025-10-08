import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCategories } from "@/server/queries";

import { PostEditorForm } from "../_components/post-editor-form";

export default async function NewPostPage() {
  const categories = await listCategories();

  return (
    <Card>
      <CardHeader>
        <CardTitle>New post</CardTitle>
      </CardHeader>
      <CardContent>
        <PostEditorForm initialData={{ contentJson: { blocks: [] } }} categories={categories} />
      </CardContent>
    </Card>
  );
}
