import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { EditorContent } from "@/lib/editor";

export const userRoleEnum = pgEnum("user_role", ["owner", "editor", "viewer"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);
export const courseDisciplineEnum = pgEnum("course_discipline", [
  "Math",
  "CS",
  "Other",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    image: text("image"),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
  }),
);

export const profileSettings = pgTable("profile_settings", {
  id: integer("id").primaryKey().default(1),
  heroText: text("hero_text").notNull(),
  contactEmail: text("contact_email").notNull(),
  socials: jsonb("socials").$type<Record<string, string>>().notNull(),
  resumeUrls: jsonb("resume_urls").$type<Record<string, string>>().notNull(),
  footerContent: text("footer_content"),
  faviconUrl: text("favicon_url"),
  ogImageUrl: text("og_image_url"),
  bannerWarning: text("banner_warning"),
});

export const blogCategories = pgTable(
  "blog_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("blog_categories_slug_unique").on(table.slug),
  }),
);

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    contentJson: jsonb("content_json").$type<EditorContent>().notNull(),
    status: postStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    categoryId: uuid("category_id").references(() => blogCategories.id),
    heroImageUrl: text("hero_image_url"),
    tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readingTimeMinutes: integer("reading_time_minutes"),
  },
  (table) => ({
    slugUnique: uniqueIndex("blog_posts_slug_unique").on(table.slug),
    publishedStatusIdx: index("blog_posts_published_idx")
      .on(table.publishedAt)
      .where(sql`${table.status} = 'published'`),
    tagsGinIdx: index("blog_posts_tags_gin").using("gin", table.tags),
    publishedCheck: check(
      "blog_posts_published_at_check",
      sql`(${table.status} <> 'published') OR (${table.publishedAt} IS NOT NULL)`,
    ),
  }),
);

export const blogPostTags = pgTable(
  "blog_post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.tag] }),
  }),
);

export const blogPostSnapshots = pgTable(
  "blog_post_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    contentJson: jsonb("content_json").$type<EditorContent>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    snapshotPostIdx: index("blog_post_snapshots_post_idx").on(table.postId),
  }),
);

export const books = pgTable(
  "books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    author: text("author").notNull(),
    description: text("description"),
    review: text("review"),
    coverUrl: text("cover_url"),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orderIndexIdx: index("books_order_index_idx").on(table.orderIndex),
  }),
);

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  discipline: courseDisciplineEnum("discipline").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  path: text("path").notNull(),
  publicUrl: text("public_url").notNull(),
  size: integer("size").notNull(),
  mime: text("mime").notNull(),
  width: integer("width"),
  height: integer("height"),
  source: text("source").notNull().default("supabase"),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  deleted: boolean("deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const uploadReferences = pgTable(
  "upload_references",
  {
    uploadId: uuid("upload_id")
      .notNull()
      .references(() => uploads.id, { onDelete: "cascade" }),
    entityTable: text("entity_table").notNull(),
    entityId: uuid("entity_id").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.uploadId, table.entityTable, table.entityId] }),
  }),
);

export const blogCategoryRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogPostRelations = relations(blogPosts, ({ one, many }) => ({
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  tags: many(blogPostTags),
  snapshots: many(blogPostSnapshots),
}));

export const blogPostTagRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id],
  }),
}));

export const blogPostSnapshotRelations = relations(
  blogPostSnapshots,
  ({ one }) => ({
    post: one(blogPosts, {
      fields: [blogPostSnapshots.postId],
      references: [blogPosts.id],
    }),
  }),
);

export const uploadsRelations = relations(uploads, ({ many }) => ({
  references: many(uploadReferences),
}));
