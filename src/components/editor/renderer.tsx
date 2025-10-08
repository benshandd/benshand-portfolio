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
            const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
            const text = typeof (data as { text?: unknown }).text === "string" ? data.text : "";
            return React.createElement(Tag, { key: block.id ?? block.type }, text as React.ReactNode);
          }
          case "paragraph":
            const paragraphData = data as { text?: unknown };
            const paragraphHtml =
              typeof paragraphData.text === "string" ? paragraphData.text : "";
            return (
              <p
                key={block.id}
                dangerouslySetInnerHTML={{
                  __html: paragraphHtml,
                }}
              />
            );
          case "list": {
            const listData = data as { items?: unknown; style?: unknown };
            const items = isStringArray(listData.items) ? listData.items : [];
            const isOrdered = listData.style === "ordered";
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
                    __html:
                      typeof (data as { text?: unknown }).text === "string"
                        ? (data as { text: string }).text
                        : "",
                  }}
                />
                {typeof (data as { caption?: unknown }).caption === "string" ? (
                  <cite>{(data as { caption: string }).caption}</cite>
                ) : null}
              </blockquote>
            );
          case "code":
            const codeData = data as { code?: unknown };
            const codeText = typeof codeData.code === "string" ? codeData.code : "";
            return (
              <pre key={block.id}>
                <code>{codeText}</code>
              </pre>
            );
          case "checklist":
            const checklistData = data as { items?: unknown };
            const checklistItems = isChecklistItems(checklistData.items) ? checklistData.items : [];
            return (
              <ul key={block.id} className="not-prose space-y-2">
                {checklistItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <input type="checkbox" checked={item.checked} readOnly className="h-4 w-4" />
                    <span dangerouslySetInnerHTML={{ __html: item.text }} />
                  </li>
                ))}
              </ul>
            );
          case "image":
            const imageData = data as {
              file?: { url?: unknown; width?: unknown; height?: unknown } | unknown;
              caption?: unknown;
            };
            const imageFile =
              typeof imageData.file === "object" && imageData.file !== null
                ? (imageData.file as { url?: unknown; width?: unknown; height?: unknown })
                : undefined;
            const imageUrl = typeof imageFile?.url === "string" ? imageFile.url : null;
            const imageWidth = typeof imageFile?.width === "number" ? imageFile.width : 1200;
            const imageHeight = typeof imageFile?.height === "number" ? imageFile.height : 675;
            const imageCaption =
              typeof imageData.caption === "string" ? imageData.caption : "";
            return (
              <figure key={block.id} className="my-6">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={imageCaption}
                    width={imageWidth}
                    height={imageHeight}
                    className="w-full rounded-lg"
                  />
                ) : null}
                {imageCaption ? (
                  <figcaption className="mt-2 text-sm">{imageCaption}</figcaption>
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
