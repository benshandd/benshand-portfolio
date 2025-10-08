"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { courseDisciplineEnum, courses } from "@/db/schema";
import { enforceRateLimit, resolveServerActionKey } from "@/lib/rate-limit";

import { requireAuth } from "../session";

const courseSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  discipline: z.enum(courseDisciplineEnum.enumValues),
});

export async function upsertCourse(input: z.infer<typeof courseSchema>) {
  await requireAuth(["owner", "editor"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  const parsed = courseSchema.parse(input);
  if (parsed.id) {
    await db.update(courses).set(parsed).where(eq(courses.id, parsed.id));
  } else {
    await db.insert(courses).values(parsed);
  }
  revalidatePath("/courses");
  return { ok: true } as const;
}

export async function deleteCourse(id: string) {
  await requireAuth(["owner", "editor"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  await db.delete(courses).where(eq(courses.id, id));
  revalidatePath("/courses");
  return { ok: true } as const;
}

const csvImportSchema = z.object({
  csv: z.string().min(1, "CSV data is required"),
});

type CourseDiscipline = (typeof courseDisciplineEnum.enumValues)[number];

function parseDiscipline(value: string): CourseDiscipline {
  const normalized = value.trim();
  const match = courseDisciplineEnum.enumValues.find(
    (option) => option.toLowerCase() === normalized.toLowerCase(),
  );
  if (!match) {
    throw new Error(`Unknown discipline: ${value}`);
  }
  return match;
}

export async function importCoursesFromCsv(input: z.infer<typeof csvImportSchema>) {
  await requireAuth(["owner", "editor"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  const { csv } = csvImportSchema.parse(input);

  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one record");
  }

  const [, ...rows] = lines;

  const parsedRows = rows.map((row) => {
    const [code, name, discipline] = row.split(",").map((value) => value.trim());
    if (!code || !name || !discipline) {
      throw new Error(`Invalid row: ${row}`);
    }
    return {
      code,
      name,
      discipline: parseDiscipline(discipline),
    } satisfies Omit<z.infer<typeof courseSchema>, "id">;
  });

  if (!parsedRows.length) {
    throw new Error("No rows parsed from CSV");
  }

  await db.insert(courses).values(parsedRows);
  revalidatePath("/courses");
  return { ok: true, count: parsedRows.length } as const;
}
