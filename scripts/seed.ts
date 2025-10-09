import "dotenv/config";

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import readingTime from "reading-time";

import { db } from "@/db/client";
import {
  blogCategories,
  blogPosts,
  books,
  courses,
  profileSettings,
  users,
} from "@/db/schema";
import { serverEnv } from "@/env/server";
import type { EditorContent } from "@/lib/editor";
import { tiptapContentToPlainText } from "@/lib/tiptap";

async function main() {
  const categories = [
    { slug: "misc", name: "Misc" },
    { slug: "neuroscience", name: "Neuroscience" },
    { slug: "dev-notes", name: "Dev Notes" },
  ];

  for (const category of categories) {
    const existing = await db
      .select({ id: blogCategories.id })
      .from(blogCategories)
      .where(eq(blogCategories.slug, category.slug))
      .limit(1);
    if (!existing.length) {
      await db.insert(blogCategories).values(category);
    }
  }

  const [settings] = await db.select().from(profileSettings).limit(1);
  if (!settings) {
    await db.insert(profileSettings).values({
      heroText: "Hi, I'm Ben — I build developer platforms that stay out of your way.",
      contactEmail: "hello@example.com",
      socials: {
        GitHub: "https://github.com/example",
        LinkedIn: "https://linkedin.com/in/example",
      },
      resumeUrls: {
        PDF: "https://example.com/resume.pdf",
      },
      footerContent: "© " + new Date().getFullYear() + " Ben Shand. All rights reserved.",
    });
  }

  const tiptapPosts: Array<{
    slug: string;
    title: string;
    summary: string;
    categorySlug: string;
    tags: string[];
    heroImageUrl: string;
    content: EditorContent;
    publishedAt: Date;
  }> = [
    {
      slug: "welcome-to-the-portfolio",
      title: "Welcome to the refreshed portfolio",
      summary: "A walk-through of the new stack powering this site and how the blog now runs on Tiptap.",
      categorySlug: "misc",
      tags: ["announcement", "portfolio"],
      heroImageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
      publishedAt: new Date("2024-01-05T10:00:00Z"),
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "A modern foundation" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "The blog now uses Tiptap for authoring and rendering content. Server components handle the public routes while Supabase keeps data in sync.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Expect faster iteration, better formatting tools, and a simpler writing experience overall.",
              },
            ],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Next.js App Router with React Server Components" }] }],
              },
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Supabase Postgres and Storage for content and media" }] }],
              },
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Tiptap providing the writing UI and output JSON" }] }],
              },
            ],
          },
        ],
      },
    },
    {
      slug: "tiptap-authoring-basics",
      title: "Authoring posts with Tiptap",
      summary: "Learn how to format copy, add structure, and publish directly from the new in-dashboard editor.",
      categorySlug: "dev-notes",
      tags: ["tiptap", "editor"],
      heroImageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
      publishedAt: new Date("2024-01-12T09:30:00Z"),
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Start writing immediately using the simplified toolbar. Highlight text to " },
              { type: "text", marks: [{ type: "bold" }], text: "bold" },
              { type: "text", text: " or " },
              { type: "text", marks: [{ type: "italic" }], text: "italicize" },
              { type: "text", text: " important ideas." },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Lists & structure" }],
          },
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Use numbered lists for step-by-step walkthroughs." }] }],
              },
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Switch to bullet lists to collect related ideas." }] }],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Publishing still enforces categories, hero images, and summary limits to keep the front of house tidy.",
              },
            ],
          },
          {
            type: "codeBlock",
            attrs: { language: "tsx" },
            content: [
              {
                type: "text",
                text: `const editor = useEditor({
  extensions: [StarterKit],
  content,
});`,
              },
            ],
          },
        ],
      },
    },
    {
      slug: "neuroscience-reading-list",
      title: "Neuroscience reads that shaped my thinking",
      summary: "Three approachable books that influence how I approach product systems and developer tools.",
      categorySlug: "neuroscience",
      tags: ["books", "learning"],
      heroImageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1600&q=80",
      publishedAt: new Date("2024-01-20T14:15:00Z"),
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A short list of neuroscience books that blend well with developer experience design.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Books worth highlighting" }],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", marks: [{ type: "bold" }], text: "How We Learn" },
                      { type: "text", text: " – solid grounding in spaced repetition, retrieval practice, and generative learning." },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", marks: [{ type: "bold" }], text: "The Brain That Changes Itself" },
                      { type: "text", text: " – neuroplasticity case studies that map nicely to platform adoption journeys." },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      { type: "text", marks: [{ type: "bold" }], text: "Thinking, Fast and Slow" },
                      { type: "text", text: " – decision-making frameworks for prioritising roadmap bets." },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "If you have a recommendation that shaped your own practice, I would love to hear it.",
              },
            ],
          },
        ],
      },
    },
  ];

  for (const post of tiptapPosts) {
    const [category] = await db
      .select({ id: blogCategories.id })
      .from(blogCategories)
      .where(eq(blogCategories.slug, post.categorySlug))
      .limit(1);

    const readingStats = readingTime(tiptapContentToPlainText(post.content));
    const payload = {
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      categoryId: category?.id ?? null,
      tags: post.tags,
      heroImageUrl: post.heroImageUrl,
      contentJson: post.content,
      status: "published" as const,
      publishedAt: post.publishedAt,
      readingTimeMinutes: Math.max(1, Math.round(readingStats.minutes)),
    };

    const existing = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, post.slug))
      .limit(1);

    if (existing.length) {
      await db.update(blogPosts).set(payload).where(eq(blogPosts.id, existing[0].id));
    } else {
      await db.insert(blogPosts).values(payload);
    }
  }

  const existingBooks = await db.select({ id: books.id }).from(books).limit(1);
  if (!existingBooks.length) {
    await db.insert(books).values([
      {
        title: "The Creative Act",
        author: "Rick Rubin",
        description: "A meditation on staying present with creative work.",
        orderIndex: 0,
      },
      {
        title: "Make It Stick",
        author: "Peter C. Brown",
        description: "Practical science-backed approaches to learning.",
        orderIndex: 1,
      },
      {
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        description: "The modern reference for reliable data systems.",
        orderIndex: 2,
      },
    ]);
  }

  const existingCourses = await db.select({ id: courses.id }).from(courses).limit(1);
  if (!existingCourses.length) {
    await db.insert(courses).values([
      { code: "CS101", name: "Foundations of Programming", discipline: "CS" },
      { code: "MATH221", name: "Linear Algebra", discipline: "Math" },
      { code: "NEURO310", name: "Computational Neuroscience", discipline: "Other" },
    ]);
  }

  if (serverEnv.OWNER_EMAIL && serverEnv.OWNER_PASSWORD) {
    const ownerEmail = serverEnv.OWNER_EMAIL.toLowerCase();
    const looksHashed = serverEnv.OWNER_PASSWORD.startsWith("$2");
    const passwordHash = looksHashed
      ? serverEnv.OWNER_PASSWORD
      : await bcrypt.hash(serverEnv.OWNER_PASSWORD, 12);

    const existingOwner = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, ownerEmail))
      .limit(1);

    if (!existingOwner.length) {
      await db.insert(users).values({
        email: ownerEmail,
        passwordHash,
        role: "owner",
        name: "Owner",
      });
    } else {
      // Ensure the seeded owner can sign in with the provided password
      await db
        .update(users)
        .set({ passwordHash, role: "owner" })
        .where(eq(users.id, existingOwner[0].id));
    }
  }
}

main()
  .then(() => {
    console.log("Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
