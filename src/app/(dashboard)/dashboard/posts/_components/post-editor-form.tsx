"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const TiptapEditor = dynamic(
  () => import("@/components/client/tiptap-editor").then((m) => m.TiptapEditor),
  { ssr: false },
);
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptyEditorContent, type EditorContent } from "@/lib/editor";
import { slugify } from "@/lib/utils";
import { tiptapContentToPlainText } from "@/lib/tiptap";
import type { UpsertPostInput } from "@/server/actions/posts";
import { upsertPost } from "@/server/actions/posts";

interface PostEditorFormProps {
  initialData: Partial<UpsertPostInput> & { id?: string; publishedAt?: string | null };
}

function deriveSummary(content: EditorContent) {
  const summary = tiptapContentToPlainText(content).trim();
  if (!summary) {
    return "";
  }
  return summary.slice(0, 180);
}

export function PostEditorForm({ initialData }: PostEditorFormProps) {
  const router = useRouter();
  const [postId, setPostId] = useState(initialData.id ?? "");
  const [title, setTitle] = useState(initialData.title ?? "");
  const [slug, setSlug] = useState(initialData.slug ?? "");
  const [content, setContent] = useState<EditorContent>(
    initialData.contentJson && "type" in (initialData.contentJson as Record<string, unknown>)
      ? (initialData.contentJson as EditorContent)
      : emptyEditorContent,
  );
  const [slugDirty, setSlugDirty] = useState(Boolean(initialData.slug));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!slugDirty) {
      setSlug(slugify(title));
    }
  }, [slugDirty, title]);

  const summaryPreview = useMemo(() => deriveSummary(content), [content]);
  const canSave = title.trim().length > 0 && slug.trim().length > 0;
  const canPublish = canSave && summaryPreview.length > 0;

  const handleSave = (status: "draft" | "published") => {
    startTransition(() => {
      void (async () => {
        setFeedback(null);
        const payload: UpsertPostInput = {
          id: postId || undefined,
          title: title.trim(),
          slug: slugify(slug),
          summary: summaryPreview,
          categoryId: null,
          tags: [],
          heroImageUrl: undefined,
          contentJson: content,
          status,
          publishedAt: status === "published" ? initialData.publishedAt ?? null : null,
        };

        try {
          const result = await upsertPost(payload);
          setPostId(result.id);
          setSlugDirty(true);
          setFeedback(status === "published" ? "Post published" : "Draft saved");
          if (!postId || postId !== result.id) {
            router.replace(`/dashboard/posts/${result.id}`);
          }
          router.refresh();
        } catch (error) {
          console.error(error);
          setFeedback("Unable to save. Please try again.");
        }
      })();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-wide text-[hsl(var(--fg-muted))]">
          {feedback ?? (isPending ? "Saving…" : "Ready")}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => handleSave("draft")} disabled={!canSave || isPending}>
            Save draft
          </Button>
          <Button type="button" onClick={() => handleSave("published")} disabled={!canPublish || isPending}>
            Publish
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setFeedback(null);
              setSlugDirty(false);
            }}
            placeholder="My latest post"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugDirty(true);
              setFeedback(null);
            }}
            placeholder="my-latest-post"
          />
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <TiptapEditor value={content} onChange={setContent} />
          <p className="text-xs text-[hsl(var(--fg-muted))]">
            {summaryPreview ? `Summary preview: ${summaryPreview}` : "Start typing to generate a summary preview."}
          </p>
        </div>
      </div>
    </div>
  );
}
