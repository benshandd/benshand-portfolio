"use client";

import EditorJS, { OutputData } from "@editorjs/editorjs";
import Checklist from "@editorjs/checklist";
import Code from "@editorjs/code";
import Header from "@editorjs/header";
import ImageTool from "@editorjs/image";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import { useEffect, useRef } from "react";

import type { EditorContent } from "@/lib/editor";

interface EditorProps {
  value?: EditorContent;
  onChange?: (data: EditorContent) => void;
  readOnly?: boolean;
}

export function Editor({ value, onChange, readOnly }: EditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (readOnly) {
      return;
    }

    if (!holderRef.current) return;
    if (editorRef.current) return;

    const editor = new EditorJS({
      holder: holderRef.current,
      data: value as OutputData,
      placeholder: "Start writing your story...",
      inlineToolbar: true,
      autofocus: true,
      tools: {
        header: Header,
        list: List,
        quote: Quote,
        code: Code,
        checklist: Checklist,
        image: {
          class: ImageTool,
          config: {
            uploader: {
              async uploadByFile(file: File) {
                const formData = new FormData();
                formData.append("file", file);
                const response = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                });
                if (!response.ok) {
                  throw new Error("Upload failed");
                }
                const json = await response.json();
                return {
                  success: 1,
                  file: {
                    url: json.publicUrl,
                    width: json.width,
                    height: json.height,
                  },
                };
              },
            },
          },
        },
      },
      async onChange(api) {
        const data = (await api.saver.save()) as EditorContent;
        onChange?.(data);
      },
    });

    editorRef.current = editor;

    return () => {
      editor.isReady.then(() => {
        editor.destroy();
        editorRef.current = null;
      });
    };
  }, [onChange, readOnly, value]);

  useEffect(() => {
    if (readOnly && value && holderRef.current) {
      holderRef.current.innerHTML = "";
    }
  }, [readOnly, value]);

  return <div ref={holderRef} className="min-h-[320px]" />;
}
