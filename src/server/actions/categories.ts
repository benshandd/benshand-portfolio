"use server";

import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { blogCategories, blogPosts } from "@/db/schema";
import { slugify } from "@/lib/utils";
import { enforceRateLimit, resolveServerActionKey } from "@/lib/rate-limit";

import { requireAuth } from "../session";

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
});

export async function upsertCategory(input: z.infer<typeof categorySchema>) {
  await requireAuth(["owner", "editor"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  const parsed = categorySchema.parse(input);
  const normalizedSlug = slugify(parsed.slug);

  if (parsed.id) {
    await db
      .update(blogCategories)
      .set({ name: parsed.name, slug: normalizedSlug })
      .where(eq(blogCategories.id, parsed.id));
  } else {
    await db.insert(blogCategories).values({ name: parsed.name, slug: normalizedSlug });
  }

  revalidatePath("/blog");
  return { ok: true } as const;
}

export async function deleteCategory(id: string, fallbackCategoryId?: string) {
  await requireAuth(["owner", "editor"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });

  const [{ value: postCount }] = await db
    .select({ value: count() })
    .from(blogPosts)
    .where(eq(blogPosts.categoryId, id));

  if (postCount > 0 && !fallbackCategoryId) {
    throw new Error("Cannot delete category with posts without fallback assignment");
  }

  if (postCount > 0 && fallbackCategoryId) {
    await db
      .update(blogPosts)
      .set({ categoryId: fallbackCategoryId })
      .where(eq(blogPosts.categoryId, id));
  }

  await db.delete(blogCategories).where(eq(blogCategories.id, id));

  revalidatePath("/blog");
  return { ok: true } as const;
}
