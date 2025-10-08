import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { serverEnv } from "@/env/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const secret = body?.secret ?? new URL(request.url).searchParams.get("secret");

  if (secret !== serverEnv.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const paths: string[] = Array.isArray(body.paths) ? body.paths : [];
  const tags: string[] = Array.isArray(body.tags) ? body.tags : [];

  paths.forEach((path) => revalidatePath(path));
  tags.forEach((tag) => revalidateTag(tag));

  return NextResponse.json({ ok: true });
}
