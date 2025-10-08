import "@testing-library/jest-dom";

import { vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    redirect: vi.fn(() => {
      throw new Error("Redirect called");
    }),
    notFound: vi.fn(() => {
      throw new Error("Not found");
    }),
  };
});
