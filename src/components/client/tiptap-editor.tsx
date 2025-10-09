"use client";

import "@tiptap/core/styles.css";
import "@tiptap/pm/styles.css";

import type { EditorContent as EditorJSONContent } from "@/lib/editor";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent as TiptapEditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  value: EditorJSONContent;
  onChange: (content: EditorJSONContent) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  className?: string;
}

export function TiptapEditor({
  value,
  onChange,
  onBlur,
  readOnly = false,
  className,
}: TiptapEditorProps) {
  const editor = useEditor(
    {
      extensions: [StarterKit.configure({ heading: { levels: [1, 2] } })],
      content: value,
      autofocus: true,
      editable: !readOnly,
      immediatelyRender: false,
      onUpdate: ({ editor }) => onChange(editor.getJSON()),
      editorProps: {
        attributes: {
          class:
            "prose prose-neutral max-w-none dark:prose-invert outline-none min-h-[16rem] whitespace-pre-wrap",
        },
      },
    },
    [readOnly],
  );

  const serialisedValue = useMemo(() => JSON.stringify(value), [value]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const current = JSON.stringify(editor.getJSON());
    if (current === serialisedValue) {
      return;
    }
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, serialisedValue, value]);

  useEffect(() => {
    if (!editor || !onBlur) {
      return;
    }
    editor.on("blur", onBlur);
    return () => {
      editor.off("blur", onBlur);
    };
  }, [editor, onBlur]);

  const MenuBar = () => {
    if (!editor) {
      return null;
    }

    const buttonClass = (isActive: boolean) =>
      cn(
        "rounded-md border border-[hsl(var(--border))] px-3 py-1 text-sm transition-colors",
        isActive ? "bg-[hsl(var(--bg))] font-semibold" : "bg-transparent hover:bg-[hsl(var(--bg-muted))]",
        readOnly && "pointer-events-none opacity-60",
      );

    return (
      <div className="flex flex-wrap gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg-muted))] p-2">
        <button
          type="button"
          className={buttonClass(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={buttonClass(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className={buttonClass(editor.isActive("heading", { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Heading
        </button>
        <button
          type="button"
          className={buttonClass(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullet list
        </button>
        <button
          type="button"
          className={buttonClass(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Numbered
        </button>
        <button
          type="button"
          className={buttonClass(editor.isActive("blockquote"))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </button>
        <button
          type="button"
          className={buttonClass(editor.isActive("codeBlock"))}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          Code
        </button>
        <button
          type="button"
          className={buttonClass(false)}
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          Clear
        </button>
      </div>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      <MenuBar />
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4">
        {editor ? (
          <TiptapEditorContent editor={editor} />
        ) : (
          <div className="h-52 animate-pulse rounded-md border border-dashed border-[hsl(var(--border))]" />
        )}
      </div>
    </div>
  );
}
