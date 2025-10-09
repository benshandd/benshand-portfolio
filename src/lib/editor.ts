import { z } from "zod";

export const editorContentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.any()).optional(),
});

export type EditorContent = z.infer<typeof editorContentSchema>;

export const emptyEditorContent: EditorContent = { type: "doc", content: [{ type: "paragraph" }] };

export function isEditorContentEmpty(content: EditorContent | null | undefined) {
  return !content || !Array.isArray(content.content) || content.content.length === 0;
}
