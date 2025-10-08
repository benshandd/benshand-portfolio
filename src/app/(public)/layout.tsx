import { ReactNode } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getProfileSettings } from "@/server/queries";

export const revalidate = 60;

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getProfileSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container-desktop py-12">{children}</div>
      </main>
      <SiteFooter
        contactEmail={settings?.contactEmail}
        socials={settings?.socials ?? undefined}
        footerContent={settings?.footerContent}
      />
    </div>
  );
}
