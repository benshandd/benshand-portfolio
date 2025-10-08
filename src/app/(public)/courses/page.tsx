import { listCourses } from "@/server/queries";

interface CoursesPageProps {
  searchParams: Promise<{ discipline?: string }>;
}

export const revalidate = 60;

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const discipline = params.discipline as "Math" | "CS" | "Other" | undefined;
  const courses = await listCourses(discipline);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Courses</h1>
            <p className="text-sm text-[hsl(var(--fg-muted))]">
              Notes and resources from classes and workshops I teach or participate in.
            </p>
          </div>
          <form method="get">
            <select
              name="discipline"
              defaultValue={discipline ?? ""}
              className="h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
            >
              <option value="">All disciplines</option>
              <option value="Math">Math</option>
              <option value="CS">CS</option>
              <option value="Other">Other</option>
            </select>
          </form>
        </div>
      </header>
      <section className="grid gap-4">
        {courses.length === 0 ? <p className="text-sm text-[hsl(var(--fg-muted))]">No courses found.</p> : null}
        {courses.map((course) => (
          <article key={course.id} className="rounded-xl border border-[hsl(var(--border))] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{course.name}</h2>
              <span className="text-xs uppercase tracking-wide text-[hsl(var(--fg-muted))]">{course.discipline}</span>
            </div>
            <p className="text-sm text-[hsl(var(--fg-muted))]">{course.code}</p>
            <time className="text-xs text-[hsl(var(--fg-muted))]">
              {new Date(course.createdAt).toLocaleDateString()}
            </time>
          </article>
        ))}
      </section>
    </div>
  );
}
