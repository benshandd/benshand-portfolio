import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { MainNav } from "./main-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[hsl(var(--border))] backdrop-blur bg-[hsla(var(--bg)/0.9)]">
      <div className="container-desktop flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold">
            {siteConfig.name}
          </Link>
          <MainNav className="hidden md:flex" />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
