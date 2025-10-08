"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { uploadReferences, uploads } from "@/db/schema";
import { enforceRateLimit, resolveServerActionKey } from "@/lib/rate-limit";

import { requireAuth } from "../session";

const softDeleteSchema = z.object({
  id: z.string().uuid(),
});

export async function softDeleteUpload(input: z.infer<typeof softDeleteSchema>) {
  await requireAuth(["owner", "editor"]);
  const clientKey = await resolveServerActionKey();
  enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  const parsed = softDeleteSchema.parse(input);

  const references = await db
    .select({ entityTable: uploadReferences.entityTable })
    .from(uploadReferences)
    .where(eq(uploadReferences.uploadId, parsed.id));

  if (references.length) {
    throw new Error("Cannot delete upload with active references");
  }

  await db.update(uploads).set({ deleted: true }).where(eq(uploads.id, parsed.id));
  revalidatePath("/dashboard/media");
  return { ok: true } as const;
}
