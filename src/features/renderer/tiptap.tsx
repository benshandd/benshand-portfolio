import React from "react";
import type { EditorContent } from "@/lib/editor";

import { generateTiptapHtml } from "@/lib/tiptap";

interface TiptapRendererProps {
  content: EditorContent | null | undefined;
  emptyFallback?: React.ReactNode;
  className?: string;
}

export function TiptapRenderer({ content, emptyFallback = <p className="text-sm text-[hsl(var(--fg-muted))]">No content available.</p>, className }: TiptapRendererProps) {
  if (!content || !Array.isArray(content.content) || content.content.length === 0) {
    return <>{emptyFallback}</>;
  }

  const html = generateTiptapHtml(content);

  return (
    <div
      className={className ?? "prose prose-neutral max-w-none dark:prose-invert"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
