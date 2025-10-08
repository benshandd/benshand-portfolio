import { describe, expect, it, beforeEach, vi } from "vitest";
import { ZodError } from "zod";

import type { UpsertPostInput } from "@/server/actions/posts";
import { upsertPost } from "@/server/actions/posts";

const {
  insertMock,
  updateMock,
  deleteMock,
  requireAuthMock,
  enforceRateLimitMock,
  resolveServerActionKeyMock,
} = vi.hoisted(() => ({
  insertMock: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([{ id: "post-id" }])),
    })),
  })),
  updateMock: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })) })),
  deleteMock: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
  requireAuthMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  resolveServerActionKeyMock: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  db: {
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
  },
}));

vi.mock("@/server/session", () => ({
  requireAuth: requireAuthMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
  resolveServerActionKey: resolveServerActionKeyMock,
}));

describe("upsertPost", () => {
  beforeEach(() => {
    requireAuthMock.mockReset();
    requireAuthMock.mockResolvedValue({ role: "owner" });
    enforceRateLimitMock.mockClear();
    resolveServerActionKeyMock.mockResolvedValue("127.0.0.1");
    insertMock.mockClear();
  });

  it("rejects publishing without hero image", async () => {
    const payload: UpsertPostInput = {
      title: "Test post",
      slug: "test-post",
      summary: "A short summary",
      categoryId: "00000000-0000-0000-0000-000000000000",
      tags: ["test"],
      heroImageUrl: "",
      contentJson: {
        blocks: [
          {
            id: "1",
            type: "paragraph",
            data: { text: "Hello world" },
          },
        ],
      },
      status: "published",
      publishedAt: null,
    };

    let caught: unknown;
    try {
      await upsertPost(payload);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);

    expect(requireAuthMock).toHaveBeenCalledWith(["owner", "editor"]);
    expect(enforceRateLimitMock).toHaveBeenCalledWith({
      key: "admin:127.0.0.1",
      limit: 10,
      windowMs: 60_000,
    });
    expect(insertMock).not.toHaveBeenCalled();
  });
});
