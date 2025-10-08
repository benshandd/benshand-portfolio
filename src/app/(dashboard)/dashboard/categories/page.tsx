import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import { deleteCategory, upsertCategory } from "@/server/actions/categories";
import { listCategories } from "@/server/queries";

export default async function CategoriesPage() {
  const categories = await listCategories();
  const session = await auth();
  const role = session?.user?.role ?? "viewer";
  const canEdit = role === "owner" || role === "editor";

  async function handleCreate(formData: FormData) {
    "use server";
    if (!canEdit) return;
    const name = formData.get("name");
    const slug = formData.get("slug");
    if (typeof name === "string" && typeof slug === "string") {
      await upsertCategory({ name, slug });
    }
  }

  async function handleDelete(formData: FormData) {
    "use server";
    if (!canEdit) return;
    const id = formData.get("id");
    if (typeof id === "string") {
      await deleteCategory(id);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create category</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="Neuroscience" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" required placeholder="neuroscience" />
              </div>
              <Button type="submit">Create</Button>
            </form>
          ) : (
            <p className="text-sm text-[hsl(var(--fg-muted))]">View-only access.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Existing categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3">
              <div>
                <div className="font-medium">{category.name}</div>
                <div className="text-xs text-[hsl(var(--fg-muted))]">{category.slug}</div>
              </div>
              {canEdit ? (
                <form action={handleDelete}>
                  <input type="hidden" name="id" value={category.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Delete
                  </Button>
                </form>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
