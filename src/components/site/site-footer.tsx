import Link from "next/link";

import { siteConfig } from "@/config/site";

interface SiteFooterProps {
  contactEmail?: string | null;
  socials?: Record<string, string> | null;
  footerContent?: string | null;
}

export function SiteFooter({ contactEmail, socials, footerContent }: SiteFooterProps) {
  return (
    <footer className="border-t border-[hsl(var(--border))] py-12">
      <div className="container-desktop grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{siteConfig.name}</h2>
          {footerContent ? <p className="text-sm text-[hsl(var(--fg-muted))]">{footerContent}</p> : null}
          {contactEmail ? (
            <p className="text-sm text-[hsl(var(--fg-muted))]">
              <Link href={`mailto:${contactEmail}`} className="underline">
                {contactEmail}
              </Link>
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium uppercase tracking-wide text-[hsl(var(--fg-muted))]">Socials</h3>
          <ul className="flex flex-wrap gap-3 text-sm">
            {socials &&
              Object.entries(socials).map(([label, url]) => (
                <li key={label}>
                  <Link href={url} target="_blank" className="underline">
                    {label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
