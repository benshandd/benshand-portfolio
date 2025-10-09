import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PostEditorForm } from "../_components/post-editor-form";

export default async function NewPostPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New post</CardTitle>
      </CardHeader>
      <CardContent>
        <PostEditorForm initialData={{}} />
      </CardContent>
    </Card>
  );
}
