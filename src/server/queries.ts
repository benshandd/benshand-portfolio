import { cache } from "react";
import type { SQL } from "drizzle-orm";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  blogCategories,
  blogPosts,
  books,
  courses,
  courseDisciplineEnum,
  profileSettings,
  uploads,
} from "@/db/schema";

interface ListPostsParams {
  page?: number;
  pageSize?: number;
  query?: string;
  categorySlug?: string;
  tag?: string;
  status?: "draft" | "published";
}

export const getProfileSettings = cache(async () => {
  const [settings] = await db.select().from(profileSettings).where(eq(profileSettings.id, 1));
  return settings ?? null;
});

export async function listBlogPosts(params: ListPostsParams = {}) {
  const pageSize = params.pageSize ?? 10;
  const page = params.page ?? 1;

  const conditions: SQL<unknown>[] = [];

  if (params.status) {
    conditions.push(eq(blogPosts.status, params.status));
  }

  if (params.query) {
    const queryValue = params.query;
    const queryCondition = or(
      ilike(blogPosts.title, `%${queryValue}%`),
      ilike(blogPosts.summary, `%${queryValue}%`),
    ) as SQL<unknown>;
    conditions.push(queryCondition);
  }

  if (params.categorySlug) {
    const [category] = await db
      .select({ id: blogCategories.id })
      .from(blogCategories)
      .where(eq(blogCategories.slug, params.categorySlug));
    if (category) {
      conditions.push(eq(blogPosts.categoryId, category.id));
    }
  }

  if (params.tag) {
    conditions.push(sql`${blogPosts.tags} @> ARRAY[${params.tag}]::text[]`);
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const posts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      summary: blogPosts.summary,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      heroImageUrl: blogPosts.heroImageUrl,
      tags: blogPosts.tags,
      updatedAt: blogPosts.updatedAt,
      readingTimeMinutes: blogPosts.readingTimeMinutes,
      categoryId: blogPosts.categoryId,
    })
    .from(blogPosts)
    .where(whereClause)
    .orderBy(desc(blogPosts.updatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return posts;
}

export async function getBlogPostBySlug(slug: string) {
  const [post] = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      summary: blogPosts.summary,
      status: blogPosts.status,
      contentJson: blogPosts.contentJson,
      publishedAt: blogPosts.publishedAt,
      heroImageUrl: blogPosts.heroImageUrl,
      tags: blogPosts.tags,
      readingTimeMinutes: blogPosts.readingTimeMinutes,
      categoryId: blogPosts.categoryId,
    })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug));
  return post ?? null;
}

export async function getBlogPostById(id: string) {
  const [post] = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      summary: blogPosts.summary,
      status: blogPosts.status,
      contentJson: blogPosts.contentJson,
      publishedAt: blogPosts.publishedAt,
      heroImageUrl: blogPosts.heroImageUrl,
      tags: blogPosts.tags,
      readingTimeMinutes: blogPosts.readingTimeMinutes,
      categoryId: blogPosts.categoryId,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.id, id));
  return post ?? null;
}

export async function listCategories() {
  return db.select().from(blogCategories).orderBy(blogCategories.name);
}

export async function listBooks() {
  return db.select().from(books).orderBy(asc(books.orderIndex));
}

export async function listCourses(discipline?: (typeof courseDisciplineEnum.enumValues)[number]) {
  const condition = discipline ? eq(courses.discipline, discipline) : undefined;
  return db.select().from(courses).where(condition).orderBy(desc(courses.createdAt));
}

export async function listUploads() {
  return db.select().from(uploads).orderBy(desc(uploads.createdAt));
}

export async function getAdjacentPosts(postId: string) {
  const [current] = await db
    .select({
      id: blogPosts.id,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.id, postId));

  if (!current?.publishedAt) {
    return { previous: null, next: null } as const;
  }

  const [previous] = await db
    .select({ id: blogPosts.id, slug: blogPosts.slug, title: blogPosts.title })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), sql`${blogPosts.publishedAt} < ${current.publishedAt}`))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(1);

  const [next] = await db
    .select({ id: blogPosts.id, slug: blogPosts.slug, title: blogPosts.title })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), sql`${blogPosts.publishedAt} > ${current.publishedAt}`))
    .orderBy(blogPosts.publishedAt)
    .limit(1);

  return { previous: previous ?? null, next: next ?? null } as const;
}
