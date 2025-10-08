import { z } from "zod";

export const editorBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  data: z.record(z.unknown()),
  tunes: z.record(z.unknown()).optional(),
});

export const editorContentSchema = z.object({
  time: z.number().optional(),
  version: z.string().optional(),
  blocks: z.array(editorBlockSchema),
});

export type EditorBlock = z.infer<typeof editorBlockSchema>;
export type EditorContent = z.infer<typeof editorContentSchema>;

export const emptyEditorContent: EditorContent = { blocks: [] };
