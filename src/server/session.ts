import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

type Role = "owner" | "editor" | "viewer";

export async function requireAuth(allowed: Role[] = ["owner", "editor", "viewer"]) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!session?.user || !role || !allowed.includes(role)) {
    redirect("/dashboard/sign-in");
  }
  return { session, role } as const;
}
