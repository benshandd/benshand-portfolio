import { describe, expect, it, beforeEach, vi } from "vitest";

import { POST } from "@/app/api/upload/route";

const { enforceRateLimitMock, resolveRequestKeyMock, authMock } = vi.hoisted(() => ({
  enforceRateLimitMock: vi.fn(),
  resolveRequestKeyMock: vi.fn(),
  authMock: vi.fn(),
}));

vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({}),
  })),
  __esModule: true,
}));

vi.mock("@/lib/rate-limit", () => ({
  RateLimitError: class extends Error {
    retryAfterSeconds = 60;
  },
  enforceRateLimit: enforceRateLimitMock,
  resolveRequestKey: resolveRequestKeyMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/storage", () => ({
  getSupabaseAdminClient: () => {
    throw new Error("Supabase client should not be created for unauthorized requests");
  },
}));

vi.mock("@/db/client", () => ({
  db: {},
}));

vi.mock("@/db/schema", () => ({
  uploads: {},
}));

vi.mock("@/env/server", () => ({
  serverEnv: {
    SUPABASE_BUCKET: "uploads",
    SUPABASE_SERVICE_ROLE_KEY: "service-role",
    SUPABASE_URL: "https://example.supabase.co",
  },
}));

describe("POST /api/upload", () => {
  beforeEach(() => {
    enforceRateLimitMock.mockClear();
    resolveRequestKeyMock.mockReturnValue("192.168.1.1");
    authMock.mockResolvedValue(null);
  });

  it("returns 403 when the user is not authorized", async () => {
    const request = new Request("http://localhost/api/upload", { method: "POST" });
    const response = await POST(request);

    expect(enforceRateLimitMock).toHaveBeenCalledWith({
      key: "admin:192.168.1.1",
      limit: 10,
      windowMs: 60_000,
    });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
