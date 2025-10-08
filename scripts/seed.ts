import "dotenv/config";

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

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

async function main() {
  const categories = [
    { slug: "misc", name: "Misc" },
    { slug: "neuroscience", name: "Neuroscience" },
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

  const [draftPost] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, "welcome"))
    .limit(1);

  if (!draftPost) {
    const [miscCategory] = await db
      .select({ id: blogCategories.id })
      .from(blogCategories)
      .where(eq(blogCategories.slug, "misc"))
      .limit(1);

    await db.insert(blogPosts).values({
      title: "Welcome to the new build",
      slug: "welcome",
      summary: "A work-in-progress look at the new developer portfolio.",
      categoryId: miscCategory?.id ?? null,
      tags: ["welcome", "portfolio"],
      heroImageUrl: null,
      contentJson: {
        time: Date.now(),
        blocks: [
          {
            type: "paragraph",
            data: {
              text: "This draft post lives entirely in Editor.js JSON blocks and demonstrates the content pipeline.",
            },
          },
          {
            type: "list",
            data: {
              style: "unordered",
              items: ["Server components drive the public site", "Editor.js powers the admin", "Supabase stores media"],
            },
          },
        ],
      },
      status: "draft",
    });
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
