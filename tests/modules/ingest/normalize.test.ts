import { describe, expect, it } from "vitest"

import { buildSlug } from "@/modules/ingest/normalize"

describe("buildSlug", () => {
  it("creates stable slugs from kind and external id", () => {
    expect(buildSlug("tweet", "2040806346556428585")).toBe(
      "tweet-2040806346556428585"
    )
    expect(buildSlug("blog_post", "ABC-123")).toBe("blog_post-abc-123")
  })
})
