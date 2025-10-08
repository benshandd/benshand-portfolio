"use client";

import { useEffect, useMemo, useReducer, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { useDebounce } from "usehooks-ts";

import { Editor } from "@/components/editor/editor";
import { EditorRenderer } from "@/components/editor/renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { emptyEditorContent, type EditorContent } from "@/lib/editor";
import type { UpsertPostInput } from "@/server/actions/posts";
import { upsertPost } from "@/server/actions/posts";
import { slugify } from "@/lib/utils";

interface PostEditorFormProps {
  initialData: Partial<UpsertPostInput> & { id?: string; updatedAt?: string | Date };
  categories: Array<{ id: string; name: string }>;
}

type EditorStatus = "idle" | "saving" | "saved" | "error";

export function PostEditorForm({ initialData, categories }: PostEditorFormProps) {
  const initialContent: EditorContent =
    initialData.contentJson && "blocks" in initialData.contentJson
      ? (initialData.contentJson as EditorContent)
      : emptyEditorContent;
  const [title, setTitle] = useState(initialData.title ?? "");
  const [slug, setSlug] = useState(initialData.slug ?? "");
  const [summary, setSummary] = useState(initialData.summary ?? "");
  const [categoryId, setCategoryId] = useState(initialData.categoryId ?? "");
  const [tags, setTags] = useState((initialData.tags as string[] | undefined)?.join(", ") ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(initialData.heroImageUrl ?? "");
  const [content, setContent] = useState<EditorContent>(initialContent);
  const [status, setStatus] = useState<EditorStatus>("idle");
  const [isPreview, setIsPreview] = useState(false);
  const [isSlugDirty, setIsSlugDirty] = useState(Boolean(initialData.slug));
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialData.updatedAt ? new Date(initialData.updatedAt as Date | string) : null,
  );
  const [, forceRelativeUpdate] = useReducer((count: number) => count + 1, 0);
  const [, startTransition] = useTransition();

  const debouncedTitle = useDebounce(title, 500);

  useEffect(() => {
    if (!isSlugDirty && debouncedTitle) {
      setSlug(slugify(debouncedTitle));
    }
  }, [debouncedTitle, isSlugDirty]);

  useEffect(() => {
    const interval = setInterval(() => {
      void handleSave("draft", { silent: true });
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, summary, categoryId, tags, heroImageUrl, content]);

  useEffect(() => {
    if (!lastSavedAt) {
      return;
    }
    const id = setInterval(() => forceRelativeUpdate(), 15000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  async function handleSave(nextStatus: "draft" | "published", options?: { silent?: boolean }) {
    setStatus("saving");
    const payload: UpsertPostInput = {
      id: initialData.id,
      title,
      slug,
      summary,
      categoryId: categoryId || null,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      heroImageUrl,
      contentJson: content,
      status: nextStatus,
      publishedAt: initialData.publishedAt ?? null,
    };

    startTransition(async () => {
      try {
        await upsertPost(payload);
        const savedAt = new Date();
        setLastSavedAt(savedAt);
        setStatus(options?.silent ? "idle" : "saved");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    });
  }

  const statusLabel = useMemo(() => {
    switch (status) {
      case "saving":
        return "Saving…";
      case "saved":
        return "Saved just now";
      case "error":
        return "Error";
      default:
        if (lastSavedAt) {
          return `Saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`;
        }
        return "Idle";
    }
  }, [lastSavedAt, status]);

  return (
    <form className="space-y-6" action={async () => {}}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-[hsl(var(--fg-muted))]">Status: {statusLabel}</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setIsPreview((prev) => !prev)}>
            {isPreview ? "Edit" : "Preview"}
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleSave("draft")}>Save draft</Button>
          <Button type="button" onClick={() => void handleSave("published")}>Publish</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="My latest breakthrough"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(event) => {
              setIsSlugDirty(true);
              setSlug(event.target.value);
            }}
            placeholder="my-latest-breakthrough"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          maxLength={180}
        />
        <div className="text-xs text-[hsl(var(--fg-muted))]">{summary.length} / 180 characters</div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="neuroscience, productivity"
          />
          <p className="text-xs text-[hsl(var(--fg-muted))]">Separate tags with commas.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="heroImage">Hero image URL</Label>
          <Input
            id="heroImage"
            value={heroImageUrl}
            onChange={(event) => setHeroImageUrl(event.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        {isPreview ? (
          <div className="rounded-lg border border-[hsl(var(--border))] p-6">
            <EditorRenderer content={content} />
          </div>
        ) : (
          <div className="rounded-lg border border-[hsl(var(--border))] p-6">
            <Editor value={content} onChange={(data) => setContent(data)} />
          </div>
        )}
      </div>
    </form>
  );
}
