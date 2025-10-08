import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/categories/misc", label: "Categories" },
  { href: "/books", label: "Books" },
  { href: "/courses", label: "Courses" },
];

interface MainNavProps {
  className?: string;
}

export function MainNav({ className }: MainNavProps) {
  return (
    <nav className={cn("flex items-center gap-4 text-sm font-medium", className)}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-[hsl(var(--fg-muted))] transition hover:text-[hsl(var(--fg))]">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
