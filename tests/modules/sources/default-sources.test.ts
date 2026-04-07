import { describe, expect, it } from "vitest"

import { defaultSources } from "@/modules/sources/default-sources"

describe("default sources", () => {
  it("contains upstream feed and curated sources", () => {
    expect(defaultSources.some((item) => item.key === "follow-builders-feed")).toBe(
      true
    )
    expect(defaultSources.some((item) => item.type === "x_account")).toBe(true)
    expect(defaultSources.some((item) => item.type === "podcast")).toBe(true)
    expect(defaultSources.some((item) => item.type === "blog")).toBe(true)
  })
})
