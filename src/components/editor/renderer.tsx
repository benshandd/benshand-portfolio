import React from "react";
import Image from "next/image";

import type { EditorContent } from "@/lib/editor";

interface EditorRendererProps {
  content: EditorContent | null | undefined;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isChecklistItems(
  value: unknown,
): value is Array<{ text: string; checked: boolean }> {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { text?: unknown }).text === "string" &&
        typeof (item as { checked?: unknown }).checked === "boolean",
    )
  );
}

export function EditorRenderer({ content }: EditorRendererProps) {
  if (!content?.blocks?.length) {
    return <p className="text-sm text-[hsl(var(--fg-muted))]">No content available.</p>;
  }

  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert">
      {content.blocks.map((block) => {
        const data = block.data ?? {};
        switch (block.type) {
          case "header": {
            const levelValue = Number((data as { level?: unknown }).level ?? 2);
            const level = Math.min(Math.max(Number.isFinite(levelValue) ? levelValue : 2, 1), 6);
            const Tag = `h${level}` as keyof JSX.IntrinsicElements;
            const text = typeof (data as { text?: unknown }).text === "string" ? data.text : "";
            return <Tag key={block.id}>{text}</Tag>;
          }
          case "paragraph":
            return (
              <p
                key={block.id}
                dangerouslySetInnerHTML={{
                  __html: typeof (data as { text?: unknown }).text === "string" ? data.text : "",
                }}
              />
            );
          case "list": {
            const items = isStringArray((data as { items?: unknown }).items) ? data.items : [];
            const isOrdered = (data as { style?: unknown }).style === "ordered";
            if (isOrdered) {
              return (
                <ol key={block.id}>
                  {items.map((item, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ol>
              );
            }
            return (
              <ul key={block.id}>
                {items.map((item, index) => (
                  <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ul>
            );
          }
          case "quote":
            return (
              <blockquote key={block.id}>
                <p
                  dangerouslySetInnerHTML={{
                    __html: typeof (data as { text?: unknown }).text === "string" ? data.text : "",
                  }}
                />
                {typeof (data as { caption?: unknown }).caption === "string" ? (
                  <cite>{data.caption}</cite>
                ) : null}
              </blockquote>
            );
          case "code":
            return (
              <pre key={block.id}>
                <code>
                  {typeof (data as { code?: unknown }).code === "string" ? data.code : ""}
                </code>
              </pre>
            );
          case "checklist":
            return (
              <ul key={block.id} className="not-prose space-y-2">
                {isChecklistItems((data as { items?: unknown }).items)
                  ? data.items.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <input type="checkbox" checked={item.checked} readOnly className="h-4 w-4" />
                        <span dangerouslySetInnerHTML={{ __html: item.text }} />
                      </li>
                    ))
                  : null}
              </ul>
            );
          case "image":
            return (
              <figure key={block.id} className="my-6">
                {typeof (data as { file?: unknown }).file === "object" && data.file &&
                typeof (data.file as { url?: unknown }).url === "string" ? (
                  <Image
                    src={data.file.url}
                    alt={
                      typeof (data as { caption?: unknown }).caption === "string"
                        ? data.caption
                        : ""
                    }
                    width={
                      typeof (data.file as { width?: unknown }).width === "number"
                        ? data.file.width
                        : 1200
                    }
                    height={
                      typeof (data.file as { height?: unknown }).height === "number"
                        ? data.file.height
                        : 675
                    }
                    className="w-full rounded-lg"
                  />
                ) : null}
                {typeof (data as { caption?: unknown }).caption === "string" ? (
                  <figcaption className="mt-2 text-sm">{data.caption}</figcaption>
                ) : null}
              </figure>
            );
          default:
            return (
              <div key={block.id} className="rounded-md border border-dashed border-[hsl(var(--border))] p-4 text-sm">
                Unsupported block type: {block.type}
              </div>
            );
        }
      })}
    </div>
  );
}
