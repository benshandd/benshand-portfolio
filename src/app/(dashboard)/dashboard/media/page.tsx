import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";
import { softDeleteUpload } from "@/server/actions/uploads";
import { listUploads } from "@/server/queries";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const uploads = await listUploads();
  const session = await auth();
  const role = session?.user?.role ?? "viewer";
  const canEdit = role === "owner" || role === "editor";
  const query = params.q?.toLowerCase() ?? "";
  const filtered = query
    ? uploads.filter((upload) => upload.path.toLowerCase().includes(query) && !upload.deleted)
    : uploads.filter((upload) => !upload.deleted);

  async function handleDelete(formData: FormData) {
    "use server";
    if (!canEdit) return;
    const id = formData.get("id");
    if (typeof id === "string") {
      await softDeleteUpload({ id });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <CardTitle>Media library</CardTitle>
        <form className="md:w-64">
          <Input placeholder="Search filename" name="q" defaultValue={query} />
        </form>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((upload) => (
            <div key={upload.id} className="space-y-3 rounded-lg border border-[hsl(var(--border))] p-3">
              {upload.mime.startsWith("image") ? (
                <Image
                  src={upload.publicUrl}
                  alt={upload.path}
                  width={upload.width ?? 400}
                  height={upload.height ?? 300}
                  className="h-40 w-full rounded-md object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-md bg-[hsl(var(--bg-muted))] text-sm">
                  {upload.mime}
                </div>
              )}
              <div className="text-sm font-medium">{upload.path}</div>
              <div className="text-xs text-[hsl(var(--fg-muted))]">{upload.mime}</div>
              <div className="flex items-center gap-2">
                <Input defaultValue={upload.publicUrl} readOnly />
                {canEdit ? (
                  <form action={handleDelete}>
                    <input type="hidden" name="id" value={upload.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Delete
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
