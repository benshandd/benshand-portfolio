import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EditorRenderer } from "@/components/editor/renderer";

describe("EditorRenderer", () => {
  it("renders header blocks with the correct level", () => {
    render(
      <EditorRenderer
        content={{
          blocks: [
            {
              id: "header-1",
              type: "header",
              data: { level: 2, text: "Neuroscience" },
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Neuroscience" })).toBeInTheDocument();
  });

  it("shows a fallback for unsupported blocks", () => {
    render(
      <EditorRenderer
        content={{
          blocks: [
            {
              id: "unknown",
              type: "diagram",
              data: { text: "Unsupported" },
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/Unsupported block type: diagram/)).toBeInTheDocument();
  });
});
