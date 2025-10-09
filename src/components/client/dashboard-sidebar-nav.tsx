"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Role = "owner" | "editor" | "viewer";

export interface DashboardNavItem {
  href: string;
  label: string;
  roles: Role[];
}

interface DashboardSidebarNavProps {
  role: Role;
  items: DashboardNavItem[];
}

export function DashboardSidebarNav({ role, items }: DashboardSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-4 py-4 text-sm">
      {items
        .filter((item) => item.roles.includes(role))
        .map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "w-full justify-start text-left",
                isActive
                  ? "bg-[hsl(var(--bg))] font-medium text-[hsl(var(--fg))] shadow-sm"
                  : "text-[hsl(var(--fg-muted))]",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
