"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useDebounceValue } from "usehooks-ts";

import { FileUploadField } from "@/components/client/file-upload-field";
import { EditorRenderer } from "@/components/editor/renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { emptyEditorContent, type EditorContent } from "@/lib/editor";
import type { UpsertPostInput } from "@/server/actions/posts";
import { upsertPost } from "@/server/actions/posts";
import { upsertCategory } from "@/server/actions/categories";
import { slugify } from "@/lib/utils";

interface PostEditorFormProps {
  initialData: Partial<UpsertPostInput> & { id?: string; updatedAt?: string | Date };
  categories: Array<{ id: string; name: string; slug: string }>;
}

type EditorStatus = "idle" | "saving" | "saved" | "error";

const Editor = dynamic(() => import("@/components/editor/editor").then((mod) => mod.Editor), {
  ssr: false,
});

export function PostEditorForm({ initialData, categories }: PostEditorFormProps) {
  const initialContent: EditorContent =
    initialData.contentJson && "blocks" in initialData.contentJson
      ? (initialData.contentJson as EditorContent)
      : emptyEditorContent;
  const [postId, setPostId] = useState(initialData.id ?? "");
  const [publishedAt, setPublishedAt] = useState<string | null>(
    (initialData.publishedAt as string | null | undefined) ?? null,
  );
  const [title, setTitle] = useState(initialData.title ?? "");
  const [slug, setSlug] = useState(initialData.slug ?? "");
  const [summary, setSummary] = useState(initialData.summary ?? "");
  const [categoryId, setCategoryId] = useState(initialData.categoryId ?? "");
  const [availableCategories, setAvailableCategories] = useState(categories);
  const [tags, setTags] = useState((initialData.tags as string[] | undefined)?.join(", ") ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(initialData.heroImageUrl ?? "");
  const [content, setContent] = useState<EditorContent>(initialContent);
  const [status, setStatus] = useState<EditorStatus>("idle");
  const [isPreview, setIsPreview] = useState(false);
  const [isSlugDirty, setIsSlugDirty] = useState(Boolean(initialData.slug));
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialData.updatedAt ? new Date(initialData.updatedAt as Date | string) : null,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [categoryStatus, setCategoryStatus] = useState<"idle" | "success" | "error">("idle");
  const [, forceRelativeUpdate] = useReducer((count: number) => count + 1, 0);
  const beforeUnloadHandlerRef = useRef<((event: BeforeUnloadEvent) => void) | null>(null);

  const debouncedTitle = useDebounceValue(title, 500);

  const normalizedTags = useMemo(() => {
    return Array.from(
      new Set(
        tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    );
  }, [tags]);

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        id: postId || null,
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim(),
        categoryId: categoryId || null,
        tags: normalizedTags,
        heroImageUrl: heroImageUrl.trim(),
        contentJson: content,
        publishedAt,
      }),
    [categoryId, content, heroImageUrl, normalizedTags, postId, publishedAt, slug, summary, title],
  );

  const lastSavedSnapshotRef = useRef(currentSnapshot);
  const hasInitialisedSnapshotRef = useRef(false);

  useEffect(() => {
    setAvailableCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (!isSlugDirty && debouncedTitle) {
      setSlug(slugify(debouncedTitle));
    }
  }, [debouncedTitle, isSlugDirty]);

  useEffect(() => {
    if (!hasInitialisedSnapshotRef.current) {
      hasInitialisedSnapshotRef.current = true;
      lastSavedSnapshotRef.current = currentSnapshot;
      setIsDirty(false);
      return;
    }

    const hasChanges = currentSnapshot !== lastSavedSnapshotRef.current;
    setIsDirty(hasChanges);
    if (hasChanges && status === "saved") {
      setStatus("idle");
    }
  }, [currentSnapshot, status]);

  useEffect(() => {
    if (!lastSavedAt) {
      return;
    }
    const id = setInterval(() => forceRelativeUpdate(), 15000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  const canSaveDraft = useMemo(() => {
    return Boolean(title.trim() && slug.trim() && summary.trim());
  }, [slug, summary, title]);

  const canPublish = useMemo(() => {
    return (
      canSaveDraft &&
      Boolean(categoryId) &&
      Boolean(heroImageUrl.trim()) &&
      Boolean(content?.blocks?.length)
    );
  }, [canSaveDraft, categoryId, content?.blocks?.length, heroImageUrl]);

  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    },
    [isDirty],
  );

  useEffect(() => {
    if (isDirty) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      beforeUnloadHandlerRef.current = handleBeforeUnload;
    } else if (beforeUnloadHandlerRef.current) {
      window.removeEventListener("beforeunload", beforeUnloadHandlerRef.current);
      beforeUnloadHandlerRef.current = null;
    }

    return () => {
      if (beforeUnloadHandlerRef.current) {
        window.removeEventListener("beforeunload", beforeUnloadHandlerRef.current);
        beforeUnloadHandlerRef.current = null;
      }
    };
  }, [handleBeforeUnload, isDirty]);

  const buildPayload = useCallback(
    (nextStatus: "draft" | "published"): UpsertPostInput => ({
      id: postId || undefined,
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim(),
      categoryId: categoryId ? categoryId : null,
      tags: normalizedTags,
      heroImageUrl: heroImageUrl.trim(),
      contentJson: content,
      status: nextStatus,
      publishedAt: publishedAt ?? null,
    }),
    [categoryId, content, heroImageUrl, normalizedTags, postId, publishedAt, slug, summary, title],
  );

  const handleSave = useCallback(
    async (nextStatus: "draft" | "published", options?: { silent?: boolean }) => {
      if (nextStatus === "draft" && !canSaveDraft) {
        return;
      }
      if (nextStatus === "published" && !canPublish) {
        return;
      }

      setStatus("saving");
      const payload = buildPayload(nextStatus);

      try {
        const result = await upsertPost(payload);
        const savedAt = new Date();
        const resolvedId = result.id ?? postId ?? "";
        setPostId(resolvedId);
        if (nextStatus === "draft") {
          setPublishedAt(null);
        } else if (!publishedAt) {
          setPublishedAt(savedAt.toISOString());
        }
        setLastSavedAt(savedAt);
        lastSavedSnapshotRef.current = JSON.stringify({
          id: resolvedId || null,
          title: payload.title,
          slug: payload.slug,
          summary: payload.summary,
          categoryId: payload.categoryId,
          tags: payload.tags,
          heroImageUrl: payload.heroImageUrl,
          contentJson: payload.contentJson,
          publishedAt: nextStatus === "draft" ? null : publishedAt ?? savedAt.toISOString(),
        });
        setIsDirty(false);
        setStatus(options?.silent ? "idle" : "saved");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    },
    [buildPayload, canPublish, canSaveDraft, postId, publishedAt],
  );

  const handleAutoSave = useCallback(() => {
    if (!isDirty || !canSaveDraft || status === "saving") {
      return;
    }
    void handleSave("draft", { silent: true });
  }, [canSaveDraft, handleSave, isDirty, status]);

  useEffect(() => {
    if (!newCategoryName) {
      setNewCategorySlug("");
      return;
    }
    setNewCategorySlug(slugify(newCategoryName));
  }, [newCategoryName]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleAutoSave();
    }, 10000);
    return () => clearInterval(interval);
  }, [handleAutoSave]);

  const handleBlurAutoSave = useCallback(() => {
    handleAutoSave();
  }, [handleAutoSave]);

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

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      setCategoryMessage("Name is required");
      setCategoryStatus("error");
      return;
    }

    setIsAddingCategory(true);
    setCategoryMessage(null);
    setCategoryStatus("idle");
    try {
      const result = await upsertCategory({
        name: newCategoryName.trim(),
        slug: newCategorySlug || slugify(newCategoryName),
      });
      if (result.category) {
        setAvailableCategories((prev) => {
          const next = [...prev.filter((item) => item.id !== result.category.id), result.category];
          return next.sort((a, b) => a.name.localeCompare(b.name));
        });
        setCategoryId(result.category.id);
        setNewCategoryName("");
        setNewCategorySlug("");
        setCategoryMessage("Category created");
        setCategoryStatus("success");
      }
    } catch (error) {
      console.error(error);
      setCategoryMessage(error instanceof Error ? error.message : "Failed to save category");
      setCategoryStatus("error");
    } finally {
      setIsAddingCategory(false);
    }
  }, [newCategoryName, newCategorySlug]);

  return (
    <form className="space-y-6" action={async () => {}}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-[hsl(var(--fg-muted))]">Status: {statusLabel}</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setIsPreview((prev) => !prev)}>
            {isPreview ? "Edit" : "Preview"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSave("draft")}
            disabled={!canSaveDraft || status === "saving"}
          >
            Save draft
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave("published")}
            disabled={!canPublish || status === "saving"}
          >
            Publish
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={handleBlurAutoSave}
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
            onBlur={handleBlurAutoSave}
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
          onBlur={handleBlurAutoSave}
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
            onBlur={handleBlurAutoSave}
            className="h-10 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm"
          >
            <option value="">Select category</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="space-y-2 rounded-md border border-dashed border-[hsl(var(--border))] p-3 text-xs">
            <div className="font-medium">Need a new category?</div>
            <div className="grid gap-2">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(event) => {
                  setNewCategoryName(event.target.value);
                  setCategoryMessage(null);
                  setCategoryStatus("idle");
                }}
              />
              <Input
                placeholder="category-slug"
                value={newCategorySlug}
                onChange={(event) => {
                  setNewCategorySlug(event.target.value);
                  setCategoryMessage(null);
                  setCategoryStatus("idle");
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleCreateCategory()}
                disabled={isAddingCategory}
              >
                {isAddingCategory ? "Saving…" : "Save category"}
              </Button>
              {categoryMessage ? (
                <p
                  className={
                    categoryStatus === "error"
                      ? "text-red-600"
                      : "text-[hsl(var(--fg-muted))]"
                  }
                >
                  {categoryMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            onBlur={handleBlurAutoSave}
            placeholder="neuroscience, productivity"
          />
          <p className="text-xs text-[hsl(var(--fg-muted))]">Separate tags with commas.</p>
        </div>
        <FileUploadField
          id="heroImage"
          label="Hero image"
          value={heroImageUrl}
          onChange={(next) => {
            setHeroImageUrl(next);
            setTimeout(() => handleBlurAutoSave(), 0);
          }}
          description="Upload a featured image or paste an external URL."
          accept="image/*"
          onBlur={handleBlurAutoSave}
        />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        {isPreview ? (
          <div className="rounded-lg border border-[hsl(var(--border))] p-6">
            <EditorRenderer content={content} />
          </div>
        ) : (
          <div
            className="rounded-lg border border-[hsl(var(--border))] p-6"
            onBlurCapture={handleBlurAutoSave}
          >
            <Editor value={content} onChange={(data) => setContent(data)} />
          </div>
        )}
      </div>
    </form>
  );
}
