"use client";

import EditorJS, { OutputData } from "@editorjs/editorjs";
import type { EditorConfig } from "@editorjs/editorjs/types/configs/editor-config";
import Checklist from "@editorjs/checklist";
import Code from "@editorjs/code";
import Header from "@editorjs/header";
import ImageTool from "@editorjs/image";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import { useEffect, useMemo, useRef } from "react";

import { emptyEditorContent, type EditorContent } from "@/lib/editor";

interface EditorProps {
  value?: EditorContent;
  onChange?: (data: EditorContent) => void;
  readOnly?: boolean;
}

export function Editor({ value, onChange, readOnly = false }: EditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef<typeof onChange | undefined>(undefined);
  const lastSyncedValueRef = useRef<EditorContent>(value ?? emptyEditorContent);

  onChangeRef.current = onChange;

  const initialData = useMemo<OutputData>(() => {
    const data = value ?? emptyEditorContent;
    lastSyncedValueRef.current = data;
    return data as OutputData;
  }, [value]);

  useEffect(() => {
    if (!holderRef.current) {
      return;
    }

    if (editorRef.current) {
      return;
    }

    const editor = new EditorJS({
      holder: holderRef.current,
      data: initialData,
      readOnly,
      placeholder: "Start writing your story...",
      inlineToolbar: true,
      autofocus: !readOnly,
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
                try {
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
                  } as const;
                } catch (error) {
                  console.error(error);
                  return {
                    success: 0,
                    message:
                      error instanceof Error && error.message ? error.message : "Upload failed",
                  } as const;
                }
              },
            },
          },
        },
      } as EditorConfig["tools"],
      async onChange(api) {
        const data = (await api.saver.save()) as EditorContent;
        lastSyncedValueRef.current = data;
        onChangeRef.current?.(data);
      },
    });

    editorRef.current = editor;

    return () => {
      editor.isReady
        .then(() => {
          editor.destroy();
        })
        .finally(() => {
          editorRef.current = null;
        });
    };
  }, [initialData, readOnly]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    void editor.isReady.then(() => {
      if (readOnly) {
        const readOnlyApi = editor.readOnly as unknown as {
          enable?: () => void;
          disable?: () => void;
        };
        readOnlyApi.enable?.();
      } else {
        const readOnlyApi = editor.readOnly as unknown as {
          enable?: () => void;
          disable?: () => void;
        };
        readOnlyApi.disable?.();
      }
    });
  }, [readOnly]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const nextValue = (value ?? emptyEditorContent) as OutputData;
    const previousValue = lastSyncedValueRef.current;

    if (deepEqual(previousValue, nextValue)) {
      return;
    }

    void editor.isReady.then(async () => {
      lastSyncedValueRef.current = nextValue;
      await editor.render(nextValue);
    });
  }, [value]);

  return <div ref={holderRef} className="min-h-[320px]" />;
}

function deepEqual(a: EditorContent | OutputData, b: EditorContent | OutputData) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (error) {
    console.error("Failed to compare editor content", error);
    return false;
  }
}
