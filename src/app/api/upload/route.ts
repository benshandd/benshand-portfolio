import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import imageSize from "image-size";

import { db } from "@/db/client";
import { uploads } from "@/db/schema";
import { serverEnv } from "@/env/server";
import { auth } from "@/lib/auth";
import { RateLimitError, enforceRateLimit, resolveRequestKey } from "@/lib/rate-limit";
import { getSupabaseAdminClient } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const clientKey = resolveRequestKey(request);
  try {
    enforceRateLimit({ key: `admin:${clientKey}`, limit: 10, windowMs: 60_000 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      );
    }
    throw error;
  }

  const session = await auth();
  const role = session?.user?.role;
  if (!role || (role !== "owner" && role !== "editor")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 10MB limit" },
      { status: 413, headers: { "Retry-After": "60" } },
    );
  }
  const now = new Date();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}`;

  const fileName = typeof file.name === "string" ? file.name : "";
  const mimeType = file.type || "application/octet-stream";
  let extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? null : null;
  if (!extension && mimeType.includes("/")) {
    extension = mimeType.split("/")[1]?.toLowerCase() ?? null;
  }

  let width: number | undefined;
  let height: number | undefined;

  if (mimeType.startsWith("image/")) {
    try {
      const dimensions = imageSize(buffer);
      width = dimensions.width ?? undefined;
      height = dimensions.height ?? undefined;
      if (dimensions.type) {
        extension = dimensions.type;
      }
    } catch (error) {
      console.warn("Failed to read image metadata", error);
    }
  }

  const objectPath = `${path}.${extension ?? "bin"}`;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage.from(serverEnv.SUPABASE_BUCKET).upload(objectPath, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(serverEnv.SUPABASE_BUCKET).getPublicUrl(objectPath);

  await db.insert(uploads).values({
    path: objectPath,
    publicUrl: data.publicUrl,
    size: buffer.length,
    mime: mimeType,
    width: width ?? null,
    height: height ?? null,
    tags: [],
  });

  return NextResponse.json({
    path: objectPath,
    publicUrl: data.publicUrl,
    width,
    height,
  });
}
