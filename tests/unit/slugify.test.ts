import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/utils";

describe("slugify", () => {
  it("normalizes whitespace and casing", () => {
    expect(slugify(" Hello World ")).toBe("hello-world");
  });

  it("removes unsupported characters", () => {
    expect(slugify("Snakes & Ladders!")).toBe("snakes-ladders");
  });

  it("collapses duplicate separators", () => {
    expect(slugify("a---b___c")).toBe("a-b-c");
  });
});
