"use client";

import { useEffect, useMemo, useState } from "react";

import { FileUploadField } from "@/components/client/file-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileSettings } from "@/server/actions/settings";
import { cn } from "@/lib/utils";

interface SettingsFormProps {
  initialSettings: {
    heroText: string;
    contactEmail: string;
    socials: Record<string, string>;
    resumeUrls: Record<string, string>;
    footerContent: string | null;
    faviconUrl: string | null;
    ogImageUrl: string | null;
    bannerWarning: string | null;
  } | null;
  canEdit: boolean;
}

interface SocialLinkInput {
  id: string;
  label: string;
  url: string;
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

export function SettingsForm({ initialSettings, canEdit }: SettingsFormProps) {
  const [heroText, setHeroText] = useState(initialSettings?.heroText ?? "");
  const [contactEmail, setContactEmail] = useState(initialSettings?.contactEmail ?? "");
  const [footerContent, setFooterContent] = useState(initialSettings?.footerContent ?? "");
  const [bannerWarning, setBannerWarning] = useState(initialSettings?.bannerWarning ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initialSettings?.faviconUrl ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(initialSettings?.ogImageUrl ?? "");
  const [resumeUrl, setResumeUrl] = useState(initialSettings?.resumeUrls?.resume ?? "");
  const [transcriptUrl, setTranscriptUrl] = useState(initialSettings?.resumeUrls?.transcript ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialSocialLinks = useMemo<SocialLinkInput[]>(() => {
    return Object.entries(initialSettings?.socials ?? {}).map(([label, url]) => ({
      id: createId(),
      label,
      url,
    }));
  }, [initialSettings?.socials]);

  const [socialLinks, setSocialLinks] = useState<SocialLinkInput[]>(initialSocialLinks);

  useEffect(() => {
    setSocialLinks(initialSocialLinks);
  }, [initialSocialLinks]);

  const isSaving = status === "saving";
  const isDisabled = !canEdit || isSaving;

  function handleAddSocialLink() {
    setSocialLinks((prev) => [
      ...prev,
      { id: createId(), label: "", url: "" },
    ]);
  }

  function handleRemoveSocialLink(id: string) {
    setSocialLinks((prev) => prev.filter((link) => link.id !== id));
  }

  function handleSocialChange(id: string, field: "label" | "url", value: string) {
    setSocialLinks((prev) =>
      prev.map((link) =>
        link.id === id
          ? {
              ...link,
              [field]: value,
            }
          : link,
      ),
    );
  }

  useEffect(() => {
    if (status === "saved") {
      const timeout = setTimeout(() => setStatus("idle"), 3000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    setStatus("saving");
    setErrorMessage(null);

    try {
      const socialsRecord = socialLinks.reduce<Record<string, string>>((acc, link) => {
        const trimmedLabel = link.label.trim();
        const trimmedUrl = link.url.trim();
        if (trimmedLabel && trimmedUrl) {
          acc[trimmedLabel] = trimmedUrl;
        }
        return acc;
      }, {});

      const resumeRecord: Record<string, string> = {};
      if (resumeUrl.trim()) {
        resumeRecord.resume = resumeUrl.trim();
      }
      if (transcriptUrl.trim()) {
        resumeRecord.transcript = transcriptUrl.trim();
      }

      await updateProfileSettings({
        heroText: heroText.trim(),
        contactEmail: contactEmail.trim(),
        socials: socialsRecord,
        resumeUrls: resumeRecord,
        footerContent: footerContent.trim() ? footerContent.trim() : undefined,
        faviconUrl: faviconUrl.trim() ? faviconUrl.trim() : undefined,
        ogImageUrl: ogImageUrl.trim() ? ogImageUrl.trim() : undefined,
        bannerWarning: bannerWarning.trim() ? bannerWarning.trim() : undefined,
      });

      setErrorMessage(null);
      setStatus("saved");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to save settings");
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="heroText">Hero text</Label>
          <Textarea
            id="heroText"
            value={heroText}
            onChange={(event) => setHeroText(event.target.value)}
            disabled={isDisabled}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            disabled={isDisabled}
            required
          />
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <Label>Social links</Label>
          <p className="text-xs text-[hsl(var(--fg-muted))]">Add the platforms you want to highlight.</p>
        </div>
        <div className="space-y-3">
          {socialLinks.map((link) => (
            <div key={link.id} className="grid gap-2 rounded-md border border-[hsl(var(--border))] p-3 md:grid-cols-[200px_1fr_auto] md:items-center">
              <Input
                placeholder="Label (e.g. Twitter)"
                value={link.label}
                onChange={(event) => handleSocialChange(link.id, "label", event.target.value)}
                disabled={isDisabled}
              />
              <Input
                placeholder="https://"
                value={link.url}
                onChange={(event) => handleSocialChange(link.id, "url", event.target.value)}
                disabled={isDisabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSocialLink(link.id)}
                disabled={isDisabled}
              >
                Remove
              </Button>
            </div>
          ))}
          {socialLinks.length === 0 ? (
            <p className="text-sm text-[hsl(var(--fg-muted))]">No links yet.</p>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={handleAddSocialLink} disabled={isDisabled}>
            Add link
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FileUploadField
          id="faviconUrl"
          label="Favicon"
          value={faviconUrl}
          onChange={setFaviconUrl}
          description="Upload a square image (at least 512x512)."
          accept="image/*"
          disabled={isDisabled}
        />
        <FileUploadField
          id="ogImageUrl"
          label="Default OG image"
          value={ogImageUrl}
          onChange={setOgImageUrl}
          description="Used for social sharing previews."
          accept="image/*"
          disabled={isDisabled}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FileUploadField
          id="resumeUrl"
          label="Resume"
          value={resumeUrl}
          onChange={setResumeUrl}
          description="Upload a PDF resume or paste a link."
          accept="application/pdf"
          disabled={isDisabled}
        />
        <FileUploadField
          id="transcriptUrl"
          label="Transcript"
          value={transcriptUrl}
          onChange={setTranscriptUrl}
          description="Upload a transcript file or paste a link."
          accept="application/pdf"
          disabled={isDisabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="footerContent">Footer content</Label>
        <Textarea
          id="footerContent"
          value={footerContent}
          onChange={(event) => setFooterContent(event.target.value)}
          disabled={isDisabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bannerWarning">Admin banner warning</Label>
        <Input
          id="bannerWarning"
          value={bannerWarning}
          onChange={(event) => setBannerWarning(event.target.value)}
          disabled={isDisabled}
          placeholder="Shown to admins in the dashboard"
        />
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isDisabled}>
          {status === "saving" ? "Saving…" : "Save settings"}
        </Button>
        <span
          className={cn(
            "text-sm",
            status === "error" ? "text-red-600" : "text-[hsl(var(--fg-muted))]",
          )}
        >
          {status === "saved"
            ? "Settings saved"
            : status === "error"
            ? errorMessage ?? "Something went wrong"
            : null}
        </span>
      </div>
    </form>
  );
}
