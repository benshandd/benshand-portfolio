import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import type { EditorContent } from "@/lib/editor";

export const tiptapExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2],
    },
    bulletList: {
      keepMarks: true,
    },
    orderedList: {
      keepMarks: true,
    },
  }),
];

export function generateTiptapHtml(content: EditorContent) {
  return generateHTML(content ?? { type: "doc", content: [{ type: "paragraph" }] }, tiptapExtensions);
}

export function tiptapContentToPlainText(content: EditorContent) {
  const html = generateTiptapHtml(content);
  return html.replace(/<[^>]*>/g, " ");
}
