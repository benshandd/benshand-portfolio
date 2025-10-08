import bcrypt from "bcrypt";
import Credentials from "next-auth/providers/credentials";
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const { selectMock, fromMock, whereMock } = vi.hoisted(() => {
  const where = vi.fn();
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  return { selectMock: select, fromMock: from, whereMock: where };
});

vi.mock("next/server", () => ({
  __esModule: true,
  default: {},
}));

vi.mock("@/db/client", () => ({
  db: {
    select: selectMock,
  },
}));

vi.mock("@/env/server", () => ({
  serverEnv: {
    DATABASE_URL: "postgres://localhost/test",
    DIRECT_URL: undefined,
    NEXTAUTH_SECRET: "test-secret",
    NEXTAUTH_URL: "http://localhost:3000",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role",
    SUPABASE_BUCKET: "uploads",
    REVALIDATE_SECRET: "secret",
    OWNER_EMAIL: "owner@example.com",
    OWNER_PASSWORD: "test-password",
  },
}));

import { authConfig } from "@/lib/auth/config";

const credentialsProvider = authConfig.providers.find(
  (provider) => provider.id === "credentials",
) as ReturnType<typeof Credentials>;

const authorize = credentialsProvider.options?.authorize;

if (!authorize) {
  throw new Error("Credentials provider is not configured");
}

describe("credentials authorize", () => {
  beforeEach(() => {
    selectMock.mockClear();
    fromMock.mockClear();
    whereMock.mockReset();
  });

  it("returns a user when email and password match", async () => {
    const password = "ValidPassword123!";
    const passwordHash = await bcrypt.hash(password, 12);

    whereMock.mockImplementationOnce(async () => [
      {
        id: "user-id",
        email: "owner@example.com",
        passwordHash,
        role: "owner",
        name: "Owner",
      },
    ]);

    const result = await authorize({
      email: "owner@example.com",
      password,
    });

    expect(result).toEqual(
      expect.objectContaining({
        email: "owner@example.com",
        role: "owner",
      }),
    );
  });

  it("returns null when the password is invalid", async () => {
    const passwordHash = await bcrypt.hash("ValidPassword123!", 12);

    whereMock.mockImplementationOnce(async () => [
      {
        id: "user-id",
        email: "owner@example.com",
        passwordHash,
        role: "owner",
        name: "Owner",
      },
    ]);

    const result = await authorize({
      email: "owner@example.com",
      password: "wrong-password",
    });

    expect(result).toBeNull();
  });
});
