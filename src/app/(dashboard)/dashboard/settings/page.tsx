import { auth } from "@/lib/auth";
import { getProfileSettings } from "@/server/queries";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const settings = await getProfileSettings();
  const session = await auth();
  const role = session?.user?.role ?? "viewer";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site settings</CardTitle>
      </CardHeader>
      <CardContent>
        {role !== "owner" ? (
          <p className="text-sm text-[hsl(var(--fg-muted))]">Only the owner can update global settings.</p>
        ) : null}
        <SettingsForm initialSettings={settings} canEdit={role === "owner"} />
      </CardContent>
    </Card>
  );
}
