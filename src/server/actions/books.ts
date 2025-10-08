"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { books } from "@/db/schema";
import { enforceRateLimit, resolveServerActionKey } from "@/lib/rate-limit";

import { requireAuth } from "../session";

const bookSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  description: z.string().optional(),
  review: z.string().optional(),
  coverUrl: z.string().url().optional(),
  orderIndex: z.number().int().nonnegative(),
});

export async function upsertBook(input: z.infer<typeof bookSchema>) {
  await requireAuth(["owner", "editor"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  const parsed = bookSchema.parse(input);

  if (parsed.id) {
    await db
      .update(books)
      .set(parsed)
      .where(eq(books.id, parsed.id));
  } else {
    await db.insert(books).values(parsed);
  }

  revalidatePath("/books");
  return { ok: true } as const;
}

const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});

export async function reorderBooks(input: z.infer<typeof reorderSchema>) {
  await requireAuth(["owner", "editor"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  const parsed = reorderSchema.parse(input);

  const existing = await db.select({ id: books.id }).from(books).orderBy(asc(books.orderIndex));

  const idToIndex = new Map(parsed.orderedIds.map((id, index) => [id, index] as const));

  await Promise.all(
    existing.map((book) => {
      const nextOrder = idToIndex.get(book.id);
      if (nextOrder === undefined) return Promise.resolve();
      return db.update(books).set({ orderIndex: nextOrder }).where(eq(books.id, book.id));
    }),
  );

  revalidatePath("/books");
  return { ok: true } as const;
}

export async function deleteBook(id: string) {
  await requireAuth(["owner", "editor"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  await db.delete(books).where(eq(books.id, id));
  revalidatePath("/books");
  return { ok: true } as const;
}
