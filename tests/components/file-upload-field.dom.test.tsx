import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FileUploadField } from "@/components/client/file-upload-field";

const PUBLIC_URL = "https://example.com/uploads/test.png";

describe("FileUploadField", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ publicUrl: PUBLIC_URL }),
      })),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("propagates manual URL edits", () => {
    const handleChange = vi.fn();
    render(
      <FileUploadField label="Hero image" value="" onChange={handleChange} />,
    );

    const input = screen.getByLabelText("Hero image");
    fireEvent.change(input, { target: { value: PUBLIC_URL } });

    expect(handleChange).toHaveBeenCalledWith(PUBLIC_URL);
    expect(screen.queryByText(/Upload complete/i)).not.toBeInTheDocument();
  });

  it("uploads a file and surfaces status messaging", async () => {
    const handleChange = vi.fn();
    const { container } = render(
      <FileUploadField label="Hero image" value="" onChange={handleChange} />,
    );

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    const file = new File(["test"], "cover.png", { type: "image/png" });
    fireEvent.change(fileInput!, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(PUBLIC_URL);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Upload complete")).toBeInTheDocument();
  });
});
