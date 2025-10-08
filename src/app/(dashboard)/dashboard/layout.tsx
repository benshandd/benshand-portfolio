import Link from "next/link";
import { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/server/session";

type Role = "owner" | "editor" | "viewer";

const navItems: Array<{ href: string; label: string; roles: Role[] }> = [
  { href: "/dashboard", label: "Dashboard", roles: ["owner", "editor", "viewer"] },
  { href: "/dashboard/posts", label: "Posts", roles: ["owner", "editor", "viewer"] },
  { href: "/dashboard/categories", label: "Categories", roles: ["owner", "editor"] },
  { href: "/dashboard/books", label: "Books", roles: ["owner", "editor", "viewer"] },
  { href: "/dashboard/courses", label: "Courses", roles: ["owner", "editor", "viewer"] },
  { href: "/dashboard/settings", label: "Settings", roles: ["owner"] },
  { href: "/dashboard/media", label: "Media", roles: ["owner", "editor"] },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { role } = await requireAuth();

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[hsl(var(--bg))] text-[hsl(var(--fg))] md:grid-cols-[240px_1fr]">
      <aside className="border-r border-[hsl(var(--border))] bg-[hsl(var(--bg-muted))]">
        <div className="flex h-16 items-center justify-between px-6">
          <span className="text-sm font-semibold uppercase tracking-wide">Admin</span>
        </div>
        <nav className="space-y-1 px-4 py-4 text-sm">
          {navItems
            .filter((item) => item.roles.includes(role))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full justify-start text-left",
                )}
              >
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="px-4 py-6 text-xs text-[hsl(var(--fg-muted))]">
          Shared Supabase database across environments. Be mindful of destructive actions.
        </div>
      </aside>
      <main className="flex flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[hsl(var(--border))] px-6">
          <div className="text-sm text-[hsl(var(--fg-muted))]">Role: {role}</div>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View site
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-5xl space-y-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
