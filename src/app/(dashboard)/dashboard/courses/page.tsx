import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/auth";
import { deleteCourse, importCoursesFromCsv, upsertCourse } from "@/server/actions/courses";
import { listCourses } from "@/server/queries";

export default async function CoursesAdminPage() {
  const courses = await listCourses();
  const session = await auth();
  const role = session?.user?.role ?? "viewer";
  const canEdit = role === "owner" || role === "editor";

  async function handleCreate(formData: FormData) {
    "use server";
    if (!canEdit) return;
    const code = formData.get("code");
    const name = formData.get("name");
    const discipline = formData.get("discipline");
    if (typeof code === "string" && typeof name === "string" && typeof discipline === "string") {
      await upsertCourse({ code, name, discipline: discipline as "Math" | "CS" | "Other" });
    }
  }

  async function handleDelete(formData: FormData) {
    "use server";
    if (!canEdit) return;
    const id = formData.get("id");
    if (typeof id === "string") {
      await deleteCourse(id);
    }
  }

  async function handleImport(formData: FormData) {
    "use server";
    if (!canEdit) return;
    const csv = formData.get("csv");
    if (typeof csv === "string") {
      await importCoursesFromCsv({ csv });
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add course</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discipline">Discipline</Label>
                <select
                  id="discipline"
                  name="discipline"
                  className="h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
                  required
                >
                  <option value="Math">Math</option>
                  <option value="CS">CS</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Button type="submit">Save</Button>
            </form>
          ) : (
            <p className="text-sm text-[hsl(var(--fg-muted))]">View-only access.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bulk import</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <form action={handleImport} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv">CSV data</Label>
                <Textarea id="csv" name="csv" placeholder="code,name,discipline" />
              </div>
              <Button type="submit">Import</Button>
            </form>
          ) : (
            <p className="text-sm text-[hsl(var(--fg-muted))]">Bulk import requires editor access.</p>
          )}
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-4">
              <div>
                <div className="font-medium">{course.name}</div>
                <div className="text-sm text-[hsl(var(--fg-muted))]">{course.code}</div>
                <div className="text-xs uppercase tracking-wide text-[hsl(var(--fg-muted))]">{course.discipline}</div>
              </div>
              {canEdit ? (
                <form action={handleDelete}>
                  <input type="hidden" name="id" value={course.id} />
                  <Button variant="destructive" size="sm" type="submit">
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
