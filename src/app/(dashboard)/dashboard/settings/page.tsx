import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/auth";
import { updateProfileSettings } from "@/server/actions/settings";
import { getProfileSettings } from "@/server/queries";

export default async function SettingsPage() {
  const settings = await getProfileSettings();
  const session = await auth();
  const role = session?.user?.role ?? "viewer";

  async function handleSubmit(formData: FormData) {
    "use server";
    if (role !== "owner") return;
    const heroText = formData.get("heroText");
    const contactEmail = formData.get("contactEmail");
    const socials = formData.get("socials");
    const resumeUrls = formData.get("resumeUrls");
    const footerContent = formData.get("footerContent");
    const faviconUrl = formData.get("faviconUrl");
    const ogImageUrl = formData.get("ogImageUrl");
    const bannerWarning = formData.get("bannerWarning");

    if (typeof heroText !== "string" || typeof contactEmail !== "string") {
      return;
    }

    const parseRecord = (value: string | null): Record<string, string> => {
      if (!value) return {};
      try {
        return JSON.parse(value);
      } catch (error) {
        console.error("Failed to parse record", error);
        return {};
      }
    };

    await updateProfileSettings({
      heroText,
      contactEmail,
      socials: parseRecord(typeof socials === "string" ? socials : null),
      resumeUrls: parseRecord(typeof resumeUrls === "string" ? resumeUrls : null),
      footerContent: typeof footerContent === "string" ? footerContent : undefined,
      faviconUrl: typeof faviconUrl === "string" ? faviconUrl : undefined,
      ogImageUrl: typeof ogImageUrl === "string" ? ogImageUrl : undefined,
      bannerWarning: typeof bannerWarning === "string" ? bannerWarning : undefined,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site settings</CardTitle>
      </CardHeader>
      <CardContent>
        {role !== "owner" ? (
          <p className="text-sm text-[hsl(var(--fg-muted))]">Only the owner can update global settings.</p>
        ) : (
          <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heroText">Hero text</Label>
            <Textarea id="heroText" name="heroText" defaultValue={settings?.heroText ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input id="contactEmail" name="contactEmail" defaultValue={settings?.contactEmail ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socials">Socials (JSON)</Label>
            <Textarea
              id="socials"
              name="socials"
              defaultValue={settings?.socials ? JSON.stringify(settings.socials, null, 2) : "{}"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resumeUrls">Resume URLs (JSON)</Label>
            <Textarea
              id="resumeUrls"
              name="resumeUrls"
              defaultValue={settings?.resumeUrls ? JSON.stringify(settings.resumeUrls, null, 2) : "{}"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerContent">Footer content</Label>
            <Textarea id="footerContent" name="footerContent" defaultValue={settings?.footerContent ?? ""} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="faviconUrl">Favicon URL</Label>
              <Input id="faviconUrl" name="faviconUrl" defaultValue={settings?.faviconUrl ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ogImageUrl">OG image URL</Label>
              <Input id="ogImageUrl" name="ogImageUrl" defaultValue={settings?.ogImageUrl ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerWarning">Banner warning</Label>
              <Input id="bannerWarning" name="bannerWarning" defaultValue={settings?.bannerWarning ?? ""} />
            </div>
          </div>
            <Button type="submit">Save settings</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
