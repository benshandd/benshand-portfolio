import { describe, expect, it, beforeEach, vi } from "vitest";

import { deleteCategory } from "@/server/actions/categories";

const {
  whereMock,
  requireAuthMock,
  enforceRateLimitMock,
  resolveServerActionKeyMock,
  updateMock,
  deleteMock,
} = vi.hoisted(() => ({
  whereMock: vi.fn(() => Promise.resolve([{ value: 2 }])),
  requireAuthMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  resolveServerActionKeyMock: vi.fn(),
  updateMock: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })) })),
  deleteMock: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: whereMock,
      })),
    })),
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

describe("deleteCategory", () => {
  beforeEach(() => {
    requireAuthMock.mockReset();
    requireAuthMock.mockResolvedValue({ role: "owner" });
    enforceRateLimitMock.mockClear();
    resolveServerActionKeyMock.mockResolvedValue("10.0.0.1");
    whereMock.mockResolvedValue([{ value: 2 }]);
  });

  it("throws when posts exist without fallback", async () => {
    await expect(deleteCategory("00000000-0000-0000-0000-000000000001")).rejects.toThrow(
      /Cannot delete category with posts without fallback assignment/,
    );
    expect(requireAuthMock).toHaveBeenCalledWith(["owner", "editor"]);
    expect(enforceRateLimitMock).toHaveBeenCalledWith({
      key: "admin:10.0.0.1",
      limit: 10,
      windowMs: 60_000,
    });
  });
});
