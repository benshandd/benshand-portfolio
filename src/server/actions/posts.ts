"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { notFound } from "next/navigation";
import readingTime from "reading-time";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import {
  blogPostSnapshots,
  blogPostTags,
  blogPosts,
} from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache";
import { editorContentSchema, type EditorContent } from "@/lib/editor";
import { slugify } from "@/lib/utils";
import { enforceRateLimit, resolveServerActionKey } from "@/lib/rate-limit";

import { requireAuth } from "../session";

const basePostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  summary: z
    .string()
    .max(180, "Summary must be 180 characters or fewer")
    .min(1, "Summary is required"),
  categoryId: z.string().uuid().nullable(),
  tags: z.array(z.string().min(1)).max(20).default([]),
  heroImageUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\//.test(value), {
      message: "Hero image URL must be empty or a valid URL",
    }),
  contentJson: editorContentSchema,
  status: z.enum(["draft", "published"]).default("draft"),
  publishedAt: z.string().datetime().nullable().optional(),
});

const publishRequirementsSchema = basePostSchema.superRefine((data, ctx) => {
  if (data.status === "published") {
    if (!data.categoryId) {
      ctx.addIssue({
        path: ["categoryId"],
        code: z.ZodIssueCode.custom,
        message: "Category is required to publish",
      });
    }
    if (!data.contentJson.blocks.length) {
      ctx.addIssue({
        path: ["contentJson"],
        code: z.ZodIssueCode.custom,
        message: "At least one content block is required",
      });
    }
    if (!data.heroImageUrl) {
      ctx.addIssue({
        path: ["heroImageUrl"],
        code: z.ZodIssueCode.custom,
        message: "Hero image is required to publish",
      });
    }
  }
});

export type UpsertPostInput = z.infer<typeof basePostSchema>;

export async function upsertPost(input: UpsertPostInput) {
  await requireAuth(["owner", "editor"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  const parsed = publishRequirementsSchema.parse(input);

  const normalizedSlug = slugify(parsed.slug);
  const publishedAtValue =
    parsed.status === "published"
      ? parsed.publishedAt
        ? new Date(parsed.publishedAt)
        : new Date()
      : null;

  const readingStats = readingTime(JSON.stringify(parsed.contentJson));

  if (parsed.id) {
    await db
      .update(blogPosts)
      .set({
        title: parsed.title,
        slug: normalizedSlug,
        summary: parsed.summary,
        categoryId: parsed.categoryId ?? null,
        tags: parsed.tags,
        heroImageUrl: parsed.heroImageUrl || null,
        contentJson: parsed.contentJson,
        status: parsed.status,
        publishedAt: publishedAtValue,
        updatedAt: sql`now()`,
        readingTimeMinutes: Math.max(1, Math.round(readingStats.minutes)),
      })
      .where(eq(blogPosts.id, parsed.id));

    await db.delete(blogPostTags).where(eq(blogPostTags.postId, parsed.id));
    if (parsed.tags.length) {
      await db.insert(blogPostTags).values(parsed.tags.map((tag) => ({ postId: parsed.id!, tag })));
    }
  } else {
    const [inserted] = await db
      .insert(blogPosts)
      .values({
        title: parsed.title,
        slug: normalizedSlug,
        summary: parsed.summary,
        categoryId: parsed.categoryId ?? null,
        tags: parsed.tags,
        heroImageUrl: parsed.heroImageUrl || null,
        contentJson: parsed.contentJson,
        status: parsed.status,
        publishedAt: publishedAtValue,
        readingTimeMinutes: Math.max(1, Math.round(readingStats.minutes)),
      })
      .returning({ id: blogPosts.id });

    if (!inserted) {
      throw new Error("Failed to create post");
    }

    if (parsed.tags.length) {
      await db.insert(blogPostTags).values(parsed.tags.map((tag) => ({ postId: inserted.id, tag })));
    }

    parsed.id = inserted.id;
  }

  await persistSnapshot(parsed.id!, parsed.contentJson);

  revalidateTag(CACHE_TAGS.blogList);
  if (parsed.id) {
    revalidateTag(CACHE_TAGS.blogPost(parsed.id));
    revalidatePath(`/blog/${normalizedSlug}`);
  }

  return { ok: true, id: parsed.id! } as const;
}

export async function deletePost(id: string) {
  await requireAuth(["owner"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  revalidateTag(CACHE_TAGS.blogList);
  return { ok: true } as const;
}

export async function duplicatePost(id: string) {
  await requireAuth(["owner", "editor"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id));
  if (!post) {
    notFound();
  }
  const [created] = await db
    .insert(blogPosts)
    .values({
      title: `${post.title} (Copy)`,
      slug: slugify(`${post.slug}-copy-${Date.now()}`),
      summary: post.summary,
      categoryId: post.categoryId,
      tags: post.tags,
      heroImageUrl: post.heroImageUrl,
      contentJson: post.contentJson,
      status: "draft",
      readingTimeMinutes: post.readingTimeMinutes,
    })
    .returning({ id: blogPosts.id });

  if (post.tags.length) {
    await db.insert(blogPostTags).values(post.tags.map((tag) => ({ postId: created.id, tag })));
  }

  await persistSnapshot(created.id, post.contentJson as EditorContent);

  revalidateTag(CACHE_TAGS.blogList);
  return { ok: true, id: created.id } as const;
}

async function persistSnapshot(postId: string, content: EditorContent) {
  await db.insert(blogPostSnapshots).values({ postId, contentJson: content });

  const snapshots = await db
    .select({ id: blogPostSnapshots.id })
    .from(blogPostSnapshots)
    .where(eq(blogPostSnapshots.postId, postId))
    .orderBy(desc(blogPostSnapshots.createdAt));

  if (snapshots.length > 5) {
    const excess = snapshots.slice(5);
    await db
      .delete(blogPostSnapshots)
      .where(inArray(blogPostSnapshots.id, excess.map((snap) => snap.id)));
  }
}
