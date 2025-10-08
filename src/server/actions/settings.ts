"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import { profileSettings } from "@/db/schema";
import { enforceRateLimit, resolveServerActionKey } from "@/lib/rate-limit";

import { requireAuth } from "../session";

const settingsSchema = z.object({
  heroText: z.string().min(1, "Hero text is required"),
  contactEmail: z.string().email("Valid email required"),
  socials: z.record(z.string(), z.string().url()),
  resumeUrls: z.record(z.string(), z.string().url()),
  footerContent: z.string().optional(),
  faviconUrl: z.string().url().optional(),
  ogImageUrl: z.string().url().optional(),
  bannerWarning: z.string().optional(),
});

export async function updateProfileSettings(input: z.infer<typeof settingsSchema>) {
  await requireAuth(["owner"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  const parsed = settingsSchema.parse(input);

  await db
    .insert(profileSettings)
    .values({ id: 1, ...parsed })
    .onConflictDoUpdate({
      target: profileSettings.id,
      set: parsed,
    });

  revalidatePath("/");
  return { ok: true } as const;
}
